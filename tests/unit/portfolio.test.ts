import { describe, expect, it } from 'vitest';
import { optimizePortfolio, SEARCH_NODE_LIMIT } from '../../lib/portfolio/optimizer';
import type { Strategy } from '../../lib/portfolio/optimizer';
import { exportPlanner, importPlanner } from '../../lib/storage/planner';
import { createStay, createTrip } from '../../lib/trips/trips';
import { fixtureCatalog } from '../fixtures/catalog';
import { loadFoundation } from '../../lib/catalog/foundation';
import { validateFoundation } from '../../lib/validation/foundation';
import { parseRoute, portfolioHref } from '../../lib/navigation/routes';
import { DEFAULT_QUERY } from '../../lib/catalog/explorer';
import { portfolioFixture, portfolioRequest } from '../fixtures/portfolio';
const catalog = fixtureCatalog();
const run = (data = portfolioFixture(), request = portfolioRequest()) => {
  const result = optimizePortfolio(data, request, catalog);
  if (!result.success) throw new Error(result.errors.join('; '));
  return result;
};
const plan = (result: ReturnType<typeof run>, strategy: Strategy) => {
  const p = result.plans.find((p) => p.strategy === strategy)!;
  if (!p.available) throw new Error(p.reason);
  return p;
};
const cert = (id = 'cert-one', points = 50_000) => ({ id, label: id, points, expiresOn: '2027-12-31', notes: '' });
describe('Deterministic manual multi-trip allocation', () => {
  it('admits explicitly authorized Stage 14 while rejecting deferred and later runtime stages', () => {
    const bundle = loadFoundation(); expect(bundle.success).toBe(true); if (!bundle.success) throw new Error('Foundation required.');
    expect(bundle.data.foundation.stage).toBe(14);
    for (const stage of [12, 13, 15, 16]) expect(validateFoundation({ ...bundle.data, foundation: { ...bundle.data.foundation, stage } }).success).toBe(false);
    const query = { ...DEFAULT_QUERY, country: 'TZ' }; expect(parseRoute(portfolioHref(query, ['mapito']))).toEqual({ page: 'portfolio', query, comparisonSlugs: ['mapito'] });
  });
  it('compares independently known cash, CPP and balanced optima and every ledger balance', () => {
    const r = run(); const c = plan(r, 'cash-conservation'); const v = plan(r, 'redemption-value'); const b = plan(r, 'balanced');
    expect(c.allocations.map((a) => a.method)).toEqual(['points', 'cash', 'cash']); expect(c.cashUsd.total).toBe(1000); expect(c.points.total).toBe(100000); expect(c.remainingPoints).toBe(0);
    expect(v.allocations.map((a) => a.method)).toEqual(['cash', 'points', 'cash']); expect(v.redemptionCpp).toBe(2); expect(v.cashUsd.total).toBe(1400); expect(v.remainingPoints).toBe(70000);
    expect(b.cashPlusPointsValueUsd).toBe(1700); expect(b.allocations.map((a) => a.remainingPoints)).toEqual([100000, 70000, 70000]);
    expect(b.tripTotals.map((t) => t.remainingPoints)).toEqual([100000, 70000, 70000]); expect(r.search.limited).toBe(false);
  });
  it('never mutates input, gives byte-equivalent results and reconstructs from compatible v2 backup', () => {
    const d = portfolioFixture(); const before = structuredClone(d); const r = run(d);
    expect(d).toEqual(before); expect(run(d)).toEqual(r);
    const restored = importPlanner(exportPlanner(d, catalog), catalog); expect(restored.success).toBe(true);
    if (restored.success) expect(run(restored.data)).toEqual(r);
  });
  it('uses trip priorities only as documented, without adding per-trip balances', () => {
    const d = portfolioFixture(); d.workspace.trips.forEach((t) => t.balance = 1e9);
    const q = portfolioRequest(); q.priorities = [{ tripId: 'journey-2', weight: 3 }];
    const r = run(d, q); expect(plan(r, 'balanced').allocations.map((a) => a.method)).toEqual(['cash', 'cash', 'points']); expect(plan(r, 'cash-conservation').points.total).toBe(100000);
  });
  it('obeys cash caps and reports impossible budgets without inventing an allocation', () => {
    const q = portfolioRequest(); q.cashBudgetUsd = 1200; expect(plan(run(undefined, q), 'redemption-value').allocations[0]!.method).toBe('points');
    q.cashBudgetUsd = 999; expect(run(undefined, q).plans.every((p) => !p.available)).toBe(true);
    q.cashBudgetUsd = 0; const d = portfolioFixture(); d.profile.balance = 210000; expect(plan(run(d, q), 'cash-conservation').cashUsd.total).toBe(0);
  });
  it('allocates each certificate once across trips and counts exact top-offs and forfeiture', () => {
    const d = portfolioFixture(); d.profile.certificates = [cert()]; const q = portfolioRequest(); q.certificateEligibleStayIds = ['stop-1', 'stop-2'];
    const r = run(d, q); for (const strategy of ['cash-conservation', 'redemption-value', 'balanced'] as const) {
      const p = plan(r, strategy); expect(p.usedCertificateIds.length).toBeLessThanOrEqual(1); expect(new Set(p.usedCertificateIds).size).toBe(p.usedCertificateIds.length); expect(p.points.total!).toBeLessThanOrEqual(100000);
      const a = p.allocations.find((a) => a.method === 'certificate'); if (a) { expect(a.stayId).toBe('stop-1'); expect(a.points).toBe(0); expect(a.unusedCertificateValue).toBe(20000); expect(a.cpp).toBeNull(); }
    }
    expect(plan(r, 'cash-conservation').usedCertificateIds).toEqual(['cert-one']);
    expect(plan(r, 'redemption-value').usedCertificateIds).toEqual([]);
    d.profile.certificates = [cert('cert-one', 60000)]; q.certificateEligibleStayIds = ['stop-2']; const p = plan(run(d, q), 'cash-conservation'); expect(p.allocations[2]!.points).toBe(20000); expect(p.remainingPoints).toBe(50000);
  });
  it('rejects duplicate fixed certificate assignment between trips', () => {
    const d = portfolioFixture(); d.profile.certificates = [cert('cert-one', 100000)];
    for (const t of d.workspace.trips.slice(0, 2)) { t.stays[0]!.bookingMethod = 'certificate'; t.stays[0]!.reservationStatus = 'reserved'; t.stays[0]!.certificate = { id: 'cert-one', eligibility: 'eligible' }; }
    const r = optimizePortfolio(d, portfolioRequest(), catalog); expect(r.success).toBe(false); if (!r.success) expect(r.errors.join()).toMatch(/more than one/);
  });
  it('enforces top-off and expiry boundaries and never combines multiple certificates', () => {
    const d = portfolioFixture(); d.profile.balance = 25000; d.profile.certificates = [cert('cert-one', 55000), cert('cert-two', 20000)];
    const q = portfolioRequest(); q.selectedTripIds = ['journey-2']; q.certificateEligibleStayIds = ['stop-2'];
    const p = plan(run(d, q), 'cash-conservation'); expect(p.usedCertificateIds).toEqual(['cert-one']); expect(p.points.total).toBe(25000); expect(p.remainingPoints).toBe(0);
    d.workspace.trips[2]!.stays[0]!.pricing.awardPoints = 80001; expect(plan(run(d, q), 'cash-conservation').usedCertificateIds).toEqual([]);
    d.workspace.trips[2]!.stays[0]!.pricing.awardPoints = 80000; d.profile.certificates[0]!.expiresOn = '2027-03-09'; expect(plan(run(d, q), 'cash-conservation').usedCertificateIds).toEqual([]);
    d.profile.certificates[0]!.expiresOn = '2027-03-10'; expect(plan(run(d, q), 'cash-conservation').usedCertificateIds).toEqual(['cert-one']);
    d.profile.certificates[0]!.expiresOn = null; expect(plan(run(d, q), 'cash-conservation').usedCertificateIds).toEqual([]);
  });
  it('holds reserved points and certificates outside selection and counts inside commitments once', () => {
    const d = portfolioFixture(); d.profile.certificates = [cert('cert-one', 100000)]; const s = d.workspace.trips[0]!.stays[0]!; s.bookingMethod = 'certificate'; s.reservationStatus = 'reserved'; s.certificate = { id: 'cert-one', eligibility: 'eligible' };
    const q = portfolioRequest(); q.selectedTripIds = ['journey-1', 'journey-2']; q.certificateEligibleStayIds = ['stop-1']; const r = run(d, q); expect(r.outsidePoints.total).toBe(0); expect(plan(r, 'cash-conservation').usedCertificateIds).toEqual([]); expect(plan(r, 'cash-conservation').remainingCertificateIds).toEqual([]);
    s.bookingMethod = 'points'; const outside = run(d, q); expect(outside.availablePoints).toBe(0); expect(plan(outside, 'cash-conservation').points.total).toBe(0);
    d.profile.certificates = []; q.certificateEligibleStayIds = []; q.selectedTripIds = ['journey-0', 'journey-1']; const inside = plan(run(d, q), 'balanced'); expect(inside.points.total).toBe(100000); expect(inside.remainingPoints).toBe(0); expect(inside.cashUsd.total).toBe(600);
  });
  it('never alters a reserved cash choice even when a better alternative exists', () => {
    const d = portfolioFixture(); d.workspace.trips[0]!.stays[0]!.reservationStatus = 'reserved'; expect(plan(run(d), 'cash-conservation').allocations[0]!.method).toBe('cash');
  });
  it('reports fixed points shortfalls before discretionary optimization', () => {
    const d = portfolioFixture(); d.profile.balance = 1; const s = d.workspace.trips[0]!.stays[0]!; s.bookingMethod = 'points'; s.reservationStatus = 'reserved'; expect(optimizePortfolio(d, portfolioRequest(), catalog).success).toBe(false);
  });
  it.each(['cashRoom', 'cashTaxes', 'cashFees', 'awardCash', 'awardPoints', 'usdPerCurrency'] as const)('preserves unknown %s with incomplete assessment', (field) => {
    const d = portfolioFixture(); const s = d.workspace.trips[0]!.stays[0]!; if (field === 'usdPerCurrency') s.pricing.currency = 'EUR'; s.pricing[field] = null;
    const p = plan(run(d), 'cash-conservation'); expect(p.assessmentComplete).toBe(false); expect(p.optimal).toBe(false); expect(p.allocations[0]!.fixed).toBe(true); expect(p.allocations[0]!.missing.length).toBeGreaterThan(0);
    if (['cashRoom', 'cashTaxes', 'cashFees', 'usdPerCurrency'].includes(field)) { expect(p.cashUsd.total).toBeNull(); expect(p.cashUsd.knownSubtotal).toBe(400); }
  });
  it('withholds new resource spending if a fixed points commitment is unknown', () => {
    const d = portfolioFixture(); const s = d.workspace.trips[0]!.stays[0]!; s.bookingMethod = 'points'; s.pricing.awardPoints = null;
    const p = plan(run(d), 'cash-conservation'); expect(p.points.total).toBeNull(); expect(p.points.knownSubtotal).toBe(0); expect(p.remainingPoints).toBeNull(); expect(p.allocations.slice(1).map((a) => a.method)).toEqual(['cash', 'cash']);
  });
  it('distinguishes zero balance, unknown balance, zero prices and missing personal valuation', () => {
    const d = portfolioFixture(); d.profile.balance = 0; expect(plan(run(d), 'cash-conservation').remainingPoints).toBe(0);
    d.profile.balance = null; d.profile.valuationCpp = null; const r = run(d); expect(plan(r, 'cash-conservation').remainingPoints).toBeNull(); expect(r.plans.find((p) => p.strategy === 'balanced')!.available).toBe(false);
    d.workspace.trips[0]!.stays[0]!.pricing.awardPoints = 0; expect(plan(run(d), 'cash-conservation').allocations[0]!.method).toBe('points'); expect(plan(run(d), 'cash-conservation').redemptionCpp).toBeNull();
  });
  it.each(['observedAt', 'checkIn'] as const)('does not optimize undated %s quotes', (field) => {
    const d = portfolioFixture(); d.workspace.trips[0]!.stays[0]![field] = null; expect(plan(run(d), 'cash-conservation').allocations[0]!.method).toBe('cash');
  });
  it('retains stale date warnings, rejects future observed dates, and flags overlapping trips', () => {
    const d = portfolioFixture(); d.workspace.trips[0]!.stays[0]!.observedAt = '2026-01-01'; expect(plan(run(d), 'cash-conservation').allocations[0]!.warnings.join()).toMatch(/30 days/);
    d.workspace.trips[0]!.stays[0]!.observedAt = '2026-10-14'; expect(plan(run(d), 'cash-conservation').allocations[0]!.fixed).toBe(true);
    d.workspace.trips[1]!.stays[0]!.checkIn = '2027-01-10'; expect(plan(run(d), 'cash-conservation').assessmentComplete).toBe(false);
  });
  it('does not infer comparable rooms or certificate eligibility and rejects ineligible overrides', () => {
    const d = portfolioFixture(); d.profile.certificates = [cert()]; expect(plan(run(d), 'cash-conservation').usedCertificateIds).toEqual([]);
    d.workspace.trips[0]!.stays[0]!.pricing.comparable = 'different'; expect(plan(run(d), 'cash-conservation').allocations[0]!.fixed).toBe(true);
    d.workspace.trips[1]!.stays[0]!.certificate = { id: null, eligibility: 'ineligible' }; const q = portfolioRequest(); q.certificateEligibleStayIds = ['stop-1']; expect(optimizePortfolio(d, q, catalog).success).toBe(false);
  });
  it('reuses varying-night fifth-night arithmetic without double discounts or certificate splitting', () => {
    const d = portfolioFixture(); d.profile.balance = 1000000; d.profile.certificates = [cert('cert-one', 100000)]; const s = d.workspace.trips[0]!.stays[0]!;
    s.pricing.nights = 5; s.pricing.awardBasis = 'varying'; s.pricing.nightlyPoints = [20000, 30000, 20000, 40000, 50000]; s.pricing.fifthNight = 'eligible';
    const p = plan(run(d), 'cash-conservation'); expect(p.allocations[0]!.points).toBe(140000); expect(p.allocations[0]!.freeNightIndices).toEqual([0]); expect(p.allocations[0]!.fifthNightSavings).toBe(20000);
    s.pricing.awardBasis = 'total'; s.pricing.awardPoints = 140000; expect(plan(run(d), 'cash-conservation').allocations[0]!.points).toBe(140000);
  });
  it('separates native currencies, converts at manual FX and rounds amounts before summing', () => {
    const d = portfolioFixture(); d.profile.balance = 0; const s = d.workspace.trips[0]!.stays[0]!; s.pricing.currency = 'EUR'; s.pricing.cashRoom = 1.005; s.pricing.usdPerCurrency = 1.1;
    const p = plan(run(d), 'cash-conservation'); expect(p.allocations[0]!.cash).toBe(1.01); expect(p.allocations[0]!.cashUsd).toBe(1.11); expect(p.cashUsd.total).toBe(1001.11); expect(p.cashByCurrency.map((c) => c.currency)).toEqual(['EUR', 'USD']);
  });
  it.each([null, {}, { ...portfolioRequest(), selectedTripIds: ['missing'] }, { ...portfolioRequest(), selectedTripIds: ['journey-0', 'journey-0'] }, { ...portfolioRequest(), cashBudgetUsd: -1 }, { ...portfolioRequest(), asOf: '2026-02-30' }])('rejects malformed scenario or orphaned references', (q) => expect(optimizePortfolio(portfolioFixture(), q, catalog).success).toBe(false));
  it('guards unsafe FX arithmetic and malformed varying-night prices', () => {
    const d = portfolioFixture(); const s = d.workspace.trips[0]!.stays[0]!; s.pricing.currency = 'EUR'; s.pricing.usdPerCurrency = 1e6; s.pricing.cashRoom = 1e9; expect(optimizePortfolio(d, portfolioRequest(), catalog).success).toBe(false);
    s.pricing = { ...s.pricing, cashRoom: 100, usdPerCurrency: 1, awardBasis: 'varying', nightlyPoints: [] }; expect(optimizePortfolio(d, portfolioRequest(), catalog).success).toBe(false);
  });
  it('discloses bounded search without claiming globally optimal results', () => {
    const d = portfolioFixture(); d.profile.balance = 1e9; const t = createTrip('big-trip'); t.stays = Array.from({ length: 18 }, (_, i) => ({ ...createStay(`big-stop-${i}`, 'property-fixture'), checkIn: `2027-06-${String(i + 1).padStart(2, '0')}`, observedAt: '2026-10-13', pricing: { ...d.workspace.trips[0]!.stays[0]!.pricing } })); d.workspace.trips = [t]; d.workspace.activeId = t.id;
    const q = { ...portfolioRequest(), selectedTripIds: [t.id] }; const r = run(d, q); expect(r.search.nodes).toBe(SEARCH_NODE_LIMIT); expect(r.search.limited).toBe(true); expect(plan(r, 'cash-conservation').optimal).toBe(false); expect(r.warnings.join()).toMatch(/global optimality/);
  });
  it('matches an independent complete enumeration for 40 varied small portfolios', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const d = portfolioFixture(); d.profile.balance = 50_000 + seed * 3000; d.profile.valuationCpp = .5 + seed / 50;
      d.workspace.trips.forEach((t, i) => { t.stays[0]!.pricing.cashRoom = (seed * (i + 7) * 97) % 1900 + 100; t.stays[0]!.pricing.awardPoints = (seed * (i + 3) * 79) % 90000 + 10000; t.stays[0]!.pricing.awardCash = seed + i; });
      const candidates = Array.from({ length: 8 }, (_, mask) => {
        let cash = 0, points = 0, avoided = 0;
        d.workspace.trips.forEach((t, i) => { const p = t.stays[0]!.pricing; if (mask & (1 << i)) { cash += p.awardCash!; points += p.awardPoints!; avoided += p.cashRoom! - p.awardCash!; } else cash += p.cashRoom!; });
        return { cash, points, cpp: points ? avoided * 100 / points : 0, cost: cash + points * d.profile.valuationCpp! / 100 };
      }).filter((c) => c.points <= d.profile.balance!);
      const r = run(d);
      expect(plan(r, 'cash-conservation').cashUsd.total).toBe(Math.min(...candidates.map((c) => c.cash)));
      expect(plan(r, 'redemption-value').redemptionCpp ?? 0).toBeCloseTo(Math.max(...candidates.map((c) => c.cpp)), 10);
      expect(plan(r, 'balanced').cashPlusPointsValueUsd).toBeCloseTo(Math.min(...candidates.map((c) => c.cost)), 10);
    }
  });
});
