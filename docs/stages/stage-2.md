# Stage 2 — Property Explorer

Status: **PASS. Stage 2 is complete and ready for Stage 3 review.** Stage 3 is not authorized and has not begun.

## Baseline and scope

Started from exact main commit `cf7847b4014180fb99e9a539447407fc52948374`. Implementation branch: `stage-2-property-explorer`. The approved project brief, React/TypeScript/Vite/Zod architecture, Node 24, dependencies and lockfile are preserved. All six Stage 1 catalog collections are unchanged: no expansion, research updates, new hotel facts or editorial ratings.

Stage 2 implements only the grid, search, filters, sorting, details, responsive layout and meaningful URLs required by the brief. No maps, comparison, saved targets, trips, profile/storage, pricing/economics, recommendations, benefits engine, dynamic requests or monitoring. Future capabilities are labeled Planned.

## Implemented

- Responsive grid for all 25 properties, with recorded geography, brand, setting tags, type, confidence and verification dates. System fonts and original decorative SVG; no hotel photography or external font/image requests.
- Explicit word-based, case/diacritic-insensitive search over identity, geography, brand, Marriott code, type and setting tags.
- Ten AND-composed facets: destination, country/territory, region, brand, property type, experience, resort designation, destination-property designation, opening year and renovation year. Individual removal, reset and recoverable zero-result states.
- Six deterministic sorts: name ascending/descending, brand, destination, newest opening and newest renovation. Unknown years stay last; no hotel-quality ranking or recommendation scores.
- Slug-based details with factual confidence, verification dates, source title/link/type/publisher/access dates, claim values, observation/validity dates, applicability, disputes, staleness and notes. Unknown and unavailable prices remain explicit; no zero substitutes or operation inferred from a listing.
- Separate editorial panel with rationale, author, review date, methodology and clearly editorial ratings/stay length. The one desk review retains unknown scores/stay length; other properties explicitly lack assessments.
- Pages-safe hash URLs retaining search/filter/sort through detail/return links, direct links, reloads and native history. Informational anchors remain. Unknown paths/slugs recover visibly; unsupported filters remain removable and do not silently broaden results.
- Named controls, semantic landmarks, skip link, page-transition focus, keyboard search/navigation and native disclosures.
- Pure query/sort and evidence-view functions outside components. Whole-catalog admission and error fallback preserved; manifest supports Stage 2 and rejects Stage 3.
- ADR-008 and updated architecture, explorer behavior, testing, deployment, requirements, README and execution guidance.

See `docs/architecture/property-explorer.md` for exact query, unknown, evidence and URL semantics.

## Catalog preservation, assessed 2026-10-07

| Metric | Result |
| --- | --- |
| Properties / brands / destinations / countries-territories | 25 / 6 / 24 / 14, unchanged |
| Sources / evidence claims | 25 / 260, unchanged |
| High / Medium confidence | 185 (71.15%) / 75 (28.85%), unchanged |
| Low / Unverified claims | 0 / 0 |
| Valid / invalid records | 25 / 0 |
| Schema / reference / duplicate / critical-evidence errors | 0 |
| Stale / conflicting production claims | 0 / 0 |
| Optional incomplete records / missing coordinates | 25 / 25, deliberately retained |
| Editorial assessments | 1 desk review; no invented ratings |

Independent synthetic fixtures verify optional omissions, false/zero versus unknown, retained conflicts without a factual winner, stale values with dates/refresh warnings, unverified claims and non-applicable historical claims. Verified evidence is not mislabeled as unverified merely because its snapshot is unknown. No synthetic fixture is in production data.

## Acceptance and validation

| Criterion / check | Result |
| --- | --- |
| Filters combine correctly | PASS: search/facets use AND; incompatible combinations recover through reset/removal |
| Missing data does not break pages | PASS: minimal optional fixture, shipped data and all 25 direct detail pages |
| URLs support meaningful navigation | PASS: query state, direct detail reload, return context, back/forward, not-found recovery and legacy anchors |
| Desktop and mobile layouts work | PASS: Chromium 1366×900 and 390×844; grid/overflow assertions and screenshot inspection |
| End-to-end explorer tests | 16/16 preview and 16/16 live PASS; no skipped/unexpected/flaky tests |
| npm ci | PASS locally and in CI |
| Typecheck / lint / schema-reference-evidence checks / health | PASS locally and in CI |
| Unit / integration tests | 77/77 and 13/13 PASS |
| Default / Pages-base production builds | PASS |
| git diff --check | PASS |
| Independent live interactions | PASS: search → Mereshi detail → source disclosure → reload → return to searched collection |
| Live HTML/JS/CSS status and byte match | All HTTP 200 and byte-identical to the verified Pages-base build |

