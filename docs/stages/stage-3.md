# Stage 3 — Property Comparison

Status: **PASS. Stage 3 is complete and ready for Stage 4 review.** Stage 4 is not authorized and has not begun.

## Baseline and scope

Started from exact verified Stage 2 main `07c69b08d7a205ed1a5cccb85ebd1544119aba5f`. Implementation branch: `stage-3-property-comparison`. The approved brief, React/TypeScript/Vite/Zod architecture, Node 24, dependencies and lockfile are preserved. All six sourced catalog collections and the empty benefits collection are byte-for-byte unchanged.

Stage 3 implements comparison only. No catalog expansion, research updates, manual price inputs, CPP calculation, recommendation/ranking, benefits engine, profile/storage, watchlist, trip builder, maps, dynamic data, monitoring, credentials or Marriott requests.

## Implemented

- Select 2–4 properties from explorer cards or details; remove, replace and clear selections. Four selections disable additional unchecked boxes; selected boxes remain removable. Filtered-out selections stay in the tray.
- URL-backed selection on explorer/detail/comparison/approach/roadmap links. Preserve explorer search/filter/sort context through comparison and detail round trips. Reloads, shared URLs and native back/forward work on Pages without storage or routing dependencies.
- Explicit empty/one-property chooser states; ordered deduplication; visible missing/malformed/oversized warnings with URL repair. No missing property substitution. A table requires two properties.
- Semantic table with aligned facts, booking unknowns and a separate editorial group. Sticky row labels/property headers, contained horizontal/vertical scrolling, a named keyboard-focusable region and visible instructions/focus.
- Compare sourced brand/geography/type/tags/designations/operating status, opening/renovation, room count and airport logistics. Shared `EvidenceValue` rendering preserves confidence, dates, source disclosures, every conflict claim, stale values, unverified claims and historical applicability.
- Separate editorial review context/rationale, author/date/methodology, quality/uniqueness/destination/elite-value ratings, recommended stay, ideal traveler/trip fit, strengths and limitations. Retain all assessments; no silent editorial winner or hotel rank.
- Three explicit Unavailable dimensions: cash cost, points cost and cents per point. Four Unknown dimensions: elite benefits, breakfast, lounge and fees. No unknown value is replaced by zero or inferred from a brand/tag.
- Pure selection/capacity/row/formatting functions, immediate controlled-checkbox state synchronized with URL navigation, manifest Stage 3 admission and Stage 4 rejection, ADR-009 and updated product/architecture/testing guidance.

Exact behavior: `docs/architecture/property-comparison.md`.

## Catalog preservation, assessed 2026-10-08 UTC

| Metric | Result |
| --- | --- |
| Properties / brands / destinations / countries-territories | 25 / 6 / 24 / 14, unchanged |
| Sources / evidence claims / editorial assessments | 25 / 260 / 1, unchanged |
| High / Medium / Low / Unverified claims | 185 / 75 / 0 / 0 |
| Valid / invalid properties | 25 / 0 |
| Schema / reference / duplicate / critical-evidence errors | 0 |
| Production stale / conflicting claims | 0 / 0 |
| Optional incomplete records / missing coordinates | 25 / 25, deliberately retained |

The one desk review retains null numeric ratings and recommended stay. Current operating status is unknown. Catalog health validates structure/evidence admission; it does not independently establish current hotel facts.

## Acceptance and validation

| Criterion / check | Result |
| --- | --- |
| 2–4 properties with aligned metrics | PASS: ordered columns, identical row definitions and 2/3/4-column DOM/browser assertions |
| Unavailable values explicit | PASS: cash/points/CPP unavailable; unknown benefits/fees/editorial/status stay visible |
| Easy entry/exit | PASS: card/detail selection, tray, navigation, remove/replace/clear, explorer return context |
| Responsive comparison | PASS: Chromium 1366×900 and 390×844, contained document width, aligned row cells and keyboard horizontal scrolling |
| Comparison tests | PASS: six scenarios at both viewports; combined suite 28/28 preview and 28/28 live |
| npm ci / typecheck / lint | PASS locally and in required CI |
| Schema-reference-evidence validation / health | PASS locally and in CI; no catalog errors |
| Unit / integration tests | 88/88 and 22/22 PASS |
| Default / Pages-base production builds | PASS |
| git diff --check / intended diff review | PASS |
| Main CI / Pages / live QA | All three jobs SUCCESS at the verified application main SHA |
| Independent live interaction smoke | PASS: four selections, source disclosure, unknown costs, separate editorial, reload, exit and return |
| Independent live asset byte comparison | HTML, JavaScript and CSS HTTP 200; all byte-identical to the verified Pages-base build |

