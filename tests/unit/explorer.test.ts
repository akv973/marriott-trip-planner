import { describe, expect, it } from 'vitest';
import { rawCatalog } from '../../lib/catalog/catalog';
import { DEFAULT_QUERY, queryProperties } from '../../lib/catalog/explorer';
import { fieldEvidence, formatValue } from '../../lib/catalog/presentation';
import { explorerHref, parseRoute, propertyHref } from '../../lib/navigation/routes';
import type { Catalog, EvidenceClaim } from '../../types/catalog';
import { AS_OF, claim, conflictFixture, fixtureCatalog, staleFixture } from '../fixtures/catalog';

const catalog = rawCatalog as Catalog;
const names = (query: Partial<typeof DEFAULT_QUERY>) => queryProperties(catalog, { ...DEFAULT_QUERY, ...query }).map((property) => property.slug);

describe('Explorer queries', () => {
  it('combines search and all selected filters with AND semantics', () => {
    expect(names({ q: 'safari Tanzania', country: 'TZ', region: 'Africa', brand: 'brand-autograph-collection', type: 'safari-camp', tag: 'wildlife' })).toEqual(['mapito', 'mereshi']);
    expect(names({ country: 'TZ', tag: 'beach' })).toEqual([]);
  });
  it('searches accents, mixed case, words, brand, destination, and property code', () => {
    expect(names({ q: '  MARQUES riscal  ' })).toEqual(['marques-de-riscal']);
    expect(names({ q: 'TUSRZ' })).toEqual(['dove-mountain']);
    expect(names({ q: 'venice luxury' })).toEqual(['gritti-palace']);
  });
  it('keeps unknown boolean values distinct from false', () => {
    expect(names({ resort: 'true' })).toHaveLength(7);
    expect(names({ resort: 'false' })).toEqual([]);
    expect(names({ resort: 'unknown' })).toHaveLength(18);
    expect(names({ destinationProperty: 'unknown' })).toHaveLength(25);
  });
  it('supports known/unknown year filters and geographic filters', () => {
    expect(names({ opening: '2006' })).toEqual(['marques-de-riscal']);
    expect(names({ opening: 'unknown' })).toHaveLength(23);
    expect(names({ renovation: '2018' })).toEqual(['elephant-weimar']);
    expect(names({ destination: 'destination-jackson-us' })).toEqual(['cloudveil']);
  });
  it('sorts known years first, unknown years last, with stable alphabetical ties', () => {
    const opening = names({ sort: 'opening-newest' });
    expect(opening.slice(0, 2)).toEqual(['marques-de-riscal', 'imperial-vienna']);
    expect(opening.slice(2)).toEqual(names({ opening: 'unknown' }));
    expect(names({ sort: 'renovation-newest' })[0]).toBe('elephant-weimar');
  });
  it('sorts names in both directions, brands and destinations without quality ranking', () => {
    expect(names({ sort: 'name-desc' })).toEqual([...names({})].reverse());
    expect(names({ sort: 'brand' }).slice(0, 4)).toEqual(['elephant-weimar', 'mapito', 'mereshi', 'cloudveil']);
    expect(names({ sort: 'destination' })[0]).toBe('st-regis-aspen');
  });
  it('handles a minimally populated optional record and an empty collection', () => {
    expect(queryProperties(fixtureCatalog(), { ...DEFAULT_QUERY, type: 'unknown', tag: 'unknown', opening: 'unknown', resort: 'unknown' })).toHaveLength(1);
    expect(queryProperties({ ...fixtureCatalog(), properties: [] }, DEFAULT_QUERY)).toEqual([]);
    const fixture = fixtureCatalog(); fixture.properties[0]!.experienceTags = [];
    expect(queryProperties(fixture, { ...DEFAULT_QUERY, tag: 'unknown' })).toEqual([]);
  });
  it('does not mutate the catalog or invent values for arbitrary shared filters', () => {
    const before = structuredClone(catalog);
    expect(names({ brand: 'not-in-catalog' })).toEqual([]);
    expect(catalog).toEqual(before);
  });
});

