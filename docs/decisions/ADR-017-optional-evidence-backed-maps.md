# ADR-017: Optional maps with dated published pins

Status: Accepted within approved Stage 11.

## Decision

Use a separate, strict `data/maps/locations.json` bundle for the existing 100 properties. Each record stores a coordinate pair (or explicit nulls), the official property source URL, its published View Map coordinate link, review date, confidence, precision and notes. The dated ingestion overlay appends normal Source/EvidenceClaim entities and populates the existing Property latitude/longitude fields. Earlier raw catalog records and claims remain byte-for-byte intact; historical assessments before map review retain unknown coordinates. The snapshot is a published approximate property pin, not a surveyed entrance.

Use an optional, lazy SVG Mercator renderer with vendored Natural Earth 110m land for geographic context. Property details, comparison and the trip builder retain ordinary location lists. Maps open on request, have bounded zoom, button-based pan, fit/world views and a focus selector. Trip numbering follows saved order and retains repeat visits. Dashed connections join only adjacent known stops; they are neither routing nor travel feasibility. Unknown/conflicted/unverified coordinates are unplotted and remain listed.

Street detail is an explicit opt-in overlay of visible OpenStreetMap standard raster tiles. Requests follow HTTPS, normal browser HTTP caching/Referer and visible OSM attribution. No keys, SDK/CDN, geocoder, prefetch, bulk downloads, service worker caching or map provider account. Tile URLs carry only zoom/x/y, never dates, quotes, notes or profile data. An optional external coordinate link opens OSM separately.

## Failure and compatibility

Malformed optional location bundles cannot prevent raw property discovery; a strict CLI gate blocks shipping malformed records. Existing known coordinate values are not overwritten; conflicting additive evidence must fail admission and be reviewed. Coordinate conflicts/staleness retain ordinary evidence presentation. Missing/invalid map assets, renderer errors and tile failures are contained in the map panel. Lists, planning and persisted state remain available. Data and tile requests have timeouts and deliberate retries. An ES module chunk failure may require Reload page after connectivity returns; persisted valid plans survive it.

Map view state is transient. Saved planner schemas, key, v1 migration and v2 export/import do not change. No travel routes, distance/time estimates, pricing, monitoring, catalog expansion or Stage 12 work.

## Consequences

The bundled overview works without map-provider access once the app and local map asset load. Coarse coastlines omit some islands and are inappropriate for local navigation. Mercator latitude is capped at ±85.05112878 for rendering; source values remain unchanged. Colocated markers can overlap; the focus selector and numbered list keep every stop accessible. Raster service availability is best-effort and must remain optional. Tile provider can later be replaced independently, if separately approved.
