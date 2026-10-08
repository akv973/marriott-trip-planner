import { z } from 'zod';
import type { Catalog, EvidenceSubject, Property } from '../../types/catalog';
import { dateSchema, experienceTagSchema, idSchema } from '../validation/catalog';
import { fieldEvidence } from '../catalog/presentation';
import { calculatePoints, calculatorSchema } from '../points/calculator';
import { DEFAULT_WEIGHTS, FIT_LABELS, FIT_METHODOLOGY, weightsSchema } from './methodology';
import type { FitKey } from './methodology';

const optionalMoney = z.number().finite().min(0).max(1e9).nullable();
export const recommendationInputSchema = z.strictObject({
  asOf: dateSchema, country: z.string().regex(/^[A-Z]{2}$/).nullable(), destinationId: idSchema.nullable(),
  preferredTags: z.array(experienceTagSchema).max(17).refine((v) => new Set(v).size === v.length, 'Duplicate preferred experiences.'),
  requiredTag: experienceTagSchema.nullable(), requireLounge: z.boolean(),
  nights: z.number().int().min(1).max(60), checkIn: dateSchema.nullable(),
  maxAirportKm: z.number().finite().positive().max(10000).nullable(), maxCashUsd: optionalMoney,
  bookingMethod: z.enum(['either', 'cash', 'points']), weights: weightsSchema,
  quotes: z.array(z.strictObject({ propertyId: idSchema, checkIn: dateSchema.nullable(), observedAt: dateSchema.nullable(), calculator: calculatorSchema })).max(25),
}).superRefine((v, ctx) => {
  if (new Set(v.quotes.map((q) => q.propertyId)).size !== v.quotes.length) ctx.addIssue({ code: 'custom', path: ['quotes'], message: 'Only one quote per property is supported.' });
  for (const quote of v.quotes) if (quote.observedAt && quote.observedAt > v.asOf) ctx.addIssue({ code: 'custom', path: ['quotes'], message: 'Quote observation cannot be after the assessment date.' });
});
export type RecommendationInput = z.infer<typeof recommendationInputSchema>;
export type ManualQuote = RecommendationInput['quotes'][number];
export const initialRecommendationInput = (asOf: string): RecommendationInput => ({ asOf, country: null, destinationId: null, preferredTags: [], requiredTag: null, requireLounge: false, nights: 5, checkIn: null, maxAirportKm: null, maxCashUsd: null, bookingMethod: 'either', weights: { ...DEFAULT_WEIGHTS }, quotes: [] });
type Check = { label: string; state: 'met' | 'failed' | 'unknown'; detail: string };
type Component = { key: FitKey; label: string; weight: number; active: boolean; score: number | null; contribution: number | null; kind: 'factual' | 'editorial' | 'unavailable'; detail: string; subject: EvidenceSubject | null };
const ascii = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

