import { AddToTripControl } from './AddToTrip';
import type { AddToTripProps } from './AddToTrip';
import { WatchControl } from './WatchControl';
import type { WatchControlProps } from './WatchControl';
import type { FormEvent } from 'react';
import type { Catalog } from '../types/catalog';
import { activeFilterCount, compareText, facetValue, FILTER_KEYS, queryProperties, SORT_OPTIONS } from '../lib/catalog/explorer';
import type { ExplorerQuery, FilterKey } from '../lib/catalog/explorer';
import { countryName, displayDate, fieldEvidence, humanize } from '../lib/catalog/presentation';
import { explorerHref, propertyHref } from '../lib/navigation/routes';
import { ContourArt } from './ContourArt';
import { CompareControl } from './CompareControl';

import { LAKE_COMO_PHOTO } from '../lib/embedded-photos/lake-como';
import { KYOTO_PHOTO } from '../lib/embedded-photos/kyoto';
import { DOLOMITES_PHOTO } from '../lib/embedded-photos/dolomites';
import { PAROS_PHOTO } from '../lib/embedded-photos/paros';

const FILTER_LABELS: Record<FilterKey, string> = {
  destination: 'Destination', country: 'Country / territory', region: 'Region', brand: 'Brand', type: 'Property type',
  tag: 'Experience', resort: 'Resort designation', destinationProperty: 'Destination-property designation', opening: 'Opening year', renovation: 'Renovation year',
};

