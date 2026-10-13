import { z } from 'zod';
import { idSchema } from '../validation/catalog';

export const MAX_WATCH_TARGETS = 200;
export const PRIORITIES = ['high', 'medium', 'low'] as const;
// These are desired nightly thresholds, never observations or evidence of availability.
export const watchTargetSchema = z.strictObject({
  id: idSchema,
  propertyId: idSchema,
  checkIn: z.iso.date().nullable(),
  checkOut: z.iso.date().nullable(),
  cashRate: z.number().finite().min(0).max(1_000_000_000).nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  pointsRate: z.number().int().min(0).max(1_000_000_000).nullable(),
  priority: z.enum(PRIORITIES).nullable(),
  notes: z.string().max(4000),
}).superRefine((target, ctx) => {
  if (target.checkIn !== null && target.checkOut !== null && target.checkOut <= target.checkIn) ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'Check-out must be after check-in.' });
  if (target.cashRate !== null && target.currency === null) ctx.addIssue({ code: 'custom', path: ['currency'], message: 'Choose a currency for the desired cash rate.' });
});
export type WatchTarget = z.infer<typeof watchTargetSchema>;
export const watchlistSchema = z.array(watchTargetSchema).max(MAX_WATCH_TARGETS).refine((targets) => new Set(targets.map((t) => t.id)).size === targets.length, 'Watch target IDs must be unique.');
export const createWatchTarget = (id: string, propertyId: string): WatchTarget => ({ id, propertyId, checkIn: null, checkOut: null, cashRate: null, currency: null, pointsRate: null, priority: null, notes: '' });
