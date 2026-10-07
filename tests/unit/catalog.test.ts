import { describe, expect, it } from 'vitest';
import { brandSchema, destinationSchema, editorialAssessmentSchema, evidenceClaimSchema, propertySchema, sourceSchema } from '../../lib/validation/catalog';
import { assessCatalog } from '../../lib/catalog/health';
import { findConflicts, isStale } from '../../lib/catalog/evidence';
import type { EvidenceClaim } from '../../types/catalog';
import { AS_OF, claim, conflictFixture, fixtureCatalog, staleFixture } from '../fixtures/catalog';

describe('Strict domain schemas', () => {
  it.each([
    ['Property', propertySchema, fixtureCatalog().properties[0]],
    ['Brand', brandSchema, fixtureCatalog().brands[0]],
    ['Destination', destinationSchema, fixtureCatalog().destinations[0]],
    ['Source', sourceSchema, fixtureCatalog().sources[0]],
    ['EvidenceClaim', evidenceClaimSchema, fixtureCatalog().evidenceClaims[0]],
    ['Editorial assessment', editorialAssessmentSchema, { id: 'editorial-fixture', propertyId: 'property-fixture', kind: 'editorial',
      author: 'Synthetic editor', rationale: 'Synthetic desk assessment.', reviewedAt: AS_OF, methodologyVersion: 'test-1',
      strengths: [], weaknesses: [], idealTraveler: [], hardwareQuality: null }],
  ])('accepts valid %s', (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(true);
  });

  it.each([
    { name: '' }, { id: 'bad id' }, { latitude: 91, longitude: 12 }, { latitude: 10 }, { country: 'USA' },
    { roomCount: -1 }, { openingYear: 2000, renovationYear: 1990 }, { serviceQuality: 9 },
    { officialUrl: 'https://marriott.com.evil.example/hotel' }, { experienceTags: ['safari', 'safari'] },
  ])('rejects malformed or editorial property data %j', (patch) => {
    expect(propertySchema.safeParse({ ...fixtureCatalog().properties[0], ...patch }).success).toBe(false);
  });

  it('validates claimed values against their subjects', () => {
    expect(evidenceClaimSchema.safeParse(claim('roomCount', '100')).success).toBe(false);
    expect(evidenceClaimSchema.safeParse(claim('country', 'not-a-country')).success).toBe(false);
    expect(evidenceClaimSchema.safeParse(claim('serviceQuality' as EvidenceClaim['subject'], 9)).success).toBe(false);
  });
  it('requires evidence regardless of confidence', () => {
    expect(evidenceClaimSchema.safeParse(claim('roomCount', 100, { sourceId: null })).success).toBe(false);
    expect(evidenceClaimSchema.safeParse(claim('roomCount', 100, { sourceId: null, confidence: 'Unverified', lastVerifiedAt: null })).success).toBe(false);
    expect(evidenceClaimSchema.safeParse(claim('roomCount', 100, { lastVerifiedAt: null })).success).toBe(false);
  });
  it('supports an observed unknown without asserting verification', () => {
    expect(evidenceClaimSchema.safeParse(claim('roomCount', null, { sourceId: null, confidence: 'Unverified', lastVerifiedAt: null })).success).toBe(true);
  });
  it.each([
    { validFrom: '2026-12-01', validTo: '2026-01-01' },
    { observedAt: '2026-02-30' }, { observedAt: null, lastVerifiedAt: null },
    { observedAt: AS_OF, lastVerifiedAt: '2026-01-01' },
  ])('rejects invalid date semantics %j', (patch) => {
    expect(evidenceClaimSchema.safeParse(claim('roomCount', 100, patch)).success).toBe(false);
  });
});