describe('Static-host-safe navigation', () => {
  it('round trips detail URLs with search, every filter and sort selection', () => {
    const query = { ...DEFAULT_QUERY, q: 'spa & city?', destination: 'destination-test', country: 'US', region: 'North America', brand: 'brand-test', type: 'hotel', tag: 'spa', resort: 'unknown', destinationProperty: 'unknown', opening: 'unknown', renovation: '2018', sort: 'name-desc' as const };
    expect(parseRoute(propertyHref('dove-mountain', query))).toEqual({ page: 'property', slug: 'dove-mountain', query });
    expect(parseRoute(explorerHref(query))).toEqual({ page: 'explore', query, section: null });
  });
  it('handles the base, legacy anchors, malformed paths, and unsupported sorting', () => {
    expect(parseRoute('').page).toBe('explore');
    expect(parseRoute('#roadmap')).toEqual({ page: 'explore', query: DEFAULT_QUERY, section: 'roadmap' });
    for (const hash of ['#/properties/', '#/properties/%ZZ', '#/made-up', '#/properties/../x']) expect(parseRoute(hash).page).toBe('not-found');
    expect(parseRoute('#/explore?sort=quality&q=%3Cscript%3E').query).toEqual({ ...DEFAULT_QUERY, q: '<script>' });
  });
  it('bounds URL inputs and keeps unsupported filters visible rather than broadening results', () => {
    const route = parseRoute(`#/explore?q=${'a'.repeat(500)}&brand=unsupported`);
    expect(route.query.q).toHaveLength(200);
    expect(route.query.brand).toBe('unsupported');
    expect(parseRoute('#/explore?sort=__proto__').query.sort).toBe('name');
  });
});

describe('Evidence presentation', () => {
  it('preserves every conflicting claim and withholds a factual winner', () => {
    const fixture = conflictFixture();
    const view = fieldEvidence(fixture, fixture.properties[0]!, 'roomCount', AS_OF);
    expect(view.value).toBeNull(); expect(view.status).toBe('conflicted');
    expect(view.label).toBe('Requires review — sources conflict');
    expect(view.claims.map((record) => record.value)).toEqual([100, 120]);
  });
  it('retains verified historical values with visible staleness', () => {
    const fixture = staleFixture(); fixture.properties[0]!.openingYear = 2000;
    expect(fieldEvidence(fixture, fixture.properties[0]!, 'openingYear', AS_OF)).toMatchObject({ value: 2000, status: 'known', stale: true, confidence: 'High', lastVerifiedAt: '2024-01-01' });
  });
  it('does not promote unverified claims or infer operation from a listing', () => {
    const fixture = fixtureCatalog();
    fixture.evidenceClaims.push(claim('roomCount', 100, { confidence: 'Unverified', lastVerifiedAt: null }) as EvidenceClaim);
    expect(fieldEvidence(fixture, fixture.properties[0]!, 'roomCount', AS_OF)).toMatchObject({ value: null, status: 'unverified' });
    expect(fieldEvidence(fixture, fixture.properties[0]!, 'operatingStatus', AS_OF)).toMatchObject({ value: null, status: 'unknown' });
  });
  it('retains expired claims for inspection without presenting them as applicable facts', () => {
    const fixture = fixtureCatalog(); fixture.properties[0]!.roomCount = 100;
    fixture.evidenceClaims.push(claim('roomCount', 100, { validTo: '2026-01-01' }) as EvidenceClaim);
    expect(fieldEvidence(fixture, fixture.properties[0]!, 'roomCount', AS_OF)).toMatchObject({ value: null, status: 'unknown' });
    expect(fieldEvidence(fixture, fixture.properties[0]!, 'roomCount', AS_OF).claims).toHaveLength(1);
  });
  it('keeps an unadmitted snapshot unknown without relabeling verified evidence', () => {
    const fixture = fixtureCatalog();
    fixture.evidenceClaims.push(claim('roomCount', 100) as EvidenceClaim);
    expect(fieldEvidence(fixture, fixture.properties[0]!, 'roomCount', AS_OF)).toMatchObject({ value: null, status: 'unknown' });
    fixture.properties[0]!.isResort = false;
    fixture.evidenceClaims.push(claim('isResort', false) as EvidenceClaim);
    expect(fieldEvidence(fixture, fixture.properties[0]!, 'isResort', AS_OF)).toMatchObject({ value: false, status: 'known', label: 'No' });
  });
  it('formats zero distance and false as known, null as unknown, and approximate distance without losing provenance', () => {
    expect(formatValue('isResort', false, catalog)).toBe('No');
    expect(formatValue('nearestAirport', { name: 'Synthetic Airport', distanceKm: 0 }, catalog)).toBe('Synthetic Airport · about 0.0 km');
    expect(formatValue('openingYear', null, catalog)).toBe('Unknown');
  });
});
