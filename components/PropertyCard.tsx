import { useState } from 'react';
import type { AddToTripProps } from './AddToTrip';
import { AddToTripControl } from './AddToTrip';
import type { WatchControlProps } from './WatchControl';
import { WatchControl } from './WatchControl';
import type { Catalog, Property } from '../types/catalog';
import type { ExplorerQuery } from '../lib/catalog/explorer';
import { countryName, displayDate, fieldEvidence, humanize } from '../lib/catalog/presentation';
import type { CardPhoto } from '../lib/catalog/photos';
import { propertyHref } from '../lib/navigation/routes';
import { CompareControl } from './CompareControl';

// The collection card, split editorial: a real photograph on the left,
// details on the right. The photo is the property's own photograph from
// Wikimedia Commons where one exists, a photograph of the destination
// otherwise, and a country-level photograph for the last two properties —
// never presented as the hotel when it shows the area instead (alt text and
// the credit line say what the picture is). Photos load from Wikimedia at
// view time; if one fails to load, the card falls back to the property's
// brand illustration (passed down from the grouped collection, which holds
// the imports), so a renamed or deleted Commons file never leaves a broken
// card. Facts, verification line and all actions are unchanged from the
// explorer grid.
export function PropertyCard({ catalog, property, query, asOf, comparisonSlugs = [], onToggle, onWatch, watchedIds, onAddToTrip, brandPhoto, photo }: WatchControlProps & AddToTripProps & { catalog: Catalog; property: Property; query: ExplorerQuery; asOf: string; comparisonSlugs?: string[]; onToggle?: ((slug: string) => void) | undefined; brandPhoto?: { photo: string; alt: string } | undefined; photo?: CardPhoto | undefined }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const type = fieldEvidence(catalog, property, 'propertyType', asOf);
  const tags = fieldEvidence(catalog, property, 'experienceTags', asOf);
  const identity = fieldEvidence(catalog, property, 'name', asOf);
  const destination = catalog.destinations.find((entry) => entry.id === property.destinationId)?.name;
  const brand = catalog.brands.find((entry) => entry.id === property.brandId)?.name;
  const tagText = tags.value && Array.isArray(tags.value) && tags.value.length ? tags.value.map((tag) => humanize(tag)).join(' · ') : tags.label;
  const showPhoto = photo && !photoFailed;
  const photoAlt = !photo ? '' : photo.kind === 'hotel' ? property.name : photo.kind === 'destination' ? (destination ?? property.name) : countryName(property.country);
  return <article className={`property-card${showPhoto || brandPhoto ? '' : ' property-card-no-photo'}`}>
    {showPhoto ? <div className="property-card-photo">
      <img src={photo.src} alt={photoAlt} loading="lazy" onError={() => setPhotoFailed(true)} />
      {photo.artist && photo.license && <span className="property-card-photo-credit">Photo: {photo.artist}, {photo.licenseUrl ? <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a> : photo.license}</span>}
    </div> : brandPhoto ? <div className="property-card-photo"><img src={brandPhoto.photo} alt={brandPhoto.alt} /></div> : null}
    <div className="property-card-body">
      <span className="property-brand">{brand}</span>
      <h2><a href={propertyHref(property.slug, query, comparisonSlugs)}>{property.name}</a></h2>
      <p className="property-facts">{destination} <span>·</span> {countryName(property.country)} <span>·</span> {type.label}{type.status === 'known' ? ` · ${type.confidence} confidence` : ''}</p>
      <p className="property-tags">{tagText}</p>
      <div className="property-card-bottom"><span>{identity.lastVerifiedAt ? `Identity verified ${displayDate(identity.lastVerifiedAt)}` : 'Identity needs review'}{identity.stale || type.stale || tags.stale ? ' · Evidence needs refresh' : ''}</span><div className="property-card-actions"><a className="primary-link" href={propertyHref(property.slug, query, comparisonSlugs)} aria-label={`View details for ${property.name}`}>View details <span aria-hidden="true">→</span></a><CompareControl property={property} slugs={comparisonSlugs} onToggle={onToggle} /><AddToTripControl property={property} onAddToTrip={onAddToTrip} /><WatchControl property={property} onWatch={onWatch} watchedIds={watchedIds} /></div></div>
    </div>
  </article>;
}
