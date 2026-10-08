# Testing and validation

## Current checks (Stage 3 — Property Comparison)

| Command | Checks |
| --- | --- |
| `npm ci` | Lockfile-based dependency installation |
| `npm run typecheck` | Strict app, scripts, tests, and config TypeScript |
| `npm run lint` | ESLint and React rules, zero warnings |
| `npm run validate:schema` | Manifest, domain schemas, relationships and evidence admission |
| `npm run test:unit` | Malformed inputs, stage/version guards, unsupported data, duplicate identifiers |
| `npm run test:integration` | Shipped catalog JSON → schemas/references/evidence → explorer/detail UI; sources, unknowns, conflict/stale fixtures; invalid-data fallback |
| `npm run catalog:health` | Dated health, optional gaps, conflicts, staleness and confidence denominators |
| `npm run build` | Production bundle |
| `npm run test:browser` | Chromium desktop/narrow explorer, combined filters, sorting, details, history/reloads, keyboard, all 25 pages, assets and overflow |

`npm run check` groups typecheck, lint, schema validation, both Vitest projects, and build. The CI workflow runs unit and integration suites separately to make failures easy to diagnose.

## Verification limits

jsdom checks document behavior and semantics; it cannot prove browser layout, paint, media-query behavior, contrast, or real network operation. Do not label it as E2E testing.

CI installs Chromium and runs eight explorer flows at each of 1366×900 and 390×844 (16 tests) against the production preview. Flows include all 25 direct detail pages, combined filters/search/sorting, unknowns and sources, not-found recovery, keyboard interaction, native history and detail/fragment reloads. The preview and build must both use `/marriott-trip-planner/`. Successful main runs deploy Pages, then repeat all 16 checks against the public live URL. The `local-explorer-browser-qa` and `live-explorer-browser-qa` artifacts contain JSON results, full-page explorer/filtered/detail screenshots and traces on failure. Inspect screenshots separately before claiming visual QA. A Chromium viewport check is not physical-device or cross-browser testing.

To reproduce the production preview checks:

```bash
npx playwright install --with-deps chromium
VITE_BASE_PATH=/marriott-trip-planner/ npm run build
npm run test:browser
```

To inspect an already deployed explorer:

```bash
PLAYWRIGHT_BASE_URL=https://akv973.github.io/marriott-trip-planner/ npm run test:browser
```

Production-base checks inspect built asset paths for both `/` and `/marriott-trip-planner/`. Local development requires a successful Vite startup. Visual/browser verification is reported separately; lack of an available approved preview path is a limitation, not a pass.

## Future regression matrix

The brief defines 15 stable scenarios: five-night points, four-night points, cash superior, points superior, missing award, missing cash, insufficient points, certificate, certificate top-off, property benefit override, stale source, conflicting evidence, incomplete property, multi-hotel trip, and missing optional data.

Create typed fixtures and independent expected results alongside each corresponding approved feature. Tests should verify substantive outcomes and edge cases rather than reproduce the implementation formula. Do not invent certificate limits, fifth-night-free eligibility, status guarantees, or fee waivers; verify policy with dated primary evidence first.

Stage 1 implements domain and relationship checks, independent unknown/conflict/stale fixtures, deterministic health and production ingestion. Stage 2 implements browser explorer flows. Stage 4 adds economics cases. Stage 5 adds deterministic recommendation integration. Stage 6 adds trip totals and incomplete-pricing behavior. Stages 7–8 add storage/certificate and benefits fixtures. Unimplemented cases are pending, not passing.

## Stage 3 comparison coverage

Six comparison scenarios run at each desktop/narrow viewport (12 additional tests; 28 combined). They cover selection from explorer/details, query-preserving return links, reload/history, 2/3/4 aligned columns, source disclosures, unknown booking values, scroll containment, four-property capacity, replacement/removal/clear, and invalid/duplicate/oversized URL recovery. Comparison screenshots are included in the existing browser artifacts. Unit/DOM tests additionally cover pure selection/URL rules, Stage 4 rejection, unknown/zero/empty editorial values and preserved conflicted/stale/unverified/historical factual evidence.

## Stage 4 economics coverage

Eight canonical economics fixtures plus discount, unknown/zero/invalid, currency, threshold and route boundaries are covered by the new unit suite. Six new DOM flows validate manual pricing and source disclosures. Four new browser scenarios run at each desktop/narrow viewport (eight additional; 36 combined). They cover transparent five-night assessment, unknown/invalid/comparability recovery, variable/total/FX modes and context/history/reload. The browser artifacts include `calculator-filled.png` and `calculator-result.png` for both viewports. Inspect these before claiming visual QA. Stage 5–8 behavior remains pending as documented in `manual-points-calculator.md`.
