# Manual planner release-readiness audit

Audit date: **2026-10-13**. Scope: the existing manual application through Stage 14, against baseline `b58f1deb218176d86485159718f21ce039ab7696`. This is an audit, not another product stage. Stage 13 remains deferred; Stages 15 and 16 and any release tag require separate approval.

## Recommendation

**PASS — ready for a manual-planner release within the audited scope.** PR #27 was merged at the separately approved head `1ba7e8d6a0293a41a8859d7e42aa844df0120276`. The three demonstrated defects are deployed and verified on the public site. Required checks, deployment and all 126 live browser checks passed in the existing gated workflow. No unresolved blocking application defect remains in this tested scope. Remaining manual-data, performance, repository-protection and browser/device limitations are listed below. This recommendation does not promote a version or create a release tag.

## Demonstrated findings and fixes

| ID | Severity | Reproduction | Corrected behavior |
| --- | --- | --- | --- |
| AUD-001 | Medium | Two EUR 100.02 cash stays at manual FX 1.125 showed USD 225.05 in Trip builder and USD 225.04 in Portfolio. The displayed per-stay values each round to USD 112.52. | Convert and round each stay to USD cents before summation in both engines. Cash avoided uses the difference of separately rounded cash/award USD charges. Unknown amounts still remain null. |
| AUD-002 | Low | Inserting an empty trip between quoted trips changed its otherwise known balance-after-trip to Unknown, despite spending zero points and zero cash. | Carry the preceding known balance, or the initial available pool, through an empty trip. Unknown fixed commitments still leave balances unknown. |
| AUD-003 | Medium | Import a valid v2 planner with saved trips and `workspace.activeId: null`. The trip selector visually selected the first trip but the editor displayed the empty-state message. | Display the first saved trip and align the selector. Loading changes no stored bytes; editing affects that displayed trip. |

The original audit regression run failed on all three findings (three failures, two passing controls). Targeted corrections passed the regressions. A test-only ambiguous money selector was narrowed during verification. Initial Chromium CI passed 124/126 checks; the two failures were the audit test expecting a quota warning after a denied storage read. The application correctly preserved in-memory work and requested an export. The test was corrected to assert the existing read-block message and exercise quota failure in a separate browser context; final CI passed 126/126 with no retries or skipped tests. No speculative product changes were introduced.

## Audit coverage

- Real journey: enter Ambassador profile and valuation, discover Dove Mountain and Mapito, save a watch target, compare their evidence, use the independent calculator, save a two-hotel trip with dated manual quotes, inspect the allocation strategies, export, change the balance, restore and reload an exact v2 backup.
- Arithmetic: a synthetic 600,000-point pool, four-night USD 575 stay with taxes/fees, five-night 100,000-point/night stay with confirmed discount, and a 105,000-point night using an 85,000-point certificate plus 20,000-point top-off. Cash conservation consumes 420,000 points, one certificate and USD 3,120; 180,000 points remain. Points-only CPP is 1.7; top-offs are excluded from CPP. Synthetic quotes are not hotel observations.
- Prior portfolio regressions: independent enumeration of 40 varied portfolios; shared points, fixed reservations inside/outside selection, single-use certificates, top-off/expiry bounds, fifth-night reuse, stable order, budgets, impossible budgets, missing dates/prices/FX/comparability, incomplete CPP, zero and unknown balances, and 100,000-node search-limit disclosure.
- Persistence/recovery: current v2 exact reconstruction; strict legacy v1 migration with empty watchlist; invalid/future versions, invalid numeric drafts and corruption; another-tab conflict preserving the newer saved copy while allowing an in-memory export; denied reads and quota failures retaining exportable work. Read-only allocation does not change stored planner bytes.
- Keyboard/accessibility: named controls on all nine principal routes, keyboard route entry and heading focus, skip link to main, calculator/recommendation result focus, native summaries and selectors, map activation/zoom and horizontal ledger navigation. This is a focused keyboard/semantic audit, not a full assistive-technology or WCAG conformance certification.
- Usability: production Chromium at 1366×900 and 390×844, plus route reflow at 320, 768 and 1366 pixels; no document overflow, visible controls and recoverable empty/error/incomplete states. Four-column comparison scrolls within its labeled region. Maps remain optional, with usable property lists when map data or street tiles fail.
- Loading: three cold samples per width with cache disabled, 150 ms latency, 200,000 bytes/s download and 4× CPU slowdown. Capture paints/LCP, long tasks, resource bytes and duration, and time to a successful search. Verify the optional map renderer and land data are absent from initial discovery requests. Raw measurements are attached to CI evidence.

## Validation

Baseline `npm run check`: **341 unit + 71 integration = 412 passed**. After corrections: **345 unit + 72 integration = 417 passed**, including typecheck, lint, foundation/catalog/expansion/map schemas and production build. Node 24.19.0. Default and Pages-base builds succeed. Local Chromium installation is unavailable in this execution environment; the repository's existing Chromium CI runner supplies the browser evidence.

