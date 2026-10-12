import { z } from 'zod';
import { catalogSchema } from './catalog';
import { benefitBundleSchema, benefitReferenceErrors } from '../benefits/schema';
import { assessCatalog } from '../catalog/health';

// Benefits remain unimplemented until their separately authorized stage.
export const emptyCollectionSchema = z.array(z.never());

export const foundationSchema = z.strictObject({
  schemaVersion: z.literal('0.1'),
  appId: z.literal('marriott-trip-planner'),
  stage: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(9)]),
  deploymentTarget: z.literal('github-pages'),
  catalogState: z.enum(['unpopulated', 'seeded']),
  modules: z.array(z.strictObject({
    id: z.enum(['explorer', 'economics', 'trips']),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    firstStage: z.number().int().min(1).max(16),
  })).length(3).refine(
    (modules) => new Set(modules.map((module) => module.id)).size === modules.length,
    'Module identifiers must be unique.',
  ),
}).refine((manifest) => manifest.catalogState === (manifest.stage === 0 ? 'unpopulated' : 'seeded'), 'Stage and catalog state must agree.');

export const foundationBundleSchema = z.strictObject({
  foundation: foundationSchema,
  properties: catalogSchema.shape.properties,
  brands: catalogSchema.shape.brands,
  destinations: catalogSchema.shape.destinations,
  benefits: z.union([emptyCollectionSchema, benefitBundleSchema]),
  sources: catalogSchema.shape.sources,
  evidenceClaims: catalogSchema.shape.evidenceClaims,
  editorialAssessments: catalogSchema.shape.editorialAssessments,
}).superRefine((bundle, ctx) => {
  const { foundation, benefits, ...catalog } = bundle;
  if (foundation.stage < 8 && !Array.isArray(benefits)) ctx.addIssue({ code: 'custom', message: 'Benefit engine requires authorized Stage 8.' });
  if (foundation.stage >= 8 && Array.isArray(benefits)) ctx.addIssue({ code: 'custom', message: 'Stages 8–9 require sourced benefit rules.' });
  if (!Array.isArray(benefits)) for (const message of benefitReferenceErrors(benefits, catalog)) ctx.addIssue({ code: 'custom', path: ['benefits'], message });
  if (foundation.stage === 0 && Object.values(catalog).some((records) => records.length > 0)) {
    ctx.addIssue({ code: 'custom', message: 'Stage 0 catalog must remain empty.' });
  }
  const result = assessCatalog(catalog, new Date().toISOString().slice(0, 10));
  for (const issue of result.health.errors) ctx.addIssue({ code: 'custom', path: issue.path.split('.'), message: issue.message });
});

export function validateFoundation(input: unknown) {
  return foundationBundleSchema.safeParse(input);
}
