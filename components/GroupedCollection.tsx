import type { AddToTripProps } from './AddToTrip';
import type { WatchControlProps } from './WatchControl';
import type { Catalog, Property } from '../types/catalog';
import { groupProperties, groupSlug } from '../lib/catalog/explorer';
import type { ExplorerQuery, GroupBy } from '../lib/catalog/explorer';
import { explorerHref } from '../lib/navigation/routes';
import { PropertyCard } from './PropertyCard';
import { REGION_NORTH_AMERICA_PHOTO } from '../lib/embedded-photos/region-north-america';
import { REGION_ASIA_PHOTO } from '../lib/embedded-photos/region-asia';
import { REGION_EUROPE_PHOTO } from '../lib/embedded-photos/region-europe';
import { REGION_SOUTH_AMERICA_PHOTO } from '../lib/embedded-photos/region-south-america';
import { REGION_AFRICA_PHOTO } from '../lib/embedded-photos/region-africa';
import { REGION_OCEANIA_PHOTO } from '../lib/embedded-photos/region-oceania';
import { BRAND_RITZ_CARLTON_PHOTO } from '../lib/embedded-photos/brand-ritz-carlton';
import { BRAND_ST_REGIS_PHOTO } from '../lib/embedded-photos/brand-st-regis';
import { BRAND_LUXURY_COLLECTION_PHOTO } from '../lib/embedded-photos/brand-luxury-collection';
import { BRAND_JW_MARRIOTT_PHOTO } from '../lib/embedded-photos/brand-jw-marriott';
import { BRAND_EDITION_PHOTO } from '../lib/embedded-photos/brand-edition';
import { BRAND_AUTOGRAPH_COLLECTION_PHOTO } from '../lib/embedded-photos/brand-autograph-collection';

// Banner pictures are generated illustrations evoking a region or a brand's
// mood — never photographs of a hotel. Alt text says so; the honesty note
// below the grid stays accurate.
const REGION_BANNERS: Record<string, { photo: string; alt: string }> = {
  'North America': { photo: REGION_NORTH_AMERICA_PHOTO, alt: 'Illustrative image of desert canyons in North America' },
  Asia: { photo: REGION_ASIA_PHOTO, alt: 'Illustrative image of a temple garden in Asia' },
  Europe: { photo: REGION_EUROPE_PHOTO, alt: 'Illustrative image of a Mediterranean coast in Europe' },
  'South America': { photo: REGION_SOUTH_AMERICA_PHOTO, alt: 'Illustrative image of Andean peaks in South America' },
  Africa: { photo: REGION_AFRICA_PHOTO, alt: 'Illustrative image of a savanna at dusk in Africa' },
  Oceania: { photo: REGION_OCEANIA_PHOTO, alt: 'Illustrative image of coastal cliffs in Oceania' },
};
const BRAND_BANNERS: Record<string, { photo: string; alt: string }> = {
  'brand-ritz-carlton': { photo: BRAND_RITZ_CARLTON_PHOTO, alt: 'Illustrative image of a grand hotel salon in the Ritz-Carlton mood' },
  'brand-st-regis': { photo: BRAND_ST_REGIS_PHOTO, alt: 'Illustrative image of a Belle Époque lounge in the St. Regis mood' },
  'brand-luxury-collection': { photo: BRAND_LUXURY_COLLECTION_PHOTO, alt: 'Illustrative image of a historic palace courtyard in the Luxury Collection mood' },
  'brand-jw-marriott': { photo: BRAND_JW_MARRIOTT_PHOTO, alt: 'Illustrative image of a modern warm lobby in the JW Marriott mood' },
  'brand-edition': { photo: BRAND_EDITION_PHOTO, alt: 'Illustrative image of a stark modern interior in the EDITION mood' },
  'brand-autograph-collection': { photo: BRAND_AUTOGRAPH_COLLECTION_PHOTO, alt: 'Illustrative image of an eclectic boutique interior in the Autograph Collection mood' },
};

