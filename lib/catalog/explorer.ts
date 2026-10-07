import type { Catalog, Property } from '../../types/catalog';
import { countryName } from './presentation';

export const SORT_OPTIONS = {
  name: 'Name · A–Z', 'name-desc': 'Name · Z–A', destination: 'Destination · A–Z', brand: 'Brand · A–Z',
  'opening-newest': 'Opening year · newest first', 'renovation-newest': 'Renovation year · newest first',
} as const;
export type ExplorerSort = keyof typeof SORT_OPTIONS;
export const FILTER_KEYS = ['destination', 'country', 'region', 'brand', 'type', 'tag', 'resort', 'destinationProperty', 'opening', 'renovation'] as const;
export type FilterKey = typeof FILTER_KEYS[number];
export type ExplorerQuery = { q: string; sort: ExplorerSort } & Record<FilterKey, string>;
export const DEFAULT_QUERY: ExplorerQuery = {
  q: '', sort: 'name', destination: '', country: '', region: '', brand: '', type: '', tag: '', resort: '', destinationProperty: '', opening: '', renovation: '',
};

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
export const compareText = (a: string, b: string) => collator.compare(a, b);
const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('en').trim();

// Facets deliberately derive from the curated snapshots. Unknown/disputed optional
// fields do not count as false, an empty list, a zero year, or positive evidence.
export function facetValue(property: Property, key: FilterKey): string {
  switch (key) {
    case 'destination': return property.destinationId;
    case 'brand': return property.brandId;
    case 'country': return property.country;
    case 'region': return property.region;
    case 'type': return property.propertyType ?? 'unknown';
    case 'tag': return '';
    case 'resort': return property.isResort == null ? 'unknown' : String(property.isResort);
    case 'destinationProperty': return property.isDestinationProperty == null ? 'unknown' : String(property.isDestinationProperty);
    case 'opening': return property.openingYear == null ? 'unknown' : String(property.openingYear);
    case 'renovation': return property.renovationYear == null ? 'unknown' : String(property.renovationYear);
  }
}

export function queryProperties(catalog: Catalog, query: ExplorerQuery): Property[] {
  const brands = new Map(catalog.brands.map((brand) => [brand.id, brand.name]));
  const destinations = new Map(catalog.destinations.map((destination) => [destination.id, destination.name]));
  const terms = normalize(query.q).split(/\s+/).filter(Boolean);
  const results = catalog.properties.filter((property) => {
    const haystack = normalize([property.name, property.city, countryName(property.country), property.country, property.region,
      brands.get(property.brandId), destinations.get(property.destinationId), property.marriottCode, property.propertyType,
      ...(property.experienceTags ?? [])].filter(Boolean).join(' '));
    return terms.every((term) => haystack.includes(term)) && FILTER_KEYS.every((key) => {
      const requested = query[key];
      if (!requested) return true;
      if (key === 'tag') return requested === 'unknown' ? property.experienceTags == null : property.experienceTags?.includes(requested as NonNullable<Property['experienceTags']>[number]) === true;
      return facetValue(property, key) === requested;
    });
  });
  const alphabetical = (a: Property, b: Property) => compareText(a.name, b.name) || compareText(a.id, b.id);
  return results.sort((a, b) => {
    switch (query.sort) {
      case 'name-desc': return -alphabetical(a, b);
      case 'brand': return compareText(brands.get(a.brandId) ?? '', brands.get(b.brandId) ?? '') || alphabetical(a, b);
      case 'destination': return compareText(destinations.get(a.destinationId) ?? '', destinations.get(b.destinationId) ?? '') || alphabetical(a, b);
      case 'opening-newest':
      case 'renovation-newest': {
        const field = query.sort === 'opening-newest' ? 'openingYear' : 'renovationYear';
        const first = a[field]; const second = b[field];
        if (first == null && second != null) return 1;
        if (first != null && second == null) return -1;
        return (second != null && first != null ? second - first : 0) || alphabetical(a, b);
      }
      default: return alphabetical(a, b);
    }
  });
}

export function activeFilterCount(query: ExplorerQuery) {
  return FILTER_KEYS.filter((key) => query[key]).length + (query.q ? 1 : 0);
}
