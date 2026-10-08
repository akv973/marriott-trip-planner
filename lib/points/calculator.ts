import { z } from 'zod';
import { POINTS_POLICY } from './policy';

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'BRL', 'TZS', 'ZAR', 'JPY', 'AUD', 'CHF'] as const;
const money = z.number().finite().min(0).max(1_000_000_000).nullable();
const points = z.number().int().min(0).max(1_000_000_000).nullable();
export const thresholdsSchema = z.strictObject({
  stronglyCash: z.number().positive().max(100),
  cash: z.number().positive().max(100),
  good: z.number().positive().max(100),
  excellent: z.number().positive().max(100),
}).refine((v) => v.stronglyCash < v.cash && v.cash < v.good && v.good < v.excellent, 'Thresholds must increase: strongly cash < cash < good < excellent.');
export const DEFAULT_THRESHOLDS = { stronglyCash: 0.5, cash: 0.9, good: 1.1, excellent: 1.5 };
export const calculatorSchema = z.strictObject({
  nights: z.number().int().min(1).max(60),
  currency: z.enum(CURRENCIES),
  cashBasis: z.enum(['nightly', 'total']),
  cashRoom: money,
  cashTaxes: money,
  cashFees: money,
  awardCash: money,
  awardBasis: z.enum(['flat', 'varying', 'total']),
  awardPoints: points,
  nightlyPoints: z.array(points).max(60),
  fifthNight: z.enum(['unknown', 'eligible', 'ineligible']),
  comparable: z.enum(['unknown', 'same', 'different']),
  usdPerCurrency: z.number().finite().positive().max(1_000_000).nullable(),
  valuationCpp: z.number().finite().positive().max(1000).nullable(),
  balance: points,
  thresholds: thresholdsSchema,
}).superRefine((v, ctx) => {
  if (v.awardBasis === 'varying' && v.nightlyPoints.length !== v.nights) ctx.addIssue({ code: 'custom', path: ['nightlyPoints'], message: 'Enter one points price for each night.' });
});
export type CalculatorInput = z.infer<typeof calculatorSchema>;
export type ValueBand = 'Excellent points use' | 'Good points use' | 'Approximately neutral' | 'Cash preferred' | 'Strongly cash preferred';

export function classifyValue(ratio: number, thresholds: CalculatorInput['thresholds']): ValueBand {
  // Treat machine-precision equality as the threshold, without rounding CPP.
  const below = (threshold: number) => ratio < threshold && threshold - ratio > Number.EPSILON * Math.max(1, Math.abs(ratio), threshold) * 8;
  if (below(thresholds.stronglyCash)) return 'Strongly cash preferred';
  if (below(thresholds.cash)) return 'Cash preferred';
  if (below(thresholds.good)) return 'Approximately neutral';
  if (below(thresholds.excellent)) return 'Good points use';
  return 'Excellent points use';
}