export function PropertyExplorer({ catalog, query, asOf, comparisonSlugs = [], onToggle, onWatch, watchedIds, onAddToTrip }: WatchControlProps & AddToTripProps & { catalog: Catalog; query: ExplorerQuery; asOf: string; comparisonSlugs?: string[]; onToggle?: (slug: string) => void }) {
  const results = queryProperties(catalog, query);
  const update = (key: keyof ExplorerQuery, value: string) => window.location.assign(explorerHref({ ...query, [key]: value }, comparisonSlugs));
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update('q', String(new FormData(event.currentTarget).get('q') ?? '').trim().slice(0, 200));
  }
  const labelFor = (key: FilterKey, value: string) => {
    if (value === 'unknown') return 'Unknown / requires review';
    if (key === 'country') return countryName(value);
    if (key === 'brand') return catalog.brands.find((brand) => brand.id === value)?.name ?? value;
    if (key === 'destination') return catalog.destinations.find((destination) => destination.id === value)?.name ?? value;
    if (value === 'true' || value === 'false') return value === 'true' ? 'Yes' : 'No';
    return humanize(value);
  };
  function filter(key: FilterKey) {
    const values = [...new Set(catalog.properties.flatMap((property) => key === 'tag' ? property.experienceTags ?? ['unknown'] : [facetValue(property, key)]))]
      .sort((a, b) => a === 'unknown' ? 1 : b === 'unknown' ? -1 : compareText(labelFor(key, a), labelFor(key, b)));
    if (query[key] && !values.includes(query[key])) values.unshift(query[key]);
    return <label className="filter-field" key={key}><span>{FILTER_LABELS[key]}</span>
      <select value={query[key]} onChange={(event) => update(key, event.target.value)}>
        <option value="">All</option>{values.map((value) => <option value={value} key={value}>{labelFor(key, value)}</option>)}
      </select>
    </label>;
  }
  return <>
    <figure className="explorer-hero-photo"><img src={LAKE_COMO_PHOTO} alt="Historic lakeside villa and cypress trees on Lake Como" /><figcaption>Lake Como</figcaption></figure>
    <section className="explorer-hero" aria-labelledby="page-title">
      <ContourArt />
      <div><p className="eyebrow">A considered collection</p><h1 id="page-title" tabIndex={-1}>Find a stay worth<br /><em>the journey.</em></h1>
        <p className="collection-stat-line">{catalog.properties.length} properties · {catalog.brands.length} brands</p>
        <p>Explore {catalog.properties.length} curated Marriott properties. Follow the sources, discover the setting, and see what’s still unknown.</p></div>
    </section>
    <section className="explorer-section" aria-label="Property explorer">
      <form className="search-form" onSubmit={search} role="search">
        <label htmlFor="property-search">Where will your curiosity take you?</label>
        <div className="search-row"><input key={query.q} id="property-search" name="q" type="search" maxLength={200} defaultValue={query.q} placeholder="Property, destination, brand, or experience" />
          <button type="submit" className="primary-button">Search <span aria-hidden="true">↗</span></button></div>
      </form>
      <p className="comparison-hint">Select 2–4 properties to compare their setting, sourced details, and editorial notes.</p>
      <div className="explorer-layout">
        <aside className="filter-panel" aria-label="Property filters">
          <div className="filter-heading"><h2>Refine your collection</h2><a className="text-link" href={explorerHref(undefined, comparisonSlugs)}>Reset all</a></div>
          {FILTER_KEYS.slice(0, 6).map(filter)}
          <details className="more-filters"><summary>More property details</summary>{FILTER_KEYS.slice(6).map(filter)}</details>
          <p className="filter-note">Filters use recorded facts and sourced setting tags. Unknown doesn’t mean no. Some details still need research.</p>
        </aside>
        <div className="results-panel">
          <div className="results-heading"><p role="status" aria-live="polite"><strong>{results.length}</strong> of {catalog.properties.length} properties{activeFilterCount(query) ? ' · filtered' : ''}</p>
            <label className="sort-field"><span>Sort by</span><select value={query.sort} onChange={(event) => update('sort', event.target.value)}>{Object.entries(SORT_OPTIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
          {(query.q || FILTER_KEYS.some((key) => query[key])) && <div className="active-filters" aria-label="Active filters">
            {query.q && <button onClick={() => update('q', '')} aria-label={`Remove search ${query.q}`}>Search: {query.q} <span aria-hidden="true">×</span></button>}
            {FILTER_KEYS.filter((key) => query[key]).map((key) => <button key={key} onClick={() => update(key, '')} aria-label={`Remove ${FILTER_LABELS[key]} filter`}>{FILTER_LABELS[key]}: {labelFor(key, query[key])} <span aria-hidden="true">×</span></button>)}
          </div>}
          {!results.length ? <div className="no-results"><p className="eyebrow">A little room to explore</p><h2>No properties match these choices.</h2><p>Try another destination or remove a filter. The collection is curated, rather than a complete Marriott directory.</p><a className="primary-link" href={explorerHref(undefined, comparisonSlugs)}>View all properties <span aria-hidden="true">↗</span></a></div> :
            <div className="property-grid">{results.map((property) => {
              const type = fieldEvidence(catalog, property, 'propertyType', asOf);
              const tags = fieldEvidence(catalog, property, 'experienceTags', asOf);
              const identity = fieldEvidence(catalog, property, 'name', asOf);
              return <article className="property-card" key={property.id}>
                <div className="property-card-top"><span className="property-brand">{catalog.brands.find((brand) => brand.id === property.brandId)?.name}</span><span className="property-index" aria-hidden="true">↗</span></div>
                <p className="property-location">{catalog.destinations.find((destination) => destination.id === property.destinationId)?.name} <span>·</span> {countryName(property.country)}</p>
                <h2><a href={propertyHref(property.slug, query, comparisonSlugs)}>{property.name}</a></h2>
                <p className="property-type">{type.label}{type.status === 'known' ? ` · ${type.confidence} confidence` : ''}</p>
                <div className="tag-list" aria-label="Recorded experiences">{tags.value && Array.isArray(tags.value) ? tags.value.map((tag) => <span key={tag}>{humanize(tag)}</span>) : <span>{tags.label}</span>}</div>
                <div className="property-card-bottom"><span>{identity.lastVerifiedAt ? `Identity verified ${displayDate(identity.lastVerifiedAt)}` : 'Identity needs review'}{identity.stale || type.stale || tags.stale ? ' · Evidence needs refresh' : ''}</span><div className="property-card-actions"><a className="primary-link" href={propertyHref(property.slug, query, comparisonSlugs)} aria-label={`View details for ${property.name}`}>View details <span aria-hidden="true">→</span></a><CompareControl property={property} slugs={comparisonSlugs} onToggle={onToggle} /><AddToTripControl property={property} onAddToTrip={onAddToTrip} /><WatchControl property={property} onWatch={onWatch} watchedIds={watchedIds} /></div></div>
              </article>;
            })}</div>}
          <p className="results-note">Setting tags describe sourced activities or surroundings; they don’t rate hotel quality. Year sorts put unknown values last.</p>
        </div>
      </div>
    </section>
    <section className="journey-gallery" aria-labelledby="journeys-title">
      <div><p className="eyebrow">Places that linger</p><h2 id="journeys-title">Journeys to linger over.</h2>
        <p className="journey-note">Destination photographs from the travel concept — not photographs of catalog hotels.</p></div>
      <div className="journey-grid">
        <figure><img src={KYOTO_PHOTO} alt="Traditional garden and wooden ryokan in Kyoto" loading="lazy" /><figcaption><strong>Kyoto</strong><span>A measured stay shaped by garden mornings, intimate meals, and time set aside simply to notice.</span></figcaption></figure>
        <figure><img src={DOLOMITES_PHOTO} alt="Alpine landscape in the Italian Dolomites" loading="lazy" /><figcaption><strong>The Dolomites</strong><span>Crisp mountain air, long lunches, and a landscape that invites you to leave the schedule behind.</span></figcaption></figure>
        <figure><img src={PAROS_PHOTO} alt="Whitewashed village above the blue Aegean Sea on Paros" loading="lazy" /><figcaption><strong>Paros</strong><span>Salt air, whitewashed lanes, and generous days that begin late and finish by the water.</span></figcaption></figure>
      </div>
    </section>
  </>;
}
