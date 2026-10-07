# Stage 1 domain model and production admission

Schemas live in `lib/validation/catalog.ts`; types in `types/catalog.ts` are inferred from Zod. Every entity is strict: unknown keys fail rather than disappear. `loadCatalog` exposes typed data only when the complete catalog passes schema, relationship, and factual snapshot checks. `assessCatalog` retains partial parsed data for developer diagnostics; callers must check success before production use.

| Entity | Responsibility | Relationships |
| --- | --- | --- |
| Property | Stable identity and reviewed factual snapshot | Brand and Destination IDs |
| Brand | Brand identity without benefit assumptions | Source IDs |
| Destination | Locality/island/area, country and broad region | Source IDs |
| Source | Reusable provenance, publisher, constrained type, HTTPS URL and access date | Referenced by claims and metadata |
| EvidenceClaim | Typed subject/value with observation, validity, verification, confidence and dispute status | Property and optional Source IDs; brand values also reference Brand |
| EditorialPropertyAssessment | Opinion, reviewer, rationale, review date and methodology version | Property ID |

## Required versus optional

Property admission requires `id`, `slug`, `name`, `brandId`, `destinationId`, `city`, `country`, and `region`. City means the official page's locality, including island or safari-area names. Country is an uppercase ISO alpha-2 code; the schema enforces its two-letter shape. Region is one of six broad geographic groupings; Cayman Islands is grouped in North America. Destination and property country/region must agree. IDs use lowercase hyphenated strings, are globally unique, and use entity prefixes in shipped data. Slugs are unique within their entity collection, allowing separate future route namespaces.

Critical evidence subjects are **name, brandId, city, and country**. Each requires applicable, non-null, sourced, verified evidence matching the snapshot. A source URL alone does not verify all fields. Other known snapshot values also require matching evidence; missing optional facts do not require claims. Brand and Destination metadata require Source IDs.

Optional property fields: official URL, Marriott code, administrative area, property type, coordinates, nearest airport and distance, opening/renovation year, room count, resort and destination-property flags, and experience tags. Both omission and explicit `null` mean unknown. Known false is distinct from unknown. Coordinates must be supplied together and in range; known room counts must be positive integers. Airport distance can itself be unknown. Hotel opening year is distinct from building construction. Official URLs must be Marriott/brand locators; arbitrary source links live in Source entities.

An unsupported known optional value fails admission; a null optional value does not. Optional research can be removed without crashing ingestion. Benefits, pricing, profiles, ranking, recommendations and trips are not Stage 1 engines. The benefits collection remains empty and guarded.

## Facts versus editorial assessments

Property rejects service/hardware scores and other editorial fields. Editorial assessments require `kind: editorial`, author, rationale, reviewed date, methodology version, and explicit traveler/strength/weakness arrays. Ratings and stay lengths are optional. Their schema is not a recommendation engine. The single seed assessment is a limited desk review of Dove Mountain's planning context with all quality scores and stay lengths unknown; it supplies no firsthand service judgment or upgrade prediction.

## Catalog-health methodology

`npm run validate:catalog` and `npm run catalog:health` share one ingestion/reporting path. Both support `--as-of YYYY-MM-DD` and `--input path/to/bundle.json` after npm's `--`. `npm run validate:schema` checks manifest and catalog before CI tests/build/deployment.

```bash
npm run validate:catalog -- --as-of 2026-10-07
npm run catalog:health -- --as-of 2026-10-07
npm run validate:catalog -- --input /tmp/catalog.json --as-of 2026-10-07
```

| Metric | Definition |
| --- | --- |
| Total/valid/invalid records | Raw / schema-valid / schema-invalid property rows; referential errors are separate and still block admission |
| Complete/incomplete | Valid properties with every tracked optional top-level field known / at least one unknown; breadth of research, not permission to enter production |
| Schema errors | Individual Zod issues, not number of bad entities |
| Orphaned references | Each missing Brand, Destination, Source, Property, or evidence brand-value reference |
| Duplicate IDs/slugs | Each repeated ID globally / repeated slug within a collection |
| Missing critical evidence | Each property/critical subject without applicable sourced verified matching evidence |
| Missing optional evidence | Known noncritical values without matching verified evidence; source them or set unknown |
| Missing coordinates | Valid properties with unknown coordinate pair |
| Missing destination metadata | Valid properties whose destination is absent; malformed destinations also cause schema errors |
| Conflicting subjects/claims | Active disputed or disagreeing property/subject groups / distinct claim IDs in those groups |
| Stale evidence | Active known claims whose age strictly exceeds subject threshold; report includes claim IDs |
| Unverified claims | All valid claims labeled Unverified, including explicit unknown observations |
| Confidence percentages | Counts divided by all schema-valid claims, including historical and unknown claims, rounded to two decimals; empty denominators yield null |

Structural errors, malformed dates/values, broken references, duplicates, missing critical evidence, unsupported snapshots and concealed conflicts cause nonzero CLI exit and block CI. Optional unknowns, stale evidence, explicit unresolved optional conflicts and unverified optional claims are review warnings. Critical identity conflicts block admission. Optional conflicted snapshots stay unknown. Historical non-overlapping claims remain available but do not count as current conflict/stale evidence. Serious unresolved disputes require review before later bulk expansion.

Every report records `asOf`. CLI defaults to today's UTC date; tests pin it. Source access, observation, verification and editorial review cannot be after assessment date. Future `validFrom` is allowed but is not current evidence. Completeness measures tracked optional top-level property fields; it excludes future-stage benefits, rates and recommendations and does not assert that all subfields of a known airport object are complete.
