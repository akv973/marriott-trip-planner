import type { z } from 'zod';
import type { Catalog, EvidenceClaim } from '../../types/catalog';
import { brandSchema, catalogEnvelopeSchema, dateSchema, destinationSchema, editorialAssessmentSchema, evidenceClaimSchema, propertySchema, sourceSchema } from '../validation/catalog';
import { CRITICAL_SUBJECTS, DEFAULT_STALENESS_POLICY, findConflicts, isApplicable, isStale, valueKey } from './evidence';
import type { StalenessPolicy } from './evidence';

export interface CatalogIssue { code: string; path: string; message: string }
const optionalFields = ['officialUrl', 'marriottCode', 'propertyType', 'administrativeArea', 'latitude', 'longitude',
  'nearestAirport', 'openingYear', 'renovationYear', 'roomCount', 'isResort', 'isDestinationProperty', 'experienceTags'] as const;

export function assessCatalog(input: unknown, asOf: string, policy: StalenessPolicy = DEFAULT_STALENESS_POLICY) {
  dateSchema.parse(asOf);
  for (const threshold of [policy.defaultDays, ...Object.values(policy.bySubject ?? {})]) {
    if (!Number.isInteger(threshold) || threshold < 0) throw new Error('Staleness thresholds must be nonnegative whole days.');
  }
  const errors: CatalogIssue[] = [];
  const schemaErrors: CatalogIssue[] = [];
  const raw = catalogEnvelopeSchema.safeParse(input);
  const envelope = raw.success ? raw.data : { properties: [], brands: [], destinations: [], sources: [], evidenceClaims: [], editorialAssessments: [] };
  if (!raw.success) for (const issue of raw.error.issues) schemaErrors.push({ code: 'schema', path: issue.path.join('.'), message: issue.message });
  function parse<T>(schema: z.ZodType<T>, records: unknown[], collection: string): T[] {
    return records.flatMap((record, index) => {
      const result = schema.safeParse(record);
      if (result.success) return [result.data];
      for (const issue of result.error.issues) schemaErrors.push({ code: 'schema', path: `${collection}.${index}.${issue.path.join('.')}`, message: issue.message });
      return [];
    });
  }
  const catalog: Catalog = {
    properties: parse(propertySchema, envelope.properties, 'properties'),
    brands: parse(brandSchema, envelope.brands, 'brands'), destinations: parse(destinationSchema, envelope.destinations, 'destinations'),
    sources: parse(sourceSchema, envelope.sources, 'sources'), evidenceClaims: parse(evidenceClaimSchema, envelope.evidenceClaims, 'evidenceClaims'),
    editorialAssessments: parse(editorialAssessmentSchema, envelope.editorialAssessments, 'editorialAssessments'),
  };
  const add = (code: string, path: string, message: string) => errors.push({ code, path, message });
  const allIds = new Set<string>();
  for (const [collection, records] of Object.entries(catalog)) {
    const slugs = new Set<string>();
    for (const record of records) {
      if (allIds.has(record.id)) add('duplicate-id', `${collection}.${record.id}`, 'Stable IDs must be globally unique.');
      allIds.add(record.id);
      if ('slug' in record) {
        if (slugs.has(record.slug)) add('duplicate-slug', `${collection}.${record.id}`, 'Slugs must be unique within an entity collection.');
        slugs.add(record.slug);
      }
    }
  }
  const ids = {
    properties: new Set(catalog.properties.map((record) => record.id)), brands: new Set(catalog.brands.map((record) => record.id)),
    destinations: new Set(catalog.destinations.map((record) => record.id)), sources: new Set(catalog.sources.map((record) => record.id)),
  };
  const reference = (collection: keyof typeof ids, id: string, path: string) => {
    if (!ids[collection].has(id)) add('orphaned-reference', path, `Missing ${collection} reference: ${id}`);
  };
  const destinations = new Map(catalog.destinations.map((record) => [record.id, record]));
  for (const property of catalog.properties) {
    reference('brands', property.brandId, `${property.id}.brandId`);
    reference('destinations', property.destinationId, `${property.id}.destinationId`);
    const destination = destinations.get(property.destinationId);
    if (destination && (destination.country !== property.country || destination.region !== property.region)) {
      add('geography-mismatch', property.id, 'Property and destination country/region must agree.');
    }
    if (property.officialUrl && property.marriottCode && !new URL(property.officialUrl).pathname.toUpperCase().includes(`/HOTELS/${property.marriottCode}-`)) {
      add('identity-mismatch', property.id, 'Property code does not match its official locator.');
    }
  }
  for (const record of [...catalog.brands, ...catalog.destinations]) {
    for (const id of record.sourceIds) reference('sources', id, `${record.id}.sourceIds`);
  }
  for (const source of catalog.sources) if (source.accessedAt > asOf) add('future-date', `${source.id}.accessedAt`, 'Access date is after assessment date.');
  for (const claim of catalog.evidenceClaims) {
    reference('properties', claim.propertyId, `${claim.id}.propertyId`);
    if (claim.sourceId !== null) reference('sources', claim.sourceId, `${claim.id}.sourceId`);
    if (claim.subject === 'brandId' && claim.value !== null) reference('brands', claim.value, `${claim.id}.value`);
    for (const field of ['observedAt', 'lastVerifiedAt'] as const) if (claim[field] && claim[field] > asOf) add('future-date', `${claim.id}.${field}`, 'Observation/verification is after assessment date.');
  }
  for (const editorial of catalog.editorialAssessments) {
    reference('properties', editorial.propertyId, `${editorial.id}.propertyId`);
    if (editorial.reviewedAt > asOf) add('future-date', `${editorial.id}.reviewedAt`, 'Review is after assessment date.');
  }
  const conflicts = findConflicts(catalog.evidenceClaims, asOf);
  const active = catalog.evidenceClaims.filter((claim) => isApplicable(claim, asOf));
  const missingCriticalEvidence: { propertyId: string; subject: string }[] = [];
  const missingOptionalEvidence: { propertyId: string; subject: string }[] = [];
  for (const property of catalog.properties) {
    const propertyClaims = active.filter((claim) => claim.propertyId === property.id);
    for (const subject of [...CRITICAL_SUBJECTS, ...optionalFields, 'region'] as const) {
      const value = property[subject];
      const claims = propertyClaims.filter((claim) => claim.subject === subject);
      const conflict = conflicts.some((item) => item.propertyId === property.id && item.subject === subject);
      if (conflict) {
        if (value != null) add('conflicted-snapshot', `${property.id}.${subject}`, 'Conflicted subjects must remain unknown in the factual snapshot; retain all claims.');
        continue;
      }
      const matching = claims.filter((claim) => claim.value !== null && valueKey(claim.value) === valueKey(value as EvidenceClaim['value']));
      const verified = matching.some((claim) => claim.confidence !== 'Unverified' && claim.sourceId !== null && ids.sources.has(claim.sourceId));
      if ((CRITICAL_SUBJECTS as readonly string[]).includes(subject) && !verified) {
        missingCriticalEvidence.push({ propertyId: property.id, subject });
        add('missing-critical-evidence', `${property.id}.${subject}`, 'Basic identity requires applicable, sourced, verified evidence.');
      } else if (value != null && !verified) {
        missingOptionalEvidence.push({ propertyId: property.id, subject });
        add('unsupported-snapshot', `${property.id}.${subject}`, 'Known optional facts require matching evidence; use null for unknown.');
      }
      if (value != null && claims.some((claim) => claim.value !== null && claim.confidence !== 'Unverified' && valueKey(claim.value) !== valueKey(value as EvidenceClaim['value']))) {
        add('evidence-mismatch', `${property.id}.${subject}`, 'Factual snapshot disagrees with applicable evidence.');
      }
    }
  }
  const confidenceCounts = { High: 0, Medium: 0, Low: 0, Unverified: 0 };
  for (const claim of catalog.evidenceClaims) confidenceCounts[claim.confidence]++;
  const claimCount = catalog.evidenceClaims.length;
  const incompleteRecords = catalog.properties.filter((record) => optionalFields.some((field) => record[field] == null)).map((record) => record.id);
  const invalidRecords = envelope.properties.length - catalog.properties.length;
  const health = {
    asOf, stalenessPolicy: policy, totalProperties: envelope.properties.length,
    validRecords: catalog.properties.length, invalidRecords, completeRecords: catalog.properties.length - incompleteRecords.length,
    incompleteRecords: incompleteRecords.length, incompletePropertyIds: incompleteRecords,
    schemaErrors: schemaErrors.length, orphanedReferences: errors.filter((error) => error.code === 'orphaned-reference').length,
    duplicateIds: errors.filter((error) => error.code === 'duplicate-id').length, duplicateSlugs: errors.filter((error) => error.code === 'duplicate-slug').length,
    missingCriticalEvidence: missingCriticalEvidence.length, missingCriticalEvidenceDetails: missingCriticalEvidence,
    missingOptionalEvidence: missingOptionalEvidence.length,
    staleEvidence: catalog.evidenceClaims.filter((claim) => isStale(claim, asOf, policy)).map((claim) => claim.id),
    conflictingSubjects: conflicts.length, conflictingClaims: new Set(conflicts.flatMap((item) => item.claimIds)).size, conflicts,
    unverifiedClaims: confidenceCounts.Unverified,
    missingCoordinates: catalog.properties.filter((record) => record.latitude == null || record.longitude == null).length,
    missingDestinationMetadata: catalog.properties.filter((record) => !ids.destinations.has(record.destinationId)).length,
    totalSources: catalog.sources.length, totalEvidenceClaims: claimCount, confidenceCounts,
    confidencePercentages: Object.fromEntries(Object.entries(confidenceCounts).map(([level, count]) => [level, claimCount ? Math.round(count / claimCount * 10_000) / 100 : null])),
    confidenceDenominator: 'All schema-valid evidence claims, including historic and unknown claims.',
    evidenceAssessed: true, errors: [...schemaErrors, ...errors],
  };
  return { catalog, health, success: health.errors.length === 0 };
}
