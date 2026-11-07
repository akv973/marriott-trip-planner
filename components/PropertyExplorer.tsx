import { AddToTripControl } from './AddToTrip';
import type { AddToTripProps } from './AddToTrip';
import { WatchControl } from './WatchControl';
import type { WatchControlProps } from './WatchControl';
import type { FormEvent, KeyboardEvent } from 'react';
import type { Catalog } from '../types/catalog';
import { activeFilterCount, compareText, facetValue, FILTER_KEYS, queryProperties, SORT_OPTIONS } from '../lib/catalog/explorer';
import type { ExplorerQuery, FilterKey } from '../lib/catalog/explorer';
import { countryName, displayDate, fieldEvidence, humanize } from '../lib/catalog/presentation';
import { explorerHref, explorerSectionHref, explorerTabForSection, propertyHref } from '../lib/navigation/routes';
import type { ExplorerSection } from '../lib/navigation/routes';
import { CompareControl } from './CompareControl';
import { EditorialHomepage, JourneyGallery } from './EditorialHomepage';
import { ProjectNotes } from './ProjectNotes';

const FILTER_LABELS: Record<FilterKey, string> = {
  destination: 'Destination', country: 'Country / territory', region: 'Region', brand: 'Brand', type: 'Property type',
  tag: 'Experience', resort: 'Resort designation', destinationProperty: 'Destination-property designation', opening: 'Opening year', renovation: 'Renovation year',
};

export function PropertyExplorer({ catalog, query, asOf, section, comparisonSlugs = [], onToggle, onWatch, watchedIds, onAddToTrip }: WatchControlProps & AddToTripProps & { catalog: Catalog; query: ExplorerQuery; asOf: string; section: string | null; comparisonSlugs?: string[]; onToggle?: (slug: string) => void }) {
  const results = queryProperties(catalog, query);
  const tab = explorerTabForSection(section);
  const tabs: { id: ExplorerSection; label: string; href: string }[] = [
    { id: 'properties', label: 'Properties', href: explorerSectionHref('properties', query, comparisonSlugs) },
    { id: 'journeys', label: 'Journeys', href: explorerSectionHref('journeys', query, comparisonSlugs) },
    { id: 'about', label: 'About', href: explorerSectionHref('about', query, comparisonSlugs) },
  ];
  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const order = tabs.map((entry) => entry.id);
    const current = order.indexOf(tab);
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = (current + 1) % order.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + order.length) % order.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = order.length - 1;
    if (next === null) return;
    event.preventDefault();
    window.location.assign(tabs[next]!.href);
  }
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
    <div className="explorer-tabs" role="tablist" aria-label="Explorer sections" onKeyDown={onTabKeyDown}>
      {tabs.map((entry) => <a key={entry.id} role="tab" id={`explorer-tab-${entry.id}`} aria-selected={tab === entry.id} aria-controls={`explorer-${entry.id}`} tabIndex={tab === entry.id ? 0 : -1} href={entry.href}>{entry.label}</a>)}
    </div>
    {tab === 'properties' && (<div role="tabpanel" id="explorer-properties" aria-labelledby="explorer-tab-properties">
    <EditorialHomepage catalog={catalog} query={query} comparisonSlugs={comparisonSlugs} />
    <section className="explorer-section" id="collection-grid" aria-label="Property explorer">
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
    <p className="editorial-photo-note">Destination photographs from the travel concept — not photographs of catalog hotels.</p>
    </div>)}
    {tab === 'journeys' && (<div role="tabpanel" id="explorer-journeys" aria-labelledby="explorer-tab-journeys">
    <JourneyGallery />
    </div>)}
    {tab === 'about' && (<div role="tabpanel" id="explorer-about" aria-labelledby="explorer-tab-about"><ProjectNotes /></div>)}
  </>;
}
