import { z } from 'zod';
import { dateSchema, idSchema, sourceSchema } from '../validation/catalog';
import { STATUSES } from '../profile/profile';
import type { Catalog } from '../../types/catalog';

export const BENEFIT_LABELS = { breakfast: 'Breakfast', lounge: 'Lounge access', club: 'Club access', roomUpgrade: 'Room upgrade', suiteUpgrade: 'Suite upgrade', lateCheckout: 'Late checkout', welcome: 'Welcome gift', bonus: 'Elite points bonus', your24: 'Your24', availability: '48-hour availability' } as const;
export const benefitKeySchema = z.enum(['breakfast', 'lounge', 'club', 'roomUpgrade', 'suiteUpgrade', 'lateCheckout', 'welcome', 'bonus', 'your24', 'availability']);
const text = z.string().trim().min(1);
export const outcomeSchema = z.strictObject({ code: idSchema, state: z.enum(['eligible', 'conditional', 'excluded', 'included', 'unknown']), basis: z.enum(['elite', 'included', 'policy']), label: text, detail: text, amount: z.number().nonnegative().nullable().optional() });
const uniqueIds = z.array(idSchema).refine(v => new Set(v).size === v.length, 'Repeated selector/source identifiers.');
const selectorSchema = z.strictObject({ statuses: z.array(z.enum(STATUSES)).min(1).refine(v => new Set(v).size === v.length, 'Repeated status selector.'), brandIds: uniqueIds, conditions: z.strictObject({ resort: z.boolean().optional(), convention: z.boolean().optional(), lounge: z.boolean().optional(), small: z.boolean().optional(), scope: z.enum(['standard', 'all-inclusive']).optional(), regionGroup: z.enum(['us-canada-europe', 'other']).optional() }) });
export const benefitRuleSchema = z.strictObject({ id: idSchema, category: benefitKeySchema, layer: z.enum(['status', 'brand', 'property']), propertyId: idSchema.nullable(), selector: selectorSchema, outcome: outcomeSchema, sourceIds: uniqueIds.refine(v => v.length > 0), section: text, confidence: z.enum(['High', 'Medium', 'Low', 'Unverified']), verifiedAt: dateSchema, validFrom: dateSchema.nullable(), validTo: dateSchema.nullable(), conflictStatus: z.enum(['none', 'disputed']) }).superRefine((r, ctx) => {
  if ((r.layer === 'property') !== (r.propertyId !== null)) ctx.addIssue({ code: 'custom', message: 'Only property overrides have a property ID.' });
  if (r.layer === 'brand' && !r.selector.brandIds.length) ctx.addIssue({ code: 'custom', message: 'Brand rules need brand selectors.' });
  if (r.validFrom && r.validTo && r.validFrom > r.validTo) ctx.addIssue({ code: 'custom', message: 'Invalid benefit validity interval.' });
});
export const benefitBundleSchema = z.strictObject({ schemaVersion: z.literal(1), version: z.literal('bonvoy-benefits-2026-10-12'), sources: z.array(sourceSchema), rules: z.array(benefitRuleSchema), reviews: z.array(z.strictObject({ propertyId: idSchema, sourceIds: uniqueIds.refine(v => v.length > 0), verifiedAt: dateSchema, scope: z.enum(['standard', 'all-inclusive']).nullable(), convention: z.boolean().nullable(), lounge: z.boolean().nullable(), notes: text })), observations: z.array(z.strictObject({ id: idSchema, propertyId: idSchema, kind: z.literal('editorial'), reviewedAt: dateSchema, text, sourceIds: z.array(idSchema) })) });
export type BenefitBundle = z.infer<typeof benefitBundleSchema>;
export type BenefitRule = z.infer<typeof benefitRuleSchema>;
export type BenefitKey = z.infer<typeof benefitKeySchema>;
export type BenefitOutcome = z.infer<typeof outcomeSchema>;

export function benefitReferenceErrors(bundle: BenefitBundle, catalog: Catalog): string[] {
  const errors: string[] = [];
  const sources = [...catalog.sources, ...bundle.sources];
  const official = ['marriott-corporate', 'marriott-property-page', 'hotel-official-website', 'official-hotel-communication'];
  for (const [name, records] of Object.entries({ sources, rules: bundle.rules, reviews: bundle.reviews.map(r => ({ id: r.propertyId })), observations: bundle.observations })) if (new Set(records.map(r => r.id)).size !== records.length) errors.push(`Duplicate benefit ${name} identifiers.`);
  for (const r of [...bundle.rules, ...bundle.reviews, ...bundle.observations]) {
    if (r.propertyId && !catalog.properties.some(p => p.id === r.propertyId)) errors.push(`Unknown benefit property: ${r.propertyId}`);
    for (const id of r.sourceIds) {
      const source = sources.find(s => s.id === id);
      if (!source) errors.push(`Missing benefit source: ${id}`);
      else if (!('kind' in r) && !official.includes(source.type)) errors.push(`Nonofficial source cannot establish benefit policy: ${id}`);
      else if (!('kind' in r) && source.accessedAt < r.verifiedAt) errors.push(`Benefit verification exceeds source access date: ${id}`);
    }
    if ('selector' in r) for (const id of r.selector.brandIds) if (!catalog.brands.some(b => b.id === id)) errors.push(`Unknown benefit brand: ${id}`);
  }
  for (const p of catalog.properties) if (!bundle.reviews.some(r => r.propertyId === p.id)) errors.push(`Missing property benefit review: ${p.id}`);
  return errors;
}
