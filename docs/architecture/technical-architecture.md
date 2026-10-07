# Technical architecture

## Static foundation

React and TypeScript render a static browser application built by Vite. The deployable artifact is `dist/`, hosted on GitHub Pages. Node 24 is the development and CI runtime, not a production server dependency. Dependency resolution is reproducible through `package-lock.json` and `npm ci`.

Zod is the runtime validation boundary. TypeScript types are inferred from schemas to avoid a second, inconsistent type definition. Current validation covers the foundation manifest and five deliberately empty collections. Stage 1 introduces domain schemas and evidence relationships; it must supersede the empty-collection guard.

## Boundaries

The UI consumes validated domain results. It may format values and manage view state, but it must not implement economic calculations, scoring, evidence resolution, or benefits precedence. The shell consumes a small manifest and contains no business engine.

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

Factual records must be schema-valid and referentially valid. Evidence has timestamps, confidence, source attribution, and conflict status where appropriate. Editorial judgments have rationale, review date, and methodology version. Stage 1 determines exact schemas and mandatory evidence fields.

## Recommendation design

Four layers: eligibility → trip fit → independent booking economics → deterministic explanation. Trip fit and redemption value must remain inspectable separately. An optional composite presentation cannot erase components or turn missing data into positive evidence. See ADR-005 for the scoring conflict in the brief.

## State and persistence

Stage 0 has no account or persisted traveler profile. Stage 7 will define a storage interface, versioned export envelope, schema validation on import, migration rules, and graceful quota/corruption handling. Traveler-specific state must not be built into static deployment artifacts.

## Navigation and Pages

The shell uses ordinary same-document anchors. Vite's `VITE_BASE_PATH` is `/` locally and `/marriott-trip-planner/` for project Pages. Stage 2 should choose a static-host-safe route strategy, documenting direct-link reload behavior; hash routing is a likely candidate. No router, 404 rewrite, or future deep-link behavior is claimed today.

## Failure handling

Invalid foundation data yields an honest error screen. Schema CLI failures exit nonzero and block CI. Later stages must retain valid partial records, show missing rates and conflicting evidence, and avoid substituting zero for unknown prices. A provider outage must not block manual planning.

## Delivery

Pull requests and main pushes execute the same required checks. The deploy job depends on successful validation and can run only on `main`. It receives limited Pages and OIDC permissions. Actions are pinned to full commit SHAs. Protected branch settings and Pages enablement must be configured at the repository; workflow files alone cannot enforce GitHub branch protection.

## Assets and accessibility

The shell uses system fonts, CSS, and original decorative SVG. It has a skip link, named navigation, semantic landmarks, heading hierarchy, visible keyboard focus, and responsive breakpoints. DOM integration tests verify the shell and link targets. Browser layout/contrast checks remain a separately reported verification task.
