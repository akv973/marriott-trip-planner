import type { AddToTripProps } from './AddToTrip';
import { AddToTripControl } from './AddToTrip';
import type { WatchControlProps } from './WatchControl';
import { WatchControl } from './WatchControl';
import type { Catalog, Property } from '../types/catalog';
import type { ExplorerQuery } from '../lib/catalog/explorer';
import { countryName, displayDate, fieldEvidence, humanize } from '../lib/catalog/presentation';
import { propertyHref } from '../lib/navigation/routes';
import { CompareControl } from './CompareControl';

// The collection card, split editorial: the property's brand illustration on
// the left, details on the right. The image is the brand illustration
// already in the bundle (passed down from the grouped collection, which
// holds the imports) — a generated illustration evoking the brand's mood,
// never a photograph of the hotel. Facts, verification line and all actions
// are unchanged from the explorer grid.
export function PropertyCard({ catalog, property, query, asOf, comparisonSlugs = [], onToggle, onWatch, watchedIds, onAddToTrip, brandPhoto }: WatchControlProps & AddToTripProps & { catalog: Catalog; property: Property; query: ExplorerQuery; asOf: string; comparisonSlugs?: string[]; onToggle?: ((slug: string) => void) | undefined; brandPhoto?: { photo: string; alt: string } | undefined }) {
  const type = fieldEvidence(catalog, property, 'propertyType', asOf);
  const tags = fieldEvidence(catalog, property, 'experienceTags', asOf);
  const identity = fieldEvidence(catalog, property, 'name', asOf);
  const destination = catalog.destinations.find((entry) => entry.id === property.destinationId)?.name;
  const brand = catalog.brands.find((entry) => entry.id === property.brandId)?.name;
  const tagText = tags.value && Array.isArray(tags.value) && tags.value.length ? tags.value.map((tag) => humanize(tag)).join(' · ') : tags.label;
  return <article className={`property-card${brandPhoto ? '' : ' property-card-no-photo'}`}>
    {brandPhoto && <div className="property-card-photo"><img src={brandPhoto.photo} alt={brandPhoto.alt} /></div>}
    <div className="property-card-body">
      <span className="property-brand">{brand}</span>
      <h2><a href={propertyHref(property.slug, query, comparisonSlugs)}>{property.name}</a></h2>
      <p className="property-facts">{destination} <span>·</span> {countryName(property.country)} <span>·</span> {type.label}{type.status === 'known' ? ` · ${type.confidence} confidence` : ''}</p>
      <p className="property-tags">{tagText}</p>
      <div className="property-card-bottom"><span>{identity.lastVerifiedAt ? `Identity verified ${displayDate(identity.lastVerifiedAt)}` : 'Identity needs review'}{identity.stale || type.stale || tags.stale ? ' · Evidence needs refresh' : ''}</span><div className="property-card-actions"><a className="primary-link" href={propertyHref(property.slug, query, comparisonSlugs)} aria-label={`View details for ${property.name}`}>View details <span aria-hidden="true">→</span></a><CompareControl property={property} slugs={comparisonSlugs} onToggle={onToggle} /><AddToTripControl property={property} onAddToTrip={onAddToTrip} /><WatchControl property={property} onWatch={onWatch} watchedIds={watchedIds} /></div></div>
    </div>
  </article>;
}
