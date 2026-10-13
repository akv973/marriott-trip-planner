# STAGE COMPLETION REPORT

Stage: **14 — Portfolio Optimization**

Status: **PASS. Stage 14 is complete using manual dated pricing.** Stage 13 remains deferred; Stage 15 has not begun.

## Sequencing and scope

The user explicitly authorized Stage 14 using manual dated pricing while keeping Stage 13 deferred. [ADR-019](../decisions/ADR-019-manual-portfolio-sequencing.md) records this exception to the brief's normal sequence. Stage 12 research and ADR-018 remain in effect. No provider, scraping, monitoring, account integration, booking automation, new catalog property or Stage 15 work was implemented.

## Delivered

- `#/portfolio` compares cash conservation, aggregate points-only redemption value and a balanced priority-weighted cash plus personal point-value strategy across saved trips.
- Strict independent pure engine, version `manual-portfolio-1`: one profile points pool and certificate inventory; reserved stays fixed; reserved resource commitments outside selection deducted once; duplicate fixed certificates and known fixed shortfalls return review errors.
- Per-stay/per-trip cash, points, top-offs, certificate identity and forfeiture, fifth-night savings, quote dates, alternatives, missing inputs, assumptions and remaining balances. Actual USD cash, native currencies and weighted cash are distinct. Structured input/output inspection is available.
- Optional selected-trip USD cap, priority weights 1/2/3 and explicit standard-room certificate confirmation. Controls are transient, and do not alter saved booking choices, balances or certificate inventory.
- Unknown dates, prices, FX, comparability, balances and selected costs remain explicit. Totals stay nullable beside labeled known subtotals. Unknown fixed resources withhold new spending. Missing valuation withholds balanced allocation; an incomplete fixed award value comparison withholds CPP ranking rather than assuming a zero numerator.
- Deterministic ASCII search order and tie breaks, independent of ambient locale. Bounded exhaustive search discloses its 100,000-node limit; limited results never claim global optimality. Complete results are optimal only within the entered stay alternatives.

## Strategy arithmetic

| Strategy | Objective |
| --- | --- |
| Cash conservation | Minimize actual selected-trip USD cash; ties favor priority-weighted cash avoided, then fewer points and stable IDs |
| Redemption value | Maximize summed USD cash avoided divided by summed points on points bookings; certificates/top-offs excluded from CPP; ties favor lower actual cash and fewer points |
| Balanced | Minimize priority-weighted cash cents plus points spent × profile valuation in USD cents/point; includes top-offs, excludes certificate opportunity cost |

CPP is an aggregate ratio, not an average of stay CPPs. Integer cross-products compare ratios. Native charges use currency minor units; USD conversions are rounded per stay before summation, and cash avoided is the difference of rounded cash/award USD costs. Cash limits consider known costs; unknown full cash makes compliance unknown. Existing fifth-night and dated certificate engines are reused without discounting final points totals again.

An independent complete enumeration of **40 varied synthetic portfolios** checks all three objectives. Canonical tests cover shared points, fixed commitments inside/outside selection, fixed stays later in saved order, unique certificate use, top-offs/expiry/forfeiture, budgets, zero/unknown costs, missing dates/FX/comparability, incomplete CPP, safe monetary bounds, fifth-night reuse, exact reconstruction and search-limit disclosure. Synthetic test quotes are not production hotel observations.

## Verification

| Check | Result |
| --- | --- |
| Node 24.19.0 full local `npm run check` | PASS |
| Typecheck / lint / schema / catalog / map gates | PASS |
| Unit tests | **341/341 PASS** |
| Integration tests | **71/71 PASS** |
| Production and Pages-base builds | PASS |
| Final correction PR production-preview browser checks | **112/112 PASS** (56 per width) |
| Final main required checks / Pages deployment | **SUCCESS** for `e7c237866507c87465252ce23e94085b204c252a` |
| Live desktop/narrow browser checks | **112/112 PASS** (56 per width) |
| Desktop / narrow visual QA | PASS at 1366×900 / 390×844; 16 portfolio images reviewed |
| Independent objective enumeration | PASS, 40 portfolios |
| v1/v2 backup and read-only persistence regressions | PASS |
| Served application bytes versus exact checked Pages build | **5/5 exact SHA-256 matches; HTTP 200** |

Seven new DOM flows and six browser scenarios per width join prior regressions. Browser flows cover allocation arithmetic, certificate inventory, reviewed v2 reconstruction, reload/transient state, priorities, cash caps, keyboard inspection, outside commitments, duplicate certificate review, incomplete value withholding, empty recovery and route context. Controls, strategies, ledger, certificate, incomplete, infeasible, duplicate-error and empty screenshots were inspected at both widths. The correction preview and final live sets each contained 16 screenshots, matching the reviewed layouts byte-for-byte.

The initial browser run found two priority-control selector failures; explicit accessible names corrected them. Final review added the later fixed-stay ledger regression and fail-closed aggregate CPP guard. All final PR checks passed. Local browser execution was unavailable in the container; production-preview and live browser execution use the repository's existing Chromium CI jobs. The existing large-main-bundle advisory remains; no dependency or workflow change was introduced.

