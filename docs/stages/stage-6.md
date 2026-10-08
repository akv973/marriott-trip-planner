# STAGE COMPLETION REPORT

## Stage and status

**6 — Trip Builder: PASS. Stage 6 is complete. Stage 7 has not begun and is not authorized.**

## Baseline and scope

Started from Stage 5 main `5a341e6602561b2be550038d17bff3b0c9937156`. Implementation PR #13 uses the approved React/TypeScript/Vite/Zod architecture and GitHub Pages gates. Six sourced catalog collections, empty benefits, existing calculator and recommendation engines, dependencies and lockfile remain byte-for-byte unchanged. The manifest admits Stage 6 and rejects Stage 7.

Only transient Trip Builder functionality is implemented. No live pricing, new hotel facts, scraper, undocumented endpoint, account connection, booking automation, profile persistence, import/export, certificate engine, benefit rules, watchlist or portfolio allocation is introduced.

## Implemented

- Strict separate Trip and TripStay contracts; pure aggregation and UTC checkout in `lib/trips/`. The editor manages inputs and rendering; economics and totals remain outside components.
- `#/trips` navigation preserving explorer/comparison context. Existing 25-property explorer, details, 2–4 comparison, manual calculator and recommendations remain available.
- Up to ten independent trips with name, destination, approximate/exact travel window, travelers, notes/activities, optional balance and editable point valuation. Up to thirty ordered hotel stays per trip, each with property, check-in, derived check-out, 1–60 nights, cash/points choice, manual reservation status, notes and quote context. Add/remove/reorder/switch trips retain stable stay identity and notes.
- Every stay delegates to the unchanged calculator, including final, flat and variable award quotes and confirmed Stay for 5, Pay for 4 eligibility. Separate stays are not merged, even at the same hotel; a free night never crosses hotel/stay boundaries. Final award totals are never discounted twice.
- Selected-booking points/cash totals, total hotel nights, adjacent hotel changes, native currencies, manual USD conversion, whole-trip balance/shortfall, weighted award redemption and economic planning cost. Missing chosen values preserve null full totals alongside explicit partial known subtotals and missing counts. Missing alternative quotes leave chosen spending intact but withhold redemption value.
- Immediate recalculation on edits. Invalid drafts remove totals until corrected. Changes to hotel/date/nights/currency/basis clear affected quotes rather than reinterpret stale prices. Blank values and confirmed zero remain distinct.
- Chronology/gap/overlap review, old/unknown/future manual quote-date warnings, per-stay arithmetic/assumptions, unchanged factual evidence rendering and links to separate editorial details. Manual prices and reservation statuses remain user assertions; availability is not checked.
- Full read-only trip/structured result JSON includes `trip-totals-1`, assessment date, quote inputs, calculator results/policy version, complete/partial totals and warnings.
- Trip/notes workspace remains in application memory across hash navigation. Reload clears it, following ADR-003. No local/session storage writes or traveler data in URLs/static artifacts. Balances are independent per trip and do not reserve points across trips.

See [Trip Builder architecture](../architecture/trip-builder.md) and [ADR-012](../decisions/ADR-012-trip-builder.md) for contracts, formulas, invalidation and boundaries.

## Totals methodology

| Booking method | Selected cash | Selected points |
| --- | --- | --- |
| Cash | Calculator room + stay taxes + mandatory fees | Known zero |
| Points | Calculator cash still payable on award | Calculator final net award points |

Cash currencies are summed independently. USD uses each stay's manually entered FX. Full aggregate is null when any selected value/conversion is unknown; known subtotal is explicitly partial. Points balance is checked once against the entire selected itinerary. Incomplete demand can prove an **at least** shortfall, but never a remaining balance.

Weighted redemption value uses comparable points stays only: sum of USD net cash avoided divided by total selected points, multiplied by 100. Never average stay CPP. Unknown prices/FX, unconfirmed/different products or zero points prevent a complete aggregate redemption value. Nights count hotel nights rather than calendar trip duration; known overlaps/gaps are flagged. Adjacent different properties determine hotel changes in user order.

## Validation and acceptance

| Check | Result |
| --- | --- |
| Strict typecheck, lint, schema/reference/evidence validation | PASS |
| Unit / integration tests | **175/175 / 37/37 PASS** |
| Final PR production preview browser tests | **54/54 PASS** |
| Application main preview browser tests | **54/54 PASS** |
| Live Pages browser tests | **54/54 PASS** |
| Browser retries/skips/unexpected/flaky | **0/0/0/0** on passing final suites |
| Default and Pages-base production builds | PASS |
| git diff --check; intended scope; unchanged earlier engines/catalog/dependencies | PASS |
| Multi-hotel mixed bookings; edit recalculation; incomplete prices | PASS |
| Unknown/zero distinctions; stay-scoped discounts; final-total protection | PASS |
| Trip-wide balance/shortfall; manual FX; comparable weighted redemption | PASS |
| Deterministic replay without input/catalog mutation | PASS |
| Multiple trips/notes; remove/reorder; navigation memory and reload boundary | PASS |
| Desktop/narrow visual QA | PASS; full form, totals and expanded stay arithmetic inspected |
| Main CI / gated Pages deployment / live QA | All three jobs SUCCESS |
| Independent live HTML/JS/CSS | **200 / exact build match** |
| No live pricing / no Stage 7 work | PASS |

