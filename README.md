# Marriott Trip Planner

An independent, evidence-backed Marriott Bonvoy travel portfolio planner. **Current implementation: Stage 11 — Maps.** Browse the 100-property curated catalog, combine filters, sort, and open sourced detail pages. Select 2–4 properties for an aligned, sourced comparison. Assess manual cash/points quotes with transparent arithmetic. Generate deterministic, inspectable recommendations with separate eligibility, trip fit, booking economics and explanations. Build multi-hotel trips with manual cash/points choices, notes and inspectable complete or partial totals. Profile, trips and watch targets persist locally, with certificates, preferences and versioned JSON backup/restore. Effective benefits use saved status and dated official rules, with property precedence and inspectable unknowns. Optional property, comparison and trip maps show sourced locations and ordered geography.

## Run locally

Use Node.js 24 and npm. The lockfile is committed.

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`. The responsive explorer shows the validated catalog, explicit unknowns, factual evidence, and separate editorial notes. It requests no external hotel data, images, or fonts.

## Check and build

```bash
npm run check
npm run validate:catalog
npm run catalog:health -- --as-of 2026-10-07
```

Individual checks: `npm run typecheck`, `npm run lint`, `npm run validate:schema`, `npm run test:unit`, `npm run test:integration`, and `npm run build`. `npm test` runs Vitest in watch mode. `npm run preview` serves the production build on port 4173.

For GitHub project Pages:

```bash
VITE_BASE_PATH=/marriott-trip-planner/ npm run build
npm run preview -- --base /marriott-trip-planner/
```

Open `http://localhost:4173/marriott-trip-planner/`. Do not use `vite preview` as a production server. See the [deployment runbook](docs/architecture/deployment.md).

## Project boundaries

| Path | Responsibility |
| --- | --- |
| `app/` | React entrypoint, hash navigation, explorer, details, and responsive CSS |
| `components/` | Presentational building blocks |
| `data/` | Manifest; properties, brands, destinations, sources, claims and editorial data; dated official benefit rules and property reviews |
| `lib/validation/` | Strict Zod manifest/domain schemas |
| `lib/catalog/` | Validated ingestion, evidence health, query/sort functions, and evidence presentation |
| `lib/points/`, `lib/scoring/`, `lib/trips/` | Independent stay economics, recommendation layers and selected-booking trip aggregation |
| `lib/benefits/`, `lib/storage/` | Reserved later-stage boundaries |
| `types/` | Types inferred from runtime schemas |
| `scripts/` | Schema/reference validation and dated evidence health |
| `tests/` | Vitest unit, React/jsdom integration, and Chromium explorer flows |
| `docs/` | Governing brief, requirements, architecture, ADRs, data methodology, and stage records |
| `public/` | Original or permitted static assets; `.nojekyll` |

## Documentation

- [Governing project brief](docs/product/project-brief.md)
- [Product requirements](docs/product/requirements.md)
- [V1 non-goals](docs/product/v1-non-goals.md)
- [Technical architecture](docs/architecture/technical-architecture.md)
- [Deployment and repository setup](docs/architecture/deployment.md)
- [Testing and validation](docs/architecture/testing.md)
- [Data methodology](docs/data-methodology/evidence.md)
- [Architecture decisions](docs/decisions/README.md)
- [Stage 0 implementation record](docs/stages/stage-0.md)
- [Stage 1 domain contracts and health](docs/data-methodology/catalog-model.md)
- [Seed catalog research](docs/data-methodology/seed-catalog.md)
- [Stage 1 implementation record](docs/stages/stage-1.md)
- [Explorer behavior and URLs](docs/architecture/property-explorer.md)
- [Stage 2 implementation record](docs/stages/stage-2.md)
- [Comparison behavior and URLs](docs/architecture/property-comparison.md)
- [Stage 3 implementation record](docs/stages/stage-3.md)

## CI and deployment

`.github/workflows/ci.yml` runs installation, typecheck, lint, schema validation, unit tests, integration tests, catalog evidence health, the production build, and desktop/narrow Chromium explorer flows for pull requests and main-branch pushes. Only a successful main-branch validation job can upload and deploy the Pages artifact. A dependent job repeats browser checks against the live site and uploads screenshots and results. Deployment receives Pages write and OIDC permissions; pull-request checks have read-only repository permissions.

