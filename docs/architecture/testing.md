# Testing and validation

## Stage 0 checks

| Command | Checks |
| --- | --- |
| `npm ci` | Lockfile-based dependency installation |
| `npm run typecheck` | Strict app, scripts, tests, and config TypeScript |
| `npm run lint` | ESLint and React rules, zero warnings |
| `npm run validate:schema` | Foundation manifest and deliberately empty collections |
| `npm run test:unit` | Malformed inputs, stage/version guards, unsupported data, duplicate identifiers |
| `npm run test:integration` | Shipped JSON → validation → React shell; empty state; real anchor targets; invalid-data fallback |
| `npm run catalog:health` | Explicit zero-property report with evidence assessment marked not performed |
| `npm run build` | Production bundle |

`npm run check` groups typecheck, lint, schema validation, both Vitest projects, and build. The CI workflow runs unit and integration suites separately to make failures easy to diagnose.

## Verification limits

jsdom checks document behavior and semantics; it cannot prove browser layout, paint, media-query behavior, contrast, or real network operation. Do not label it as E2E testing. Stage 0 has no explorer or planner flows, so Playwright is not installed solely to create placeholder passing tests. Add Playwright and browser CI in Stage 2 when meaningful user flows exist.

Production-base checks inspect built asset paths for both `/` and `/marriott-trip-planner/`. Local development requires a successful Vite startup. Visual/browser verification is reported separately; lack of an available approved preview path is a limitation, not a pass.

## Future regression matrix

The brief defines 15 stable scenarios: five-night points, four-night points, cash superior, points superior, missing award, missing cash, insufficient points, certificate, certificate top-off, property benefit override, stale source, conflicting evidence, incomplete property, multi-hotel trip, and missing optional data.

Create typed fixtures and independent expected results alongside each corresponding approved feature. Tests should verify substantive outcomes and edge cases rather than reproduce the implementation formula. Do not invent certificate limits, fifth-night-free eligibility, status guarantees, or fee waivers; verify policy with dated primary evidence first.

Stage 1 adds domain and referential validation. Stage 2 adds browser explorer flows. Stage 4 adds economics cases. Stage 5 adds deterministic recommendation integration. Stage 6 adds trip totals and incomplete-pricing behavior. Stages 7–8 add storage/certificate and benefits fixtures. Unimplemented cases are pending, not passing.