The combined browser suite retains all 44 previous feature checks and adds five Trip Builder scenarios at both 1366×900 and 390×844. Twenty-three new unit cases and five DOM flows independently verify the contracts and acceptance criteria. New screenshots: `trip-builder-full.png`, `trip-totals.png`, `trip-stay-arithmetic.png` for both viewports. Final PR and live images match the inspected preview pixels exactly. A direct cloud-browser inspection also confirmed the deployed title, navigation, Stage 6 indicator, create-trip control and visible reload/uncertainty disclosure.

Pre-merge browser checks caught dropdown/restored-note label instability and the old roadmap status expectation. All were corrected before the passing final PR and merge. No failed run is represented as a pass.

Local Chromium downloads returned truncated archives; local browser execution is not claimed. Chromium preview/live execution is provided by CI, with screenshots separately inspected. No physical-device, Safari/Firefox or comprehensive accessibility audit was performed.

## Catalog health

Assessed 2026-10-08 UTC: **25 properties, 6 brands, 24 destinations, 14 countries/territories, 25 sources, 260 evidence claims and one qualitative editorial assessment.** Zero schema/reference/duplicate/critical-evidence errors. Existing optional gaps/unknown coordinates remain. Trip quotes never become catalog evidence. Health validation checks evidence admission/structure and does not establish current availability or independently prove every hotel fact.

## Commits and workflow evidence

- Baseline main: `5a341e6602561b2be550038d17bff3b0c9937156`.
- Final implementation head: `80f0dc796c8996549ef1ea59bc6f26a9c1e27e56`.
- Locally validated and remotely committed application tree: `1985fcab6cb1ee521e513ff8dca6e436813bef64` — exact match.
- [Implementation PR #13](https://github.com/akv973/marriott-trip-planner/pull/13) — merged after passing checks and visual inspection.
- [Final PR CI](https://github.com/akv973/marriott-trip-planner/actions/runs/37823077153) — SUCCESS.
- [Final PR browser evidence](https://github.com/akv973/marriott-trip-planner/actions/runs/37823077153/artifacts/11569658556).
- **Verified application main/merge SHA: `84e493c131429f7231f2d06d193e1ecc23f287ec`.**
- [Application main CI / Pages / live QA](https://github.com/akv973/marriott-trip-planner/actions/runs/37823445960) — all three jobs SUCCESS.
- [Application main preview evidence](https://github.com/akv973/marriott-trip-planner/actions/runs/37823445960/artifacts/11570282485).
- [Application live screenshots/results](https://github.com/akv973/marriott-trip-planner/actions/runs/37823445960/artifacts/11569574634).

This report records the verified application commit before the documentation-only completion record. That record updates this report/current stage boundary, runs the same gates and does not change application artifacts. A commit cannot embed its own SHA; the final chat report identifies final main and its workflow.

## Deployment

**https://akv973.github.io/marriott-trip-planner/#/trips**

Pages deploy reports the exact environment URL, https://akv973.github.io/marriott-trip-planner/ . The live suite repeats multi-hotel calculations, incomplete pricing, quote invalidation, notes/order, JSON/evidence, history/reload and every prior feature flow.

| File | HTTP | SHA-256 | Build match |
| --- | --- | --- | --- |
| index.html | 200 | `e9a225b35322e70bf6948011e11bc0d2ce8a22998be3bd4b143e196c5437df19` | Exact |
| assets/index-C_wC11hV.js | 200 | `bce1d2e2e8b8a214fc7f701b85040ff940a0b651e759efde2d1110be90ccd02d` | Exact |
| assets/index-C2XZDveB.css | 200 | `1645b896597195c6cb4fc942ff57afca6cabf6df6ad29fcb1742cd26f5c856dd` | Exact |

## Limitations and unresolved issues

- Trips/notes are transient and clear on reload. Persistence, a local Bonvoy profile, certificates and versioned import/export remain Stage 7. Independent trip balances do not allocate a portfolio.
- Dates, quotes, FX, comparability, reservation status and balance are manual assertions. Reconfirm with Marriott; no availability/provider/account integration or automatic fee waiver.
- Nights are assigned hotel nights. Overlaps can contribute to this count and are flagged; gaps, transport and activities are excluded. Separate stays are never automatically combined.
- Paid-stay earnings, card rewards, effective elite benefits and certificates remain excluded under existing calculator assumptions.
- Production JS is approximately 571 kB (138 kB gzip); the inherited Vite chunk-size advisory remains. CI screenshot artifacts have limited retention. Cross-browser/physical-device/accessibility limits are stated above.

**No unresolved material issue within Stage 6 scope.**

## Recommended next stage

**Stage 7 — Local Bonvoy Profile**, only after separate explicit approval.

**STOPPING HERE. Stage 7 has not begun.**
