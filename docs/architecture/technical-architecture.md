# Technical architecture

## Static foundation

React and TypeScript render a static browser application built by Vite. The deployable artifact is `dist/`, hosted on GitHub Pages. Node 24 is the development and CI runtime, not a production server dependency. Dependency resolution is reproducible through `package-lock.json` and `npm ci`.

Zod is the runtime validation boundary. TypeScript types are inferred from schemas to avoid a second, inconsistent type definition. Stage 1 validates the manifest and six domain collections, including relationships/evidence. Benefits remain empty. See ADR-007 and the data-methodology contracts.

## Boundaries

The UI consumes validated domain results. It may format values and manage view state, but it must not implement economic calculations, scoring, evidence resolution, or benefits precedence. The explorer consumes the validated catalog. Query/sort functions and factual evidence presentation live in `lib/catalog/`; UI components own form state and rendering only.

| Module | Future responsibility |
| --- | --- |
| Catalog | Curated properties, destinations, brands, evidence, health, and inspectable conflicts |
| Points | Independent cash/points economics, eligibility, certificates, and fifth-night-free |
| Scoring | Eligibility and trip fit, separately from booking economics |
| Benefits | Brand rules, property overrides, status, dated policy evidence |
| Trips | Stay chronology, points/cash totals, unknowns, and hotel changes |
| Storage | Local-first persistence behind a replaceable, versioned interface |
| Provider | Optional observations through an approved dynamic provider, after Stage 12 research |

No module in the future-responsibility table is implemented merely because its directory exists.

## Domain model plan

Separate entities will include Property, Brand, Destination, Airport, Source, EvidenceClaim, EditorialPropertyData, BenefitRule, PropertyBenefitOverride, CashRateObservation, AwardRateObservation, UserProfile, Certificate, Trip, TripStay, WatchTarget, RecommendationInput, and RecommendationResult.

Property identity and stable characteristics are distinct from date-sensitive affiliations, opening/closure states, fees, policies, availability, and prices. Effective views can derive a current value from evidence but must not erase older or conflicting claims. Official URLs are locators; they alone do not prove every field.

Factual records must be schema-valid and referentially valid. Evidence has timestamps, confidence, source attribution, and conflict status where appropriate. Editorial judgments have rationale, review date, and methodology version. Stage 1 implements strict schemas, typed claims and evidence admission; see `docs/data-methodology/catalog-model.md`.

## Recommendation design

Four layers: eligibility → trip fit → independent booking economics → deterministic explanation. Trip fit and redemption value must remain inspectable separately. An optional composite presentation cannot erase components or turn missing data into positive evidence. See ADR-005 for the scoring conflict in the brief.

## State and persistence

Stage 2 has no account or persisted traveler profile. Explorer view state lives in the URL only. Stage 7 will define a storage interface, versioned export envelope, schema validation on import, migration rules, and graceful quota/corruption handling. Traveler-specific state must not be built into static deployment artifacts.

## Navigation and Pages

Stage 2 uses hash routes: `#/explore` and `#/properties/<slug>`, with URLSearchParams inside the hash for search, filters, and sorting. GitHub Pages always receives the repository root document on direct reload. Native `#foundation` and `#roadmap` anchors remain supported. Unknown routes/slugs show a recoverable not-found screen. See ADR-008 and `property-explorer.md`. Vite's `VITE_BASE_PATH` remains `/` locally and `/marriott-trip-planner/` for project Pages. No new router dependency or Pages 404 rewrite is needed.

## Failure handling

Invalid foundation data yields an honest error screen. Schema CLI failures exit nonzero and block CI. Later stages must retain valid partial records, show missing rates and conflicting evidence, and avoid substituting zero for unknown prices. A provider outage must not block manual planning.

## Delivery

Pull requests and main pushes execute the same required checks. The deploy job depends on successful validation and can run only on `main`. It receives limited Pages and OIDC permissions. Actions are pinned to full commit SHAs. Protected branch settings and Pages enablement must be configured at the repository; workflow files alone cannot enforce GitHub branch protection.

## Assets and accessibility

The explorer uses system fonts, CSS, and original decorative SVG. It has a skip link, named navigation, semantic landmarks, heading hierarchy, visible keyboard focus, and responsive breakpoints. DOM integration tests verify queries, details, unknowns, conflicts, staleness, and recovery. Chromium E2E checks cover desktop/narrow explorer flows, layout, assets, direct-link reloads, keyboard interaction, and all 25 detail pages. Screenshot inspection is reported separately from automated assertions.

## Stage 3 comparison