describe('Catalog integrity and health', () => {
  it('distinguishes incomplete from invalid and has deterministic counts', () => {
    const result = assessCatalog(fixtureCatalog(), AS_OF);
    expect(result.success).toBe(true);
    expect(result.health).toMatchObject({ totalProperties: 1, validRecords: 1, invalidRecords: 0, schemaErrors: 0,
      incompleteRecords: 1, missingCoordinates: 1, missingCriticalEvidence: 0, totalEvidenceClaims: 5,
      conflictingSubjects: 0, unverifiedClaims: 0, confidenceCounts: { High: 5, Medium: 0, Low: 0, Unverified: 0 },
      confidencePercentages: { High: 100, Medium: 0, Low: 0, Unverified: 0 } });
    expect(assessCatalog(fixtureCatalog(), AS_OF).health).toEqual(result.health);
  });
  it.each(['brandId', 'destinationId'] as const)('detects missing property %s reference', (field) => {
    const catalog = fixtureCatalog(); catalog.properties[0]![field] = 'missing';
    expect(assessCatalog(catalog, AS_OF).health.orphanedReferences).toBeGreaterThan(0);
  });
  it('detects missing sources on claims, brands and destinations', () => {
    const catalog = fixtureCatalog(); catalog.sources = [];
    const result = assessCatalog(catalog, AS_OF);
    expect(result.success).toBe(false); expect(result.health.orphanedReferences).toBe(7);
    expect(result.health.missingCriticalEvidence).toBe(4);
  });
  it('detects orphaned evidence and editorial property references', () => {
    const catalog = fixtureCatalog(); catalog.evidenceClaims[0]!.propertyId = 'missing';
    catalog.editorialAssessments.push({ id: 'editorial-orphan', propertyId: 'missing', kind: 'editorial', author: 'Test',
      rationale: 'Synthetic.', reviewedAt: AS_OF, methodologyVersion: 'test', idealTraveler: [], strengths: [], weaknesses: [] });
    expect(assessCatalog(catalog, AS_OF).health.orphanedReferences).toBe(2);
  });
  it('detects global duplicate IDs, including across entity collections', () => {
    const catalog = fixtureCatalog(); catalog.brands[0]!.id = catalog.properties[0]!.id;
    expect(assessCatalog(catalog, AS_OF).health.duplicateIds).toBe(1);
  });
  it.each(['properties', 'brands', 'destinations'] as const)('detects duplicate %s slugs', (collection) => {
    const catalog = fixtureCatalog();
    const record = catalog[collection][0]!;
    (catalog[collection] as { id: string; slug: string }[]).push({ ...record, id: 'additional-id' });
    expect(assessCatalog(catalog, AS_OF).health.duplicateSlugs).toBe(1);
  });
  it('reports malformed property counts while retaining inspectable valid records', () => {
    const catalog = fixtureCatalog();
    const result = assessCatalog({ ...catalog, properties: [...catalog.properties, { id: 'broken' }] }, AS_OF);
    expect(result.success).toBe(false);
    expect(result.health).toMatchObject({ totalProperties: 2, validRecords: 1, invalidRecords: 1 });
    expect(result.health.schemaErrors).toBeGreaterThan(0);
  });
  it.each([null, {}, { ...fixtureCatalog(), extra: [] }, { ...fixtureCatalog(), properties: null }])('reports malformed catalog envelope without crashing', (input) => {
    const result = assessCatalog(input, AS_OF); expect(result.success).toBe(false); expect(result.health.schemaErrors).toBeGreaterThan(0);
  });
  it('blocks missing critical evidence and unsupported known optional values', () => {
    const catalog = fixtureCatalog(); catalog.evidenceClaims = []; catalog.properties[0]!.roomCount = 100;
    const result = assessCatalog(catalog, AS_OF);
    expect(result.success).toBe(false); expect(result.health.missingCriticalEvidence).toBe(4);
    expect(result.health.missingOptionalEvidence).toBe(2); // room count and known geographic region
  });
  it('does not turn expired identity evidence into current proof', () => {
    const catalog = fixtureCatalog(); catalog.evidenceClaims[0]!.validTo = '2026-01-01';
    expect(assessCatalog(catalog, AS_OF).health.missingCriticalEvidence).toBe(1);
  });
  it('counts unknown/unverified separately from malformed values', () => {
    const catalog = fixtureCatalog(); catalog.evidenceClaims.push(claim('roomCount', null, {
      sourceId: null, confidence: 'Unverified', lastVerifiedAt: null,
    }) as EvidenceClaim);
    const result = assessCatalog(catalog, AS_OF);
    expect(result.success).toBe(true); expect(result.health.unverifiedClaims).toBe(1);
    expect(result.health.confidencePercentages.Unverified).toBe(16.67);
  });
  it('preserves known false and counts all confidence levels with one denominator', () => {
    const catalog = fixtureCatalog(); catalog.properties[0]!.isResort = false;
    catalog.evidenceClaims.push(claim('isResort', false, { confidence: 'Low' }) as EvidenceClaim,
      claim('roomCount', 100, { confidence: 'Medium' }) as EvidenceClaim,
      claim('openingYear', 2000, { confidence: 'Unverified', lastVerifiedAt: null }) as EvidenceClaim);
    const result = assessCatalog(catalog, AS_OF);
    expect(result.success).toBe(true); expect(result.catalog.properties[0]!.isResort).toBe(false);
    expect(result.health.confidenceCounts).toEqual({ High: 5, Medium: 1, Low: 1, Unverified: 1 });
    expect(result.health.confidencePercentages).toEqual({ High: 62.5, Medium: 12.5, Low: 12.5, Unverified: 12.5 });
  });
  it('uses null percentages for an empty claim denominator', () => {
    const result = assessCatalog({ properties: [], brands: [], destinations: [], sources: [], evidenceClaims: [], editorialAssessments: [] }, AS_OF);
    expect(result.health.confidencePercentages).toEqual({ High: null, Medium: null, Low: null, Unverified: null });
  });
  it('validates geography, locator/code, and future verification dates', () => {
    const catalog = fixtureCatalog(); catalog.destinations[0]!.country = 'BR';
    catalog.properties[0]!.officialUrl = 'https://www.marriott.com/en-us/hotels/abcde-synthetic/overview/';
    catalog.properties[0]!.marriottCode = 'XXXXX'; catalog.sources[0]!.accessedAt = '2027-01-01';
    catalog.evidenceClaims[0]!.lastVerifiedAt = '2027-01-01';
    const codes = assessCatalog(catalog, AS_OF).health.errors.map((error) => error.code);
    expect(codes).toEqual(expect.arrayContaining(['geography-mismatch', 'identity-mismatch', 'future-date']));
  });
});

