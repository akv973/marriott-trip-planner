import { DEFAULT_QUERY, FILTER_KEYS, SORT_OPTIONS } from '../catalog/explorer';
import type { ExplorerQuery } from '../catalog/explorer';

export type Route = { page: 'explore'; query: ExplorerQuery; section: string | null }
  | { page: 'property'; query: ExplorerQuery; slug: string }
  | { page: 'not-found'; query: ExplorerQuery };

export function parseRoute(hash: string): Route {
  const [path = '', search = ''] = hash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(search);
  const query = { ...DEFAULT_QUERY, q: (params.get('q') ?? '').trim().slice(0, 200) };
  for (const key of FILTER_KEYS) query[key] = (params.get(key) ?? '').slice(0, 100);
  const sort = params.get('sort');
  if (sort && Object.hasOwn(SORT_OPTIONS, sort)) query.sort = sort as ExplorerQuery['sort'];
  if (['', '/', '/explore', 'overview', 'foundation', 'roadmap', 'main'].includes(path)) {
    return { page: 'explore', query, section: ['foundation', 'roadmap', 'main'].includes(path) ? path : null };
  }
  if (/^\/properties\/[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(path)) return { page: 'property', slug: path.slice('/properties/'.length), query };
  return { page: 'not-found', query };
}

function serializeQuery(query: ExplorerQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  for (const key of FILTER_KEYS) if (query[key]) params.set(key, query[key]);
  if (query.sort !== DEFAULT_QUERY.sort) params.set('sort', query.sort);
  return params.size ? `?${params}` : '';
}
export const explorerHref = (query: ExplorerQuery = DEFAULT_QUERY) => `#/explore${serializeQuery(query)}`;
export const propertyHref = (slug: string, query: ExplorerQuery = DEFAULT_QUERY) => `#/properties/${slug}${serializeQuery(query)}`;
