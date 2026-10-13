# Map sources and licensing

Reviewed 2026-10-13 UTC. Scope: the existing 100 curated properties; no additions.

## Published property pins

Each of the 100 official property pages was reviewed for its named property and exposed View Map link. The numeric latitude/longitude in that published link was recorded exactly in `data/maps/locations.json`, with the official source URL, normalized coordinate-only link, review date, High confidence in the published pin, and `published-property-pin` precision. No city centroid, nearest airport, guessed entrance, address geocoder, scraped HTML, private/undocumented endpoint or Google map imagery was used. The Google target supplies the published numbers only; its rendered map is not redistributed. Numeric factual pins do not license hotel/Google photography, map tiles or page text; none is copied. Official sources remain linked in the effective evidence view.

The JW Masai Mara overview was inaccessible to the research tool; its official Experiences page exposed the same named property's View Map link and supplies the coordinate source. Some Google destinations hit a consent wall; the already-exposed official link's numeric query is still traceable first-party pin evidence. Pin coordinates alone do not verify operating status, reserve boundaries, drive access or future affiliation. Existing Al Bustan, Deer Valley and Athenee disputes remain unchanged. Airport figures and all earlier optional unknowns are untouched.

Current coverage: **100 reviewed / 100 mapped / 0 unmapped**. Unknown locations remain a supported explicit pair of null values; future incomplete evidence must remain unknown. Runtime invalid bundles are withheld; the separate CLI validates the whole bundle and blocks release errors. Current ingestion adds 100 Source entities and 200 coordinate EvidenceClaims to the original 100 sources/1,017 claims. Raw prior-stage records are unchanged; as-of dates before 2026-10-13 keep their earlier unknowns.

## Geographic overview

The local basemap is Natural Earth **110m land**, acquired from the maintainer's public repository at commit `ca96624a56bd078437bca8184e78163e5039ad19`:

- [Upstream pinned GeoJSON](https://github.com/nvkelso/natural-earth-vector/blob/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_110m_land.geojson)
- [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/)

Natural Earth declares raster/vector data public domain and permits modification and redistribution without permission. We retain outer land rings, discard nongeometric metadata/interior holes, and project WGS84 coordinates into browser Mercator. `data/maps/land.json` is vendored with no remote-basemap dependency. Visible credit links Natural Earth despite credit being optional. `npm run validate:maps` verifies finite bounded geometry and reports its SHA-256. This coarse, small-scale physical outline omits many small islands and local features; it must not be used for navigation. No political boundary claims are drawn. Projection caps polar latitude for display only.

## Optional street detail

- [OpenStreetMap copyright / ODbL](https://www.openstreetmap.org/copyright)
- [OSMF standard-tile policy](https://operations.osmfoundation.org/policies/tiles/)
- [OSMF standard-tile licensing decision](https://blog.openstreetmap.org/2020/06/25/new-licence-for-the-standard-style-tiles-from-openstreetmap-org/)

OSM data is ODbL 1.0. Since July 2020 standard tiles are ODbL Produced Works, requiring visible attribution; do not confuse the older CC BY-SA tile license with current tiles or the documentation license. The overlay continuously shows linked **© OpenStreetMap contributors** attribution and ODbL/Produced Work context immediately beside the map. No OSM database is bundled or modified.

Only visible tiles are requested from `https://tile.openstreetmap.org/{z}/{x}/{y}.png` after explicit Load street map. Normal browser User-Agent, Referer and cache headers apply; the app sets no restrictive Referrer-Policy, cache bypass, custom UA or cache/prefetch code. There is no tile scraping, bulk fetch, offline tile package, automatic retry loop or background monitoring. Provider availability is best-effort, without SLA. Raster failure restores the local overview; lists, evidence, saved plans and backups are independent.

The browser discloses normal network metadata and the tile/coordinate area requested to OSM when the user opts in or opens its external map. Dates, prices, notes, status, certificates, account details and traveler preferences are never transmitted by this feature. No credentials or provider account.
