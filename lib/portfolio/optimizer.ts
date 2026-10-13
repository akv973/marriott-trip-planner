import { z } from 'zod';
import type { Catalog } from '../../types/catalog';
import { calculatePoints, DEFAULT_THRESHOLDS, fractionDigits } from '../points/calculator';
import { assessCertificate } from '../profile/profile';
import { validatePlanner } from '../storage/planner';
import type { PlannerData } from '../storage/planner';
import { checkout } from '../trips/trips';
import type { Trip, TripStay } from '../trips/trips';
import { dateSchema, idSchema } from '../validation/catalog';

export const PORTFOLIO_VERSION = 'manual-portfolio-1';
export const SEARCH_NODE_LIMIT = 100_000;
export const STRATEGIES = ['cash-conservation', 'redemption-value', 'balanced'] as const;
export type Strategy = typeof STRATEGIES[number];
export const STRATEGY_LABELS: Record<Strategy, string> = { 'cash-conservation': 'Cash conservation', 'redemption-value': 'Redemption value', balanced: 'Balanced' };
export const STRATEGY_RULES: Record<Strategy, string> = {
  'cash-conservation': 'Minimize actual USD cash. Ties favor cash avoided on higher-priority trips, then fewer points.',
  'redemption-value': 'Maximize aggregate USD cents per point on points bookings. Certificates and top-offs are excluded from CPP. Ties favor lower actual cash, then fewer points.',
  balanced: 'Minimize priority-weighted USD cash plus the personal value of all points spent, including top-offs. Priorities weight cash 1×, 2× or 3×. Ties favor lower actual cash, then fewer points.',
};
const uniqueIds = z.array(idSchema).refine((ids) => new Set(ids).size === ids.length, 'IDs must be unique.');
export const portfolioRequestSchema = z.strictObject({
  selectedTripIds: uniqueIds.max(10),
  priorities: z.array(z.strictObject({ tripId: idSchema, weight: z.union([z.literal(1), z.literal(2), z.literal(3)]) })).max(10)
    .refine((items) => new Set(items.map((i) => i.tripId)).size === items.length, 'Trip priorities must be unique.'),
  certificateEligibleStayIds: uniqueIds.max(300),
  cashBudgetUsd: z.number().finite().min(0).max(1e9).nullable(),
  asOf: dateSchema,
});
export type PortfolioRequest = z.infer<typeof portfolioRequestSchema>;
type Option = {
  method: TripStay['bookingMethod']; certificateId: string | null; points: number | null;
  cash: number | null; cashUsd: number | null; cashAvoidedUsd: number | null; cpp: number | null;
  unusedCertificateValue: number | null; explanation: string;
};
type Row = { tripId: string; tripName: string; weight: number; stay: TripStay; propertyName: string;
  checkOut: string | null; cashQuote: number | null; awardQuote: number | null; options: Option[];
  fixed: boolean; missing: string[]; warnings: string[]; fifthNightSavings: number | null; freeNightIndices: number[] };
const cents = (n: number) => Math.round((n + Number.EPSILON) * 100);
const total = (ns: (number | null)[]) => {
  const known = ns.filter((n): n is number => n !== null);
  return { total: known.length === ns.length ? known.reduce((a, b) => a + b, 0) : null,
    knownSubtotal: known.reduce((a, b) => a + b, 0), missingCount: ns.length - known.length };
};
const cashTotal = (ns: (number | null)[], digits = 2) => {
  const s = total(ns.map((n) => n === null ? null : Math.round((n + Number.EPSILON) * 10 ** digits)));
  return { ...s, total: s.total === null ? null : s.total / 10 ** digits, knownSubtotal: s.knownSubtotal / 10 ** digits };
};

