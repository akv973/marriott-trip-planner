# Testing and validation

## Current checks (Stage 1 preserving the Stage 0 shell)

| Command | Checks |
| --- | --- |
| `npm ci` | Lockfile-based dependency installation |
| `npm run typecheck` | Strict app, scripts, tests, and config TypeScript |
| `npm run lint` | ESLint and React rules, zero warnings |
| `npm run validate:schema` | Manifest, domain schemas, relationships and evidence admission |
| `npm run test:unit` | Malformed inputs, stage/version guards, unsupported data, duplicate identifiers |
| `npm run test:integration` | Shipped catalog JSON → schemas/references/evidence → React shell summary; real anchor targets; invalid-data fallback |
| `npm run catalog:health` | Dated health, optional gaps, conflicts, staleness and confidence denominators |
| `npm run build` | Production bundle |
| `npm run test:browser` | Chromium desktop/narrow shell loading, assets, console errors, overflow, navigation, and direct-fragment reloads |

`npm run check` groups typecheck, lint, schema validation, both Vitest projects, and build. The CI workflow runs unit and integration suites separately to make failures easy to diagnose.

## Verification limits

jsdom checks document behavior and semantics; it cannot prove browser layout, paint, media-query behavior, contrast, or real network operation. Do not label it as E2E testing. Stage 0 browser checks cover only the implemented shell. They exposed an actual initial-fragment reload defect and provide regression coverage for that fix. Explorer and planner flows remain unimplemented and are not counted as passing.

CI installs Chromium and runs four shell checks at 1366×900 and 390×844 against the production preview. The preview and build must both use `/marriott-trip-planner/`; a mismatched preview base can return HTML or 404 for bundled assets. Successful main runs deploy Pages, then repeat all four checks against the public live URL. The `local-shell-browser-qa` and `live-shell-browser-qa` artifacts contain JSON results, full-page screenshots, and traces on failure. Inspect screenshots separately before claiming visual QA. A Chromium viewport check is not physical-device or cross-browser testing.

To reproduce the production preview checks:

```bash
npx playwright install --with-deps chromium
VITE_BASE_PATH=/marriott-trip-planner/ npm run build
npm run test:browser
```

To inspect an already deployed shell:

```bash
PLAYWRIGHT_BASE_URL=https://akv973.github.io/marriott-trip-planner/ npm run test:browser
```

Production-base checks inspect built asset paths for both `/` and `/marriott-trip-planner/`. Local development requires a successful Vite startup. Visual/browser verification is reported separately; lack of an available approved preview path is a limitation, not a pass.

## Future regression matrix

The brief defines 15 stable scenarios: five-night points, four-night points, cash superior, points superior, missing award, missing cash, insufficient points, certificate, certificate top-off, property benefit override, stale source, conflicting evidence, incomplete property, multi-hotel trip, and missing optional data.

Create typed fixtures and independent expected results alongside each corresponding approved feature. Tests should verify substantive outcomes and edge cases rather than reproduce the implementation formula. Do not invent certificate limits, fifth-night-free eligibility, status guarantees, or fee waivers; verify policy with dated primary evidence first.

Stage 1 implements domain and relationship checks, independent unknown/conflict/stale fixtures, deterministic health and production ingestion. Stage 2 adds browser explorer flows. Stage 4 adds economics cases. Stage 5 adds deterministic recommendation integration. Stage 6 adds trip totals and incomplete-pricing behavior. Stages 7–8 add storage/certificate and benefits fixtures. Unimplemented cases are pending, not passing.