function assessProperty(catalog: Catalog, property: Property, input: RecommendationInput) {
  const evidence = (subject: EvidenceSubject) => fieldEvidence(catalog, property, subject, input.asOf);
  const fresh = (subject: EvidenceSubject) => { const view = evidence(subject); return view.status === 'known' && !view.stale ? view.value : null; };
  const checks: Check[] = [];
  const status = fresh('operatingStatus');
  checks.push({ label: 'Operating status', state: status === 'open' ? 'met' : status === null ? 'unknown' : 'failed', detail: status === 'open' ? 'Sourced as open; availability for your dates is not checked.' : status === null ? 'Current operating status needs confirmation.' : `Sourced as ${String(status)}; not offered as an operating stay.` });
  if (input.country) {
    const country = fresh('country');
    checks.push({ label: 'Required country', state: country === null ? 'unknown' : country === input.country ? 'met' : 'failed', detail: country === null ? 'Country evidence needs review.' : `${String(country)} ${country === input.country ? 'matches' : 'does not match'} required ${input.country}.` });
  }
  const tags = fresh('experienceTags') as Property['experienceTags'];
  if (input.requiredTag) checks.push({ label: 'Required recorded experience', state: tags == null ? 'unknown' : tags.includes(input.requiredTag) ? 'met' : 'failed', detail: tags == null ? 'Experience evidence is unknown or needs review.' : tags.includes(input.requiredTag) ? `Recorded ${input.requiredTag} tag matches.` : `Required ${input.requiredTag} tag is not recorded. Tags describe settings, not an exhaustive activity inventory.` });
  if (input.requireLounge) checks.push({ label: 'Required lounge access', state: 'unknown', detail: 'Evidence-backed benefit rules are unavailable; lounge presence and elite access are not assumed.' });

  const quote = input.quotes.find((q) => q.propertyId === property.id);
  const quoteMatches = quote && quote.calculator.nights === input.nights && (!input.checkIn || quote.checkIn === input.checkIn);
  const calculated = quoteMatches ? calculatePoints(quote.calculator) : null;
  const economics = calculated?.success ? calculated : null;
  const economicMissing = quote ? quoteMatches ? [] : ['Manual quote dates or number of nights do not match this request.'] : ['No manual quote for this property.'];
  if (quote && !quote.observedAt) economicMissing.push('Quote observation date is unknown.');
  if (quote && !quote.checkIn) economicMissing.push('Quote travel date is unknown; current pricing is not asserted.');
  const cashCost = economics?.cashTotal == null || economics.fx === null ? null : economics.cashTotal * economics.fx;
  const awardCost = economics?.awardCash == null || economics.fx === null ? null : economics.awardCash * economics.fx;
  const awardAffordable = economics?.pointsShortfall == null ? null : economics.pointsShortfall === 0;
  const cashWithin = input.maxCashUsd === null ? null : cashCost === null ? null : cashCost <= input.maxCashUsd;
  const awardWithin = input.maxCashUsd === null ? null : awardCost === null ? null : awardCost <= input.maxCashUsd;
  const awardPossible = awardWithin === false || awardAffordable === false ? false : awardWithin === null || awardAffordable === null ? null : true;
  if (input.maxCashUsd !== null) {
    const fits = input.bookingMethod === 'cash' ? cashWithin : input.bookingMethod === 'points' ? awardPossible : cashWithin === true || awardPossible === true ? true : cashWithin === false && awardPossible === false ? false : null;
    checks.push({ label: 'Cash budget / selected booking method', state: fits === null ? 'unknown' : fits ? 'met' : 'failed', detail: fits === null ? 'Matching manual cost, USD conversion or points balance is missing.' : fits ? 'At least one permitted booking path fits the entered cash budget.' : 'The selected booking path exceeds the cash budget or available points.' });
  } else if (input.bookingMethod === 'points') checks.push({ label: 'Points affordability', state: awardAffordable === null ? 'unknown' : awardAffordable ? 'met' : 'failed', detail: awardAffordable === null ? 'Matching award quote and available points are needed.' : awardAffordable ? 'Award quote fits the entered points balance.' : 'Insufficient points for this quote.' });
  const eligibility = checks.some((c) => c.state === 'failed') ? 'excluded' : checks.some((c) => c.state === 'unknown') ? 'provisional' : 'eligible';

  const editorial = catalog.editorialAssessments.filter((a) => a.propertyId === property.id && a.reviewedAt <= input.asOf).sort((a, b) => ascii(b.reviewedAt, a.reviewedAt) || ascii(a.id, b.id))[0] ?? null;
  const editorialContext = editorial ? `Editorial by ${editorial.author}, reviewed ${editorial.reviewedAt}, ${editorial.methodologyVersion}. ${editorial.rationale}` : 'No reviewed editorial rating.';
  const destination = catalog.destinations.find((d) => d.id === property.destinationId);
  // Destination membership is a curated relationship; require fresh, matching country/region context.
  const destinationKnown = destination && fresh('country') === destination.country && fresh('region') === destination.region;
  const airport = fresh('nearestAirport') as Property['nearestAirport'];
  const add = (key: FitKey, active: boolean, score: number | null, kind: Component['kind'], detail: string, subject: EvidenceSubject | null = null): Component => ({ key, label: FIT_LABELS[key], weight: input.weights[key], active: active && input.weights[key] > 0, score: active ? score : null, contribution: active && score !== null ? score * input.weights[key] / 100 : null, kind, detail, subject });
  const components = [
    add('quality', true, editorial?.hardwareQuality != null && editorial.serviceQuality != null ? (editorial.hardwareQuality + editorial.serviceQuality) * 5 : null, 'editorial', `Mean of hardware and service ratings (0–10), scaled to 100; both are required. ${editorialContext}`),
    add('destination', input.destinationId !== null, destinationKnown ? property.destinationId === input.destinationId ? 100 : 0 : null, 'factual', input.destinationId ? 'Exact curated destination match: 100; another destination: 0. Country and region evidence must be current.' : 'No destination preference; inactive.'),
    add('experience', input.preferredTags.length > 0, tags == null ? null : input.preferredTags.filter((tag) => tags.includes(tag)).length / input.preferredTags.length * 100, 'factual', input.preferredTags.length ? `Fraction of requested tags recorded: ${input.preferredTags.join(', ')}. Tags describe setting, not quality or guaranteed activities.` : 'No experience preference; inactive.', 'experienceTags'),
    add('elite', true, null, 'unavailable', 'Benefit rules are not implemented. Brand or editorial potential never guarantees benefits.'),
    add('uniqueness', true, editorial?.uniqueness == null ? null : editorial.uniqueness * 10, 'editorial', `Reviewed uniqueness rating scaled from 0–10. ${editorialContext}`),
    add('logistics', input.maxAirportKm !== null, airport?.distanceKm == null || input.maxAirportKm === null ? null : Math.max(0, 1 - airport.distanceKm / input.maxAirportKm) * 100, 'factual', input.maxAirportKm ? `Distance utility = max(0, 1 − distance / ${input.maxAirportKm} km) × 100. This is a preference, not a driving-time estimate.` : 'No airport-distance preference; inactive.', 'nearestAirport'),
  ];
  const activeWeight = components.filter((c) => c.active).reduce((n, c) => n + c.weight, 0);
  const knownWeight = components.filter((c) => c.active && c.score !== null).reduce((n, c) => n + c.weight, 0);
  const supported = components.filter((c) => c.active && c.contribution !== null).reduce((n, c) => n + c.contribution!, 0);
  const lowerBound = activeWeight ? supported / activeWeight * 100 : null;
  const upperBound = activeWeight ? (supported + activeWeight - knownWeight) / activeWeight * 100 : null;
  const coverage = activeWeight ? knownWeight / activeWeight * 100 : 0;
  const fit = { components, activeWeight, knownWeight, lowerBound, upperBound, coverage, score: activeWeight && activeWeight === knownWeight ? lowerBound : null };
  const strengths = components.filter((c) => c.active && c.score !== null && c.score >= 70).map((c) => `${c.label} matches your preferences (${c.score!.toFixed(1)}/100; ${c.kind}).`);
  const weaknesses = components.filter((c) => c.active && c.score !== null && c.score < 40).map((c) => `${c.label} is a weaker match (${c.score!.toFixed(1)}/100; ${c.kind}).`);
  const missing = components.filter((c) => c.active && c.score === null).map((c) => `${c.label}: unknown.`);
  const booking = economics?.band ?? 'Booking value unavailable';
  const bookingAction = !economics?.band ? 'Confirm comparable quotes and missing economics before deciding cash versus points.' : economics.pointsShortfall !== null && economics.pointsShortfall > 0 && economics.band.includes('points use') ? 'Points value is attractive, but the entered balance cannot fund this award.' : economics.band.includes('points use') ? 'Points are favored by your valuation and thresholds; availability and affordability require confirmation.' : economics.band.includes('cash preferred') || economics.band === 'Cash preferred' ? 'Cash is favored by your valuation and thresholds.' : 'Cash and points are approximately neutral at your valuation.';
  return { propertyId: property.id, eligibility: eligibility as 'eligible' | 'provisional' | 'excluded', checks, fit, economics, economicMissing,
    budget: { limitUsd: input.maxCashUsd, bookingMethod: input.bookingMethod, cashCostUsd: cashCost, awardCashUsd: awardCost, cashWithinBudget: cashWithin, awardWithinBudget: awardWithin, awardPointsAffordable: awardAffordable },
    quoteContext: quote ? { checkIn: quote.checkIn, observedAt: quote.observedAt } : null,
    explanation: { summary: `${eligibility === 'excluded' ? 'Excluded by a required constraint' : eligibility === 'provisional' ? 'Provisional candidate — required information needs confirmation' : 'Eligible catalog candidate'}. ${coverage < 100 ? 'Trip fit is partial' : 'Trip fit is fully assessed'}. ${booking}.`, strengths, weaknesses, missing,
      editorialStrengths: editorial?.strengths ?? [], editorialWeaknesses: editorial?.weaknesses ?? [], bookingAction,
      uncertainties: [...checks.filter((c) => c.state === 'unknown').map((c) => c.detail), ...economicMissing, ...(economics?.missing ?? []), ...(economics?.warnings ?? []), 'Availability for travel dates is not checked. Manual quotes are user inputs, not catalog evidence.'],
    } };
}
export type RecommendationResult = ReturnType<typeof assessProperty>;

export function recommendProperties(catalog: Catalog, input: unknown) {
  const parsed = recommendationInputSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, errors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) };
  const v = parsed.data;
  if (v.destinationId && !catalog.destinations.some((d) => d.id === v.destinationId)) return { success: false as const, errors: ['Preferred destination is unavailable in the catalog.'] };
  if (v.quotes.some((q) => !catalog.properties.some((p) => p.id === q.propertyId))) return { success: false as const, errors: ['A quote refers to an unavailable property.'] };
  const results = catalog.properties.map((p) => assessProperty(catalog, p, v));
  const order = { eligible: 0, provisional: 1, excluded: 2 };
  results.sort((a, b) => order[a.eligibility] - order[b.eligibility] || (b.fit.lowerBound ?? -1) - (a.fit.lowerBound ?? -1) || b.fit.coverage - a.fit.coverage || ascii(a.propertyId, b.propertyId));
  const custom = Object.keys(DEFAULT_WEIGHTS).some((key) => v.weights[key as FitKey] !== DEFAULT_WEIGHTS[key as FitKey]);
  return { success: true as const, input: v, methodologyVersion: `${FIT_METHODOLOGY.version}${custom ? '-custom' : ''}`, results };
}