function buildRow(trip: Trip, stay: TripStay, data: PlannerData, catalog: Catalog, request: PortfolioRequest): Row {
  const economics = calculatePoints({ ...stay.pricing, balance: null, valuationCpp: data.profile.valuationCpp, thresholds: DEFAULT_THRESHOLDS });
  // The planner schema and calculator semantic validation are checked before rows are built.
  if (!economics.success) throw new Error('Validated pricing required.');
  const p = stay.pricing;
  const convert = (amount: number | null) => amount === null || economics.fx === null ? null : cents(amount * economics.fx) / 100;
  const cashUsd = convert(economics.cashTotal); const awardUsd = convert(economics.awardCash);
  const avoided = cashUsd === null || awardUsd === null ? null : (cents(cashUsd) - cents(awardUsd)) / 100;
  const cash: Option = { method: 'cash', certificateId: null, points: 0, cash: economics.cashTotal, cashUsd: convert(economics.cashTotal), cashAvoidedUsd: 0, cpp: null, unusedCertificateValue: null, explanation: 'Pay the manually quoted room, taxes and mandatory fees.' };
  const points: Option = { method: 'points', certificateId: null, points: economics.pointsSpent, cash: economics.awardCash, cashUsd: awardUsd, cashAvoidedUsd: avoided, cpp: avoided === null || !economics.pointsSpent ? null : avoided * 100 / economics.pointsSpent, unusedCertificateValue: null, explanation: 'Use the existing points engine; final totals are not discounted again.' };
  const eligible = request.certificateEligibleStayIds.includes(stay.id) || stay.certificate?.eligibility === 'eligible';
  const certificateOptions = data.profile.certificates.map((certificate) => {
    const assessment = assessCertificate({ certificate, nightPoints: p.nights === 1 ? economics.pointsSpent : null,
      stayDate: stay.checkIn, eligibility: p.nights === 1 ? eligible ? 'eligible' : stay.certificate?.eligibility ?? 'unknown' : 'ineligible', asOf: request.asOf });
    return { certificate, assessment, option: { method: 'certificate' as const, certificateId: certificate.id,
      points: assessment.topOff, cash: economics.awardCash, cashUsd: convert(economics.awardCash), cashAvoidedUsd: avoided,
      cpp: null, unusedCertificateValue: assessment.unusedValue,
      explanation: `One certificate for one night; top-off is counted against the shared balance. ${assessment.reasons.join(' ')}` } };
  });
  const selectedCertificate = certificateOptions.find((c) => c.certificate.id === stay.certificate?.id);
  const chosen: Option = stay.bookingMethod === 'cash' ? cash : stay.bookingMethod === 'points' ? points : selectedCertificate?.option ?? {
    ...points, method: 'certificate', certificateId: stay.certificate?.id ?? null, points: null, cpp: null, explanation: 'Certificate selection or eligibility requires review.',
  };
  const missing: string[] = [];
  if (stay.checkIn === null) missing.push('Stay date unknown.');
  else if (stay.checkIn < request.asOf) missing.push('Stay date is in the past; review the plan.');
  if (stay.observedAt === null) missing.push('Quote observation date unknown.');
  else if (stay.observedAt > request.asOf) missing.push('Quote observation date is in the future.');
  if (economics.cashTotal === null) missing.push('Cash quote, taxes or mandatory fees unknown.');
  if (economics.awardCash === null) missing.push('Cash payable on award unknown.');
  if (economics.pointsSpent === null) missing.push('Award points or fifth-night eligibility unknown.');
  if (economics.fx === null) missing.push('Manual USD exchange rate unknown.');
  if (p.comparable !== 'same') missing.push('Same room, occupancy, inclusions and cancellation terms are not confirmed.');
  if (stay.bookingMethod === 'certificate' && selectedCertificate?.assessment.state !== 'eligible') missing.push('Selected certificate eligibility is incomplete or ineligible.');
  const warnings = [...economics.warnings];
  if (stay.observedAt && stay.observedAt <= request.asOf && Date.parse(request.asOf) - Date.parse(stay.observedAt) > 30 * 86400000) warnings.push('Manual quote is over 30 days old; reconfirm before booking.');
  if (p.nights > 1 && data.profile.certificates.length) warnings.push('Certificates are considered only on separately quoted one-night stays; multi-night stays are not split.');
  if (p.nights === 1 && data.profile.certificates.length && !eligible) warnings.push('Certificate alternatives need explicit standard-room eligibility confirmation.');
  if (eligible) for (const c of certificateOptions) if (c.assessment.state !== 'eligible') warnings.push(`${c.certificate.label || c.certificate.id}: ${c.assessment.reasons.join(' ')}`);
  const fixed = stay.reservationStatus === 'reserved' || missing.length > 0;
  return { tripId: trip.id, tripName: trip.name, weight: request.priorities.find((i) => i.tripId === trip.id)?.weight ?? 1,
    stay, propertyName: catalog.properties.find((p) => p.id === stay.propertyId)!.name,
    checkOut: checkout(stay.checkIn, p.nights), cashQuote: economics.cashTotal, awardQuote: economics.pointsSpent,
    options: fixed ? [chosen] : [cash, points, ...certificateOptions.filter((c) => c.assessment.state === 'eligible').map((c) => c.option)],
    fixed, missing, warnings, fifthNightSavings: economics.savings, freeNightIndices: economics.freeNightIndices };
}

