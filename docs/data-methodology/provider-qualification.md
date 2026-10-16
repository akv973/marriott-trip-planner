# Provider qualification follow-up

Reviewed **2026-10-14 UTC**. Baseline: `d0ab9ddc15a426b71d2b95971dcde30fa0d8dc44` (`v1.0.1`). This is a bounded follow-up to [Stage 12](dynamic-data-research.md), its [source register](dynamic-data-sources.md), and [ADR-018](../decisions/ADR-018-dynamic-data-research-gate.md).

## Decision

**WAIT for provider qualification; NO-GO for Stage 13 implementation on present evidence.** Neither candidate satisfies all five ADR-018 gates. This does not establish that either vendor is incapable of qualifying. Manual dated pricing remains the production approach.

| Candidate | Cash assessment | Bonvoy award assessment | Decision |
| --- | --- | --- | --- |
| Rooms.aero | Documented cached cash observations; completeness and comparability untested | Documented cached Bonvoy discovery; all catalog matches and accuracy untested | WAIT for a limited supported-context candidate; NO-GO for continuous 6–8-night quotes under the published contract |
| Odynn / Awayz Data | Claimed paired cash data; no inspectable Marriott response obtained | Claimed award data; exact Bonvoy redemption semantics unproved | WAIT for data-only access, rights, inventory, samples, service commitments and quote |

**No Stage 13 proposal is issued because qualification requirements are unsatisfied.** Existing ADR-018 boundaries remain; this follow-up does not approve an adapter, provider interface, service, account connection or persistence change. Stages 13, 15 and 16 remain deferred.

Review materials:

- [Dated primary-source register and retrieval limitations](provider-qualification-sources.md).
- [100-property matching worksheet](provider-catalog-matching.md).
- [Representative validation plan](provider-validation-plan.md).
- [Vendor questionnaires and unsent outreach drafts](provider-vendor-review.md).
- [Completion and preservation record](../stages/provider-qualification-follow-up.md).

## Evidence actually inspected

Public primary documentation and published terms were read. No vendor was contacted; no account, subscription, credential or agreement was obtained. There were **zero authenticated pricing requests and zero contemporaneous hotel-price comparisons**. Sample inspection below means a published documentation example, not a successful production API response. Searches supplement direct reads; marketing and search snippets cannot establish a schema or service commitment.

The original Stage 12 findings remain historically intact. The current application is the released manual Stage 14 planner; Stage 12's statement about its then-current Stage 11 deployment is historical.

## Access and reuse rights

