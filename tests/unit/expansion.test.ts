import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import manifest from '../../docs/data-methodology/stage-9-batches/index.json';
import { rawCatalog, loadCatalog } from '../../lib/catalog/catalog';
import { benefits, effectiveBenefits } from '../../lib/benefits/engine';
import { fieldEvidence } from '../../lib/catalog/presentation';
import { DEFAULT_QUERY, queryProperties } from '../../lib/catalog/explorer';
import { recommendProperties, initialRecommendationInput } from '../../lib/scoring/recommendations';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  return JSON.stringify(value);
}
const digest = (v: unknown) => createHash('sha256').update(canonical(v)).digest('hex');
const result = loadCatalog(manifest.reviewedAt);
if (!result.success) throw new Error('Expanded catalog must validate.');
const catalog = result.data;

describe('Reviewed catalog expansion', () => {
  it('preserves every baseline record, rule and property ID exactly', () => {
    const collections = { properties: rawCatalog.properties, brands: rawCatalog.brands, destinations: rawCatalog.destinations, sources: rawCatalog.sources, evidence: rawCatalog.evidenceClaims, editorial: rawCatalog.editorialAssessments };
    for (const [name, baseline] of Object.entries(manifest.baseline)) expect(digest(collections[name as keyof typeof collections].slice(0, baseline.count))).toBe(baseline.sha256);
    for (const [name, baseline] of Object.entries(manifest.baselineBenefits)) expect(digest(benefits[name as keyof typeof manifest.baselineBenefits].slice(0, baseline.count))).toBe(baseline.sha256);
  });
  it('admits exactly five disjoint 15-property batches without duplicate property codes', () => {
    const additions = manifest.batches.flatMap(b => b.propertyIds);
    expect(manifest.batches).toHaveLength(5);
    expect(manifest.batches.every(b => b.propertyIds.length === 15)).toBe(true);
    expect(new Set(additions).size).toBe(75);
    expect(catalog.properties.map(p => p.id).slice(25)).toEqual(additions);
    expect(new Set(catalog.properties.map(p => p.marriottCode)).size).toBe(100);
  });
  it('provides current official identity evidence, a separate desk rationale and a benefit review for every addition', () => {
    for (const property of catalog.properties.slice(25)) {
      for (const subject of ['name', 'brandId', 'city', 'country'] as const) {
        const v = fieldEvidence(catalog, property, subject, manifest.reviewedAt);
        expect(v.status).toBe('known'); expect(v.stale).toBe(false);
        expect(v.claims.every(c => catalog.sources.find(s => s.id === c.sourceId)?.type === 'marriott-property-page')).toBe(true);
      }
      expect(catalog.editorialAssessments.find(a => a.propertyId === property.id)).toMatchObject({ kind: 'editorial', hardwareQuality: null, serviceQuality: null, methodologyVersion: 'desk-review-1' });
      expect(benefits.reviews.find(r => r.propertyId === property.id)?.verifiedAt).toBe(manifest.reviewedAt);
    }
  });
  it('retains both real factual disputes and withholds disputed snapshots and operating eligibility', () => {
    const deer = catalog.properties.find(p => p.slug === 'st-regis-deer-valley')!;
    expect(fieldEvidence(catalog, deer, 'roomCount', manifest.reviewedAt)).toMatchObject({ value: null, status: 'conflicted' });
    expect(fieldEvidence(catalog, deer, 'roomCount', manifest.reviewedAt).claims.map(c => c.value)).toEqual([174, 181]);
    const bustan = catalog.properties.find(p => p.slug === 'al-bustan')!;
    expect(fieldEvidence(catalog, bustan, 'operatingStatus', manifest.reviewedAt)).toMatchObject({ value: null, status: 'conflicted' });
    const recommendations = recommendProperties(catalog, { ...initialRecommendationInput(manifest.reviewedAt), country: 'OM' });
    expect(recommendations.success).toBe(true);
    if (recommendations.success) expect(recommendations.results.find(r => r.propertyId === bustan.id)?.checks.find(c => c.label === 'Operating status')?.state).toBe('unknown');
  });
  it('shows new destinations in geographic and experience queries without filling optional unknowns', () => {
    expect(new Set(catalog.properties.map(p => p.region)).size).toBe(6);
    const australia = queryProperties(catalog, { ...DEFAULT_QUERY, country: 'AU' });
    expect(australia).toHaveLength(5);
    expect(queryProperties(catalog, { ...DEFAULT_QUERY, country: 'PE' })).toHaveLength(4);
    expect(catalog.properties.slice(25).every(p => p.latitude === null && p.openingYear === null && p.isDestinationProperty === null)).toBe(true);
  });
  it('applies explicit Waikiki program exclusions and preserves the Athenee official-policy contradiction', () => {
    const waikiki = catalog.properties.find(p => p.slug === 'ritz-waikiki')!;
    const v = effectiveBenefits(catalog, waikiki, 'ambassador', manifest.reviewedAt);
    for (const key of ['roomUpgrade', 'suiteUpgrade', 'lateCheckout', 'your24']) expect(v.results.find(r => r.category === key)).toMatchObject({ conflict: false, outcome: { state: 'excluded', basis: 'policy' } });
    const athenee = catalog.properties.find(p => p.slug === 'athenee-bangkok')!;
    const lounge = effectiveBenefits(catalog, athenee, 'platinum', manifest.reviewedAt).results.find(r => r.category === 'lounge')!;
    expect(lounge).toMatchObject({ conflict: true, outcome: { state: 'unknown' } });
    expect(lounge.trace.filter(t => t.match === 'applies').map(t => t.rule.id)).toEqual(['lounge-excluded-brands', 'override-athenee-bangkok-lounge']);
  });
});
