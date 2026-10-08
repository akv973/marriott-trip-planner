# Marriott Trip Planner

An independent, evidence-backed Marriott Bonvoy travel portfolio planner. **Current implementation: Stage 4 — Manual Points Calculator.** Browse the existing 25-property catalog, combine filters, sort, and open sourced detail pages. Select 2–4 properties for an aligned, sourced comparison. Assess manual cash/points quotes with transparent arithmetic. Hotel-fit recommendations, trips, profiles, and maps remain planned.

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
| `data/` | Manifest; properties, brands, destinations, sources, claims and editorial data; empty benefits |
| `lib/validation/` | Strict Zod manifest/domain schemas |
| `lib/catalog/` | Validated ingestion, evidence health, query/sort functions, and evidence presentation |
| `lib/points/`, `lib/scoring/`, `lib/trips/`, `lib/benefits/`, `lib/storage/` | Reserved module boundaries, with no domain implementation yet |
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

The next stage is **Stage 5 — Recommendation Engine**, only after explicit approval. The unchanged Stage 1 catalog contains 25 properties across six brands and 14 countries/territories, 25 sources and 260 claims. Coordinates remain unknown; optional incompleteness is reported separately from validity. Validation cannot independently prove the truth of researched facts.

Hash URLs preserve comparison selections, search, filters, and sort order through reloads and property-detail round trips. See [explorer behavior](docs/architecture/property-explorer.md) for supported filters and unknown handling.

No Marriott credentials, scraping, undocumented endpoints, or dynamic pricing are used. This tool is not affiliated with Marriott International.

## Stage 4 calculator

Open `#/calculator`, use the navigation from a comparison, or choose “Calculate with your own rates” on a property detail. Enter comparable cash and award quotes, taxes, mandatory fees and cash still due on the award. Blank values remain unknown; explicit zero means confirmed no charge. Inspect the arithmetic, dated policy links, discount eligibility and configurable assessment thresholds. Non-USD quotes require manually entered FX for USD CPP. Rates are transient manual inputs, never catalog facts.

See [calculator architecture](docs/architecture/manual-points-calculator.md) and [Stage 4 report](docs/stages/stage-4.md). Stop before Stage 5; no live pricing, scoring, certificates, trips or profile persistence are introduced.
