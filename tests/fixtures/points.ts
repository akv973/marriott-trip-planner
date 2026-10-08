import type { CalculatorInput } from '../../lib/points/calculator';
import { DEFAULT_THRESHOLDS } from '../../lib/points/calculator';

// Synthetic prices with independently specified expected answers. Never catalog rates.
export const pointsInput = (overrides: Partial<CalculatorInput> = {}): CalculatorInput => ({
  nights: 5, currency: 'USD', cashBasis: 'nightly', cashRoom: 500, cashTaxes: 250, cashFees: 100, awardCash: 100,
  awardBasis: 'flat', awardPoints: 50_000, nightlyPoints: [], fifthNight: 'eligible', comparable: 'same', usdPerCurrency: null,
  valuationCpp: 0.8, balance: null, thresholds: { ...DEFAULT_THRESHOLDS }, ...overrides,
});
export const CANONICAL_POINTS_CASES = [
  { name: 'five-night points stay', input: pointsInput(), expected: { cashTotal: 2850, netCashAvoided: 2750, pointsSpent: 200000, cpp: 1.375, band: 'Excellent points use' } },
  { name: 'four-night points stay', input: pointsInput({ nights: 4, cashTaxes: 200, cashFees: 80, awardCash: 80 }), expected: { cashTotal: 2280, netCashAvoided: 2200, pointsSpent: 200000, cpp: 1.1, band: 'Good points use' } },
  { name: 'cash clearly superior', input: pointsInput({ cashRoom: 100, cashTaxes: 0, cashFees: 0, awardCash: 0 }), expected: { netCashAvoided: 500, pointsSpent: 200000, cpp: 0.25, band: 'Strongly cash preferred' } },
  { name: 'points clearly superior', input: pointsInput({ cashRoom: 1500 }), expected: { netCashAvoided: 7750, pointsSpent: 200000, cpp: 3.875, band: 'Excellent points use' } },
  { name: 'missing award price', input: pointsInput({ awardPoints: null }), expected: { cashTotal: 2850, pointsSpent: null, cpp: null, band: null } },
  { name: 'missing cash price', input: pointsInput({ cashRoom: null }), expected: { cashTotal: null, pointsSpent: 200000, cpp: null, band: null } },
  { name: 'insufficient points', input: pointsInput({ balance: 199999 }), expected: { pointsSpent: 200000, pointsShortfall: 1, remainingBalance: null, band: 'Excellent points use' } },
  { name: 'missing optional data', input: pointsInput({ balance: null }), expected: { pointsSpent: 200000, pointsShortfall: null, remainingBalance: null, cpp: 1.375 } },
] as const;
