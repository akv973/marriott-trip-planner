import { describe, expect, it } from 'vitest';
import { rawCatalog } from '../../lib/catalog/catalog';
import { DEFAULT_QUERY } from '../../lib/catalog/explorer';
import { editorialComparisonValue, resolveComparison, toggleComparison, UNAVAILABLE_COMPARISON_ROWS } from '../../lib/catalog/comparison';
import { comparisonHref, explorerHref, parseRoute, propertyHref } from '../../lib/navigation/routes';
import { loadFoundation } from '../../lib/catalog/foundation';
import { validateFoundation } from '../../lib/validation/foundation';
import type { Catalog } from '../../types/catalog';

const catalog = rawCatalog as Catalog;
const slugs = ['mapito', 'mereshi', 'dove-mountain', 'jw-sao-paulo'];

describe('Property comparison contract', () => {
  it.each([2, 3, 4])('retains the requested order for %i properties without mutating catalog data', (count) => {
    const before = structuredClone(catalog);
    const selection = resolveComparison(catalog, slugs.slice(0, count));
    expect(selection.properties.map((property) => property.slug)).toEqual(slugs.slice(0, count));
    expect(selection.issues).toEqual([]);
    expect(catalog).toEqual(before);
  });
  it('deduplicates selections and visibly reports missing properties and overflow', () => {
    expect(resolveComparison(catalog, ['mapito', 'mapito']).properties).toHaveLength(1);
    const selection = resolveComparison(catalog, ['missing', ...slugs, 'cloudveil']);
    expect(selection.properties.map((property) => property.slug)).toEqual(slugs);
    expect(selection.issues).toEqual([
      'Property unavailable in this catalog: missing.',
      'A comparison supports at most four properties. Only the first four valid selections are shown.',
    ]);
  });
  it('enforces a four-property maximum while allowing removal and replacement', () => {
    expect(toggleComparison(slugs, 'cloudveil')).toEqual(slugs);
    expect(toggleComparison(slugs, 'mereshi')).toEqual(['mapito', 'dove-mountain', 'jw-sao-paulo']);
    expect(toggleComparison(['mapito'], 'mereshi')).toEqual(['mapito', 'mereshi']);
  });
  it('keeps unsupported booking values explicit and never substitutes a zero', () => {
    expect(UNAVAILABLE_COMPARISON_ROWS.map((row) => row.value)).toEqual(['Unavailable', 'Unavailable', 'Unavailable', 'Unknown', 'Unknown', 'Unknown', 'Unknown']);
  });
  it('keeps editorial unknowns, zero ratings, empty lists and stay length distinct', () => {
    const assessment = catalog.editorialAssessments[0]!;
    expect(editorialComparisonValue(assessment, 'hardwareQuality')).toBe('Unknown');
    expect(editorialComparisonValue({ ...assessment, hardwareQuality: 0 }, 'hardwareQuality')).toBe('0 / 10');
    expect(editorialComparisonValue({ ...assessment, strengths: [] }, 'strengths')).toBe('None recorded');
    expect(editorialComparisonValue({ ...assessment, recommendedStayLength: { minNights: 2, maxNights: 4 } }, 'recommendedStayLength')).toBe('2–4 nights');
  });
  it('admits Stage 6 but rejects Stage 7 progression', () => {
    const bundle = loadFoundation();
    expect(bundle.success).toBe(true);
    if (!bundle.success) throw new Error('Shipped bundle invalid');
    expect(validateFoundation({ ...bundle.data, foundation: { ...bundle.data.foundation, stage: 7 } }).success).toBe(false);
  });
});

describe('Comparison URLs', () => {
  it('round trips selections and explorer context through every page', () => {
    const query = { ...DEFAULT_QUERY, q: 'safari & spa', country: 'TZ', sort: 'name-desc' as const };
    for (const href of [comparisonHref(slugs, query), explorerHref(query, slugs), propertyHref('mapito', query, slugs)]) {
      expect(parseRoute(href)).toMatchObject({ query, comparisonSlugs: slugs });
    }
    expect(parseRoute(comparisonHref(slugs, query)).page).toBe('compare');
  });
  it('supports empty, one-property and duplicate links without manufacturing comparison partners', () => {
    expect(parseRoute('#/compare').comparisonSlugs).toEqual([]);
    expect(parseRoute('#/compare?compare=mapito&compare=mapito').comparisonSlugs).toEqual(['mapito']);
  });
  it('bounds malformed URL input while retaining overflow for a warning', () => {
    const route = parseRoute(comparisonHref([...slugs, 'cloudveil', 'x'.repeat(500)]));
    expect(route.comparisonSlugs).toHaveLength(5);
    expect(resolveComparison(catalog, route.comparisonSlugs).issues).toHaveLength(1);
    expect(parseRoute('#/compare?compare=%3Cscript%3E').comparisonSlugs).toEqual(['<script>']);
  });
});
