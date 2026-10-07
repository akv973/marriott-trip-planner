# Stage 1 — Data and Evidence Model

Implementation complete; final acceptance awaits remote PR checks, Pages deployment and live browser verification. Stage 2 is not authorized or implemented.

## Baseline and scope

Started from exact main commit `d01ef35da5e82e3c91d8081cc9cd9bf47f7d9532`; original Stage 0 commit remains in ancestry. Working branch: `stage-1-data-evidence`. React/TypeScript/Vite/Zod, Node 24, the lockfile and static Pages deployment architecture are preserved. Shell changes only update stage/catalog summary/next-stage copy. Navigation, styling, error fallback, planned capabilities and fragment reload behavior remain.

## Implemented

- Strict Property, Brand, Destination, Source, discriminated EvidenceClaim and separate editorial assessment schemas with inferred TypeScript types.
- Explicit unknowns, factual provenance, verified identity admission, reference and duplicate checks, date semantics and factual-snapshot consistency.
- Retained conflict groups, concealed-conflict rejection, validity-aware staleness with configurable thresholds and reproducible assessment dates.
- Shared developer health and validation CLI, supporting external JSON bundles and nonzero exits on structural errors; integrated into existing required CI checks.
- Independent synthetic fixtures and automated schema/integrity/evidence/health/CLI regression coverage. No later-stage engines or Property Explorer.
- Evidence/methodology/domain/seed documentation and ADR-007; ADR-004 marked implemented.

## Seed catalog and evidence, assessed 2026-10-07

| Metric | Result |
| --- | --- |
| Properties | 25 |
| Brands | 6: Ritz-Carlton, St. Regis, Luxury Collection, EDITION, JW Marriott, Autograph Collection |
| Countries/territories | 14 |
| Destinations | 24 |
| Property types | hotel, resort, safari-camp, safari-lodge |
| Experience coverage | city, safari, wildlife, beach, desert, mountain, ski, national-park access, food/culture, spa, golf, adventure |
| Sources / claims | 25 / 260 |
| High / Medium | 185 (71.15%) / 75 (28.85%) |
| Low / Unverified | 0 / 0 |
| Conflicting / stale production claims | 0 / 0; synthetic fixtures prove both behaviors |
| Schema errors / orphaned references | 0 / 0 |
| Duplicate IDs / slugs | 0 / 0 |
| Missing critical evidence | 0 |
| Valid / invalid records | 25 / 0 |
| Incomplete optional records | 25 |
| Missing coordinates / destination metadata | 25 / 0 |
| Editorial assessments | 1 limited desk review; ratings remain unknown |

See `docs/data-methodology/seed-catalog.md` for property selection, official naming decisions, sourcing and omitted optional research.

## Validation and delivery

Local installation, typecheck, lint, schema/reference/evidence validation, unit/integration/CLI regression tests and default/Pages production builds pass. Browser QA must be verified through CI and inspected screenshots. Local Chromium installation failed because the download was not a valid archive; this is an environment limitation, not a passing local browser result.

Final PR/commit/run/deployment URLs and test counts will be recorded after remote verification. Exact production URL: https://akv973.github.io/marriott-trip-planner/ .

## Known limitations

Optional details are intentionally sparse, all coordinates unknown, no exhaustive hotel encyclopedia or firsthand quality reviews. Source access is manual, not a live operational-status check. Confidence is maintainer judgment. Browser bundle includes validation and the small seed dataset. Required identity conflicts block admission; optional disputes are retained with unknown snapshots and maintainer warnings. No pricing, benefits engine, recommendation weights/ranking, trip logic, profile, watchlist, maps, dynamic Marriott requests or availability monitoring.

## Next stage

Recommended: Stage 2 — Property Explorer, only after explicit approval. STOP after Stage 1 completion report.