Rooms documents eligible Pro access for non-commercial use and written agreement for commercial use. Requests use `Partner-Authorization`; personal access is discretionary and subscription-dependent. OAuth is an available vendor mechanism, not a proposed project feature. Its personal allocation is 1,000 calls per UTC day, with remaining/reset headers and `Retry-After` on exhaustion. Commercial access and quotas need project-specific confirmation. [Q01](provider-qualification-sources.md#q01)

Seats terms, updated August 12, 2026, require attribution and a link at search/display, and written commercial API permission. Their general Pro automation prohibition needs written reconciliation with the API guidance for this application. The restriction about public flight results beyond 60 days is flight-specific; it does not resolve hotel display rights. The stated Pro price is $9.99/month or $99.99/year, not a public-planner license quote. Best-effort service and cached/phantom-data cautions prevent a reliability guarantee. [Q07](provider-qualification-sources.md#q07)

Odynn invites requests for sandbox access; no accessible hotel payload was obtained from its developer page. [Q09](provider-qualification-sources.md#q09) Its September 3, 2026 terms restrict copying/distribution, automation, similar services and public display/derivative use absent authorization, with limited revocable access and warranty disclaimers. A negotiated data agreement must specify applicable exceptions and precedence, including any eligibility/competitive-use restriction. Consumer access is insufficient evidence of permission. [Q10](provider-qualification-sources.md#q10)

The following are **unresolved contractual questions for both vendors**, not inferred prohibitions or grants:

| Required use | Evidence needed before admission |
| --- | --- |
| Public display | Written approval for the independent GitHub Pages planner and its audience, including whether non-commercial public access is acceptable and required attribution/links |
| Cache | Permitted browser, server and CDN layers; maximum TTL; revalidation; stale display; request deduplication; prohibited fields |
| Local storage | Permission for dated quote observations in saved trips, with retention, historical display and offline behavior |
| Backup/export/import | Explicit JSON export, user retention, sharing limits and later re-import rights; raw versus normalized fields; treatment after vendor termination |
| Derived calculations | Cash avoided, net CPP, fifth-night handling and portfolio allocations; whether derived outputs can persist/export independently of raw prices |
| Research evidence | Permission to retain/reproduce approved samples and validation observations, including public repository versus private review restrictions |
| Supply/provenance | Written representation that supply and downstream uses are authorized; disclose collection method and whether prohibited parsing, traveler credentials or booking obligations are involved |
| Termination | Revocation/deletion process, treatment of already exported copies, permitted historic user records and independent manual values |

An API key does not clear these uses. If a needed right is refused, reject that use or return for an explicitly approved scope revision; silently stripping backup compatibility is unacceptable. Personal planner contents are not required for vendor qualification.

## Cash, awards and stay semantics

Rooms Get Availability admits 1–5 nights, up to 50 hotel IDs, and pages up to 500 rows. Its default filters for awards; `rate_type=cash` or `any` is needed to avoid excluding cash-only rows. Only future arrivals checked within 21 days are returned. Search date bounds describe arrivals rather than the entire stay. These are documented interface limits, not observations of current coverage. [Q02](provider-qualification-sources.md#q02), [Q06](provider-qualification-sources.md#q06)

Odynn describes Awayz Data as independently licensable paired award/cash pricing, with historical series and live queries. Its aggregate collection-volume claim does not prove refresh for any particular Marriott/date. Portal hotel totals do not prove award-program coverage. [Q08](provider-qualification-sources.md#q08) The FAQ discusses awards and points-as-cash separately; the required data must identify actual Bonvoy redemption inventory rather than payment with a proprietary rewards currency. [Q11](provider-qualification-sources.md#q11)

| Requirement | Rooms.aero qualification status | Odynn / Awayz Data qualification status |
| --- | --- | --- |
| 1 night | Documented; Marriott sample/accuracy untested | Unverified |
| 4 nights | Documented; full-stay sample untested | Unverified |
| 5 nights | Documented; Bonvoy benefit inclusion unverified | Unverified |
| 6, 7 and 8 nights | Outside published range; no complete quote supported by that contract | Unverified; request each length explicitly |
| Per-night breakdown versus total | Published example/units inspected below; Marriott nightly breakdown not inspected | Neither response granularity nor unit contract inspected |
| Room equivalence | Detail endpoint promises room types, but complete room/rate-plan schema not inspected | Unverified |
| Guest context | One/two adults, children, extra-person charges and room count not established for supplied data | Unverified |
| Cash channel | Exact rate plan, public/member status, booking eligibility and Bonvoy qualification unverified | Retail/direct/OTA/net channel and qualification unverified |
| Taxes and fees | Itemization, inclusions, amounts due at property and award surcharges unverified | Same unresolved fields |
| Currency/FX | Documentation supplies currency/units; zero- and three-decimal handling and FX provenance need confirmation | Currency units, FX source/time and rounding unverified |
| Cancellation and inclusions | Refundability, board, drives/transfers, park fees, minimum stays and supplement parity unverified | Same unresolved fields |
| Availability | Flags describe an observed product; absent/stale rows cannot certify sold out | Positive, negative, partial, unchecked and stale states unverified |

No cash observation establishes an award; no award observation establishes a comparable cash product. An average stay cost is not an observed nightly series. Adjacent short stays cannot prove continuous room availability, cancellation equivalence or a 6–8-night total. Five-night totals must identify any discount already applied; do not discount twice or assume every fifth chronological night is the free one.

## Published sample inspection

**Rooms — published one-night Hyatt example only.** The inspected fields below are documentation, not a Marriott transaction. No fixture is added. [Q03](provider-qualification-sources.md#q03)

| Example fields | Inspection result |
| --- | --- |
| `source`, arrival/departure, `num_nights` | `hyatt`; November 21–22, 2026; 1 |
| `cash_currency_code`, `standard_cash_cost` | USD; 68500, meaning $685 stay total under documented minor-unit convention |
| `standard_award_cost`, `standard_cpp` | 30000 stay-total points; 2.28 reported CPP |
| Suite availability and cost | False with zero cost; not a free suite |
| `last_checked_at` | September 7, 2026, 03:58:01 UTC; not a collection time for this review |

Independent arithmetic gives $685 / 30,000 × 100 = 2.2833 cents/point. Net value remains unproved without fees and product parity. Q03 defines UTC timestamps and conditional cash collection alongside awards, not universal Marriott cash coverage.

The documented detail route returns rooms and an exact-stay booking link [Q04](provider-qualification-sources.md#q04), but its response selector did not expose an inspectable body in the text read. Published `.md` versions returned retrieval errors, including direct HTTP 403; no attempt was made to bypass this. No Marriott hotel-list/detail, multi-night, tax, occupancy or error-response transaction was tested. The example error/envelope descriptions are documentation, not observed server behavior.

**Odynn — no sample payload inspected.** Public product/developer pages do not supply the Marriott data body needed here. Schemas, successful/negative responses and comparative price accuracy remain explicitly untested. No samples were invented and no restricted developer endpoint was probed.

## Catalog matching and coverage

Baseline inspection finds **100 stable IDs, 100 official URLs and 100 unique non-null Marriott codes**. Brand counts are 30 Ritz-Carlton, 22 St. Regis, 9 EDITION, 20 Luxury Collection, 13 JW Marriott and 6 Autograph. These are repository facts, not provider results.

Rooms documents matching by the program's own `internal_id` combined with `source`, plus directory paging and name/geography filters. [Q05](provider-qualification-sources.md#q05) Use these only after permitted inventory access; never guess a vendor opaque ID. Odynn's property identifier and crosswalk contract remain unknown.

| Evidence state, per vendor | Identity | Cash coverage | Award coverage |
| --- | ---: | ---: | ---: |
| Confirmed matches/support | 0 established | 0 established | 0 established |
| Confirmed exclusions | 0 established | 0 established | 0 established |
| Confirmed ambiguous identities | 0 established | — | — |
| Untested catalog rows | 100 | 100 | 100 |

**This is not 0% actual provider coverage. Coverage is unmeasured.** Every row is retained in the [worksheet](provider-catalog-matching.md); names/codes are copied from the baseline and are not reverified current affiliation evidence. Mapito `JROSK`, Mereshi `LKYMP`, JW Masai Mara `NBOMJ`, Dove Mountain `TUSRZ` and Kanai `CUNXR` are mandatory validation targets, with no vendor matches assumed.

Match program + code, then corroborate name, country and location against the official locator and coordinate overlay. Case normalization is acceptable; a code conflict, alias, relocation, duplicate or rebrand requires human review. Names alone are insufficient. Classify inventory identity separately from cash support, award support and an exact date's availability. A missing inventory response is untested; a complete inventory with no match may establish unmatched within that provider, never hotel closure.

## Reliability, ongoing cost and maintenance

Rooms refresh is queued, normally appearing within minutes, and its documented personal allowance is one hotel refresh per user per 24 hours shared with the website. This cannot make a catalog-wide freshness promise. No refresh was triggered. [Q12](provider-qualification-sources.md#q12) Provider collection time must remain distinct from our retrieval time; a 21-day admission window is not a daily refresh commitment.

No negotiated per-property cadence, p95 latency, uptime SLA, outage history, production burst/concurrency allocation, support response time, version notice or project license price was obtained for either candidate. Odynn's volume/marketing latency statements are not data-only API guarantees. Accuracy, latency and reliability have not been measured.

Rooms documents validation, authentication, quota and missing-ID responses; these have not been transaction-tested. Odynn's data-only error contract remains unknown. [Q02](provider-qualification-sources.md#q02), [Q04](provider-qualification-sources.md#q04)

| Area | Required evidence or operational treatment |
| --- | --- |
| Failure behavior | Distinguish auth/permission, quota, timeout, schema, upstream, unsupported and explicit negative states. Preserve unknown/manual planning; respect retry instructions and never infer sold out from an error |
| Stale/partial data | Show collection age, room/context limitations and source; exclude ambiguous economics; no live or guaranteed-bookable label |
| Cadence and support | Contract property/date/length cadence, freshness cutoff, incident contact, escalation, version pinning and deprecation notice |
| Usage accounting | Quote billable requests/rows/details/pages/retries separately; establish burst and monthly caps, concurrency, hard overage stop and credential rotation |
| Monthly budget | Itemize license minimum, setup, sandbox, request/record charges, support, server hosting, taxes, overages, cancellation and price-change notice; no price assumed |
| Maintenance owner | Name an owner before any integration; review mappings/terms/schema and stale/error metrics, handle incidents and delete licensed data as required |

For a quote request, model the planned **720 exact contexts per provider** separately from an illustrative **1,000 user-initiated contexts/month**, with a 3,000-context sensitivity case. These are budgeting assumptions, not scheduled scans or authorized calls. Actual calls depend on batching, pagination, detail requests and the ability to request both rates/occupancies together. Documented personal limits are not a shared-public-service entitlement.

Analyst estimate, not vendor commitment: Rooms would likely impose medium maintenance effort (matching, pagination, stale data, sentinel values and rate-plan parity); Odynn medium-to-high with low confidence until its contract/schema is available. Reserve 2–4 maintainer hours/month plus incident time as an initial planning assumption; revise from observed evidence. Infrastructure cost and owner remain unapproved/unnamed, so affordability has not passed.

## Qualification gate ledger and review boundary

| ADR-018 gate | Rooms | Odynn | Concrete evidence still needed |
| --- | --- | --- | --- |
| Rights/access | OPEN | OPEN | Written answers to rights matrix; applicable contract and permitted upstream supply; evaluation access without accepting unapproved terms |
| Coverage | OPEN | OPEN | Licensed complete inventory, all-100 crosswalk, independent cash/award support and exact-context outcomes |
| Semantics | PARTIAL / OPEN | OPEN | Authorized Marriott samples at all requested lengths/occupancies; totals, fees, rooms, currencies and availability states; Rooms longer-stay limit remains a scoped NO-GO |
| Reliability | OPEN | OPEN | Agreed cadence/limits/service support plus separately authorized measured validation |
| Budget/maintenance | OPEN | OPEN | Written quote at modeled volume, approved ceiling/hosting, named maintenance owner |

GO requires every applicable gate to pass for a precisely bounded scope and every admitted observation to satisfy the validation plan. Unsupported properties can remain explicit unknowns; unmeasured properties cannot become supported. If a smaller scope excludes continuous safari stays, that would require an explicit product decision and renewed qualification, not a silent exception to ADR-018.

The next review can approve or revise the **outreach drafts only**. Sending, access requests, accounts, subscriptions, accepting terms, evaluation requests and Stage 13 implementation remain separately controlled. No message was sent and no paid commitment was made. Stop here for review.