Synthetic comparison fixtures cover conflicts with both claims, stale dates/warnings, unverified and expired evidence, false versus unknown, and editorial null/zero/empty-list/stay-length distinctions. No fixture is production hotel data. The checkbox regression asserts synchronous click-event state before asynchronous hashchange delivery.

Six comparison browser scenarios run at each viewport, joining the existing eight explorer scenarios (28 combined tests). They cover filtered explorer/detail selection, native history/reloads, source disclosure, aligned 2/3/4 columns, capacity/removal/replacement/clear, filter reset preservation and empty/duplicate/missing/oversized recovery. All existing explorer checks, including all 25 direct details, pass. No browser retries, skipped tests or flaky passes are claimed.

The first complete browser run caught controlled-checkbox reversion while waiting for hashchange. Selection state now updates immediately with the URL; the independent regression and final full suites pass. Checks were not bypassed.

## Repository and deployment evidence

- Final implementation head: `c1190955825bd56910233032c073693364b4685b`.
- Implementation PR: https://github.com/akv973/marriott-trip-planner/pull/7 — merged after successful required CI and diff review.
- Final PR CI: https://github.com/akv973/marriott-trip-planner/actions/runs/37719034344 — SUCCESS; all 28 browser tests passed.
- PR browser artifact: https://github.com/akv973/marriott-trip-planner/actions/runs/37719034344/artifacts/11525162083 .
- Verified application main/merge SHA: `f1041079a14fdfa6295a12aba0e4dee41e2c5a54`.
- Main CI / Pages / live QA: https://github.com/akv973/marriott-trip-planner/actions/runs/37719192614 — Required checks, Deploy GitHub Pages and Live browser QA all SUCCESS for that SHA.
- Main preview artifact: https://github.com/akv973/marriott-trip-planner/actions/runs/37719192614/artifacts/11524648064 .
- Live browser artifact: https://github.com/akv973/marriott-trip-planner/actions/runs/37719192614/artifacts/11525321922 .
- Exact Pages URL, confirmed in deployment output and live browser: https://akv973.github.io/marriott-trip-planner/ .
- Independently verified comparison: https://akv973.github.io/marriott-trip-planner/#/compare?compare=mapito&compare=mereshi&compare=dove-mountain&compare=jw-sao-paulo .

The locally validated source tree and remote application tree both equal `9c39e817e1216918ca8c50dd07356edae8f925d3`. Live SHA-256: HTML `353f78060be78a5fb624e225b35943f5cd3e5afad7569bbbf68129cba7bebd3c`; JavaScript `a4b3963dd69706114ee8cc806b7513e336a07f844ce4ae812a545f714cd9bcc3`; CSS `bb92099c0a5472b59dad65377153aaa75eb5560738c6d188fbbe5f1bcf3031cc`. Asset names: `index-B2C1mJ14.js` and `index-BxehocAH.css`.

This report records the verified application commit before its documentation-only completion PR. That PR changes only this report and runs the same gates. A commit cannot embed its own SHA; the final chat report records the final main SHA and workflow.

## Architecture decisions

ADR-009 adopts URL-backed 2–4 selection, a semantic scrolling table, shared evidence rendering and explicit later-stage booking unknowns. Existing explorer routes and evidence semantics are preserved. No dependencies or domain data change.

## Known limitations and unresolved issues

No unresolved application, catalog-structure, CI or deployment defect remains. Optional catalog data is sparse; coordinates, status, rates and many assessments/benefits are unknown. Sources reflect manual dated review rather than current availability or guaranteed future affiliation. No ranking or booking recommendation is calculated.

Local Chromium installation failed due to a truncated ZIP; local browser E2E is not claimed. CI installed Chromium and passed preview/live suites independently. The cloud browser could not open the local preview or download GitHub screenshot artifacts. Manual visual review covered the live desktop table/source disclosure; narrow layout was checked by CI assertions, with screenshots generated in its artifacts, but those screenshots were not manually inspected in this run. No physical-device, Safari/Firefox, screen-reader or full accessibility audit was performed. The small catalog/validation bundle remains about 494 kB JavaScript (118 kB gzip). Browser artifact retention is limited; repository branch protection remains unchanged from Stage 0.

## Next stage and stop

Recommended for review: **Stage 4 — Manual Points Calculator**. Separate explicit approval is required before implementation.

**Stage 3 is complete and ready for Stage 4 review. STOP. Stage 4 has not begun.**