type Candidate = { options: Option[]; cashCents: number; points: number; awardAvoidedCents: number; awardPoints: number; weightedCashCents: number; weightedAvoidedCents: number; key: string };
function better(a: Candidate, b: Candidate | undefined, strategy: Strategy, valuation: number | null) {
  if (!b) return true;
  let diff: number;
  if (strategy === 'cash-conservation') diff = b.cashCents - a.cashCents || a.weightedAvoidedCents - b.weightedAvoidedCents;
  else if (strategy === 'balanced') diff = (b.weightedCashCents + b.points * valuation!) - (a.weightedCashCents + a.points * valuation!);
  else {
    // Compare rational ratios exactly with integer USD cents and integer points.
    const an = a.awardPoints ? BigInt(a.awardAvoidedCents) : 0n;
    const bn = b.awardPoints ? BigInt(b.awardAvoidedCents) : 0n;
    const cross = an * BigInt(b.awardPoints || 1) - bn * BigInt(a.awardPoints || 1);
    diff = cross > 0n ? 1 : cross < 0n ? -1 : 0;
  }
  return diff > 0 || diff === 0 && (a.cashCents < b.cashCents || a.cashCents === b.cashCents && (a.points < b.points || a.points === b.points && a.key < b.key));
}

export function optimizePortfolio(input: unknown, scenario: unknown, catalog: Catalog) {
  const checked = validatePlanner(input, catalog);
  const parsed = portfolioRequestSchema.safeParse(scenario);
  if (!checked.success || !parsed.success) return { success: false as const, errors: [...(!checked.success ? checked.errors : []), ...(!parsed.success ? parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) : [])] };
  const data = checked.data; const request = parsed.data;
  const allStays = data.workspace.trips.flatMap((t) => t.stays);
  const errors: string[] = [];
  for (const id of [...request.selectedTripIds, ...request.priorities.map((i) => i.tripId)]) if (!data.workspace.trips.some((t) => t.id === id)) errors.push(`Unknown trip: ${id}`);
  for (const id of request.certificateEligibleStayIds) if (!allStays.some((s) => s.id === id && s.pricing.nights === 1 && s.certificate?.eligibility !== 'ineligible')) errors.push(`Certificate confirmation must identify a one-night stay without an ineligible override: ${id}`);
  for (const stay of allStays) {
    const e = calculatePoints({ ...stay.pricing, balance: null, valuationCpp: data.profile.valuationCpp, thresholds: DEFAULT_THRESHOLDS });
    if (!e.success) errors.push(...e.errors.map((error) => `${stay.id}: ${error}`));
    if (e.success && e.fx !== null && [e.cashTotal, e.awardCash, e.netCashAvoided].some((n) => n !== null && (!Number.isSafeInteger(cents(n * e.fx!)) || Math.abs(cents(n * e.fx!)) > Number.MAX_SAFE_INTEGER / 900))) errors.push(`${stay.id}: USD conversion exceeds safe monetary arithmetic; review the exchange rate.`);
  }
  if (errors.length) return { success: false as const, errors };
  const trips = data.workspace.trips.filter((t) => request.selectedTripIds.includes(t.id));
  const rows = trips.flatMap((trip) => trip.stays.map((s) => buildRow(trip, s, data, catalog, request)));
  const outside = data.workspace.trips.filter((t) => !request.selectedTripIds.includes(t.id)).flatMap((trip) => trip.stays.filter((s) => s.reservationStatus === 'reserved').map((s) => buildRow(trip, s, data, catalog, request)));
  const fixedRows = [...outside, ...rows.filter((r) => r.fixed)];
  const ids = fixedRows.flatMap((r) => r.options[0]!.certificateId ? [r.options[0]!.certificateId!] : []);
  if (new Set(ids).size !== ids.length) return { success: false as const, errors: ['A fixed certificate is assigned to more than one stay across the portfolio. Correct the duplicate in Trip builder.'] };
  const fixedPoints = total(fixedRows.map((r) => r.options[0]!.points));
  if (data.profile.balance !== null && fixedPoints.knownSubtotal > data.profile.balance) return { success: false as const, errors: ['Fixed stays exceed the shared profile points balance. Review reserved/manual commitments before optimizing.'] };
  const outsidePoints = total(outside.map((r) => r.options[0]!.points));
  const unknownCommitment = fixedPoints.total === null || fixedRows.some((r) => r.options[0]!.method === 'certificate' && (!r.options[0]!.certificateId || !data.profile.certificates.some((c) => c.id === r.options[0]!.certificateId)));
  const warnings: string[] = [];
  if (unknownCommitment) warnings.push('Fixed points or certificate commitments are unknown. New points and certificate allocations are withheld.');
  if (data.profile.balance === null) warnings.push('Profile points balance unknown. Positive points allocations are withheld; remaining balance stays unknown.');
  if (data.profile.valuationCpp === null) warnings.push('Profile point valuation unknown. Balanced strategy is unavailable.');
  if (outside.length) warnings.push('Reserved stays outside the selection reserve points and certificates. Their cash is outside the selected-trip budget and totals.');
  if (!rows.length) warnings.push('Select trips containing hotel stays to compare allocations.');
  const dated = rows.filter((r) => r.stay.checkIn && r.checkOut).sort((a, b) => a.stay.checkIn!.localeCompare(b.stay.checkIn!) || a.stay.id.localeCompare(b.stay.id));
  for (let i = 1; i < dated.length; i++) if (dated[i]!.stay.checkIn! < dated[i - 1]!.checkOut!) warnings.push(`Dates overlap: ${dated[i - 1]!.stay.id} and ${dated[i]!.stay.id}. Separate rooms or travelers are not assumed.`);
  const available = data.profile.balance === null || outsidePoints.total === null ? null : data.profile.balance - outsidePoints.total;
  const used = new Set(ids);
  const choices: Option[] = [];
  const best: Partial<Record<Strategy, Candidate>> = {};
  let nodes = 0; let limited = false; let feasible = 0;
  const budget = request.cashBudgetUsd === null ? null : cents(request.cashBudgetUsd);
  function visit(index: number, cashCents: number, points: number, awardAvoidedCents: number, awardPoints: number, weightedCashCents: number, weightedAvoidedCents: number) {
    if (nodes >= SEARCH_NODE_LIMIT) { limited = true; return; }
    nodes++;
    if (available !== null && points > available || budget !== null && cashCents > budget) return;
    if (index === rows.length) {
      feasible++;
      const candidate = { options: [...choices], cashCents, points, awardAvoidedCents, awardPoints, weightedCashCents, weightedAvoidedCents, key: choices.map((o) => `${o.method}:${o.certificateId ?? ''}`).join('|') };
      for (const strategy of STRATEGIES) if (strategy !== 'balanced' || data.profile.valuationCpp !== null) if (better(candidate, best[strategy], strategy, data.profile.valuationCpp)) best[strategy] = candidate;
      return;
    }
    const row = rows[index]!;
    // Cash first ensures a quickly available baseline; all other ordering is stable.
    const options = row.options.slice().sort((a, b) => a.method.localeCompare(b.method) || (data.profile.certificates.find((c) => c.id === a.certificateId)?.expiresOn ?? '').localeCompare(data.profile.certificates.find((c) => c.id === b.certificateId)?.expiresOn ?? '') || (a.certificateId ?? '').localeCompare(b.certificateId ?? ''));
    for (const option of options) {
      if (!row.fixed && (unknownCommitment && option.method !== 'cash' || available === null && (option.points ?? 0) > 0 || option.certificateId !== null && used.has(option.certificateId))) continue;
      choices.push(option);
      if (!row.fixed && option.certificateId) used.add(option.certificateId);
      const c = option.cashUsd === null ? 0 : cents(option.cashUsd);
      const a = option.cashAvoidedUsd === null ? 0 : cents(option.cashAvoidedUsd);
      visit(index + 1, cashCents + c, points + (option.points ?? 0), awardAvoidedCents + (option.method === 'points' ? a : 0), awardPoints + (option.method === 'points' ? option.points ?? 0 : 0), weightedCashCents + row.weight * c, weightedAvoidedCents + row.weight * a);
      if (!row.fixed && option.certificateId) used.delete(option.certificateId);
      choices.pop();
      if (limited) break;
    }
  }
  function search() {
    // Fixed rows are visited first so every variable choice sees all commitments.
    const fixed = rows.filter((r) => r.fixed); const variable = rows.filter((r) => !r.fixed);
    const ordered = [...fixed, ...variable];
    const original = [...rows]; rows.splice(0, rows.length, ...ordered);
    visit(0, 0, 0, 0, 0, 0, 0);
    for (const strategy of STRATEGIES) if (best[strategy]) {
      const b = best[strategy]!;
      b.options = original.map((r) => b.options[ordered.indexOf(r)]!);
    }
    rows.splice(0, rows.length, ...original);
  }
  search();
  if (limited) warnings.push(`Search reached ${SEARCH_NODE_LIMIT.toLocaleString('en-US')} nodes. Results are the best evaluated feasible plans; global optimality is unverified. Reduce the selection to complete search.`);
  const plans = STRATEGIES.map((strategy) => {
    const candidate = best[strategy];
    if (!candidate) return { strategy, label: STRATEGY_LABELS[strategy], available: false as const, reason: strategy === 'balanced' && data.profile.valuationCpp === null ? 'Personal point valuation is unknown.' : limited ? 'No feasible plan found before the search limit.' : 'No allocation fits known points and cash constraints.' };
    let remaining = unknownCommitment ? null : available;
    const held = new Set(outside.flatMap((r) => r.options[0]!.certificateId ? [r.options[0]!.certificateId!] : []));
    const allocations = rows.map((row, i) => {
      const option = candidate.options[i]!;
      remaining = remaining === null || option.points === null ? null : remaining - option.points;
      if (option.certificateId) held.add(option.certificateId);
      return { tripId: row.tripId, tripName: row.tripName, weight: row.weight, stayId: row.stay.id, propertyName: row.propertyName,
        checkIn: row.stay.checkIn, checkOut: row.checkOut, observedAt: row.stay.observedAt, currency: row.stay.pricing.currency,
        ...option, cpp: row.missing.length ? null : option.cpp, remainingPoints: remaining, remainingCertificateIds: unknownCommitment ? null : data.profile.certificates.filter((c) => !held.has(c.id)).map((c) => c.id),
        fixed: row.fixed, missing: row.missing, warnings: row.warnings, fifthNightSavings: option.method === 'points' ? row.fifthNightSavings : 0,
        freeNightIndices: option.method === 'points' ? row.freeNightIndices : [], alternatives: row.options,
        allocationReason: row.fixed ? row.stay.reservationStatus === 'reserved' ? 'Reserved booking is fixed.' : 'Incomplete comparison: existing manual booking choice is retained.' : STRATEGY_RULES[strategy] };
    });
    const cashUsd = cashTotal(allocations.map((a) => a.cashUsd)); const points = total(allocations.map((a) => a.points));
    const pointsAwards = allocations.filter((a) => a.method === 'points');
    const avoided = cashTotal(pointsAwards.map((a) => a.cashAvoidedUsd)); const spent = total(pointsAwards.map((a) => a.points));
    const assessmentComplete = !!rows.length && !rows.some((r) => r.missing.length) && !unknownCommitment && data.profile.balance !== null && !warnings.some((w) => w.startsWith('Dates overlap'));
    const cpp = pointsAwards.some((a) => a.missing.length) || avoided.total === null || spent.total === null || spent.total === 0 ? null : avoided.total * 100 / spent.total;
    return { strategy, label: STRATEGY_LABELS[strategy], available: true as const, assessmentComplete, optimal: !limited && assessmentComplete,
      allocations, points, cashUsd, cashByCurrency: [...new Set(allocations.map((a) => a.currency))].sort().map((currency) => ({ currency, ...cashTotal(allocations.filter((a) => a.currency === currency).map((a) => a.cash), fractionDigits(currency)) })),
      tripTotals: trips.map((trip) => {
        const group = allocations.filter((a) => a.tripId === trip.id);
        return { tripId: trip.id, tripName: trip.name, points: total(group.map((a) => a.points)), cashUsd: cashTotal(group.map((a) => a.cashUsd)),
          remainingPoints: group.length ? group[group.length - 1]!.remainingPoints : null,
          usedCertificateIds: group.flatMap((a) => a.certificateId ? [a.certificateId] : []) };
      }),
      remainingPoints: unknownCommitment ? null : remaining,
      usedCertificateIds: allocations.flatMap((a) => a.certificateId ? [a.certificateId] : []),
      remainingCertificateIds: unknownCommitment ? null : data.profile.certificates.filter((c) => !held.has(c.id)).map((c) => c.id),
      redemptionCpp: cpp, budgetState: budget === null ? 'not-set' : cashUsd.total === null ? 'unknown' : cents(cashUsd.total) <= budget ? 'within' : 'over',
      weightedCashUsd: cashUsd.total === null ? null : candidate.weightedCashCents / 100,
      cashPlusPointsValueUsd: cashUsd.total === null || points.total === null || data.profile.valuationCpp === null ? null : cashUsd.total + points.total * data.profile.valuationCpp / 100,
      objective: STRATEGY_RULES[strategy] };
  });
  return { success: true as const, version: PORTFOLIO_VERSION, request, startingPoints: data.profile.balance,
    outsideCommitments: outside.map((r) => ({ tripId: r.tripId, stayId: r.stay.id, ...r.options[0] })), outsidePoints,
    availablePoints: available, plans, warnings, search: { nodes, limit: SEARCH_NODE_LIMIT, limited, feasible },
    assumptions: ['Profile balance is the shared pre-allocation balance; it includes modeled reserved award commitments. Update manual reservation statuses or balance together if points have already been deducted.',
      'Only selected trips and reserved stays outside the selection are commitments. Unselected unreserved ideas are excluded.',
      'Each saved stay is one allocation unit. No hotel substitution, multi-night splitting or joining of reservations is inferred.',
      'Quotes, exchange rates, availability and certificate eligibility are manual; dated prices are scenarios, not guaranteed future rates.',
      'Paid-stay earnings, purchases, transfers, certificate opportunity cost, transport and activities are excluded. Scenario settings are transient; saved booking choices and balances are unchanged.'] };
}