Stage 3 adds `#/compare`, repeated `compare` slug parameters on all existing routes, pure 2–4 selection/row functions and shared evidence rendering. Facts and editorial remain separate. Costs, benefits and CPP are explicit unknowns/unavailable; no later engine exists. See ADR-009 and `property-comparison.md`. The manifest admits Stage 3 and rejects Stage 4. All six sourced catalog collections, benefit placeholder, dependencies and lockfile are unchanged.

## Stage 4 manual economics

Stage 4 adds `#/calculator`, standalone `lib/points/` validation/economics and dated primary-policy links. Null prices, fees, FX and balances are supported without substitution. Booking-value bands are independent from later hotel-fit scoring. See ADR-010 and `manual-points-calculator.md`. The manifest admits Stage 4 and rejects Stage 5. Catalog collections, benefits, dependencies and lockfile remain unchanged. Manual quotes are transient and cleared on reload; no integration or profile persistence is introduced.

## Stage 5 recommendations

Stage 5 adds `#/recommendations` and pure strict request/scoring functions in `lib/scoring/`. Eligibility, trip fit, existing points economics and structured explanations remain independently inspectable. Default/custom weights are versioned, unknown components retain weight and null values, and partial fit displays coverage/bounds. Quotes and preferences are transient; no trip or profile persistence is introduced. See ADR-011 and `recommendation-engine.md`. The manifest admits Stage 5 and rejects Stage 6; catalog collections, points business rules, dependencies and lockfile are unchanged.

## Stage 6 trips

Stage 6 adds `#/trips`, strict independent Trip/TripStay contracts and pure selected-booking totals in `lib/trips/`. Each stay delegates economics to the unchanged calculator. Unknown complete totals remain null alongside explicit known subtotals. Native currencies, manual USD conversion, weighted award redemption, whole-trip balance and chronology are inspectable. Trips and notes live in application memory across navigation and clear on reload. Stage 7 storage remains unimplemented. See ADR-012 and `trip-builder.md`. The manifest admits Stage 6 and rejects Stage 7; sourced catalog collections, earlier engines, dependencies and lockfile are unchanged.

## Stage 7 local profile

Stage 7 supersedes the earlier transient-only trip boundary with strict versioned local planner persistence behind a repository interface. Adds `#/profile`, manual status/balance/valuation/certificates/preferences and JSON backup/restore. Explicit inheritance flags keep trip manual overrides and unknowns distinct. Certificate planning delegates to a separate dated one-night assessment; the points/scoring engines and sourced catalog remain unchanged. The manifest admits Stage 7 and rejects Stage 8. See [local profile architecture](local-bonvoy-profile.md) and ADR-013. No elite benefit rules or authentication exist.

## Stage 8 effective benefits

Stage 8 admits the independent sourced benefit bundle and strict references, pure status/brand/property resolution and `#/benefits`. Details and comparison use saved status; transient previews do not change planner data. Missing conditions, stale rules and contradictions remain inspectable. Stage 7 saved schemas/engines and all 25 property records remain unchanged. Stage 9 is rejected. See [benefit architecture](elite-benefit-engine.md), ADR-014 and the 25-property audit.

## Stage 9 curated expansion

Stage 9 appends 75 reviewed properties in five batches to the existing models and benefit bundle, with no changes to earlier business engines or saved-planner contracts. Static expansion audit joins schema gates; baseline hashes, explicit conflict inventories and full-catalog browser checks prevent silent regressions. The manifest admits Stage 9 and rejects Stage 10. See [expansion architecture](catalog-expansion.md) and ADR-015.

## Stage 10 local watchlist

Adds `#/watchlist`, an independent strict WatchTarget contract in `lib/watchlist/`, explorer/detail saving and editable desired travel windows, nightly cash/points rates, currency, priority and notes. Targets never become observed quotes, catalog claims, scoring inputs or trip spending. Version-2 whole-planner backups include watchlist; strict version-1 import adds only an empty watchlist. Retains the original repository/key and draft/conflict/quota protections. Manifest admits Stage 10 and rejects Stage 11. See [watchlist architecture](watchlist.md) and ADR-016. No monitoring, external pricing, scraping, account integration or maps.

## Stage 11 optional maps

Adds a dated coordinate overlay, normal source/claim provenance and optional property/comparison/trip maps. Base catalog records and saved planner contracts remain unchanged. Geographic context uses vendored Natural Earth land, with deliberate optional OSM street detail, inspectable unknowns, ordered repeat visits and failure containment. Manifest admits Stage 11 and rejects Stage 12. See [maps architecture](maps.md), ADR-017 and [map sourcing/licensing](../data-methodology/map-sources.md).
