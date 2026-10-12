import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../../lib/catalog/catalog';
import { benefits, effectiveBenefits } from '../../lib/benefits/engine';
import { benefitBundleSchema, benefitReferenceErrors } from '../../lib/benefits/schema';
import type { BenefitKey } from '../../lib/benefits/schema';
import { STATUSES } from '../../lib/profile/profile';
import type { UserProfile } from '../../lib/profile/profile';
import { exportPlanner, importPlanner, emptyPlanner } from '../../lib/storage/planner';
import { loadFoundation } from '../../lib/catalog/foundation';
const asOf = '2026-10-12';
const loaded = loadCatalog(asOf);
if (!loaded.success) throw new Error('Catalog invalid.');
const catalog = loaded.data;
function assess(slug: string, status: UserProfile['status'], bundle = benefits, date = asOf) {
  return effectiveBenefits(catalog, catalog.properties.find(p => p.slug === slug)!, status, date, bundle);
}
const item = (slug: string, status: UserProfile['status'], category: BenefitKey, bundle = benefits, date = asOf) => assess(slug, status, bundle, date).results.find(r => r.category === category)!;
function cityFixture() {
  const c = structuredClone(catalog); const p = c.properties.find(p => p.slug === 'jw-tampa')!; p.isResort = false;
  c.evidenceClaims.push({ id: 'fixture-tampa-resort', propertyId: p.id, subject: 'isResort', value: false, sourceId: 'source-jw-tampa', confidence: 'High', conflictStatus: 'none', observedAt: asOf, lastVerifiedAt: asOf });
  const b = structuredClone(benefits); b.reviews.find(r => r.propertyId === p.id)!.convention = false;
  return { c, p, b };
}

