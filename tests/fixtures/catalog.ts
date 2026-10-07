import type { Catalog, EvidenceClaim } from '../../types/catalog';

export const AS_OF = '2026-10-07';

export function claim(subject: EvidenceClaim['subject'], value: unknown, overrides: Record<string, unknown> = {}) {
  return { id: `claim-fixture-${subject.toLowerCase()}`, propertyId: 'property-fixture', subject, value,
    sourceId: 'source-fixture', confidence: 'High', observedAt: AS_OF, lastVerifiedAt: AS_OF,
    validFrom: null, validTo: null, conflictStatus: 'none', ...overrides };
}

// Synthetic only: these locators/values are not researched production hotel facts.
export function fixtureCatalog(): Catalog {
  return {
    properties: [{ id: 'property-fixture', slug: 'fixture', name: 'Synthetic Hotel', brandId: 'brand-fixture',
      destinationId: 'destination-fixture', city: 'Test City', country: 'US', region: 'North America', roomCount: null }],
    brands: [{ id: 'brand-fixture', slug: 'test-brand', name: 'Synthetic Brand', sourceIds: ['source-fixture'] }],
    destinations: [{ id: 'destination-fixture', slug: 'test-destination', name: 'Test City', country: 'US', region: 'North America', sourceIds: ['source-fixture'] }],
    sources: [{ id: 'source-fixture', title: 'Synthetic source A', url: 'https://example.org/a', publisher: 'Synthetic Publisher', type: 'hotel-official-website', accessedAt: AS_OF }],
    evidenceClaims: [
      claim('name', 'Synthetic Hotel'), claim('brandId', 'brand-fixture'), claim('city', 'Test City'),
      claim('country', 'US'), claim('region', 'North America'),
    ] as EvidenceClaim[],
    editorialAssessments: [],
  };
}

export function conflictFixture() {
  const catalog = fixtureCatalog();
  catalog.sources.push({ ...catalog.sources[0]!, id: 'source-fixture-b', title: 'Synthetic source B', url: 'https://example.org/b' });
  catalog.evidenceClaims.push(
    claim('roomCount', 100, { id: 'claim-conflict-a', conflictStatus: 'disputed' }) as EvidenceClaim,
    claim('roomCount', 120, { id: 'claim-conflict-b', sourceId: 'source-fixture-b', conflictStatus: 'disputed' }) as EvidenceClaim,
  );
  return catalog;
}

export function staleFixture() {
  const catalog = fixtureCatalog();
  catalog.evidenceClaims.push(claim('openingYear', 2000, {
    id: 'claim-stale', observedAt: '2024-01-01', lastVerifiedAt: '2024-01-01',
  }) as EvidenceClaim);
  return catalog;
}
