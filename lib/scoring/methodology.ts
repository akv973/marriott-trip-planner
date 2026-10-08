import { z } from 'zod';

export const FIT_LABELS = { quality: 'Property quality', destination: 'Destination preference', experience: 'Experience preference', elite: 'Elite benefits', uniqueness: 'Uniqueness', logistics: 'Airport logistics' } as const;
export type FitKey = keyof typeof FIT_LABELS;
export const DEFAULT_WEIGHTS = { quality: 30, destination: 20, experience: 20, elite: 15, uniqueness: 10, logistics: 5 };
const weight = z.number().finite().min(0).max(100);
export const weightsSchema = z.strictObject({ quality: weight, destination: weight, experience: weight, elite: weight, uniqueness: weight, logistics: weight })
  .refine((v) => Math.abs(Object.values(v).reduce((a, b) => a + b, 0) - 100) < 1e-8, 'Weights must total 100.');
export const FIT_METHODOLOGY = {
  version: 'trip-fit-1',
  weights: DEFAULT_WEIGHTS,
  ranking: 'Eligibility first, then supported score lower bound, then evidence coverage, then property ID (ascending). Booking value never changes fit order.',
  uncertainty: 'Unknown components retain null scores. The lower bound credits only supported contributions; the upper bound allows every unknown active component its full weight. These bounds are not imputed ratings.',
};
