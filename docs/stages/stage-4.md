# STAGE COMPLETION REPORT

## Stage

**4 — Manual Points Calculator**

## Status

**PASS. Stage 4 is complete. Stage 5 has not begun and is not authorized.**

## Baseline and scope

Started from verified Stage 3 main `1022dc3b1a1c65ac208eb493fef289f489ab50db`. Implementation branch: `stage-4-manual-points-calculator`. React/TypeScript/Vite/Zod, Node 24, dependencies and lockfile are preserved. The six sourced catalog collections and empty benefits collection are byte-for-byte unchanged. The foundation manifest advances only to Stage 4; Stage 5 remains rejected.

Only one manual stay's booking economics is implemented. No live Marriott pricing, scraper, account connection, undocumented endpoint, certificate engine, hotel-fit ranking, trip builder, profile persistence, maps, watchlist or Stage 5 recommendation engine exists.

## Implemented

- ✓ Independent strict input validation and pure economics in `lib/points/`, outside UI components; dated primary-policy references.
- ✓ Manual `#/calculator` route; global navigation and property-specific detail link; preserve explorer filters and 2–4 comparison selections through navigation/history. All existing catalog facts, evidence and unknown booking values remain intact.
- ✓ Nightly/total cash room cost, whole-stay taxes and mandatory fees, cash still payable on the award, number of nights, currency and optional quote/date/room/cancellation context.
- ✓ Flat nightly points, each-night varying points, or a final quoted total. No second deduction from final quoted totals.
- ✓ Verified eligible standard-room Stay for 5, Pay for 4: lowest nightly points across the entire eligible stay, earliest ties, one discounted night per complete five nights. Unknown eligibility leaves discounted points unknown; ineligible stays receive no deduction.
- ✓ Explicit blanks/unknowns versus confirmed zero charges. Unknown required prices, fees or FX never become zero; zero points produces undefined CPP.
- ✓ Personal USD point valuation, configurable ordered assessment thresholds, comparable-product warning, manual non-USD exchange rate, independent optional points-balance check. Value and affordability are separate.
- ✓ Inspectable cash avoided, points before/after discount, CPP formula with entered numbers, point opportunity cost, award economic cost, discounted night indices, assumptions and primary-source links. Editing clears stale results, reset clears the form, and calculation focuses the results heading.
- ✓ Eight canonical economics fixtures, rounding-boundary regressions and desktop/narrow form, recovery, source, history and reload flows.

Behavior, formulas and boundary decisions: [calculator architecture](../architecture/manual-points-calculator.md) and [ADR-010](../decisions/ADR-010-manual-points-calculator.md).

## Marriott policy verification

Verified before implementation, **2026-10-08 UTC**:

- Current Marriott Bonvoy terms, marked Updated September 2026: https://www.marriott.com/loyalty/terms/default.mi — §§3.2.b, 3.2.f, 3.3.d–f.
- Official benefit guide: https://help.marriott.com/s/article/stay-for-5-pay-for-4-benefit — retrieved guidance includes the ten-night whole-stay example.

The engine discounts only user-confirmed eligible standard-room nightly inputs. Premium/upgrade quotes use final totals; no upgrade points are deducted automatically. Fees and special-property eligibility are user assertions, with no inferred waiver or brand override. Policy links and review date are displayed. Configurable value thresholds and the visible 0.8¢ personal-value default are planning choices, not Marriott rules.

## Validation

| Required check / acceptance criterion | Result |
| --- | --- |
| npm ci | PASS locally and in CI |
| Typecheck | PASS |
| Lint | PASS, zero lint warnings |
| Schema / reference / evidence validation | PASS |
| Catalog health | PASS, unchanged 25-property collection |
| Unit tests | **134/134 PASS** |
| Integration tests | **28/28 PASS** |
| Canonical Stage 4 fixtures | **8/8 PASS** |
| E2E preview tests | **36/36 PASS**, both PR and application main |
| E2E live tests | **36/36 PASS** at public Pages URL |
| Browser retries / skipped / flaky / unexpected | **0 / 0 / 0 / 0** in final preview/live reports |
| Default and Pages-base production builds | PASS |
| git diff --check / intended diff review | PASS |
| Required PR CI before merge | PASS at exact final implementation head |
| Main CI / gated Pages deployment / live QA | All three jobs SUCCESS at verified application main SHA |
| Desktop visual QA | PASS: inspected populated form/result screenshot and deployed page |
| Narrow visual QA | PASS: inspected 390×844 full form/result screenshots, including readable original-size crops |
| Live asset verification | HTML / JavaScript / CSS HTTP 200 and byte-identical to verified Pages-base build |
| No live pricing integration | PASS: manual inputs only; static policy hyperlinks |

Canonical independent expected results cover five-night points, four-night points, cash superior, points superior, missing award, missing cash, insufficient points and missing optional balance. Additional tests cover varying nightly rates, ten-night whole-stay discount and earliest ties, 14/15 nights, unknown/ineligible eligibility, total-price double-deduction protection, explicit zero/missing fees, missing nightly quotes, negative cash avoided, zero points, minor-unit money, manual FX, configurable/exact value boundaries, invalid inputs and URL context.