const GROUP_OPTIONS: { id: GroupBy; label: string }[] = [
  { id: 'destination', label: 'Destination' },
  { id: 'brand', label: 'Brand' },
];

export function GroupedCollection({ catalog, results, query, asOf, comparisonSlugs = [], onToggle, onWatch, watchedIds, onAddToTrip }: WatchControlProps & AddToTripProps & { catalog: Catalog; results: Property[]; query: ExplorerQuery; asOf: string; comparisonSlugs?: string[]; onToggle?: ((slug: string) => void) | undefined }) {
  const groupBy = query.group;
  const groups = groupProperties(catalog, results, groupBy);
  const banners = groupBy === 'brand' ? BRAND_BANNERS : REGION_BANNERS;
  const setGroup = (next: GroupBy) => {
    // Switching modes resets to that mode's largest group.
    if (next !== groupBy) window.location.assign(explorerHref({ ...query, group: next, only: '' }, comparisonSlugs));
  };
  // One group at a time by default: 'all' shows every group; a named group
  // shows only that group; anything else — no choice yet, an unknown slug,
  // or a group the filters emptied — falls back to the largest group that
  // still has properties, so plan-bar and Learn More links always land
  // somewhere instead of on an empty section.
  const selected = query.only === 'all' ? null : groups.find((group) => groupSlug(groupBy, group.key) === query.only);
  const visibleGroups = query.only === 'all' ? groups : [selected ?? groups[0]!];
  const effectiveOnly = query.only === 'all' ? 'all' : groupSlug(groupBy, (selected ?? groups[0]!).key);
  const setOnly = (next: string) => {
    if (next !== query.only) window.location.assign(explorerHref({ ...query, only: next }, comparisonSlugs));
  };
  return <>
    <div className="group-controls">
      <div className="group-toggle" role="group" aria-label="Group by">
        <span className="group-toggle-label" aria-hidden="true">Group by</span>
        {GROUP_OPTIONS.map((option) => <button key={option.id} type="button" aria-pressed={groupBy === option.id} aria-label={`Group by ${option.label.toLowerCase()}`} onClick={() => setGroup(option.id)}>{option.label}</button>)}
      </div>
      <label className="group-select"><span>{groupBy === 'brand' ? 'Show brand' : 'Show destination'}</span>
        <select value={effectiveOnly} onChange={(event) => setOnly(event.target.value)}>
          <option value="all">{groupBy === 'brand' ? 'All brands' : 'All destinations'}</option>
          {groups.map((group) => <option key={group.key} value={groupSlug(groupBy, group.key)}>{group.label} ({group.properties.length} {group.properties.length === 1 ? 'property' : 'properties'})</option>)}
        </select>
      </label>
    </div>
    {visibleGroups.map((group) => {
      const banner = banners[group.key];
      return <section className="collection-group" key={group.key} aria-labelledby={`collection-group-${group.key}`}>
        {banner && <figure className="collection-group-banner">
          {/* No loading="lazy": banner art is a data URI already in the
              bundle, so there is no fetch to defer — lazy only delayed decode. */}
          <img src={banner.photo} alt={banner.alt} />
          <figcaption><h2 id={`collection-group-${group.key}`}><span className="collection-group-name">{group.label}</span><span className="collection-group-count">{group.properties.length} {group.properties.length === 1 ? 'property' : 'properties'}</span></h2></figcaption>
        </figure>}
        <div className="property-grid">
          {group.properties.map((property) => <PropertyCard key={property.id} catalog={catalog} property={property} query={query} asOf={asOf} comparisonSlugs={comparisonSlugs} onToggle={onToggle} onWatch={onWatch} watchedIds={watchedIds} onAddToTrip={onAddToTrip} brandPhoto={BRAND_BANNERS[property.brandId]} />)}
        </div>
      </section>;
    })}
  </>;
}
