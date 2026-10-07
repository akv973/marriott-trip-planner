# Stage 2 explorer behavior

The unchanged Stage 1 catalog is the only hotel data source: 25 properties, six brands, 24 destinations, 25 sources, 260 claims and one separate editorial assessment. The same schema/reference/evidence boundary must succeed before rendering. No property expansion, research updates, dynamic data, maps, comparison, saved targets or trip controls are included.

## Search and filtering

Search is submitted explicitly and stored in the URL. It matches all whitespace-separated words, ignoring case and diacritics, across property name, city, destination, brand, country name/code, region, Marriott code, type, and experience tags. It does not search editorial text or infer synonyms. Searches are limited to 200 characters.

Selections use AND across destination, country/territory, region, brand, property type, experience, resort designation, destination-property designation, opening year and renovation year. Each select supports one value. Years are exact recorded years rather than an invented definition of “recent.” Additional property fields are in a native disclosure. Options come from the whole catalog, so a combination may return zero results. Reset and individual removal recover the full collection.

Unknown optional values remain distinct from false, zero, and an explicit empty tag list. “Unknown / requires review” includes withheld disputed snapshot values. Verified but stale snapshot values remain filterable with their dated evidence on details; filters are not a promise of current operation or availability. There are no filters for unsupported luxury tiers, lounge access, breakfast policies, or hotel-quality scores.

Sorts: name ascending/descending, brand, destination, newest opening year and newest renovation year. Known years precede unknown years; remaining ties use alphabetical name then stable ID. No quality ranking or recommendation score is produced. Invalid sort parameters fall back to name ascending. Arbitrary filter parameters remain visible/removable and match no property; they do not silently broaden a shared search.

## Meaningful URLs

- `#/explore`: all properties.
- `#/explore?country=TZ&tag=wildlife&sort=name-desc`: composed view.
- `#/properties/mereshi?country=TZ&tag=wildlife&sort=name-desc`: detail with return context.

Detail and return links serialize the same search/filter/sort state. Hash changes create native history entries. Back, forward, direct links and reloads work without a server rewrite or a new router dependency. Optional browser form/disclosure state and scroll position are not persisted. Page transitions move focus to the heading; filter changes retain control focus. The skip link focuses main without replacing a property route. `#foundation` and `#roadmap` retain native informational navigation. Unsupported paths/slugs show a not-found screen with an explorer recovery link.

## Evidence presentation

`lib/catalog/presentation.ts` derives display states independently of components. Active sourced verified matching claims support a snapshot. Disputes withhold a factual winner and retain every claim. Unverified evidence remains labeled as unverified, with no promoted factual value. Non-applicable historical claims stay inspectable. Stale matching evidence preserves the historical value and displays a refresh warning. A verified claim that has not been admitted into the snapshot does not fill an unknown snapshot silently.

Details show factual confidence, last verification date, source title/link/type/publisher/access date, observed/verified and validity dates, claim values, dispute/applicability/staleness status, and notes. Missing values display Unknown. Cash and award rates display Unavailable; unknown benefits/fees display Unknown. No prices are replaced by zero. Operating status is derived only from applicable verified undisputed status claims; the seed catalog has none. Official pages open in a new tab with noopener/noreferrer.

Editorial notes are a separate panel with rationale, author, review date, methodology and explicitly editorial ratings/stay length. The one desk review has no numeric scores or recommended stay. Setting tags are sourced classifications, not hotel-quality opinions or amenity guarantees. Country display names use the platform's English ISO-region display names; stored country codes are unchanged.

## Verification

Unit tests cover query composition, search, sorts, unknowns, input bounds, navigation and independent evidence states. Integration tests render shipped data, direct detail URLs, source attribution, uncertainty, editorial separation, invalid-data fallback and synthetic stale/conflict records. Chromium tests cover eight flows at 1366×900 and 390×844, including every property page. CI runs these against the production Pages-base preview and again after live deployment. Inspect the screenshots in each browser artifact before claiming visual QA.