// Monetary arithmetic uses the selected currency's minor unit; CPP stays unrounded.
export const fractionDigits = (currency: string) => new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
const minor = (value: number, currency: string) => Math.round((value + Number.EPSILON) * 10 ** fractionDigits(currency));
export function calculatePoints(input: unknown) {
  const parsed = calculatorSchema.safeParse(input);
  if (!parsed.success) {
    const labels: Record<string, string> = { nights: 'Number of nights', currency: 'Quote currency', cashBasis: 'Cash price basis', cashRoom: 'Cash room price', cashTaxes: 'Cash taxes', cashFees: 'Cash mandatory fees', awardCash: 'Cash payable on award', awardBasis: 'Award points basis', awardPoints: 'Award points price', nightlyPoints: 'Points by night', fifthNight: 'Stay for 5, Pay for 4 eligibility', comparable: 'Quote comparability', usdPerCurrency: 'Manual USD exchange rate', valuationCpp: 'Personal point value', balance: 'Available points', thresholds: 'Assessment thresholds' };
    return { success: false as const, errors: parsed.error.issues.map((issue) => `${labels[String(issue.path[0])] ?? 'Inputs'}: ${issue.message}`) };
  }
  const v = parsed.data;
  const unit = 10 ** fractionDigits(v.currency);
  const warnings: string[] = [];
  const missing: string[] = [];
  const room = v.cashRoom === null ? null : minor(v.cashRoom, v.currency) * (v.cashBasis === 'nightly' ? v.nights : 1) / unit;
  const cashTotal = room === null || v.cashTaxes === null || v.cashFees === null ? null : (minor(room, v.currency) + minor(v.cashTaxes, v.currency) + minor(v.cashFees, v.currency)) / unit;
  if (v.cashRoom === null) missing.push('Cash room price');
  if (v.cashTaxes === null) missing.push('Cash taxes');
  if (v.cashFees === null) missing.push('Cash mandatory fees');
  if (v.awardCash === null) missing.push('Cash payable on the award');
  const rates = v.awardBasis === 'total' ? null : v.awardBasis === 'flat' ? Array<number | null>(v.nights).fill(v.awardPoints) : v.nightlyPoints;
  const grossPoints: number | null = v.awardBasis === 'total' ? v.awardPoints : rates!.some((rate) => rate === null) ? null : (rates as number[]).reduce((a, b) => a + b, 0);
  let pointsSpent = grossPoints;
  const freeNightIndices: number[] = [];
  let savings: number | null = grossPoints === null ? null : 0;
  if (v.awardBasis === 'total') {
    warnings.push('Quoted points total is used exactly as entered. Any Stay for 5, Pay for 4 reduction must already be included; it is never deducted twice.');
  } else if (v.nights >= 5 && v.fifthNight === 'unknown') {
    pointsSpent = null; savings = null;
    missing.push('Stay for 5, Pay for 4 eligibility');
  } else if (grossPoints !== null && v.fifthNight === 'eligible') {
    const ranked = (rates as number[]).map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value || a.index - b.index);
    for (const night of ranked.slice(0, Math.floor(v.nights / 5))) freeNightIndices.push(night.index);
    savings = freeNightIndices.reduce((sum, index) => sum + (rates as number[])[index]!, 0);
    pointsSpent = grossPoints - savings;
  }
  if (grossPoints === null) missing.push('Award points price');
  // Do not allow unrelated fields to turn unknown costs into zero.
  const awardCash = v.awardCash === null ? null : minor(v.awardCash, v.currency) / unit;
  const netCashAvoided = cashTotal === null || awardCash === null ? null : (minor(cashTotal, v.currency) - minor(awardCash, v.currency)) / unit;
  const fx = v.currency === 'USD' ? 1 : v.usdPerCurrency;
  if (fx === null) missing.push('Manual USD exchange rate');
  const cpp = netCashAvoided === null || pointsSpent === null || pointsSpent === 0 || fx === null ? null : netCashAvoided * fx * 100 / pointsSpent;
  const pointsValue = pointsSpent === null || v.valuationCpp === null ? null : pointsSpent * v.valuationCpp / 100;
  const awardEconomicCostUsd = pointsValue === null || awardCash === null || fx === null ? null : pointsValue + awardCash * fx;
  const pointsShortfall = v.balance === null || pointsSpent === null ? null : Math.max(0, pointsSpent - v.balance);
  const remainingBalance = v.balance === null || pointsSpent === null || pointsSpent > v.balance ? null : v.balance - pointsSpent;
  if (pointsShortfall !== null && pointsShortfall > 0) warnings.push(`Insufficient points: ${pointsShortfall.toLocaleString('en-US')} more ${pointsShortfall === 1 ? 'point' : 'points'} needed. This calculation does not assume a points purchase or transfer.`);
  if (v.comparable !== 'same') warnings.push(v.comparable === 'different' ? 'Room, occupancy, inclusions or cancellation terms differ. CPP is illustrative; a booking assessment requires comparable products.' : 'Confirm the same room, occupancy, inclusions and cancellation terms before using a booking assessment.');
  if (pointsSpent === 0) warnings.push('Zero points spent: cents per point is undefined.');
  const band = cpp === null || v.valuationCpp === null || v.comparable !== 'same' ? null : classifyValue(cpp / v.valuationCpp, v.thresholds);
  if (v.valuationCpp === null) missing.push('Personal point valuation for assessment');
  return { success: true as const, input: v, policyVersion: POINTS_POLICY.version, room, cashTotal, awardCash, netCashAvoided, grossPoints, savings, freeNightIndices, pointsSpent, fx, cpp, pointsValue, awardEconomicCostUsd, pointsShortfall, remainingBalance, band, missing, warnings };
}

export const formatMoney = (value: number | null, currency: string) => value === null ? 'Unknown' : new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
export const formatPoints = (value: number | null) => value === null ? 'Unknown' : `${value.toLocaleString('en-US')} points`;
