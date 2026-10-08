# Stage 5 recommendation engine

`#/recommendations` uses the existing validated 25-property catalog. `lib/scoring/` owns strict requests, eligibility, fit components, independent points-engine evaluation and structured deterministic explanations. UI owns transient drafts, rendering and navigation. No catalog facts, numeric ratings or benefit rules were added. No trip entity, itinerary totals, profile persistence or provider exists.

## Layer 1: eligibility

Operating status, optional required country and required **recorded** setting tag produce `met`, `failed` or `unknown` checks through existing evidence presentation. Fresh known closed, temporarily closed and planned statuses exclude an operating stay. Missing, disputed, unverified or stale required evidence is provisional. An absent required tag excludes by the requirement to have that tag recorded; tags are not an exhaustive activities inventory. Required lounge access is unknown until benefit rules exist. Date-specific availability is always unverified.

An optional USD cash-outlay limit uses matching manual quotes. Cash cost includes room, taxes and mandatory fees. An award uses cash still payable and an independent points-balance check. The permitted booking method selects allowed paths. `either` passes if one path is confirmed feasible; it fails only if both are confirmed infeasible. Missing costs, FX or balance remain unknown. Favorable CPP does not establish affordability. No transfer or points purchase is assumed. Inspectable budget fields include USD costs, limits and separate feasibility booleans.

Any failed check makes the candidate `excluded`; otherwise any unknown required check makes it `provisional`; otherwise `eligible`. These labels never establish date-specific inventory. Exclusions remain inspectable with all reasons.

## Layer 2: versioned trip fit

Default methodology: **trip-fit-1**. ADR-005 assigns the brief's illustrative redemption weight to experience preference, preserving independent economics.

| Component | Default weight | Rule / provenance |
| --- | --- | --- |
| Property quality | 30 | Mean of reviewed editorial hardware and service ratings, both required; scale 0–10 to 0–100 |
| Destination preference | 20 | Exact curated destination: 100, another: 0; fresh country/region must match destination context |
| Experience preference | 20 | Fraction of requested tags recorded × 100; fresh sourced tags describe setting, not hotel quality |
| Elite benefits | 15 | Unknown until evidence-backed benefit rules exist; brand/editorial potential never guarantees access |
| Uniqueness | 10 | Reviewed editorial uniqueness × 10 |
| Airport logistics | 5 | `max(0, 1 - sourced distanceKm / user distance scale) × 100`; no driving-time inference |

Destination, experience and logistics are inactive without a preference; zero-weight components are inactive. Weights must be finite, nonnegative, at most 100 and total 100. Changed weights label the method **trip-fit-1-custom** and appear in complete request/result JSON. Replay needs actual custom weights, not just the version label.

The latest editorial review on/before explicit `asOf` is selected, with ASCII assessment-ID ascending ties. Author, review date, rationale and assessment methodology remain visible. No brand-based luxury assumptions. The seed currently has no numeric editorial ratings.

An active known component contributes `score × weight / 100`; unknown contribution stays null. Let A be active weight, K known active weight and C summed known contributions. Lower bound = `100 × C / A`; upper bound = `100 × (C + A - K) / A`; coverage = `100 × K / A`. Full fit score stays null unless all active weight is known. With no active weight, score/bounds are null and coverage 0. Unknown weights remain in the denominator. Bounds are supported and possible contributions, never imputed zero ratings or renormalization over known values.

Ordering is eligibility (eligible, provisional, excluded), supported lower bound descending (null last), coverage descending, then ASCII property ID ascending. Prices and CPP never sort fit. Sparse ties imply no quality superiority. Partial results show coverage/range, not a complete hotel-quality rating.

## Layer 3: independent economics

One optional manual quote per property calls unchanged `lib/points/calculatePoints`. The full calculator retains flat/variable nightly awards and configurable bands. Stage 5 quote UI accepts final quoted points and cash room/taxes/fees/award-cash **stay totals**, ten currencies/manual FX, personal valuation, optional balance, comparability, check-in and observation date. Default valuation and bands are Stage 4 planning choices, not Marriott policy.

Final points must already include discounts/upgrades; no second fifth-night deduction. Blank stays null; confirmed zero stays 0. Zero points has undefined CPP. Missing costs, FX, valuation or comparable terms cannot produce a booking verdict. Value, cash budget and award affordability are separate.

Quotes with different nights or a check-in differing from an explicit request date are unavailable. Changing nights clears applied quotes. Invalid/future observation dates, duplicate/unknown property IDs, invalid prices and unsupported request fields are rejected. Missing quote dates are disclosed. A dated manual quote is not guaranteed current pricing or availability; it is a user assertion, not catalog evidence.

Draft and applied quotes are explicit. Draft changes do not replace the prior quote until Apply; switching property restores its applied quote as a draft. Input/applied-quote edits clear prior results. Generation focuses results. Reload, page exit and Clear discard transient data. Nothing is written into deployment artifacts or browser storage.

## Layer 4: structured explanation

Outputs retain eligibility checks; fit components, provenance kinds, details, coverage/bounds; independent economics/budget fields; quote dates; strengths, weaknesses, missing data and uncertainty. Fixed templates derive explanations from those fields. Known component scores ≥70 produce preference strengths; <40 produce weaknesses. Editorial strengths/weaknesses remain separate and labeled. Absent lists do not prove no weaknesses.

Excellent fit may coexist with poor award value; excellent redemption may coexist with weak fit; attractive value may coexist with insufficient points. Request/results JSON is inspectable. Identical catalog, full request (including `asOf`), methodology and policy produce identical results. The engine reads no clock, storage, network, randomness or locale-dependent ordering.

## Boundaries and verification

Catalog collections, legacy calculator logic, dependencies and lockfile stay unchanged. Hash navigation retains explorer/comparison context. Manifest admits Stage 5 and rejects Stage 6. Unit fixtures independently specify scoring arithmetic, budgets, nulls, statuses, source conflicts/freshness and ordering. DOM integration checks cover manual quotes, rendering, errors and evidence. Existing plus new desktop/narrow browser flows run on preview and live Pages. Screenshot inspection is recorded separately.
