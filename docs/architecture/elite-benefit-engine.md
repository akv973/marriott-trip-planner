# Elite Benefit Engine — Stage 8

`data/benefits/index.json` contains strict schema/version, 28 official sources, 58 rules, 25 property reviews and two explicitly editorial observations. The six sourced catalog collections remain unchanged. `lib/benefits/schema.ts` validates shape and cross-references; foundation validation blocks malformed/nonofficial/orphaned policy claims and missing reviews. Stage 8 is admitted; Stage 9 is rejected.

`lib/benefits/engine.ts` resolves ten independent categories: breakfast, lounge, club, room upgrade, suite upgrade, late checkout, welcome gift, bonus, Your24 and 48-hour availability. Each returns a typed outcome, basis, conflict, reasons and sorted rule trace. Neither UI nor editorial narratives implement policy. Room/suite eligibility, physical lounge presence, premium Club admission and welcome choices are separate. Included meals do not manufacture an elite breakfast benefit. Points bonus is descriptive only; manual cash/points calculations are unchanged.

## Resolution

1. Assess current matching catalog brand, resort and room-count evidence; stale or conflicting values become null. Reviews supply separately sourced lounge/convention/program-scope context. Event space does not imply convention classification.
2. Keep rule selectors for the property/brand/category, assess status, known conditions, validity and confidence. Preserve nonmatching, expired, future, stale and superseded rules in the trace. Policy/review freshness threshold: 180 days.
3. Choose the highest possible layer: property, brand, status. Unknown conditions cannot be assumed false and cannot be bypassed by selecting a lower rule. A current confirmed outcome can agree with unresolved rules carrying the identical outcome. Unverified evidence alone never establishes an entitlement.
4. Conflicting current selected claims, explicit disputes or opposing official elite entitlements across property/base rules yield unknown and a conflict. Preserve both sources. Normal refinements and meal inclusions are not fabricated conflicts. No arbitrary source-date tie breaker.
5. Explain conditions, selected rule, precedence, provenance, confidence and date; show independent editorial notes.

## Current official research

Verified 2026-10-12 against the September 2026 [Bonvoy terms](https://www.marriott.com/loyalty/terms/default.mi), [All-Inclusive supplemental terms](https://www.marriott.com/loyalty/terms/supplemental-terms/All-Inclusive.mi), [small-property exclusion list](https://help.marriott.com/s/article/marriott-48-hour-guarantee) and all 25 official property pages. See [property audit](../data-methodology/benefit-property-audit.md).

Policy facts are dated. The current §4.3.c.ii includes select suites for Platinum and higher at the catalog brands, subject to arrival availability for the full stay; it excludes Ritz-Carlton direct Club access. Do not encode an older Titanium-only Ritz suite rule. The lounge guarantee is brand-specific and excludes JW/Autograph resorts; published property-specific access can resolve unknown context. Ritz/EDITION welcome gifts do not include restaurant breakfast. Resorts and convention properties do not carry guaranteed 4 p.m. checkout. Your24 requires approval. Small-property and resort exceptions qualify the paid 48-hour guarantee. Regional welcome/alternative rules retain their conditions.

Safari marketing alone does not confirm participation in the separate all-inclusive loyalty regime. Mapito, Mereshi and JW Masai Mara scope is null; no welcome, lounge, upgrade or checkout policy is inferred from the standard brand in this ambiguity. Confirmed meal offers and named availability exclusions remain usable. Generic breakfast advertising at Mereshi, Mystique and Nairobi does not establish every restaurant, room plan, hour or guest allowance; outcomes are explicitly conditional.

## UI and compatibility

`#/benefits?property=<slug>` provides existing-catalog selection, saved status and transient status preview. Unknown/missing property routes recover explicitly. Details and comparison derive the same results from saved status. Full traces retain source URLs and dates; a separate editorial panel disclaims treatment probability. Benefits contain no account or live rate requests.

The storage key, JSON version, profile/trip schemas, economics and recommendation scoring are byte-for-byte unchanged. A frozen fixture was exported by the actual Stage 7 exporter at baseline `d394d0acfaf01cb0727bc807b5425931a904e3da`; it covers manual points, unknown taxes/valuation, certificate, notes and inheritance flags. Tests load/import/export it exactly and derive benefits from its status without adding saved fields.

## Validation boundaries

Unit checks cover the status/brand matrix, deterministic results for all 25 properties, precedence, same-level/cross-layer conflicts, disputes, explicit unknowns, validity, stale/future/unverified evidence, editorial independence and v1 reconstruction. DOM checks cover saved status, previews, sources, conflicts and missing routes. Desktop/narrow Chromium flows retain earlier features and add compatibility, profile updates, preview safety, package scope, rule inspection and all 25 benefit pages. Screenshot inspection is separate from automatic layout checks. No Safari/Firefox, physical-device or comprehensive accessibility certification is implied.
