# Representative provider validation plan

Prepared **2026-10-14 UTC** under [ADR-018](../decisions/ADR-018-dynamic-data-research-gate.md). **PLAN ONLY — NOT EXECUTED.** Provider access, evaluation terms, spending and any later implementation need separate approval. This document is an evidence specification, not a test runner or monitoring job.

## Inventory before pricing

Obtain an explicitly licensed, complete Marriott inventory with snapshot time, pagination/completeness indicators, vendor ID, program code, official Marriott code where available, name, brand, country and location. Reconcile every row in the [100-property worksheet](provider-catalog-matching.md). Keep identity, cash support, award support and exact-date availability independent.

Use program + Marriott code and corroborating geography/official locator; inspect aliases, duplicate IDs, changed names and contradictions manually. No fuzzy match can auto-pass. Retain unmatched and ambiguous rows and the full denominator. All 100 are currently untested for each provider; no coverage percentage is available.

## Mandatory 20-property set

Names and codes below are baseline catalog values, not refreshed affiliation claims. Selection is deliberate risk sampling, not a random estimate of vendor-wide accuracy. All six regions in the existing catalog are represented.

| Stable catalog ID | Brand | Code | Country | Reason to include |
| --- | --- | --- | --- | --- |
| property-dove-mountain | Ritz-Carlton | TUSRZ | US | Mandatory; resort fees, tax and cash/award parity |
| property-grand-cayman | Ritz-Carlton | GCMRZ | KY | Resort/occupancy supplements and local versus quoted currency |
| property-ritz-kyoto | Ritz-Carlton | UKYRZ | JP | JPY zero-decimal currency and rate-plan comparisons |
| property-ritz-al-wadi | Ritz-Carlton | RKTRW | AE | Villa/product and package equivalence |
| property-st-regis-kanai | St. Regis | CUNXR | MX | Mandatory; resort charges, USD/MXN quote context |
| property-st-regis-maldives | St. Regis | MLEXR | MV | Transfers, meals and non-room charges |
| property-st-regis-new-york | St. Regis | NYCXR | US | City baseline; public/member and cancellation parity |
| property-new-york-edition | EDITION | NYCEB | US | Brand baseline and room-category matching |
| property-reykjavik-edition | EDITION | REKEB | IS | ISK/FX presentation and taxes |
| property-tokyo-edition-toranomon | EDITION | TYOET | JP | Similar-name Tokyo properties; prevent Ginza mis-match |
| property-gritti-palace | Luxury Collection | VCEGL | IT | Local taxes due at property and room category |
| property-al-maha | Luxury Collection | DXBAM | AE | Board/experience inclusions and guest restrictions |
| property-tambo-del-inka | Luxury Collection | CUZTL | PE | South America and rate/occupancy tax context |
| property-tasman-hobart | Luxury Collection | HBALC | AU | Oceania, AUD and dates spanning local midnight |
| property-jw-masai-mara | JW Marriott | NBOMJ | KE | Mandatory; continuous safari stay and package exclusions |
| property-jw-sao-paulo | JW Marriott | SAOJW | BR | BRL, tax and one/two-adult differences |
| property-jw-nairobi | JW Marriott | NBOJW | KE | Same-brand country control versus safari product |
| property-mapito | Autograph Collection | JROSK | TZ | Mandatory; lodge identity, inclusions and longer stays |
| property-mereshi | Autograph Collection | LKYMP | TZ | Mandatory; identity/affiliation uncertainty and missing inventory |
| property-cloudveil | Autograph Collection | JACAK | US | Conventional Autograph control versus safari products |

The reasons identify questions to test, not newly verified hotel fee or inclusion facts. Request currency variants only where supported; never infer the currency of a hotel quote from its country. Supplement this set with a three-decimal currency example approved by the vendor if available; a synthetic arithmetic exercise is not observed coverage.

## Exact contexts and bounded workload

Use one room, **one adult and two adults separately**, no children, and no traveler identity or account credentials. Request public retail and separately identified member rates only if licensed and documented. Each booking context must retain its channel and point program. These are synthetic evaluation dates, not personal trip plans:

| Arrival anchor | Purpose | Stay lengths |
| --- | --- | --- |
| 2027-01-12 | Nearer horizon and seasonal contrast | 1, 4, 5, 6, 7, 8 nights |
| 2027-05-11 | Middle horizon | 1, 4, 5, 6, 7, 8 nights |
| 2027-08-17 | Longer horizon and seasonal contrast | 1, 4, 5, 6, 7, 8 nights |

Checkout equals arrival plus the requested nights; no arrival-window query may be mistaken for an exact stay. If approval occurs after an anchor becomes unsuitable or falls outside supported booking horizons, record a replacement date and reason before execution.

**20 properties × 3 arrivals × 6 lengths × 2 occupancies = 720 contexts per provider**, 1,440 for two providers. Track two assessment slots, cash and award, per context; that is 1,440 slots per provider, not necessarily API calls. The first anchor alone is a bounded 240-context tranche. Complete later tranches only within the separately approved evaluation budget; disclose any unexecuted cells.

