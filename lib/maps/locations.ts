import { z } from 'zod';
import publishedLocations from '../../data/maps/locations.json';
import { dateSchema, idSchema, urlSchema } from '../validation/catalog';
import type { EvidenceClaim, Property } from '../../types/catalog';

export const coordinateSchema = z.strictObject({ latitude: z.number().finite().min(-90).max(90), longitude: z.number().finite().min(-180).max(180) });
export const locationSchema = z.strictObject({
  propertyId: idSchema, latitude: coordinateSchema.shape.latitude.nullable(), longitude: coordinateSchema.shape.longitude.nullable(),
  sourceUrl: urlSchema.nullable(), publishedMapUrl: urlSchema.nullable(), reviewedAt: dateSchema,
  confidence: z.enum(['High', 'Medium', 'Low', 'Unverified']), precision: z.literal('published-property-pin'), notes: z.string().min(1),
}).superRefine((r, ctx) => {
  if ((r.latitude === null) !== (r.longitude === null)) ctx.addIssue({ code: 'custom', message: 'Both coordinates must be known or unknown.' });
  if (r.latitude !== null && (!r.sourceUrl || !r.publishedMapUrl || r.confidence === 'Unverified')) ctx.addIssue({ code: 'custom', message: 'Known pins require reviewed, traceable source evidence.' });
});
export const locationsSchema = z.array(locationSchema);
export type Coordinate = z.infer<typeof coordinateSchema>;
export type LocationRecord = z.infer<typeof locationSchema>;

export function validateLocations(input: unknown, properties: Pick<Property, 'id' | 'officialUrl' | 'marriottCode'>[], asOf: string) {
  const parsed = locationsSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, errors: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) };
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const r of parsed.data) {
    const p = properties.find(p => p.id === r.propertyId);
    if (!p || ids.has(r.propertyId)) errors.push(`Unknown or duplicate property: ${r.propertyId}`);
    ids.add(r.propertyId);
    if (r.reviewedAt > asOf) errors.push(`Future review: ${r.propertyId}`);
    if (r.sourceUrl && p) {
      const source = new URL(r.sourceUrl);
      const official = p.officialUrl ? new URL(p.officialUrl) : null;
      if (!official || source.hostname !== official.hostname || !p.marriottCode || !source.pathname.toUpperCase().includes(`/HOTELS/${p.marriottCode}-`)) errors.push(`Source identity mismatch: ${r.propertyId}`);
    }
    if (r.latitude !== null && r.publishedMapUrl) {
      const url = new URL(r.publishedMapUrl);
      const values = url.searchParams.get('query')?.split(',').map(Number);
      if (url.hostname !== 'www.google.com' || url.pathname !== '/maps/search/' || !values || values.length !== 2 || values[0] !== r.latitude || values[1] !== r.longitude) errors.push(`Published map pin mismatch: ${r.propertyId}`);
    }
  }
  return errors.length ? { success: false as const, errors } : { success: true as const, records: parsed.data, errors };
}

// Optional map evidence cannot prevent independent catalog discovery. CLI validates the entire dated bundle separately.
export function withLocations<T extends { properties: Pick<Property, 'id' | 'officialUrl' | 'marriottCode' | 'latitude' | 'longitude'>[]; sources: unknown[]; evidenceClaims: unknown[] }>(base: T, asOf: string, input: unknown = publishedLocations): T {
  const parsed = locationsSchema.safeParse(input);
  if (!parsed.success) return base;
  const applicable = parsed.data.filter(r => r.reviewedAt <= asOf);
  const result = validateLocations(applicable, base.properties, asOf);
  if (!result.success) return base;
  const known = result.records.filter(r => r.latitude !== null && r.longitude !== null);
  const claims: EvidenceClaim[] = known.flatMap(r => (['latitude', 'longitude'] as const).map(subject => ({
    id: `claim-map-${r.propertyId}-${subject}`, propertyId: r.propertyId, subject, value: r[subject], sourceId: `source-map-${r.propertyId}`,
    observedAt: r.reviewedAt, lastVerifiedAt: r.reviewedAt, validFrom: r.reviewedAt, validTo: null,
    confidence: r.confidence, conflictStatus: 'none', notes: `${r.notes} Published map link: ${r.publishedMapUrl}`,
  })));
  return { ...base,
    properties: base.properties.map(p => {
      const r = known.find(r => r.propertyId === p.id);
      // Never overwrite existing known evidence; a later disagreement must be reviewed in the catalog admission path.
      return r && p.latitude == null && p.longitude == null ? { ...p, latitude: r.latitude, longitude: r.longitude } : p;
    }),
    sources: [...base.sources, ...known.map(r => ({ id: `source-map-${r.propertyId}`, title: 'Official property map pin', url: r.sourceUrl!, publisher: 'Marriott International', type: 'marriott-property-page' as const, accessedAt: r.reviewedAt, notes: `Manually reviewed published View Map coordinate link: ${r.publishedMapUrl}. ${r.notes}` }))],
    evidenceClaims: [...base.evidenceClaims, ...claims],
  };
}
