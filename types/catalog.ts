import type { z } from 'zod';
import type { brandSchema, catalogSchema, destinationSchema, editorialAssessmentSchema, evidenceClaimSchema, propertySchema, sourceSchema } from '../lib/validation/catalog';

export type Property = z.infer<typeof propertySchema>;
export type Brand = z.infer<typeof brandSchema>;
export type Destination = z.infer<typeof destinationSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type EvidenceClaim = z.infer<typeof evidenceClaimSchema>;
export type EvidenceSubject = EvidenceClaim['subject'];
export type EditorialPropertyAssessment = z.infer<typeof editorialAssessmentSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
