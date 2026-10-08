import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../../lib/catalog/catalog';
import { calculatePoints, DEFAULT_THRESHOLDS } from '../../lib/points/calculator';
import { calculateTrip, checkout, createStay, createTrip, tripSchema } from '../../lib/trips/trips';
import type { Trip, TripStay } from '../../lib/trips/trips';
import { parseRoute, tripsHref } from '../../lib/navigation/routes';
import { DEFAULT_QUERY } from '../../lib/catalog/explorer';

const loaded = loadCatalog();
if (!loaded.success) throw new Error('Invalid catalog');
const catalog = loaded.data;
const AS_OF = '2026-10-08';
const property = catalog.properties[0]!;
const stay = (id: string, method: 'cash' | 'points' = 'points', overrides: Partial<TripStay['pricing']> = {}): TripStay => ({
  ...createStay(id, property.id), bookingMethod: method, checkIn: '2027-01-01', observedAt: AS_OF,
  pricing: { ...createStay(id, property.id).pricing, nights: 5, cashRoom: 500, cashTaxes: 250, cashFees: 100, awardCash: 100, awardBasis: 'flat', awardPoints: 50000, fifthNight: 'eligible', comparable: 'same', ...overrides },
});
const trip = (stays: TripStay[], overrides: Partial<Trip> = {}): Trip => ({ ...createTrip('trip-test'), balance: 1200000, stays, ...overrides });
const run = (value: unknown) => { const result = calculateTrip(value, catalog, AS_OF); if (!result.success) throw new Error(result.errors.join('\n')); return result; };