Eight browser scenarios run at both viewports. One scenario opens all 25 detail URLs per viewport; this is part of the 16 tests, not counted as extra tests. Checks cover assets, app console errors, combined filters, sorting, unknowns, sources, recovery, keyboard navigation, history and reloads. Explorer, filtered results, Mereshi and Dove Mountain screenshots were inspected. Visual review caught and corrected mobile hero spacing and an offscreen skip-link artifact before merge; updated screenshots and tests passed.

Local Chromium download was truncated/not a valid ZIP, so local E2E execution is not claimed as passing. CI installed Chromium and ran both full suites successfully. The browser fixture loader was corrected for Node 24, and a test assertion now checks recorded kilometer conversion provenance rather than an unstored miles string. Final tests do not skip app behavior. The managed browser logged unrelated chrome-extension metadata errors; no application-origin errors. Clean CI Chromium console/asset checks passed.

## Repository and deployment evidence

- Final implementation head: `5c29881d5693efc228ca7dab1d478810c29ef8cb`.
- Implementation PR: https://github.com/akv973/marriott-trip-planner/pull/5 — merged after passing checks and visual inspection.
- Final PR CI: https://github.com/akv973/marriott-trip-planner/actions/runs/37701696628 — SUCCESS at the reviewed head.
- PR screenshots/results: https://github.com/akv973/marriott-trip-planner/actions/runs/37701696628/artifacts/11517563396 .
- Verified application main/merge commit: `9a270abd85688988c3d0fd705065ec072b16d6bf`.
- Main CI / Pages / live QA: https://github.com/akv973/marriott-trip-planner/actions/runs/37702446215 — Required checks, Deploy GitHub Pages and Live browser QA all SUCCESS for that SHA.
- Main preview evidence: https://github.com/akv973/marriott-trip-planner/actions/runs/37702446215/artifacts/11517793248 .
- Live screenshots/results: https://github.com/akv973/marriott-trip-planner/actions/runs/37702446215/artifacts/11518765497 .
- Exact deployed URL, confirmed in deployment output and live browser: https://akv973.github.io/marriott-trip-planner/ .

Independent live bytes matched the verified build. SHA-256: HTML `e36f7784b9cbca2f5de3e45fc0b3fb57d12c71c71751db2a710c87fffeda4be3`; JavaScript `3cafe30fb776e0268c883b5377796b1c702f944b89483e811fb8264a08f5bb0a`; CSS `5c365e7cf3074dd92ce30def44e348cd2fca48a562ce7a29ad8da71c7e9a395e`. Assets: `index-VCP1-CwB.js`, `index-DukThZ4S.css`.

This report records the verified app commit before a documentation-only completion PR. That PR changes only this report and runs the same gates. A commit cannot embed its own SHA; the final chat report records the final main SHA and successful CI/deployment run.

## Known limitations

No unresolved app, catalog-structure, CI or deployment issue remains. Optional data is sparse; all coordinates/current operating statuses are unknown. Prices, fees and benefits are not researched/calculated in this stage. Sources reflect manual dated review, not live verification. Setting tags are sourced classifications, not quality/amenity guarantees; editorial notes are desk research.

Facets are single-select with exact years; search uses literal words, not synonyms. Unsupported luxury/benefit/quality filters are omitted. URLs are shareable; form drafts, disclosures and scroll position are not persisted. The browser bundle includes the small catalog/validation code (about 484 kB JavaScript, 116 kB gzip). Narrow QA is a Chromium viewport, not a physical phone. Safari/Firefox, screen-reader behavior and a full accessibility audit were not performed. Branch protection remains unconfigured as recorded in Stage 0; the workflow gates Pages deployment. GitHub browser artifacts have retention limits.

## Next stage and stop

Recommended: **Stage 3 — Property Comparison**, approximately 2–4 properties with aligned metrics, explicit unavailable values, clear entry/exit and responsive comparison tests. Separate explicit approval is required.

**Stage 2 is complete and ready for Stage 3 review. STOP. Stage 3 has not begun.**