## Preservation and catalog health

Original storage key, strict profile/trip/watchlist schemas, v1 migration and v2 export/import are unchanged. Optimizing leaves saved data byte-identical and reconstruction yields the same default scenario. Catalog, evidence, prior business engines, dependencies, lockfile and CI workflow are preserved. Runtime manifest admits only Stage 14 in addition to prior implemented stages; Stage 12/13/15/16 runtime progression remains rejected.

| Metric | Result |
| --- | --- |
| Valid properties / invalid | 100 / 0, unchanged |
| Catalog sources / factual claims | 200 / 1,217, unchanged |
| Schema / critical / optional evidence errors | 0 / 0 / 0 |
| Conflicting subjects / claims | 2 / 4, preserved |
| Unverified / stale claims | 1 / 0, preserved |
| Mapped / unmapped | 100 / 0, unchanged |
| Approved providers / new pricing observations | 0 / 0 |

Independent explorer, comparison, calculator, recommendations, trip builder, profile, benefits, watchlist and maps remain available; no rate automation is necessary for this feature.

## Commits, workflows and deployment

- Stage 12 baseline: `72bf32fbc5b7c24fc335d439819da4e39dd6dac0`.
- [Implementation PR #25](https://github.com/akv973/marriott-trip-planner/pull/25), merged after [CI 38461522141](https://github.com/akv973/marriott-trip-planner/actions/runs/38461522141) passed 339 unit, 70 integration and 112 browser checks.
- Implementation merge: `b67d62e34a7d1620fd237abae92fbf94913dbba9`; [initial main checks, deployment and live QA](https://github.com/akv973/marriott-trip-planner/actions/runs/38462435577) passed.
- [Focused correctness PR #26](https://github.com/akv973/marriott-trip-planner/pull/26): aggregate unknown-value withholding and locale-independent traversal; [CI 38463397285](https://github.com/akv973/marriott-trip-planner/actions/runs/38463397285) passed 341 unit, 71 integration and 112 browser checks.
- Final application merge: `e7c237866507c87465252ce23e94085b204c252a`.
- [Final application main workflow 38464235081](https://github.com/akv973/marriott-trip-planner/actions/runs/38464235081): **SUCCESS** — required checks, Pages deployment and 112 live browser checks passed.
- Existing production URL: [https://akv973.github.io/marriott-trip-planner/](https://akv973.github.io/marriott-trip-planner/); portfolio at [#/portfolio](https://akv973.github.io/marriott-trip-planner/#/portfolio).

Direct HTTPS reads of the literal deployment files match the checked Pages-base build:

| Served file | SHA-256 |
| --- | --- |
| index.html | `c319768511f02f8a34cef35def91c61486b9f4aed1c57a6b542cda1d2e1be468` |
| assets/land-B4KBD8fO.json | `b1a1e0a3a069594bc9867c22e39143fa7c470300c1947a05f266fa2a0dc0e1c5` |
| assets/index-Bu0T7HCQ.js | `39dc9bf50982d5c53b419cfae136bee83d10a5b8b548b44b97bf24e733927815` |
| assets/index-Bo6Y8_w6.css | `ab9cb4f0dbc9db80f4dc46d82df16b3118b07c359ef83c80a6029fc227edd8db` |
| assets/GeographicMap-D4EqxXwp.js | `9765af40e99a09be8cc730d85b70d4f372ae249bcd7af63c8c2afc1982e3d57e` |

A documentation-only completion record follows the checked application merge. Redundant CI is skipped for this report-only commit; all application CI, deployment and live evidence above belongs to the verified application commit. The completion record changes no application, dependency, test or workflow files; its final full repository SHA is supplied with delivery. The application commit and workflow above identify the deployed code. A completion record cannot contain its own SHA or the result of a future workflow.

## Known limits and stopping boundary

- Prices and availability are manual scenarios. Older quotes retain dates and reconfirmation warnings; future rates are never inferred.
- Profile balance is the pre-allocation pool including modeled reserved awards. Already-debited reservations require a corresponding manual balance/commitment adjustment.
- Certificates use separately quoted one-night stays. No multi-night splitting, joining of reservations or hotel substitution. Remaining inventory may include expired/unverified awards.
- Cap and cash totals cover selected trips; outside reserved cash is excluded. Unknown costs cannot certify compliance. Overlapping dates are flagged and keep the assessment incomplete.
- Large searches are bounded; a limited incumbent is feasible under known constraints, with global optimality unverified. Reduce selection to complete search.
- Scenario settings reset on leaving/reloading. Existing backups reconstruct the default comparison from saved quotes, rather than persisting transient choices.
- Future earnings, purchases, transfers, certificate opportunity cost, transport, activities and booking execution are excluded. Trip fit/catalog quality are not re-scored; saved hotels are the selected travel options.

Recommended next step: review the manual allocation scenarios and retain Stage 13 deferral until its provider qualification gates are met and separate approval is given.

**STOP. Stage 13 remains deferred. Stage 15 has not begun.**
