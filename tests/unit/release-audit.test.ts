import { describe, expect, it } from 'vitest';
import { calculateTrip } from '../../lib/trips/trips';
import { optimizePortfolio } from '../../lib/portfolio/optimizer';
import { exportPlanner, importPlanner } from '../../lib/storage/planner';
import { fixtureCatalog } from '../fixtures/catalog';
import { portfolioFixture, portfolioRequest } from '../fixtures/portfolio';
const catalog = fixtureCatalog();

describe('Release audit: inspectable arithmetic and incomplete journeys', () => {
  it('sums rounded USD stay charges consistently between Trip builder and Portfolio', () => {
    const d = portfolioFixture(); d.profile.balance = 0;
    const t = d.workspace.trips[0]!;
    t.stays = [structuredClone(t.stays[0]!), structuredClone(t.stays[0]!)];
    t.stays.forEach((s, i) => { s.id = `round-${i}`; s.checkIn = `2027-01-${10 + i}`; s.pricing.currency = 'EUR'; s.pricing.cashRoom = 100.02; s.pricing.usdPerCurrency = 1.125; });
    d.workspace.trips = [t];
    const trip = calculateTrip(t, catalog, '2026-10-13', d.profile);
    const portfolio = optimizePortfolio(d, { ...portfolioRequest(), selectedTripIds: [t.id] }, catalog);
    expect(trip.success && portfolio.success).toBe(true);
    if (!trip.success || !portfolio.success) throw new Error('Valid scenario required');
    const cash = portfolio.plans.find(p => p.strategy === 'cash-conservation')!;
    if (!cash.available) throw new Error('Cash scenario required');
    expect(trip.stays.map(s => s.cashUsd)).toEqual([112.52, 112.52]);
    expect(trip.cashUsd.total).toBe(225.04);
    expect(trip.cashUsd.total).toBe(cash.cashUsd.total);
  });
  it('carries known balances through an empty selected trip without inventing spending', () => {
    const d = portfolioFixture(); d.workspace.trips[1]!.stays = [];
    const r = optimizePortfolio(d, portfolioRequest(), catalog);
    if (!r.success) throw new Error('Valid scenario required');
    for (const p of r.plans) {
      if (!p.available) throw new Error('Plan required');
      expect(p.tripTotals[1]!.points.total).toBe(0);
      expect(p.tripTotals[1]!.cashUsd.total).toBe(0);
      expect(p.tripTotals[1]!.remainingPoints).toBe(p.tripTotals[0]!.remainingPoints);
    }
  });
  it('keeps balances unknown through an empty trip if fixed points are missing', () => {
    const d = portfolioFixture(); d.workspace.trips[1]!.stays = [];
    d.workspace.trips[0]!.stays[0]!.bookingMethod = 'points'; d.workspace.trips[0]!.stays[0]!.pricing.awardPoints = null;
    const r = optimizePortfolio(d, portfolioRequest(), catalog);
    if (!r.success) throw new Error('Valid scenario required');
    const p = r.plans.find(p => p.strategy === 'cash-conservation')!;
    if (!p.available) throw new Error('Plan required');
    expect(p.tripTotals[1]!.remainingPoints).toBeNull(); expect(p.remainingPoints).toBeNull();
  });
  it('reconstructs a realistic mixed manual portfolio with fifth-night savings and one certificate', () => {
    const d = portfolioFixture(); d.profile.balance = 600000;
    d.profile.certificates = [{ id: 'annual-award', label: '85k award', points: 85000, expiresOn: '2027-12-31', notes: '' }];
    const [winter, safari, city] = d.workspace.trips.map(t => t.stays[0]!);
    winter!.pricing = { ...winter!.pricing, nights: 4, cashRoom: 575, cashTaxes: 380, cashFees: 200, awardPoints: 240000, awardCash: 200 };
    safari!.pricing = { ...safari!.pricing, nights: 5, cashRoom: 1400, awardBasis: 'flat', awardPoints: 100000, fifthNight: 'eligible', awardCash: 200 };
    city!.pricing = { ...city!.pricing, cashRoom: 500, cashTaxes: 60, cashFees: 40, awardPoints: 105000, awardCash: 40 };
    const q = { ...portfolioRequest(), certificateEligibleStayIds: [city!.id] };
    const before = exportPlanner(d, catalog); const r = optimizePortfolio(d, q, catalog);
    if (!r.success) throw new Error('Valid scenario required');
    const p = r.plans.find(p => p.strategy === 'cash-conservation')!;
    if (!p.available) throw new Error('Plan required');
    expect(p.allocations.map(a => a.method)).toEqual(['cash', 'points', 'certificate']);
    expect(p.points.total).toBe(420000); expect(p.cashUsd.total).toBe(3120); expect(p.remainingPoints).toBe(180000);
    expect(p.allocations[1]!.fifthNightSavings).toBe(100000); expect(p.allocations[2]!.points).toBe(20000);
    expect(p.redemptionCpp).toBe(1.7); expect(p.usedCertificateIds).toEqual(['annual-award']);
    expect(importPlanner(before, catalog)).toEqual({ success: true, data: d });
    const restored = importPlanner(before, catalog); if (!restored.success) throw new Error('Restore required');
    expect(optimizePortfolio(restored.data, q, catalog)).toEqual(r);
  });
});