describe('Sourced benefit contracts', () => {
  it('validates all rules, official sources and exactly 25 property reviews without catalog growth', () => {
    expect(benefitBundleSchema.safeParse(benefits).success).toBe(true);
    expect(benefitReferenceErrors(benefits, catalog)).toEqual([]);
    expect(benefits.reviews).toHaveLength(25); expect(catalog.properties).toHaveLength(25);
    expect(loadFoundation().success).toBe(true);
  });
  it('rejects malformed outcome, wrong layer, invalid dates and extra fields', () => {
    for (const changes of [{ extra: true }, { layer: 'property', propertyId: null }, { validFrom: '2027-01-01', validTo: '2026-01-01' }, { outcome: { state: 'guaranteed' } }]) {
      const b = structuredClone(benefits); Object.assign(b.rules[0]!, changes); expect(benefitBundleSchema.safeParse(b).success).toBe(false);
    }
  });
  it('rejects orphaned references, duplicate IDs, nonofficial policy sources and missing reviews', () => {
    const b = structuredClone(benefits); b.rules[0]!.sourceIds = ['missing']; b.rules[1]!.id = b.rules[0]!.id; b.reviews.pop();
    expect(benefitReferenceErrors(b, catalog).length).toBeGreaterThan(2);
    const x = structuredClone(benefits); x.sources[0]!.type = 'traveler-community-report'; expect(benefitReferenceErrors(x, catalog).join()).toContain('Nonofficial');
    const y = structuredClone(benefits); y.sources[0]!.accessedAt = '2025-01-01'; expect(benefitReferenceErrors(y, catalog).join()).toContain('verification exceeds');
  });
});
describe('Status and brand entitlement matrix', () => {
  it.each(STATUSES)('resolves %s independently for all properties without changing inputs', status => {
    const before = JSON.stringify({ catalog, benefits });
    for (const p of catalog.properties) {
      const a = effectiveBenefits(catalog, p, status, asOf); const b = effectiveBenefits(catalog, p, status, asOf);
      expect(a).toEqual(b); expect(a.results).toHaveLength(10);
      expect(a.results.find(r => r.category === 'bonus')!.outcome.amount).toBe([0,10,25,50,75,75][STATUSES.indexOf(status)]);
      expect(a.results.filter(r => r.conflict)).toEqual([]);
    }
    expect(JSON.stringify({ catalog, benefits })).toBe(before);
  });
  it.each(['dove-mountain','st-regis-new-york','new-york-edition','gritti-palace','jw-phuket','elephant-weimar'])('uses current Platinum suite rule at %s without promising availability', slug => {
    expect(item(slug, 'gold', 'suiteUpgrade').outcome.state).toBe('excluded');
    expect(item(slug, 'platinum', 'suiteUpgrade').outcome.state).toBe('conditional');
    expect(item(slug, 'ambassador', 'suiteUpgrade').outcome.state).toBe('conditional');
  });
  it('keeps breakfast and welcome choices distinct by brand', () => {
    expect(item('st-regis-aspen', 'platinum', 'breakfast').outcome.label).toBe('Breakfast as welcome choice');
    expect(item('dove-mountain', 'ambassador', 'breakfast').outcome.state).toBe('excluded');
    expect(item('new-york-edition', 'platinum', 'welcome').outcome.amount).toBe(1000);
    expect(item('jw-phuket', 'platinum', 'welcome').outcome.label).toContain('F&B amenity or breakfast');
  });
  it('does not grant club access from Ambassador or suite eligibility', () => {
    expect(item('half-moon-bay', 'ambassador', 'club').outcome.state).toBe('excluded');
    expect(item('half-moon-bay', 'ambassador', 'club').trace.some(t => t.selected && t.rule.layer === 'property')).toBe(true);
    expect(item('half-moon-bay', 'ambassador', 'lounge').outcome.state).toBe('excluded');
    expect(item('jw-sao-paulo', 'ambassador', 'club').outcome.state).toBe('unknown');
  });
  it('applies explicit property lounge policies above unresolved resort classification', () => {
    const r = item('jw-tampa', 'platinum', 'lounge'); expect(r.outcome.state).toBe('eligible');
    expect(r.trace.filter(t => t.selected).map(t => t.rule.layer)).toEqual(['property']);
    expect(r.reasons.join()).toContain('takes precedence');
    expect(item('jw-tampa', 'gold', 'lounge').outcome.state).toBe('excluded');
  });
  it('does not turn an included safari meal into an elite breakfast guarantee', () => {
    const r = item('mapito', null, 'breakfast'); expect(r.outcome.state).toBe('included'); expect(r.outcome.basis).toBe('included');
    expect(item('mapito', 'ambassador', 'welcome').outcome.state).toBe('unknown');
    expect(item('jw-masai-mara', 'ambassador', 'availability').outcome.state).toBe('excluded');
  });
  it('preserves unknown status and resort/convention classifications', () => {
    expect(item('st-regis-new-york', null, 'breakfast').outcome.state).toBe('unknown');
    expect(item('st-regis-new-york', 'platinum', 'lateCheckout').outcome.state).toBe('unknown');
    expect(item('st-regis-aspen', 'platinum', 'lateCheckout').outcome.state).toBe('conditional');
    expect(item('dove-mountain', null, 'club').outcome.state).toBe('excluded');
  });
  it('guarantees 4 p.m. only with proven non-resort/non-convention conditions; resort and convention are conditional', () => {
    const { c,p,b } = cityFixture();
    const checkout = () => effectiveBenefits(c,p,'platinum',asOf,b).results.find(r => r.category==='lateCheckout')!;
    expect(checkout().outcome.label).toContain('guaranteed');
    b.reviews.find(r=>r.propertyId===p.id)!.convention = null; expect(checkout().outcome.state).toBe('unknown');
    b.reviews.find(r=>r.propertyId===p.id)!.convention = true; expect(checkout().outcome.state).toBe('conditional');
  });
  it('keeps Your24 approval separate from late checkout', () => {
    expect(item('dove-mountain','ambassador','your24').outcome.state).toBe('conditional');
    expect(item('dove-mountain','titanium','your24').outcome.state).toBe('excluded');
    expect(item('dove-mountain','ambassador','lateCheckout').outcome.state).toBe('conditional');
  });
});
describe('Conflict, time and evidence handling', () => {
  it('surfaces competing property overrides, retaining both claims and their sources', () => {
    const b = structuredClone(benefits); const original = b.rules.find(r=>r.id==='override-jw-tampa-lounge')!;
    b.rules.push({ ...structuredClone(original), id:'fixture-opposing', outcome:{ ...original.outcome, code:'fixture-denied', state:'excluded', label:'Synthetic denial' } });
    const r=item('jw-tampa','platinum','lounge',b); expect(r.conflict).toBe(true); expect(r.outcome.state).toBe('unknown'); expect(r.trace.filter(t=>t.selected)).toHaveLength(2);
    b.rules.reverse(); expect(item('jw-tampa','platinum','lounge',b)).toEqual(r);
  });
  it('does not hide a property restriction contradicting an official entitlement', () => {
    const { c,p,b }=cityFixture(); const o=b.rules.find(r=>r.id==='override-jw-tampa-lounge')!; o.outcome={...o.outcome,code:'fixture-denied',state:'excluded'};
    expect(effectiveBenefits(c,p,'platinum',asOf,b).results.find(r=>r.category==='lounge')!.conflict).toBe(true);
  });
  it('surfaces an explicitly disputed claim even when it is the only override', () => {
    const b=structuredClone(benefits); b.rules.find(r=>r.id==='override-jw-tampa-lounge')!.conflictStatus='disputed'; expect(item('jw-tampa','platinum','lounge',b).conflict).toBe(true);
  });
  it('retains expired and future rules without applying them or silently taking precedence', () => {
    const b=structuredClone(benefits); const o=b.rules.find(r=>r.id==='override-jw-tampa-lounge')!; o.validTo='2026-10-11';
    expect(item('jw-tampa','platinum','lounge',b).trace.find(t=>t.rule.id===o.id)!.match).toBe('inactive');
    o.validTo=null; o.validFrom='2026-10-13'; expect(item('jw-tampa','platinum','lounge',b).trace.find(t=>t.rule.id===o.id)!.match).toBe('inactive');
  });
  it('withholds stale benefit rules and future verification dates, leaving evidence inspectable', () => {
    expect(item('jw-tampa','platinum','lounge',benefits,'2027-10-12').outcome.state).toBe('unknown');
    expect(item('dove-mountain','platinum','suiteUpgrade',benefits,'2026-10-11').outcome.state).toBe('unknown');
  });
  it('withholds unverified overrides rather than treating them as official entitlements', () => {
    const b=structuredClone(benefits);b.rules.find(r=>r.id==='override-jw-tampa-lounge')!.confidence='Unverified';
    const r=item('jw-tampa','platinum','lounge',b);expect(r.outcome.state).toBe('unknown');expect(r.reasons.join()).toContain('unverified');
  });
  it('withholds property conditions when their review is stale', () => {
    const { c,p,b }=cityFixture(); b.reviews.find(r=>r.propertyId===p.id)!.verifiedAt='2025-01-01';
    expect(effectiveBenefits(c,p,'platinum',asOf,b).results.find(r=>r.category==='lateCheckout')!.outcome.state).toBe('unknown');
  });
  it('conflicting catalog classifications never promote raw metadata into a guaranteed checkout', () => {
    const { c,p,b }=cityFixture(); c.evidenceClaims.push({...c.evidenceClaims.at(-1)!,id:'fixture-opposing-resort',subject:'isResort',value:true});
    const view=effectiveBenefits(c,p,'platinum',asOf,b); expect(view.context.resort).toBeNull(); expect(view.results.find(r=>r.category==='lateCheckout')!.outcome.state).toBe('unknown');
  });
  it('editorial observations cannot change official entitlements', () => {
    const b=structuredClone(benefits); b.observations.push({ id:'fixture-opinion',propertyId:'property-jw-tampa',kind:'editorial',reviewedAt:asOf,text:'Synthetic: every guest gets a suite',sourceIds:[] });
    expect(assess('jw-tampa','gold',b).results).toEqual(assess('jw-tampa','gold').results);
  });
  it('reconstructs a Stage 7 v1 backup exactly and derives benefits without adding saved fields', () => {
    const planner=emptyPlanner(); planner.profile.status='ambassador'; planner.profile.balance=1200000;
    const backup=exportPlanner(planner,catalog,'2026-10-12T00:00:00Z'); const restored=importPlanner(backup,catalog); expect(restored.success).toBe(true);
    if(!restored.success) throw new Error(); expect(restored.data).toEqual(planner); const before=JSON.stringify(restored.data);
    assess('dove-mountain',restored.data.profile.status); expect(JSON.stringify(restored.data)).toBe(before);
    expect(JSON.parse(backup).schemaVersion).toBe(1); expect(backup).not.toContain('benefit');
  });
});