For Rooms, published lengths admit only 360 of the 720 contexts. Record the other 360 as documented unsupported lengths without issuing knowingly invalid requests. Retain unsupported cells in the denominator. If a vendor supplies only a default occupancy, mark unsupported/unverified occupancy rather than doubling records into artificial coverage. No short-stay stitching.

Request a written call/record/page/detail/retry estimate before a live evaluation. An approved vendor-supplied sample bundle can be inspected first, but does not establish query success, latency or current availability. No recurrent queries or calendar sweep is authorized by this plan.

## Sample bundle requested from each vendor

Ask for licensed documentation and sanitized request/response pairs covering:

1. Each of the five named mandatory properties and all six brands; exact identity and observation time.
2. Cash and Bonvoy awards separately at every stay length and occupancy, including supported and unsupported answers.
3. Full availability, cash-only, award-only, partial/missing dates, no result, unsearched dates, stale data, explicit negatives and removed/renamed properties.
4. Room/category and rate-plan IDs, bedding/occupancy, cancellation, board/package inclusions and extra charges. Ask specifically for park/conservation fees, drives and transfers on safari examples, without assuming their treatment.
5. Stay total and any nightly series, original currency precision, taxes/mandatory fees and amounts due on an award. Five-night samples must identify benefit inclusion and any pre-discount series.
6. Auth/permission errors, quota/burst rejection, timeout/upstream failure, malformed/changed schema, pagination and async refresh lifecycle where applicable. Vendor-supplied error samples cannot be counted as measured failures.

If representative cases are unavailable, report each omitted case as untested. No fabricated vendor fixture should fill the gap.

## Observation ledger and independent comparison

For every approved attempt, record provider/document version, request ID, exact query context, inventory mapping evidence, request/response UTC times, latency, collection time, cache age, HTTP/error state, page completeness and billable units. Retain raw data only as the license allows; keep credential values and personal data out of the repository.

Record cash and award outcomes independently as: supported/returned; explicit source negative; unsupported; untested; unknown/unsearched; stale; partial; or provider error. Track manual exclusions and reasons. Directory match alone is never a passed price context.

Capture a contemporaneous human check of the authoritative booking channel with identical property, dates, guests, room, rate plan, cancellation and inclusions. Target within 15 minutes of provider retrieval and retain both collection and check times; old cached collection is a separate mismatch explanation. The traveler or approved reviewer performs this manually; no automated Marriott lookup is proposed. Where parity cannot be established, record not comparable rather than an accuracy success.

Before execution, agree cash tolerance for currency precision/tax rounding. Proposed default for a comparable, contemporaneous pair is at most one minor unit per documented rounding step and zero points difference for an identical final Bonvoy total. Any broader tolerance requires a recorded reason and approval; do not hide mismatches inside averages. Compare nightly series only if actually supplied; verify its sum and discount treatment against the final total. Recompute net value with this planner's formula only after avoidable cash, award charges and equivalence are known.

## Reliability and negative cases

A separately approved evaluation should include two manual sessions on distinct days for 20 preselected supported contexts (all six brands and all five mandatory properties), with same-context human comparisons. These **40 rechecks per provider** are additional to the 720-context baseline; quote them explicitly. They are not a schedule or monitoring setup. Report elapsed dates and every attempt, including errors/retries; two sessions cannot establish an uptime SLA.

Use vendor-approved samples or an expressly permitted sandbox to check expired/invalid credentials, 403, 429 with retry instructions, 5xx, timeout, null/zero flags, incomplete pages, repeated IDs, stale/future timestamps, currency mismatch, renamed property and schema changes. Never exhaust a paid quota or disrupt production to manufacture failures. Validation must preserve manual inputs and compatible backups in a later implementation; this document changes no app behavior.

## Required readout and pass gates

Publish denominators for all 100 identities and all planned price slots, with unexecuted/unsupported cases retained. Report matched/unmatched/ambiguous/untested by brand, region and provider. For cash and awards separately report attempted/succeeded/explicit-negative/unknown/stale/partial/errors; returned products, comparable pairs, price matches, absolute price differences, availability false positives/negatives and uncheckable cases. Distinguish cached collection drift from response errors. Report latency distributions only with sample sizes and actual measurements.

Proposed project gates, not vendor claims:

- Written permitted supply and every intended use right must pass; no forbidden scraping or account dependency.
- All 100 inventory rows must be classified from complete evidence; unsupported identities may remain explicit unknowns in the product. Every property admitted to a proposed scope must have verified identity and separate cash/award support.
- Every admitted observation must have exact context, collection time, understood units/total and availability semantics. Comparable economics additionally requires complete fees and room/rate parity. No unidentified zero sentinel, guessed currency or duplicate discount can pass.
- No unresolved false-positive availability, wrong-property match, unit error or material price mismatch in the admitted evaluation set. Any mismatch needs resolution and targeted revalidation, or exclusion of that context. Do not claim general accuracy from a small sample.
- Contractual cadence/service limits must meet an explicitly agreed freshness policy; outage and manual fallback semantics must be accepted.
- Written costs, a hard budget cap, hosting decision and maintenance owner must be approved.

Until those gates pass, the result remains WAIT with Stage 13 implementation deferred. This plan's checks have not been executed and do not count toward the existing application's regression totals.