describe('Stage 6 selected bookings and incomplete trip pricing', () => {
  it('sums a multi-hotel cash/points itinerary and checks the balance once', () => {
    const a = stay('stay-a'); const b = stay('stay-b', 'cash', { nights: 2, cashRoom: 200, cashTaxes: 40, cashFees: 10 }); b.propertyId = catalog.properties[1]!.id; b.checkIn = '2027-01-06';
    const result = run(trip([a, b]));
    expect(result).toMatchObject({ nights: 7, hotelChanges: 1, points: { total: 200000 }, cashUsd: { total: 550 }, remainingPoints: 1000000, shortfall: 0, netCashAvoidedUsd: 2750, redemptionCpp: 1.375, economicCostUsd: 2150, warnings: [] });
    expect(result.cashByCurrency).toEqual([{ currency: 'USD', total: 550, knownSubtotal: 550, missingCount: 0 }]);
  });
  it('recalculates edits without mutating trip, quotes or catalog', () => {
    const input = trip([stay('stay-a')]); const before = structuredClone(input); const catalogBefore = structuredClone(catalog);
    expect(run(input).points.total).toBe(200000);
    const edited = structuredClone(input); edited.stays[0]!.pricing.awardPoints = 60000;
    expect(run(edited).points.total).toBe(240000); expect(run(edited).remainingPoints).toBe(960000);
    expect(input).toEqual(before); expect(catalog).toEqual(catalogBefore); expect(run(input)).toEqual(run(input));
  });
  it('reuses the calculator result exactly and never discounts a final total twice', () => {
    const a = stay('stay-a', 'points', { awardBasis: 'total', awardPoints: 200000 });
    expect(run(trip([a])).stays[0]!.economics).toEqual(calculatePoints({ ...a.pricing, balance: null, valuationCpp: 0.8, thresholds: DEFAULT_THRESHOLDS }));
    expect(run(trip([a])).points.total).toBe(200000);
  });
  it('does not combine short stays at different hotels to create a free night', () => {
    const a = stay('stay-a', 'points', { nights: 3 }); const b = stay('stay-b', 'points', { nights: 2 }); b.propertyId = catalog.properties[1]!.id;
    expect(run(trip([a, b])).points.total).toBe(250000);
  });
  it('does not merge separate stays at the same property', () => {
    const result = run(trip([stay('stay-a', 'points', { nights: 3 }), stay('stay-b', 'points', { nights: 2 })]));
    expect(result.points.total).toBe(250000); expect(result.hotelChanges).toBe(0);
  });
  it('preserves unknown chosen cash costs and reports a known subtotal', () => {
    const result = run(trip([stay('stay-a'), stay('stay-b', 'cash', { cashTaxes: null })]));
    expect(result.cashUsd).toEqual({ total: null, knownSubtotal: 100, missingCount: 1 });
    expect(result.points.total).toBe(200000); expect(result.economicCostUsd).toBeNull();
  });
  it('preserves unknown award cash even with known points', () => {
    const result = run(trip([stay('stay-a', 'points', { awardCash: null })]));
    expect(result.points.total).toBe(200000); expect(result.cashUsd.total).toBeNull(); expect(result.redemptionCpp).toBeNull();
  });
  it('preserves unknown points and does not assert a remaining balance', () => {
    const result = run(trip([stay('stay-a'), stay('stay-b', 'points', { awardPoints: null })]));
    expect(result.points).toEqual({ total: null, knownSubtotal: 200000, missingCount: 1 });
    expect(result.remainingPoints).toBeNull(); expect(result.shortfall).toBeNull();
  });
  it('reports a proven minimum shortfall with incomplete points pricing', () => {
    const result = run(trip([stay('stay-a'), stay('stay-b', 'points', { awardPoints: null })], { balance: 100000 }));
    expect(result.shortfall).toBe(100000); expect(result.warnings).toContain('At least 100,000 points short; no purchase or transfer is assumed.');
  });
  it('keeps blank balance unknown, confirms exact sufficiency, and detects trip-wide shortfall', () => {
    const stays = [stay('stay-a'), stay('stay-b')];
    expect(run(trip(stays, { balance: null })).shortfall).toBeNull();
    expect(run(trip(stays, { balance: 400000 })).remainingPoints).toBe(0);
    expect(run(trip(stays, { balance: 399999 })).shortfall).toBe(1);
  });
  it('keeps known zero distinct from blank prices and undefined zero-points CPP', () => {
    const result = run(trip([stay('stay-a', 'points', { cashRoom: 0, cashTaxes: 0, cashFees: 0, awardCash: 0, awardPoints: 0 })]));
    expect(result.cashUsd.total).toBe(0); expect(result.points.total).toBe(0); expect(result.redemptionCpp).toBeNull();
  });
  it('excludes unchosen unknown award inputs from cash spending totals', () => {
    const result = run(trip([stay('stay-a', 'cash', { awardPoints: null, awardCash: null })]));
    expect(result.cashUsd.total).toBe(2850); expect(result.points.total).toBe(0); expect(result.redemptionCpp).toBeNull(); expect(result.netCashAvoidedUsd).toBeNull();
  });
  it('excludes an unknown cash alternative from chosen award costs but leaves redemption unknown', () => {
    const result = run(trip([stay('stay-a', 'points', { cashRoom: null })]));
    expect(result.cashUsd.total).toBe(100); expect(result.points.total).toBe(200000); expect(result.redemptionCpp).toBeNull();
  });
  it('keeps currencies separate and USD unknown without FX, then recalculates from manual FX', () => {
    const a = stay('stay-a', 'cash', { currency: 'EUR', nights: 1, cashRoom: 100, cashTaxes: 0, cashFees: 0 }); const b = stay('stay-b', 'cash', { nights: 1, cashRoom: 50, cashTaxes: 0, cashFees: 0 });
    expect(run(trip([a, b])).cashByCurrency.map((group) => [group.currency, group.total])).toEqual([['EUR', 100], ['USD', 50]]);
    expect(run(trip([a, b])).cashUsd).toEqual({ total: null, knownSubtotal: 50, missingCount: 1 });
    a.pricing.usdPerCurrency = 1.2; expect(run(trip([a, b])).cashUsd.total).toBe(170);
  });
  it('uses currency minor units for stay and trip totals', () => {
    expect(run(trip([stay('stay-a', 'cash', { currency: 'JPY', nights: 2, cashRoom: 100.4, cashTaxes: 0, cashFees: 0, usdPerCurrency: 0.01 })])).cashByCurrency[0]!.total).toBe(200);
    expect(run(trip([stay('stay-a', 'cash', { nights: 2, cashRoom: 0.1, cashTaxes: 0.1, cashFees: 0 })])).cashUsd.total).toBe(0.3);
  });
  it('weights redemption by total points and suppresses it for incomparable awards', () => {
    const a = stay('stay-a', 'points', { nights: 1, cashRoom: 100, cashTaxes: 0, cashFees: 0, awardCash: 0, awardBasis: 'total', awardPoints: 10000 });
    const b = stay('stay-b', 'points', { nights: 1, cashRoom: 900, cashTaxes: 0, cashFees: 0, awardCash: 0, awardBasis: 'total', awardPoints: 30000 });
    expect(run(trip([a, b])).redemptionCpp).toBe(2.5);
    b.pricing.comparable = 'different'; expect(run(trip([a, b])).redemptionCpp).toBeNull();
    b.pricing.comparable = 'unknown'; expect(run(trip([a, b])).redemptionCpp).toBeNull();
  });
  it('keeps unknown discount eligibility and variable nightly omissions explicit', () => {
    expect(run(trip([stay('stay-a', 'points', { fifthNight: 'unknown' })])).points.total).toBeNull();
    const a = stay('stay-a', 'points', { awardBasis: 'varying', nightlyPoints: [50000, null, 10000, 40000, 30000] }); expect(run(trip([a])).points.total).toBeNull();
    a.pricing.nightlyPoints[1] = 20000; expect(run(trip([a])).points.total).toBe(140000);
  });
  it('calculates UTC check-out across leap dates and flags chronology without counting gaps', () => {
    expect(checkout('2028-02-28', 2)).toBe('2028-03-01'); expect(checkout(null, 5)).toBeNull();
    const a = stay('stay-a'); const b = stay('stay-b'); b.checkIn = '2027-01-10';
    expect(run(trip([a, b])).nights).toBe(10); expect(run(trip([a, b])).warnings.join()).toContain('gap');
    b.checkIn = '2027-01-03'; expect(run(trip([a, b])).warnings.join()).toContain('overlap');
    b.checkIn = null; expect(run(trip([a, b])).warnings.join()).toContain('Chronology');
  });
  it('counts hotel changes from chosen order rather than unique properties', () => {
    const a = stay('stay-a'); const b = stay('stay-b'); b.propertyId = catalog.properties[1]!.id; const c = stay('stay-c');
    expect(run(trip([a, b, c])).hotelChanges).toBe(2); expect(run(trip([a, c, b])).hotelChanges).toBe(1);
  });
  it('retains manual notes and metadata and flags unknown/old/future quotes', () => {
    const a = stay('stay-a'); a.notes = '<script>notes</script>'; a.observedAt = '2026-01-01';
    expect(run(trip([a])).stays[0]!.warnings.join()).toContain('30 days old'); expect(run(trip([a])).trip.stays[0]!.notes).toBe(a.notes);
    a.observedAt = '2027-01-01'; expect(run(trip([a])).stays[0]!.warnings.join()).toContain('future');
    a.observedAt = null; expect(run(trip([a])).stays[0]!.warnings.join()).toContain('date unknown');
  });
  it('handles an empty trip without inventing a redemption assessment', () => {
    expect(run(trip([]))).toMatchObject({ nights: 0, hotelChanges: 0, points: { total: 0 }, cashUsd: { total: 0 }, redemptionCpp: null, remainingPoints: 1200000 });
  });
  it('rejects malformed, oversized, unknown-property and duplicate inputs without partial totals', () => {
    for (const input of [null, { ...trip([]), extra: true }, trip([stay('stay-a'), stay('stay-a')]), trip([stay('stay-a', 'cash', { nights: 61 })]), trip([stay('stay-a', 'cash', { cashRoom: -1 })]), trip(Array.from({ length: 31 }, (_, i) => stay(`stay-${i}`))), trip([{ ...stay('stay-a'), propertyId: 'missing' }]), trip([{ ...stay('stay-a'), checkIn: '2027-02-30' }]), trip([{ ...stay('stay-a'), checkIn: '9999-12-31' }]), trip([stay('stay-a', 'points', { awardBasis: 'varying', nightlyPoints: [1] })])]) expect(calculateTrip(input, catalog, AS_OF).success).toBe(false);
    expect(tripSchema.safeParse(trip([], { name: '' })).success).toBe(false);
  });
  it('round trips explorer/comparison context without exposing manual trip inputs in URLs', () => {
    const query = { ...DEFAULT_QUERY, country: 'TZ' }; const href = tripsHref(query, ['mapito', 'mereshi']);
    expect(parseRoute(href)).toEqual({ page: 'trips', query, comparisonSlugs: ['mapito', 'mereshi'] }); expect(href).not.toContain('balance');
  });
});
