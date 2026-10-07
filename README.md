# Marriott Trip Planner

An independent, evidence-backed Marriott Bonvoy travel portfolio planner. **Current implementation: Stage 0 foundation only.** No hotel catalog, pricing calculator, recommendations, account connection, or local profile is implemented yet.

## Run locally

Use Node.js 24 and npm. The lockfile is committed.

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`. The responsive shell describes the planner, shows an explicit empty catalog, and labels future capabilities as planned. It requests no external hotel data, images, or fonts.

## Check and build

```bash
npm run check
npm run catalog:health
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
| `app/` | React entrypoint, shell, and responsive CSS |
| `components/` | Presentational building blocks |
| `data/` | Foundation manifest; empty property, brand, destination, benefit, and source collections |
| `lib/validation/` | Zod foundation validation |
| `lib/catalog/` | Validated data loading |
| `lib/points/`, `lib/scoring/`, `lib/trips/`, `lib/benefits/`, `lib/storage/` | Reserved module boundaries, with no domain implementation yet |
| `types/` | Types inferred from runtime schemas |
| `scripts/` | Schema validation and empty-catalog health commands |
| `tests/` | Vitest unit, React/jsdom integration, and Chromium shell checks |
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

## CI and deployment

`.github/workflows/ci.yml` runs installation, typecheck, lint, schema validation, unit tests, integration tests, catalog foundation health, the production build, and desktop/narrow Chromium shell checks for pull requests and main-branch pushes. Only a successful main-branch validation job can upload and deploy the Pages artifact. A dependent job repeats browser checks against the live site and uploads screenshots and results. Deployment receives Pages write and OIDC permissions; pull-request checks have read-only repository permissions.

Source repository: [akv973/marriott-trip-planner](https://github.com/akv973/marriott-trip-planner). Live shell: [GitHub Pages](https://akv973.github.io/marriott-trip-planner/). The original foundation commit `7a66c1228dc7aff73ca758b0761b8cbae14a3657` is preserved in the remote history. See the [Stage 0 record](docs/stages/stage-0.md) for observed runs, QA evidence, and limitations.

## Stage discipline

The next stage is **Stage 1 — Data and Evidence Model**. It requires explicit approval. Stage 0 validation guards intentionally empty collections; it does not validate hotel facts. A zero-property health report is not evidence of a researched catalog.

No Marriott credentials, scraping, undocumented endpoints, or dynamic pricing are used. This tool is not affiliated with Marriott International.