| Verification | Result |
| --- | --- |
| Local full check, Node 24.19.0 | PASS, 345 unit / 72 integration |
| Required main CI checks, deployed application | PASS, 345 unit / 72 integration |
| Main Chromium production preview, 1366×900 / 390×844 | **126/126 PASS**, no skips/retries/flaky cases |
| Live Chromium regressions and three fixes, same widths | **126/126 PASS**, no skips/retries/flaky cases |
| Route reflow at 320 / 768 / 1366 px | PASS, all nine principal routes |
| Visual QA | PASS; 14 live audit screenshots are byte-identical to the reviewed preview, including 320/768/1366 reflow; live ledger and narrow strategy views also inspected |
| Deployed build verification | **5/5 HTTP 200 and exact SHA-256 matches** among served files, CI Pages artifact and local exact-commit build |
| Approved merge / gated Pages deployment / live audit | **SUCCESS**, workflow 38474476979 |

[Audit PR #27](https://github.com/akv973/marriott-trip-planner/pull/27) is merged. The deployed application commit is **`14db5a3c65d226df73d739e1e9877aff6cd66de3`**. [Main workflow 38474476979](https://github.com/akv973/marriott-trip-planner/actions/runs/38474476979) completed successfully with required checks, Pages deployment and live browser QA. The existing exact production URL is [https://akv973.github.io/marriott-trip-planner/](https://akv973.github.io/marriott-trip-planner/). A subsequent documentation-only completion record changes no application bytes and does not replace this deployed commit.

## Loading measurements

Candidate preview samples from workflow 38472464878 use cache disabled, 4× CPU slowdown, 150 ms latency and 200,000 bytes/s download. Each sample loads the catalog and completes a real search. These are controlled lab observations, not field Core Web Vitals or a formal performance-budget certification.

| Width | LCP samples (ms) | Median LCP | Completed-search samples (ms) | Median completed search |
| --- | --- | --- | --- | --- |
| Desktop 1366 px | 2,172 / 2,052 / 1,916 | 2,052 ms | 2,607 / 2,563 / 2,373 | 2,563 ms |
| Narrow 390 px | 2,156 / 1,880 / 1,876 | 1,880 ms | 2,677 / 2,435 / 2,369 | 2,435 ms |

Initial JS transfers approximately 203 KB compressed and decodes to 1,252,005 bytes; CSS decodes to 40,238 bytes. Neither the map renderer nor the 114,475-byte land file is requested during initial discovery. The main-bundle advisory and startup long tasks remain: maximum long task 307 ms desktop / 292 ms narrow under 4× slowdown. The measured candidate is usable under these conditions; lower-end devices and slower networks can fare worse. Broad code splitting is deferred because no loading failure was demonstrated and the user limited changes to reproduced defects.

Five local pure-engine samples of the capped 18-stay search visited 100,000 nodes in 58–94 ms. These Node timings are context only, not browser interaction guarantees. The existing limit still discloses unverified optimality.

Raw evidence: [desktop loading](evidence/loading-desktop.json), [narrow loading](evidence/loading-narrow.json), [browser summary](evidence/preview-summary.json), and [unchanged live file hashes](evidence/unchanged-live-verification.json).

## Live verification completion

The live suite independently reproduces AUD-001, AUD-002 and AUD-003 through a restored planner with no active trip, two converted EUR stays and an empty trip. Trip builder and Portfolio both show USD 225.04; the empty trip carries its known zero-point balance; saved trip editing opens immediately. Loading/navigation/reloading the read-only scenario preserves stored planner bytes. Both desktop and narrow cases pass. The realistic discover/compare/calculate/save/optimize/watch/export/restore journey, existing browser regressions and 320/768/1366 reflow checks also pass on the public deployment.

Fourteen live audit screenshots match the independently reviewed preview byte-for-byte, including the three-fix ledger, realistic journey, storage-conflict warning, keyboard-scrolled ledger and three reflow widths. Direct visual inspection of the live wide ledger and narrow strategy stack confirms readable values and controls. Existing comparison, incomplete, infeasible and certificate layouts remain covered.

Three cold live samples per width use the same cache-disabled 4× CPU, 150 ms latency and 200,000-byte/s download settings:

| Width | Live LCP samples (ms) | Median LCP | Completed-search samples (ms) | Median completed search |
| --- | --- | --- | --- | --- |
| Desktop 1366 px | 2,228 / 1,920 / 1,932 | 1,932 ms | 2,671 / 2,434 / 2,411 | 2,434 ms |
| Narrow 390 px | 2,228 / 1,916 / 1,924 | 1,924 ms | 2,697 / 2,426 / 2,395 | 2,426 ms |

Maximum live long tasks are 300 ms desktop / 295 ms narrow under the CPU slowdown. Optional map renderer/land requests remain absent from initial discovery. These lab measurements support usability under the tested conditions without certifying field Core Web Vitals or all devices.

Raw final evidence: [live browser summary](evidence/live-browser-summary.json), [live desktop loading](evidence/live-loading-desktop.json), [live narrow loading](evidence/live-loading-narrow.json), and [served/CI/local build hashes](evidence/deployed-build-verification.json).

## Preservation

No catalog/evidence, original property IDs, points/certificate policy, profile/watchlist fields, saved trip pricing fields, storage key, strict v1/v2 backup contract, dependencies, lockfile or CI workflow changed. The only business changes are the reproduced derived-total/balance defects. Existing saved planners need no migration. Runtime manifest remains Stage 14. No providers, scraping, monitoring, account integration, catalog expansion or feature additions.

Catalog health remains 100 valid properties, zero schema or missing-evidence errors, 200 sources and 1,217 factual claims. Two conflicting subjects/four claims and one unverified claim remain visible; 100 locations remain mapped. Validation checks structure and traceability; this audit does not reverify every hotel fact against current sources.

## Remaining limitations

- Manual quotes, FX, certificate eligibility and account balances require user confirmation; the tool cannot establish availability or execute bookings. Catalog and policy evidence is dated and may need later review.
- The profile is a pre-allocation pool that includes modeled reserved commitments. If account points were already deducted, users must reconcile the entered pool and modeled commitments together.
- Unknown costs and resources remain explicit; incomplete assessments and capped searches cannot certify full feasibility or global optimality. Scenario settings reset on leaving/reloading; backups reconstruct default scenarios.
- Browser data is local to the device/browser; private backups are needed for transfer and recovery. Another tab can block stale writes. Full/blocked storage needs export before closing the page.
- The existing main-bundle size advisory remains (approximately 1.25 MB decoded / 204 KB gzip). Optional maps load later. Throttled measurements and the resulting release assessment are recorded above; no broad performance refactor was authorized by this audit.
- Main branch protection is not enabled, as verified through the GitHub branch endpoint. The existing Actions workflow gates Pages deployment on required checks, but repository-level prevention of direct main writes is not configured. No repository settings were changed.
- Browser automation uses Chromium, including narrow-screen emulation. Physical iOS/Android devices, Safari/Firefox, actual screen-reader sessions and field Core Web Vitals are not certified by these checks.
- Future points earnings, transfers/purchases, certificate opportunity cost, transport/activities and unentered taxes/fees remain excluded.

## Evidence record

- Historical baseline main was `b58f1deb218176d86485159718f21ce039ab7696`; its deployed application was `e7c237866507c87465252ce23e94085b204c252a`, validated/deployed in [38464235081](https://github.com/akv973/marriott-trip-planner/actions/runs/38464235081).
- Candidate changes: `b00dfca5ac91b75e737f3452ee969e1f6cd3f3ef`; corrected storage audit: `7f442de8975e245aa3037088fa8667a3aafd9263`.
- Initial preview [38471608097](https://github.com/akv973/marriott-trip-planner/actions/runs/38471608097) documents the two test-assertion failures. Final preview [38472464878](https://github.com/akv973/marriott-trip-planner/actions/runs/38472464878) succeeds.
- [Final browser evidence artifact 11852426550](https://github.com/akv973/marriott-trip-planner/actions/runs/38472464878/artifacts/11852426550) contains all 126 results and screenshots. All 14 final audit screenshots match the independently inspected initial layouts byte-for-byte. Images include the realistic journey, corrected FX/empty-trip ledger, stale-tab warnings, keyboard ledger and 320/768/1366 reflow. Additional inspected comparison, incomplete, infeasible and certificate layouts remain readable.
- Pre-merge production-preservation checks matched five unchanged Stage 14 files; that historical evidence is retained. Final post-deployment checks match all five updated served files to both the local exact-commit build and the actual CI Pages artifact.
- Approved PR head: `1ba7e8d6a0293a41a8859d7e42aa844df0120276`. Merge/deployed application: `14db5a3c65d226df73d739e1e9877aff6cd66de3`. [Main workflow 38474476979](https://github.com/akv973/marriott-trip-planner/actions/runs/38474476979): all three jobs **SUCCESS**.
- Main preview evidence [11852479056](https://github.com/akv973/marriott-trip-planner/actions/runs/38474476979/artifacts/11852479056), deployed Pages artifact [11852209703](https://github.com/akv973/marriott-trip-planner/actions/runs/38474476979/artifacts/11852209703), and live evidence [11854380208](https://github.com/akv973/marriott-trip-planner/actions/runs/38474476979/artifacts/11854380208) tie the tests and asset bytes to that deployed commit.

**Audit complete.** The manual application is deployed and verified. This completion record changes documentation/evidence only; the deployed application SHA above remains authoritative. Stages 13, 15 and 16 and any release tag remain unauthorized.