The 28 existing explorer/comparison browser checks remain in the combined 36-test suite, including all 25 direct detail pages and evidence distinctions. The new eight browser checks exercise calculator form/economics, unknown/invalid/comparability recovery, varying/total/FX entry, and context/history/reload at both 1366×900 and 390×844.

During validation, exact-threshold binary rounding was corrected with machine-precision equality handling and independent regressions. Browser checks caught missing exact select labels and an outdated roadmap assertion; explicit accessible names and the Stage 4 availability assertion correct both. Earlier in-progress runs were superseded/cancelled. Final checks passed without retries or bypasses.

## Catalog Health

Assessed 2026-10-08 UTC:

| Metric | Result |
| --- | --- |
| Properties / brands / destinations / countries-territories | 25 / 6 / 24 / 14, unchanged |
| Valid / invalid properties | 25 / 0 |
| Sources / evidence claims / editorial assessments | 25 / 260 / 1, unchanged |
| Schema / reference / duplicate / critical-evidence errors | 0 |
| Missing critical evidence | 0 |
| Conflicting / stale / unverified claims | 0 / 0 / 0 |
| High / Medium / Low / Unverified claims | 185 / 75 / 0 / 0 |
| Optional incomplete records / missing coordinates | 25 / 25, deliberately retained |

Catalog health verifies structure/evidence admission, not current hotel availability or the truth of every hotel fact. Manual price inputs are never catalog evidence.

## Commit and repository evidence

- Baseline main: `1022dc3b1a1c65ac208eb493fef289f489ab50db`.
- Final implementation head: `79cf0263c573eb9a47009bf5122e21e0decac548`.
- Implementation PR: https://github.com/akv973/marriott-trip-planner/pull/9 — merged after successful required CI and visual/diff review.
- Final PR CI: https://github.com/akv973/marriott-trip-planner/actions/runs/37723198118 — SUCCESS, 36/36 browser tests.
- PR screenshot/results artifact: https://github.com/akv973/marriott-trip-planner/actions/runs/37723198118/artifacts/11526756367 .
- **Verified application main/merge SHA: `038f52e0923eda969ccbec8b693ceeff26dd2bab`.**
- Exact locally validated / remotely committed application tree: `ca9ced066bae4c9b3942e0997d142a80ab0f2160`.
- Main CI / Pages / live QA: https://github.com/akv973/marriott-trip-planner/actions/runs/37723431147 — Required checks, Deploy GitHub Pages and Live browser QA SUCCESS.
- Main preview artifact: https://github.com/akv973/marriott-trip-planner/actions/runs/37723431147/artifacts/11526657117 .
- Live screenshot/results artifact: https://github.com/akv973/marriott-trip-planner/actions/runs/37723431147/artifacts/11525824618 .

This report records the verified application commit before the documentation-only completion PR. That PR changes only completion/scope documentation and runs the same gates. A commit cannot embed its own SHA; the final chat report records the final main SHA and workflow.

## Deployment

**https://akv973.github.io/marriott-trip-planner/**

Verified calculator: https://akv973.github.io/marriott-trip-planner/#/calculator .

Pages deployment job reported success and the exact public environment URL. The live suite independently reproduced the calculator arithmetic, unknowns, modes, balance warning, source links, reload/history and preserved explorer/comparison flows. Manual cloud-browser inspection confirmed the deployed calculator title, controls, unknown inputs and policy context. Both viewport screenshot sets were inspected.

Independent HTTP/byte comparison:

| File | HTTP | SHA-256 | Match |
| --- | --- | --- | --- |
| index.html | 200 | `6a09e95312fe19cdc133aa5eef31bf25343823106711b3269b158f857473d7db` | Exact |
| assets/index-XlrbdGSG.js | 200 | `0e5a474cfd83aa8bec446078d8a25d74f7967861331dca1db49fb2e6b91d4c1a` | Exact |
| assets/index-DLj9Wo5C.css | 200 | `969bdc46831f97038814e24a5cd263812337da76adb571eeb46b4d8ef8fac783` | Exact |

## Known limitations

- One transient manual stay; entries clear on reload. Availability, special-property eligibility and award cash payable must be confirmed from the quote. No pricing or currency provider.
- Ten supported currencies; non-USD CPP requires manual FX. Dates/room/cancellation notes describe user input without establishing authoritative pricing or current availability.
- Paid-stay points earnings, credit-card rewards, elite treatment and certificate opportunity costs are excluded and disclosed. Points value alone is not hotel fit.
- Certificate/top-off fixtures remain Stage 7, benefit overrides Stage 8, multi-hotel totals Stage 6 and hotel-fit integration Stage 5. Those cases remain pending without placeholder passing tests. Existing stale/conflicting/incomplete property regressions continue passing.
- Local Chromium downloads returned truncated archives; local browser execution is not claimed. CI Chromium preview/live execution and manual artifact inspection passed. No physical-device, Safari/Firefox or full accessibility audit was performed.
- Production JS is about 515 kB (125 kB gzip); Vite emits a chunk-size advisory. Build and required checks pass. Browser artifacts have limited retention; branch-protection settings are unchanged.

## Unresolved issues

**None within the authorized Stage 4 scope.** Catalog optional gaps and later-stage features remain explicitly documented.

## Recommended next stage

**Stage 5 — Recommendation Engine**, only after separate explicit approval.

**STOPPING HERE FOR REVIEW. Stage 5 has not begun.**
