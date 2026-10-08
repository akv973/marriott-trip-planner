import { DEFAULT_QUERY, FILTER_KEYS, SORT_OPTIONS } from '../catalog/explorer';
import type { ExplorerQuery } from '../catalog/explorer';

type RouteContext = { query: ExplorerQuery; comparisonSlugs: string[] };
export type Route = RouteContext & ({ page: 'explore'; section: string | null }
  | { page: 'property'; slug: string }
  | { page: 'compare' }
  | { page: 'recommendations' }
  | { page: 'trips' }
  | { page: 'calculator'; propertySlug: string | null }
  | { page: 'not-found' });

export function parseRoute(hash: string): Route {
  const [path = '', search = ''] = hash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(search);
  // Retain one excess entry so an oversized shared selection is visibly flagged.
  const comparisonSlugs = [...new Set(params.getAll('compare'))].slice(0, 5).map((slug) => slug.slice(0, 100));
  const query = { ...DEFAULT_QUERY, q: (params.get('q') ?? '').trim().slice(0, 200) };
  for (const key of FILTER_KEYS) query[key] = (params.get(key) ?? '').slice(0, 100);
  const sort = params.get('sort');
  if (sort && Object.hasOwn(SORT_OPTIONS, sort)) query.sort = sort as ExplorerQuery['sort'];
  if (['', '/', '/explore', 'overview', 'foundation', 'roadmap', 'main'].includes(path)) {
    return { page: 'explore', query, comparisonSlugs, section: ['foundation', 'roadmap', 'main'].includes(path) ? path : null };
  }
  if (path === '/calculator') return { page: 'calculator', propertySlug: params.get('property')?.slice(0, 100) ?? null, query, comparisonSlugs };
  if (path === '/recommendations') return { page: 'recommendations', query, comparisonSlugs };
  if (path === '/trips') return { page: 'trips', query, comparisonSlugs };
  if (path === '/compare') return { page: 'compare', query, comparisonSlugs };
  if (/^\/properties\/[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(path)) return { page: 'property', slug: path.slice('/properties/'.length), query, comparisonSlugs };
  return { page: 'not-found', query, comparisonSlugs };
}

function serializeQuery(query: ExplorerQuery, comparisonSlugs: string[] = []) {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  for (const key of FILTER_KEYS) if (query[key]) params.set(key, query[key]);
  if (query.sort !== DEFAULT_QUERY.sort) params.set('sort', query.sort);
  for (const slug of comparisonSlugs) params.append('compare', slug);
  return params.size ? `?${params}` : '';
}
export const explorerHref = (query: ExplorerQuery = DEFAULT_QUERY, comparisonSlugs: string[] = []) => `#/explore${serializeQuery(query, comparisonSlugs)}`;
export const propertyHref = (slug: string, query: ExplorerQuery = DEFAULT_QUERY, comparisonSlugs: string[] = []) => `#/properties/${slug}${serializeQuery(query, comparisonSlugs)}`;
export const comparisonHref = (comparisonSlugs: string[] = [], query: ExplorerQuery = DEFAULT_QUERY) => `#/compare${serializeQuery(query, comparisonSlugs)}`;

export function calculatorHref(query: ExplorerQuery = DEFAULT_QUERY, comparisonSlugs: string[] = [], propertySlug?: string) {
  const context = serializeQuery(query, comparisonSlugs);
  return `#/calculator${context}${propertySlug ? `${context ? '&' : '?'}property=${encodeURIComponent(propertySlug)}` : ''}`;
}

export const recommendationsHref = (query: ExplorerQuery = DEFAULT_QUERY, comparisonSlugs: string[] = []) => `#/recommendations${serializeQuery(query, comparisonSlugs)}`;

export const tripsHref = (query: ExplorerQuery = DEFAULT_QUERY, comparisonSlugs: string[] = []) => `#/trips${serializeQuery(query, comparisonSlugs)}`;
