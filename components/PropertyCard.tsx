import type { AddToTripProps } from './AddToTrip';
import { AddToTripControl } from './AddToTrip';
import type { WatchControlProps } from './WatchControl';
import { WatchControl } from './WatchControl';
import type { Catalog, Property } from '../types/catalog';
import type { ExplorerQuery } from '../lib/catalog/explorer';
import { countryName, displayDate, fieldEvidence, humanize } from '../lib/catalog/presentation';
import { propertyHref } from '../lib/navigation/routes';
import { CompareControl } from './CompareControl';

// The collection card, unchanged from the explorer grid: brand, location,
// serif name, type and confidence, experience tags, verification line and
// the detail/compare/add-to-trip/watch actions.
export function PropertyCard({ catalog, property, query, asOf, comparisonSlugs = [], onToggle, onWatch, watchedIds, onAddToTrip }: WatchControlProps & AddToTripProps & { catalog: Catalog; property: Property; query: ExplorerQuery; asOf: string; comparisonSlugs?: string[]; onToggle?: ((slug: string) => void) | undefined }) {
  const type = fieldEvidence(catalog, property, 'propertyType', asOf);
  const tags = fieldEvidence(catalog, property, 'experienceTags', asOf);
  const identity = fieldEvidence(catalog, property, 'name', asOf);
  return <article className="property-card">
    <div className="property-card-top"><span className="property-brand">{catalog.brands.find((brand) => brand.id === property.brandId)?.name}</span><span className="property-index" aria-hidden="true">↗</span></div>
    <p className="property-location">{catalog.destinations.find((destination) => destination.id === property.destinationId)?.name} <span>·</span> {countryName(property.country)}</p>
    <h2><a href={propertyHref(property.slug, query, comparisonSlugs)}>{property.name}</a></h2>
    <p className="property-type">{type.label}{type.status === 'known' ? ` · ${type.confidence} confidence` : ''}</p>
    <div className="tag-list" aria-label="Recorded experiences">{tags.value && Array.isArray(tags.value) ? tags.value.map((tag) => <span key={tag}>{humanize(tag)}</span>) : <span>{tags.label}</span>}</div>
    <div className="property-card-bottom"><span>{identity.lastVerifiedAt ? `Identity verified ${displayDate(identity.lastVerifiedAt)}` : 'Identity needs review'}{identity.stale || type.stale || tags.stale ? ' · Evidence needs refresh' : ''}</span><div className="property-card-actions"><a className="primary-link" href={propertyHref(property.slug, query, comparisonSlugs)} aria-label={`View details for ${property.name}`}>View details <span aria-hidden="true">→</span></a><CompareControl property={property} slugs={comparisonSlugs} onToggle={onToggle} /><AddToTripControl property={property} onAddToTrip={onAddToTrip} /><WatchControl property={property} onWatch={onWatch} watchedIds={watchedIds} /></div></div>
  </article>;
}
