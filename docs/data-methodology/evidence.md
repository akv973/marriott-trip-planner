# Data and evidence methodology

Stage 1 implements separate factual snapshots, sources, evidence and editorial records. See [domain and health definitions](catalog-model.md) and [seed research](seed-catalog.md). Stage 0's empty collections remain documented historically in its completion record.

## Source preference

1. Marriott corporate / Bonvoy program terms
2. Official Marriott property page, including the official Ritz-Carlton site
3. Official hotel website
4. Official hotel communication
5. Authoritative government/tourism source where relevant
6. Reputable third-party source
7. Traveler/community report

This hierarchy guides research; it never automatically selects truth. Specificity, applicability, recency and evidence quality matter. Preserve disagreements regardless of source rank. A hotel listing substantiates identity and observed affiliation without establishing current operations, pricing, availability or elite entitlements.

## Claim values and confidence

Subjects form a discriminated union: room count is a positive integer or null; brand is a Brand ID or null; geography, flags, tags and airports use matching validators. Arbitrary JSON and quality scores are not factual subjects. `operatingStatus` is a dated claim only; no seed operating status is asserted.

| Confidence | Maintainer meaning |
| --- | --- |
| High | Directly verified specific factual statement, typically first-party |
| Medium | Sourced baseline with constrained interpretation/classification or a material limitation |
| Low | Sourced known claim with weak reliability; requires careful review |
| Unverified | Observed but not verified, or explicit unknown |

All known claims require a Source, including Unverified claims. High/Medium/Low also require a known value and last verification date. Unknown claims may have a null source but must be Unverified with no verification date. At least one observation or verification date is required. Confidence is maintainer judgment, not probability or a substitute for evidence.

## Time and staleness

`observedAt` records observation; `lastVerifiedAt` records verification. Source `accessedAt` does not automatically refresh every claim. Optional `validFrom`/`validTo` form an inclusive interval. Verification cannot predate observation. Future validity is supported; future observation/verification is invalid for the assessment date.

Default useful lifespan is **365 days**, with **180 days for brand affiliation** and **90 days for operating status**. `StalenessPolicy.bySubject` permits per-field overrides. UTC age uses last verification, falling back to observation. Age strictly greater than threshold is potentially stale. Unknown/inactive claims are excluded. Staleness means review is due, not that a claim is disproven. CLI/CI do not fetch live hotel data.

## Conflicts

Retain all claims and Source IDs. Mark known disputes `conflictStatus: disputed`. Health also discovers unequal active sourced verified claims when flags were omitted. Group by Property/subject and expose all active claim IDs. Unknown/Unverified claims do not independently manufacture disagreement; explicit dispute flags remain visible. Comparison normalizes tag ordering and airport-object key ordering. Dates and source ranks do not select a winner.

Optional conflicted snapshots must remain null/omitted. Publishing one value as fact while retaining an unresolved disagreement fails validation. Required identity subjects cannot be null, so identity disputes block production admission while preserving developer diagnostics. Non-overlapping historical/future claims do not conflict with today's value. Independent fixtures cover explicit/discovered conflicts, stale claims, unknowns and temporal boundaries.

No scraper, undocumented endpoint, credentials, copied photography, rates or booking automation are included. Later observations follow their separately authorized stages and specific evidence requirements.
