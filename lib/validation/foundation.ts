import { z } from 'zod';

// Stage 1 will replace the empty-collection guard with domain schemas.
// Stage 0 must never imply that unresearched hotel data is validated.
export const emptyCollectionSchema = z.array(z.never());

export const foundationSchema = z.strictObject({
  schemaVersion: z.literal('0.1'),
  appId: z.literal('marriott-trip-planner'),
  stage: z.literal(0),
  deploymentTarget: z.literal('github-pages'),
  catalogState: z.literal('unpopulated'),
  modules: z.array(z.strictObject({
    id: z.enum(['explorer', 'economics', 'trips']),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    firstStage: z.number().int().min(1).max(16),
  })).length(3).refine(
    (modules) => new Set(modules.map((module) => module.id)).size === modules.length,
    'Module identifiers must be unique.',
  ),
});

export const foundationBundleSchema = z.strictObject({
  foundation: foundationSchema,
  properties: emptyCollectionSchema,
  brands: emptyCollectionSchema,
  destinations: emptyCollectionSchema,
  benefits: emptyCollectionSchema,
  sources: emptyCollectionSchema,
});

export function validateFoundation(input: unknown) {
  return foundationBundleSchema.safeParse(input);
}
