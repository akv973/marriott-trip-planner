import { describe, expect, it } from 'vitest';
import { calculatePoints, classifyValue, DEFAULT_THRESHOLDS } from '../../lib/points/calculator';
import { calculatorHref, parseRoute } from '../../lib/navigation/routes';
import { DEFAULT_QUERY } from '../../lib/catalog/explorer';
import { CANONICAL_POINTS_CASES, pointsInput } from '../fixtures/points';

const evaluate = (input = pointsInput()) => {
  const result = calculatePoints(input);
  if (!result.success) throw new Error(result.errors.join('\n'));
  return result;
};
describe('Canonical Stage 4 economics regressions', () => {
  it.each(CANONICAL_POINTS_CASES)('$name', ({ input, expected }) => expect(evaluate(input)).toMatchObject(expected));
});
describe('Manual calculation boundaries', () => {
  it('uses the two lowest nights over the entire ten-night stay, with earliest ties', () => {
    const result = evaluate(pointsInput({ nights: 10, awardBasis: 'varying', nightlyPoints: [10000, 10000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000] }));
    expect(result).toMatchObject({ grossPoints: 660000, savings: 20000, pointsSpent: 640000, freeNightIndices: [0, 1] });
  });
  it('uses the lowest varying price rather than the fifth calendar night', () => {
    expect(evaluate(pointsInput({ awardBasis: 'varying', nightlyPoints: [50000, 30000, 60000, 70000, 90000] }))).toMatchObject({ grossPoints: 300000, savings: 30000, pointsSpent: 270000, freeNightIndices: [1] });
  });
  it('handles fourteen and fifteen nights with two and three free nights', () => {
    expect(evaluate(pointsInput({ nights: 14 })).pointsSpent).toBe(600000);
    expect(evaluate(pointsInput({ nights: 15 })).pointsSpent).toBe(600000);
  });
  it('does not deduct again from a final quoted points total', () => {
    expect(evaluate(pointsInput({ awardBasis: 'total', awardPoints: 200000 }))).toMatchObject({ grossPoints: 200000, pointsSpent: 200000, savings: 0, freeNightIndices: [] });
  });
  it('never discounts an ineligible award or infers unknown eligibility', () => {
    expect(evaluate(pointsInput({ fifthNight: 'ineligible' })).pointsSpent).toBe(250000);
    expect(evaluate(pointsInput({ fifthNight: 'unknown' }))).toMatchObject({ grossPoints: 250000, pointsSpent: null, savings: null, cpp: null });
    expect(evaluate(pointsInput({ nights: 4, fifthNight: 'unknown' })).pointsSpent).toBe(200000);
  });
  it.each(['cashTaxes', 'cashFees', 'awardCash'] as const)('keeps blank %s unknown rather than zero', (field) => {
    expect(evaluate(pointsInput({ [field]: null })).cpp).toBeNull();
    expect(evaluate(pointsInput({ [field]: 0 })).cpp).not.toBeNull();
  });
  it('preserves unknown nightly rates even when they could be a free night', () => {
    expect(evaluate(pointsInput({ awardBasis: 'varying', nightlyPoints: [null, 50000, 50000, 50000, 50000] })).pointsSpent).toBeNull();
  });
  it('matches nightly and total cash entries without double counting extras', () => {
    expect(evaluate(pointsInput({ cashBasis: 'total', cashRoom: 2500 })).cashTotal).toBe(2850);
    expect(evaluate(pointsInput({ cashRoom: 10.11, cashTaxes: 0.12, cashFees: 0.23, awardCash: 0 })).cashTotal).toBe(50.9);
  });
  it('requires manually entered FX for non-USD CPP and honors currency minor units', () => {
    expect(evaluate(pointsInput({ currency: 'BRL', cashRoom: 2500 })).cpp).toBeNull();
    expect(evaluate(pointsInput({ currency: 'BRL', cashRoom: 2500, cashTaxes: 0, cashFees: 0, awardCash: 0, usdPerCurrency: 0.2 })).cpp).toBe(1.25);
    expect(evaluate(pointsInput({ currency: 'JPY', cashRoom: 100.4, cashTaxes: 0, cashFees: 0, awardCash: 0, usdPerCurrency: 0.01 })).cashTotal).toBe(500);
  });
  it('keeps negative net cash avoided and zero points mathematically honest', () => {
    expect(evaluate(pointsInput({ awardCash: 3000 }))).toMatchObject({ netCashAvoided: -150, cpp: -0.075, band: 'Strongly cash preferred' });
    expect(evaluate(pointsInput({ awardPoints: 0 }))).toMatchObject({ pointsSpent: 0, cpp: null, band: null });
  });
  it('distinguishes assessment, economic costs and affordability', () => {
    expect(evaluate()).toMatchObject({ pointsValue: 1600, awardEconomicCostUsd: 1700, pointsShortfall: null });
    expect(evaluate(pointsInput({ balance: 200000 }))).toMatchObject({ pointsShortfall: 0, remainingBalance: 0 });
    expect(evaluate(pointsInput({ valuationCpp: null }))).toMatchObject({ cpp: 1.375, band: null, pointsValue: null });
    expect(evaluate(pointsInput({ comparable: 'different' }))).toMatchObject({ cpp: 1.375, band: null });
    expect(evaluate(pointsInput({ comparable: 'unknown' })).band).toBeNull();
  });
  it.each([[-0.1, 'Strongly cash preferred'], [0.5, 'Cash preferred'], [0.9, 'Approximately neutral'], [1.1, 'Good points use'], [1.5, 'Excellent points use']] as const)('classifies ratio %s at the documented boundary', (ratio, label) => expect(classifyValue(ratio, DEFAULT_THRESHOLDS)).toBe(label));
  it.each([[800, 'Cash preferred'], [1440, 'Approximately neutral'], [1760, 'Good points use'], [2400, 'Excellent points use']] as const)('classifies exact personal-value boundary for avoided cash %s despite binary rounding', (cashRoom, band) => expect(evaluate(pointsInput({ cashBasis: 'total', cashRoom, cashTaxes: 0, cashFees: 0, awardCash: 0 })).band).toBe(band));
  it('supports configurable thresholds', () => expect(evaluate(pointsInput({ thresholds: { stronglyCash: 1, cash: 2, good: 3, excellent: 4 } })).band).toBe('Cash preferred'));
  it.each([
    { nights: 0 }, { nights: 2.5 }, { nights: 61 }, { cashRoom: -1 }, { awardPoints: 1.5 }, { balance: Infinity },
    { usdPerCurrency: 0 }, { valuationCpp: 0 }, { cashTaxes: NaN }, { currency: 'XXX' }, { fifthNight: 'yes' },
    { thresholds: { stronglyCash: 1, cash: 1, good: 0.8, excellent: 2 } },
    { awardBasis: 'varying', nightlyPoints: [50000] }, { extra: 'unsupported' },
  ])('rejects malformed input %j without throwing', (overrides) => expect(calculatePoints({ ...pointsInput(), ...overrides }).success).toBe(false));
  it('preserves explorer and comparison context through calculator links', () => {
    expect(parseRoute(calculatorHref({ ...DEFAULT_QUERY, country: 'TZ' }, ['mapito', 'mereshi'], 'mapito'))).toMatchObject({ page: 'calculator', propertySlug: 'mapito', comparisonSlugs: ['mapito', 'mereshi'], query: { country: 'TZ' } });
  });
});
