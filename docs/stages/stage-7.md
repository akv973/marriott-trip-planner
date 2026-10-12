# STAGE COMPLETION REPORT

## Stage and status

**7 — Local Bonvoy Profile: PASS. Stage 7 is complete.** Stage 8 has not begun.

## Baseline and implemented scope

Started from verified Stage 6 main `c307ff575e77bde1f03de482402d5e0cc2e5ceb4`. [Implementation PR #15](https://github.com/akv973/marriott-trip-planner/pull/15) uses the approved React/TypeScript/Vite/Zod architecture and gated GitHub Pages deployment. Six sourced catalog collections, empty benefits, the points calculator and recommendation engines, dependencies, lockfile and workflow gates remain byte-for-byte unchanged. The manifest admits Stage 7 and rejects Stage 8. ADR-013 implements ADR-003 and explicitly supersedes Stage 6's transient-only trip boundary.

- Local UserProfile and Certificate contracts: manual Bonvoy status, points balance, personal USD cents-per-point valuation, certificate values/expiry/notes and all requested preferences. Unknowns remain null; zero balance remains a known zero. Status does not invent effective elite benefits.
- Profile and full ordered trip workspace persist together in this browser across navigation/reload. Complete manual prices, FX, quote dates, room/cancellation context, reservation assertions and notes are preserved. Personal data is absent from URLs and static artifacts.
- Replaceable ProfileRepository / LocalStorageProfileRepository, strict runtime validation, safe ID sequence and catalog references. Invalid drafts preserve the last valid saved planner. Corruption/unsupported versions are retained without automatic overwrite; quota/denied storage remains usable in memory. Stale-tab conflict detection prevents silent overwrites. Visible save status and explicit backup/recovery actions explain these boundaries.
- Actual version-1 JSON download and inspectable backup text; file/paste import validates and previews before explicit whole-planner replacement. Reconstructs profile, certificates, all trip/stay data, active trip, sequence, unknowns and manual-default flags. Malformed/foreign JSON, unknown fields, bad references/IDs and files over 5 MB are rejected without replacing plans. Valid imports still reconstruct in memory when browser writes fail. No older persisted format existed; unsupported versions fail rather than silently stripping fields.
- New trips explicitly inherit live profile balance/valuation. Editing either field, including clearing it to unknown, preserves a manual override. Profile changes recalculate inherited totals; an explicit control restores profile defaults. Existing manual Trip objects without flags retain their values. The standalone calculator starts from profile assumptions and keeps editable manual inputs; supported recommendation preferences/quote assumptions apply only through an explicit action.
- Preferred/disliked brands, destinations, trip types, typical duration, luxury level, cash sensitivity, hotel-change willingness and lounge/suite importance persist. Recommendations can apply trip types, a single preferred destination and typical nights; other fields remain disclosed planning context without new quality/benefit assumptions.
- Independent dated one-night certificate assessment, selected certificate trip method, inspectable eligibility/top-off/unused face value/reasons and whole-trip points shortfall. Missing value/expiry/date/quote/eligibility preserves unknown points. Duplicate certificate use within a trip blocks totals. Certificate stays do not apply a free-night discount. Cash remains manual, and certificate CPP/opportunity-cost aggregates are withheld rather than treating face value as cash. Trips remain independent alternatives rather than reserving inventory across trips.
- Existing explorer, sourced details, comparison, manual calculator, deterministic recommendations and mixed multi-hotel cash/points trips are preserved. Existing unknown, stale, conflicting and editorial distinctions remain intact. No authentication, live pricing, account integration, benefit engine, watchlist or portfolio allocation was introduced.

See [local profile architecture](../architecture/local-bonvoy-profile.md) and [ADR-013](../decisions/ADR-013-local-bonvoy-profile.md) for precise contracts, calculations and failure behavior. Trip result methodology is `trip-totals-2`; cash/points-only arithmetic remains identical to Stage 6.

## Current Marriott certificate rules

Reviewed primary Marriott sources on **2026-10-12**: [Bonvoy terms §3.3.c–d](https://www.marriott.com/loyalty/terms/default.mi), the official current top-off announcement and [Free Night Award guidance](https://help.marriott.com/s/article/marriott-free-night-award). The implemented policy is `marriott-fna-2026-10-12` with **25,000 points maximum top-off per award/night**, replacing the older 15,000 limit.

One certificate covers one eligible standard-room Standard/PointSavers night; unused face value is forfeited. Stay date must be on/before entered expiry, and an already expired certificate is ineligible. Premium/nonparticipating/excluded property use, gifted/member-absent use and cash combinations are excluded. Free Night Awards do not qualify for Stay for 5, Pay for 4. Award cash still payable is entered manually; no fee waiver or availability is inferred. Member presence, property participation and standard-room eligibility require the user's confirmation.

The bounded UI uses one-night certificate stays. Multiple certificate nights can be represented separately; a points-only free-night discount cannot be inferred across the remainder of a mixed certificate reservation. Top-off = max(0, standard-room night points − certificate face value), subject to the cap. No purchase/transfer is assumed. 85,000 + 25,000 = 110,000 is eligible for arithmetic; 110,001 is over the cap. On the exact expiry day the night can pass the date check; the following day cannot.

## Validation and acceptance

| Check | Result |
| --- | --- |
| Typecheck / lint / schema-reference validation | PASS |
| Unit tests | **211/211 PASS** |
| Integration tests | **45/45 PASS** |
| Final PR production preview E2E | **62/62 PASS** |
| Main production preview / live E2E | **62/62 / 62/62 PASS** |
| Retries / skips / unexpected / flaky | Final PR / main preview / live: **0 / 0 / 0 / 0** |
| Default and Pages-base production builds | PASS |
| Reload persistence / version-1 reconstruction | PASS |
| Profile calculation updates / manual unknown overrides | PASS |
| Certificate cap, expiry, eligibility, unknowns, no double use | PASS |
| Invalid drafts, corruption, quota/denial and stale-tab preservation | PASS |
| Regression tests / preserved source and engine boundaries | PASS |
| Desktop/narrow visual inspection | **PASS**; PR and live screenshots inspected |
| Main checks / gated deployment / live QA | All three jobs **SUCCESS** |
| Independent deployed HTML / JS / CSS | **200 / exact build match** |
| git diff --check / Stage 7-only scope | PASS |

The browser suite retains all 54 prior feature scenarios and adds four profile/persistence/import/certificate scenarios at both 1366×900 and 390×844. Intentional earlier-test updates reflect the authorized persistence boundary, profile-backed unknown valuation and new trip methodology version. The final PR suites have no retries, skips, unexpected outcomes or flaky results. Added independent unit and DOM checks verify malformed/unknown inputs, exact reconstruction, selected-booking math, live profile defaults, manual overrides, storage failure and corruption/conflict behavior.

Inspected desktop/narrow screenshots: `profile-full.png`, `import-preview.png`, `certificate-trip.png`. Layout, form labels, long disclosure wrapping, backup preview, certificate arithmetic, totals and navigation are usable without horizontal page overflow. A direct cloud-browser read confirms the deployed Profile title, Stage 7 indicator, unknown initial fields, certificate policy links and visible browser-local/no-login disclosures.

Local Chromium installation returned truncated archives; local E2E execution is not claimed. Production preview and live Chromium browser execution are provided by CI, with screenshots inspected separately. No physical-device, Safari/Firefox or comprehensive accessibility audit was performed.

## Catalog health

Assessed 2026-10-12: **25 properties, 6 brands, 24 destinations, 14 countries/territories, 25 sources, 260 claims and one editorial assessment.** High confidence 185; Medium 75; Low/Unverified 0. Profile values and manual prices are not catalog claims.

| Metric | Result |
| --- | --- |
| Schema errors / orphaned references / duplicate IDs or slugs | **0 / 0 / 0 / 0** |
| Missing critical evidence / conflicting claims / stale claims / unverified claims | **0 / 0 / 0 / 0** |
| Optional incomplete records / unknown coordinates | **25 / 25**, preserved |

Schema/health validation verifies admission, evidence structure and references; it does not prove current hotel availability or independently reverify all property facts.

## Commit and workflow evidence

- Baseline main: `c307ff575e77bde1f03de482402d5e0cc2e5ceb4`.
- Final implementation head: `8c95123eb68af613cb5ef65567d6cd5e7ae1cfdd`.
- Locally validated / remotely committed implementation tree: `ca2e1077aa0288a5f261e968ac07b821bf221df3` — exact match.
- [Implementation PR #15](https://github.com/akv973/marriott-trip-planner/pull/15), merged after passing CI and desktop/narrow visual inspection.
- [Final PR CI](https://github.com/akv973/marriott-trip-planner/actions/runs/38289387289) — SUCCESS.
- [PR browser evidence](https://github.com/akv973/marriott-trip-planner/actions/runs/38289387289/artifacts/11764726777).
- **Application main/merge SHA: `c825affd92a177d6f7fba60a7c061382847463a5`.**
- [Application main checks / deployment / live QA](https://github.com/akv973/marriott-trip-planner/actions/runs/38289910965) — all three jobs SUCCESS.
- [Application main preview evidence](https://github.com/akv973/marriott-trip-planner/actions/runs/38289910965/artifacts/11765690570).
- [Application live screenshots/results](https://github.com/akv973/marriott-trip-planner/actions/runs/38289910965/artifacts/11765416188) — 62 expected, 0 skipped/unexpected/flaky.

This record identifies the application SHA before a documentation-only completion record. That record changes the report/current stage boundary and runs the same gates, with identical application assets. A commit cannot embed its own SHA; the final chat report identifies final main and its workflow.

## Deployment

**https://akv973.github.io/marriott-trip-planner/#/profile**

Pages is deployed at **https://akv973.github.io/marriott-trip-planner/**. The live browser suite repeats profile/trip reloads, downloadable backup reconstruction, manual overrides, certificate review/cap/expiry, malformed import and corruption recovery alongside all earlier feature flows.

| File | HTTP | SHA-256 | Build match |
| --- | --- | --- | --- |
| index.html | 200 | `fb2037f1549083f8243f4adb88af342fc9fad743e0f5fc9402e0d0c00a5cc6b6` | Exact |
| assets/index-CO1ZHZiI.js | 200 | `dd9d4ba655f1dcf6e44ff2895a545f89d6ee0f2d66885f4ee98763dbf3cc50dc` | Exact |
| assets/index-Cl6oXoVQ.css | 200 | `26ac8fc64ee67f089c097b3844d00559ca2b07aeedb5d1134b364ccb4ce34b61` | Exact |

## Known limitations and unresolved issues

- Data is browser/device-local; clearing browser data erases the saved planner. Private JSON exports provide transfer/recovery. There is no cloud sync, account verification or authentication.
- Invalid drafts stay in memory; reload restores the last valid saved planner. Save-denied/quota/tab conflicts are disclosed rather than silently losing or overwriting data. Exports require valid drafts and are bounded to 5 MB; unsupported schema versions fail safely.
- Certificate planning supports separate one-night entries and manual eligibility. No award availability, automatic expiry extensions, certificate cash valuation or portfolio allocation is assumed. Trips do not reserve certificates/points across alternatives.
- Status and all preferences persist; effective elite benefits remain Stage 8. Only already-supported recommendation preferences apply to scores; other preferences remain labeled context.
- Standalone calculator/recommendation drafts remain transient; full trip pricing/context persists. Profile valuation starts unknown; 0.8¢ remains an optional editable planning assumption.
- Sparse optional catalog data and unknown coordinates are preserved. Physical-device/cross-browser/accessibility limits are stated above. The inherited Vite large-chunk advisory remains (about 597 kB JS / 145 kB gzip); it is not a failed build.

**No unresolved material issue within Stage 7 scope.**

## Recommended next stage

**Stage 8 — Elite Benefit Engine**, only after separate explicit approval.

**STOPPING HERE FOR REVIEW. Stage 8 has not begun.**
