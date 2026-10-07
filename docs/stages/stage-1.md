# Stage 1 — Data and Evidence Model

Status: **PASS. Stage 1 is complete and ready for Stage 2 review.** Stage 2 is not authorized or implemented.

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

| Check | Result |
| --- | --- |
| Lockfile installation | PASS locally and remotely |
| Typecheck / lint | PASS locally and remotely |
| Manifest/schema/reference/evidence validation | PASS locally and remotely |
| Unit tests | 60/60 PASS |
| Integration tests, including external-bundle CLI/exit behavior | 7/7 PASS |
| Catalog health | PASS; optional gaps explicitly reported |
| Default and Pages-base production builds | PASS |
| PR production-preview browser checks | 4/4 PASS |
| Main production-preview browser checks | 4/4 PASS |
| Live Pages browser checks | 4/4 PASS; no skipped, unexpected or flaky tests |
| Desktop/narrow visual inspection | PASS; PR and live screenshots inspected |
| Live browser navigation and fragment reload | PASS |
| Live HTML/JS/CSS HTTP status and build-byte match | All 200, all byte-identical |

Local Chromium installation failed because the download was not a valid archive. This is an environment limitation; local Playwright execution is not claimed as passing. GitHub's Chromium installation, production-preview browser suite and live browser suite all succeeded. All required acceptance checks are met remotely.

## Repository and deployment evidence

- Implementation branch: `stage-1-data-evidence`.
- Implementation commit: `3ba287b3303aceddfa3c52f50c82f021a77932e4`.
- Implementation PR: https://github.com/akv973/marriott-trip-planner/pull/3 — merged after successful checks and screenshot inspection.
- PR checks: https://github.com/akv973/marriott-trip-planner/actions/runs/37571332740 — SUCCESS against the reviewed implementation head.
- PR browser evidence: https://github.com/akv973/marriott-trip-planner/actions/runs/37571332740/artifacts/11460454503 .
- Verified implementation main/merge commit: `8ab5cba38adf3b104fcab4e99789397c58c99760`.
- Main CI, Pages deployment and live QA: https://github.com/akv973/marriott-trip-planner/actions/runs/37571497449 — SUCCESS, exact source SHA above.
- Live screenshot/results evidence: https://github.com/akv973/marriott-trip-planner/actions/runs/37571497449/artifacts/11460723341 .
- Exact live Pages URL: https://akv973.github.io/marriott-trip-planner/ .

The successful main run gates artifact upload behind all required checks, deploys that Pages artifact and then repeats live browser checks. Independent live downloads matched the locally verified Pages build byte for byte. SHA-256: HTML `9729bc494437fd16ed8d7735e8a8820166f9d2337b97c3f9519da3f589bfb186`; JS `a75742b07eebbf05f34e36b1fd0bf24807c3747b3c3b2ba2dd95b3cd65a2d6a5`; CSS `59189c02bfc8e698128ff71e22750be50503cef60cc2a8dfb6d815d8c003ca2b`.

The shell shows Stage 1 and 25 curated properties, preserves all three planned roadmap capabilities, loads assets without application console errors, fits desktop/narrow viewports, and preserves anchor navigation/direct-fragment reload. Full-page screenshots were inspected rather than treating DOM assertions as visual QA. The managed cloud browser logged an unrelated extension metadata error from a chrome-extension URL, with no application-origin error.

This completion record documents the verified application commit before a documentation-only completion PR. The final response records the final main SHA and its successful CI/deployment run; a commit cannot embed its own SHA without changing it. The documentation-only completion PR changes no app/data/contracts/tests and undergoes the same complete remote gates.

## Known limitations

No unresolved application, catalog-structure, CI or Pages issue remains. Optional details are intentionally sparse, all coordinates unknown, no exhaustive hotel encyclopedia or firsthand quality reviews. Source access is manual, not a live operational-status check. Confidence is maintainer judgment. Browser bundle includes validation and the small seed dataset. Required identity conflicts block admission; optional disputes are retained with unknown snapshots and maintainer warnings. No pricing, benefits engine, recommendation weights/ranking, trip logic, profile, watchlist, maps, dynamic Marriott requests or availability monitoring.

Narrow QA uses Chromium at 390×844, not a physical phone; Safari/Firefox and a full accessibility audit were not performed. Branch protection remains unconfigured as documented in Stage 0; the existing workflow still gates Pages deployment. GitHub screenshot artifacts have retention limits.

## Next stage

Recommended: **Stage 2 — Property Explorer**, only after explicit approval.

**Stage 1 is complete and ready for Stage 2 review. STOP. Do not begin Stage 2.**
