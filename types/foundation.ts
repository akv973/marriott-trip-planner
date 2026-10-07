import type { z } from 'zod';
import type { foundationBundleSchema } from '../lib/validation/foundation';

export type FoundationBundle = z.infer<typeof foundationBundleSchema>;
export type FoundationManifest = FoundationBundle['foundation'];
