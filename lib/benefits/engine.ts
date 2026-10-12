import rawBenefits from '../../data/benefits/index.json';
import { benefitBundleSchema, BENEFIT_LABELS } from './schema';
import type { BenefitBundle, BenefitKey, BenefitOutcome, BenefitRule } from './schema';
import type { Catalog, Property } from '../../types/catalog';
import type { UserProfile } from '../profile/profile';
import { STATUSES } from '../profile/profile';
import { dateSchema } from '../validation/catalog';
import { fieldEvidence } from '../catalog/presentation';

export const benefits = benefitBundleSchema.parse(rawBenefits);
export const BENEFIT_STALE_DAYS = 180;
const priority = { status: 1, brand: 2, property: 3 };
type Match = 'applies' | 'possible' | 'does-not-apply' | 'inactive' | 'stale';
export interface BenefitTrace { rule: BenefitRule; match: Match; reasons: string[]; selected: boolean }
export interface EffectiveBenefit { category: BenefitKey; outcome: BenefitOutcome; conflict: boolean; reasons: string[]; trace: BenefitTrace[] }
const unknown = (detail: string): BenefitOutcome => ({ code: 'unknown', state: 'unknown', basis: 'policy', label: 'Unknown — confirmation needed', detail });
const age = (date: string, asOf: string) => (Date.parse(asOf) - Date.parse(date)) / 86400000;
const key = (o: BenefitOutcome) => JSON.stringify([o.code, o.state, o.basis, o.amount ?? null]);

export function effectiveBenefits(catalog: Catalog, property: Property, status: UserProfile['status'], asOf: string, bundle: BenefitBundle = benefits) {
  dateSchema.parse(asOf);
  const review = bundle.reviews.find(r => r.propertyId === property.id);
  const reviewCurrent = review && review.verifiedAt <= asOf && age(review.verifiedAt, asOf) <= BENEFIT_STALE_DAYS;
  const fact = (subject: 'isResort' | 'roomCount' | 'brandId') => {
    const v = fieldEvidence(catalog, property, subject, asOf);
    return v.stale || v.status !== 'known' ? null : v.value;
  };
  const brand = fact('brandId');
  const roomCount = fact('roomCount');
  const context = { resort: fact('isResort'), convention: reviewCurrent ? review.convention : null, lounge: reviewCurrent ? review.lounge : null, small: typeof roomCount === 'number' ? roomCount <= 25 : null, scope: reviewCurrent ? review.scope : null, regionGroup: property.country === 'US' || property.country === 'CA' || property.region === 'Europe' ? 'us-canada-europe' : 'other' };
  const results = (Object.keys(BENEFIT_LABELS) as BenefitKey[]).map(category => {
    const trace: BenefitTrace[] = bundle.rules.filter(r => r.category === category && (!r.propertyId || r.propertyId === property.id) && (!r.selector.brandIds.length || brand === null || r.selector.brandIds.includes(String(brand)))).sort((a,b) => a.id.localeCompare(b.id)).map(rule => {
      const reasons: string[] = [];
      let match: Match = 'applies';
      if (rule.verifiedAt > asOf || (rule.validFrom && rule.validFrom > asOf) || (rule.validTo && rule.validTo < asOf)) return { rule, match: 'inactive', reasons: ['Rule is outside the assessment date.'], selected: false };
      if (status === null && rule.selector.statuses.length !== STATUSES.length) { match = 'possible'; reasons.push('Bonvoy status is unknown.'); }
      if (status !== null && !rule.selector.statuses.includes(status)) return { rule, match: 'does-not-apply', reasons: ['Status does not meet this rule.'], selected: false };
      if (rule.selector.brandIds.length && brand === null) { match = 'possible'; reasons.push('Brand evidence is unknown, stale or conflicted.'); }
      for (const [name, value] of Object.entries(rule.selector.conditions)) {
        const actual = context[name as keyof typeof context];
        if (actual === null) { match = 'possible'; reasons.push(`${name} classification is unknown or needs review.`); }
        else if (actual !== value) return { rule, match: 'does-not-apply', reasons: [`${name} condition does not match.`], selected: false };
      }
      if (rule.confidence === 'Unverified') { match = 'possible'; reasons.push('Policy claim is unverified.'); }
      if (age(rule.verifiedAt, asOf) > BENEFIT_STALE_DAYS) { match = 'stale'; reasons.push('Policy evidence is over 180 days old; refresh before relying on it.'); }
      return { rule, match, reasons, selected: false };
    });
    const candidates = trace.filter(t => ['applies', 'possible', 'stale'].includes(t.match));
    const highest = Math.max(0, ...candidates.map(t => priority[t.rule.layer]));
    const selected = candidates.filter(t => priority[t.rule.layer] === highest);
    selected.forEach(t => { t.selected = true; });
    let outcome: BenefitOutcome;
    let conflict = false;
    const reasons: string[] = [];
    const active = selected.filter(t => t.match === 'applies');
    const codes = new Set(active.map(t => key(t.rule.outcome)));
    // Different layers normally refine policy. Opposing official entitlements still require review.
    const opposing = active.filter(t => t.rule.layer === 'property' && t.rule.outcome.basis === 'elite').some(t => candidates.some(base => base.match === 'applies' && base.rule.layer !== 'property' && base.rule.outcome.basis === 'elite' && (((base.rule.outcome.state === 'excluded') !== (t.rule.outcome.state === 'excluded')) || (base.rule.outcome.amount != null && t.rule.outcome.amount != null && base.rule.outcome.amount !== t.rule.outcome.amount))));
    if (selected.some(t => t.rule.conflictStatus === 'disputed') || codes.size > 1 || opposing) {
      conflict = true; outcome = unknown('Requires review — official benefit evidence conflicts.'); reasons.push('Contradictory claims are retained below; no entitlement is asserted.');
    } else if (active.length && selected.every(t => t.match === 'applies' || (t.match === 'possible' && key(t.rule.outcome) === key(active[0]!.rule.outcome)))) {
      outcome = active[0]!.rule.outcome;
      if (highest === 3) reasons.push('Sourced property override takes precedence over brand and status rules.');
      else reasons.push(`${highest === 2 ? 'Brand' : 'Status'} rule applies to the entered status and known conditions.`);
    } else {
      if (!selected.length) reasons.push('No applicable sourced rule is available.');
      reasons.push(...new Set(selected.flatMap(t => t.reasons)));
      outcome = unknown(reasons.join(' ') || 'Applicable rules require more information.');
    }
    return { category, outcome, conflict, reasons, trace } satisfies EffectiveBenefit;
  });
  return { version: bundle.version, asOf, status, context, review: review ?? null, reviewStale: !reviewCurrent, results, observations: bundle.observations.filter(o => o.propertyId === property.id && o.reviewedAt <= asOf) };
}