describe('Time and conflict regression fixtures', () => {
  it('retains both conflicting claims and exposes the subject without choosing a winner', () => {
    const result = assessCatalog(conflictFixture(), AS_OF);
    expect(result.success).toBe(true); expect(result.catalog.evidenceClaims).toHaveLength(7);
    expect(result.catalog.properties[0]!.roomCount).toBeNull();
    expect(result.health).toMatchObject({ conflictingSubjects: 1, conflictingClaims: 2 });
    expect(result.health.conflicts[0]).toEqual({ propertyId: 'property-fixture', subject: 'roomCount', claimIds: ['claim-conflict-a', 'claim-conflict-b'] });
  });
  it('discovers disagreement even if conflict flags were omitted', () => {
    const catalog = conflictFixture(); catalog.evidenceClaims.forEach((record) => { record.conflictStatus = 'none'; });
    expect(findConflicts(catalog.evidenceClaims, AS_OF)).toHaveLength(1);
  });
  it('rejects a factual snapshot that conceals conflict', () => {
    const catalog = conflictFixture(); catalog.properties[0]!.roomCount = 100;
    expect(assessCatalog(catalog, AS_OF).health.errors.map((error) => error.code)).toContain('conflicted-snapshot');
  });
  it('does not manufacture conflicts from historical or future validity intervals', () => {
    const catalog = conflictFixture();
    const a = catalog.evidenceClaims.find((record) => record.id === 'claim-conflict-a')!;
    const b = catalog.evidenceClaims.find((record) => record.id === 'claim-conflict-b')!;
    a.conflictStatus = 'none'; b.conflictStatus = 'none'; a.validTo = '2025-12-31'; b.validFrom = '2026-01-01';
    expect(findConflicts(catalog.evidenceClaims, AS_OF)).toHaveLength(0);
    b.validFrom = '2027-01-01'; expect(findConflicts(catalog.evidenceClaims, AS_OF)).toHaveLength(0);
  });
  it('normalizes set-like experience tag ordering for comparison', () => {
    const catalog = fixtureCatalog(); catalog.evidenceClaims.push(claim('experienceTags', ['spa', 'city']) as EvidenceClaim,
      claim('experienceTags', ['city', 'spa'], { id: 'claim-order-b' }) as EvidenceClaim);
    expect(findConflicts(catalog.evidenceClaims, AS_OF)).toHaveLength(0);
  });
  it('reports stale evidence as a review warning, preserving the claim', () => {
    const result = assessCatalog(staleFixture(), AS_OF);
    expect(result.success).toBe(true); expect(result.health.staleEvidence).toEqual(['claim-stale']);
  });
  it('uses field-specific thresholds and a strict greater-than boundary', () => {
    const record = evidenceClaimSchema.parse(claim('openingYear', 2000, { observedAt: '2025-10-07', lastVerifiedAt: '2025-10-07' }));
    expect(isStale(record, AS_OF)).toBe(false); expect(isStale(record, '2026-10-08')).toBe(true);
    const brand = evidenceClaimSchema.parse(claim('brandId', 'brand-fixture', { observedAt: '2026-01-01', lastVerifiedAt: '2026-01-01' }));
    expect(isStale(brand, AS_OF)).toBe(true);
    expect(isStale(record, AS_OF, { defaultDays: 1000, bySubject: { openingYear: 30 } })).toBe(true);
  });
  it('excludes unknown and inactive claims from stale warnings', () => {
    const record = evidenceClaimSchema.parse(claim('roomCount', null, { sourceId: null, confidence: 'Unverified', lastVerifiedAt: null, observedAt: '2020-01-01' }));
    expect(isStale(record, AS_OF)).toBe(false);
    const expired = staleFixture().evidenceClaims.at(-1)!; expired.validTo = '2025-01-01'; expect(isStale(expired, AS_OF)).toBe(false);
  });
  it('rejects malformed assessment dates and policies', () => {
    expect(() => assessCatalog(fixtureCatalog(), 'not-a-date')).toThrow();
    expect(() => assessCatalog(fixtureCatalog(), AS_OF, { defaultDays: -1 })).toThrow();
  });
});