Source repository: [akv973/marriott-trip-planner](https://github.com/akv973/marriott-trip-planner). Live explorer: [GitHub Pages](https://akv973.github.io/marriott-trip-planner/). The original foundation commit `7a66c1228dc7aff73ca758b0761b8cbae14a3657` is preserved in the remote history. See the [Stage 0 record](docs/stages/stage-0.md) for observed runs, QA evidence, and limitations.

## Stage discipline

**Stage 12 — Dynamic Data Research is complete (documentation only).** The application remains Stage 11. The [assessment](docs/data-methodology/dynamic-data-research.md), [source register](docs/data-methodology/dynamic-data-sources.md), [ADR-018](docs/decisions/ADR-018-dynamic-data-research-gate.md) and [completion report](docs/stages/stage-12.md) recommend deferring Stage 13 integration until provider rights, coverage, semantics, reliability and budget are established and explicit approval is given. No provider is approved. The catalog contains 100 properties across six brands, six regions and 34 countries/territories, with 100 original catalog sources and 1,017 original claims. Stage 11 adds 100 coordinate sources and 200 claims in a dated 100-property evidence overlay; optional incompleteness is reported separately from validity. Validation cannot independently prove the truth of researched facts.

Hash URLs preserve comparison selections, search, filters, and sort order through reloads and property-detail round trips. See [explorer behavior](docs/architecture/property-explorer.md) for supported filters and unknown handling.

No Marriott credentials, scraping, undocumented endpoints, or dynamic pricing are used. This tool is not affiliated with Marriott International.

## Stage 4 calculator

Open `#/calculator`, use the navigation from a comparison, or choose “Calculate with your own rates” on a property detail. Enter comparable cash and award quotes, taxes, mandatory fees and cash still due on the award. Blank values remain unknown; explicit zero means confirmed no charge. Inspect the arithmetic, dated policy links, discount eligibility and configurable assessment thresholds. Non-USD quotes require manually entered FX for USD CPP. Rates are transient manual inputs, never catalog facts.

See [calculator architecture](docs/architecture/manual-points-calculator.md) and [Stage 4 report](docs/stages/stage-4.md). Stage 4 remains preserved. No live pricing is introduced. Stage 6/7 reuse this unchanged points engine; Stage 7 adds an independent certificate assessment and local profile assumptions.

## Stage 5 recommendations

Use `#/recommendations` for required constraints, preferred experiences, versioned configurable fit weights and optional manual property quotes. Sparse catalog ratings remain unknown; inspect components, coverage, possible score bounds and structured request/results JSON. Booking value and fit are separate. See [engine architecture](docs/architecture/recommendation-engine.md), [ADR-011](docs/decisions/ADR-011-recommendation-engine.md) and [Stage 5 report](docs/stages/stage-5.md). The recommendation engine remains unchanged; Stage 7 provides explicit application of supported saved preferences and quote assumptions.

## Stage 6 trips

Open `#/trips`, create a trip and add ordered hotel stays. Assign nights, select cash or points, enter manual quotes, record notes and inspect totals, partial subtotals, trip balance, chronology and structured JSON. Quotes invalidate when dates, nights, hotels, currencies or bases change. Stage 7 persists trips/notes and manual quote inputs in this browser. Balances and certificate plans are independent per trip. No live pricing exists. See [Trip Builder architecture](docs/architecture/trip-builder.md), [ADR-012](docs/decisions/ADR-012-trip-builder.md) and [Stage 6 completion report](docs/stages/stage-6.md). Stage 6 behavior is preserved except its explicitly superseded reload boundary.

## Stage 7 local profile

Open `#/profile` for status, balance, personal valuation, Free Night Awards and travel preferences. New trips use the live profile balance/valuation until those fields are edited; blank overrides stay unknown. Profile and trips persist on reload. Export a private version-1 JSON backup to reconstruct the planner in another browser; import validates and previews before explicit whole-planner replacement. Save failures/invalid drafts preserve the last valid copy and show a status. Certificate planning supports one-night entries and the current 25,000-point top-off cap without inventing availability or certificate CPP. Saved manual status now drives Stage 8 effective benefits; account status remains unverified. See [architecture](docs/architecture/local-bonvoy-profile.md), [ADR-013](docs/decisions/ADR-013-local-bonvoy-profile.md) and [Stage 7 report](docs/stages/stage-7.md).

## Stage 8 — Elite Benefit Engine

Sourced benefits for the existing 25 hotels, with manual saved status, separate status previews, inspectable precedence and official evidence. Unknown conditions and contradictory rules remain visible. See [architecture](docs/architecture/elite-benefit-engine.md), [property audit](docs/data-methodology/benefit-property-audit.md) and [stage report](docs/stages/stage-8.md). Stage 9 now expands its coverage; no live pricing or account integration.

## Stage 9 — Catalog Expansion

75 additions in five reviewed batches, with official factual sources, separate editorial selection rationales, 100 benefit reviews and preserved conflicts. Run `npm run catalog:expansion` to verify cumulative batch health, baseline preservation and coverage. See [research audit](docs/data-methodology/catalog-expansion.md), [architecture](docs/architecture/catalog-expansion.md), [ADR-015](docs/decisions/ADR-015-reviewed-catalog-expansion.md) and [stage report](docs/stages/stage-9.md). Original IDs and version-one saved planners remain compatible. Stage 10 now adds local watch targets.

## Stage 10 — Watchlist

Save properties from the explorer/details or create separate travel-window targets in `#/watchlist`. Dates, desired nightly cash/points rates, currency, priority and notes stay local. Blank values remain unknown; targets do not imply available prices or affect trip spending. Version-2 JSON backups contain profile, trips and watchlist; genuine version-1 backups/saved planners migrate with an empty watchlist and preserve prior fields. See [architecture](docs/architecture/watchlist.md), [ADR-016](docs/decisions/ADR-016-local-watchlist.md) and [stage report](docs/stages/stage-10.md). No automated monitoring. Stage 11 now adds optional maps.

## Stage 11 — Maps

Show geographic maps in property details, comparison and Trip Builder. Published official pins have normal dated source evidence. The list remains independent; unknown locations stay explicit. The bundled Natural Earth overview supports fit/world views and keyboard pan/zoom; OSM street detail is optional and recovers from provider failures. Trip numbering preserves saved order and repeat visits; connections are not travel routes. v1 planners and v2 backups remain compatible. Run `npm run validate:maps`. See [architecture](docs/architecture/maps.md), [licensing/sourcing](docs/data-methodology/map-sources.md), [ADR-017](docs/decisions/ADR-017-optional-evidence-backed-maps.md) and [stage report](docs/stages/stage-11.md).

## Stage 12 — Dynamic Data Research

Research assesses cash and award support separately, access/costs, permitted use, freshness, reliability, failure modes, opening-change evidence and maintenance. [Full findings](docs/data-methodology/dynamic-data-research.md) retain untested catalog coverage and unresolved rights explicitly. Manual planning remains the recommended fallback. No application or catalog change, provider, scraper, monitoring or account integration. Stage 13 has not begun.
