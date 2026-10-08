# Stage 6 Trip Builder

## Contracts and boundaries

`lib/trips/trips.ts` exports strict Zod `tripSchema`, `tripStaySchema`, pricing types inferred from the existing calculator fields, constructors, UTC checkout and pure `calculateTrip`. `components/TripBuilder.tsx` renders edits and results. Application memory owns the workspace across hash navigation; it never writes local/session storage. The manifest admits Stage 6 and rejects Stage 7. All existing engines, six sourced catalog collections, benefits, dependencies and lockfile are unchanged.

Trips carry ID/name, destination, exact or approximate travel window, optional travelers, notes/activities, optional points balance and personal USD point valuation. Ordered stays reference property IDs, have optional check-in, derived checkout, 1–60 nights, selected cash/points method, user-entered idea/planned/reserved status, notes, quote observation date, room/guests/inclusions and cancellation context. Pricing supports nightly or total cash room, stay-total taxes/fees/award cash, final/flat/varying award points, explicit discount eligibility, quote comparability and manual FX. Blank numeric quotes are null; confirmed zeros stay zero. Non-numeric/negative/out-of-range values fail validation and remove totals until corrected. Unknown pricing is valid; malformed values are not.

## Aggregation, version `trip-totals-1`

For each stay, pass pricing, the trip valuation, default calculator thresholds and null per-stay balance to `calculatePoints`. Store the entire result, including policy version, missing inputs and warnings.

| Selected method | Trip cash contribution | Trip points contribution |
| --- | --- | --- |
| Cash | Calculator cash total including taxes/mandatory fees | Known zero |
| Points | Calculator cash still payable on award | Calculator net points after any confirmed stay discount |

For each currency, sum the known selected cash amounts using currency minor units. Complete total is null if any selected cost is unknown; known subtotal is explicitly partial with a missing-stay count. Sum points the same way. Missing alternative prices do not break chosen spending totals. Final quoted award totals are never discounted twice. Separate stays remain separate even at the same property; the engine never invents continuity or discount eligibility.

Convert selected cash per stay with its manual FX, then sum and round the USD total to cents. Missing cash or FX makes this complete aggregate null. Native currency totals remain usable without FX. USD quotes use the existing calculator's rate of one.

Total nights sum assigned hotel nights. Hotel changes count adjacent unequal property IDs in user order. UTC checkout equals check-in plus nights. Known consecutive dates flag gaps or overlaps/out-of-order stays; undated transitions remain unknown. Night totals are room nights, do not include gaps and can include flagged overlaps; they are not calendar-trip duration.

Remaining points = entered trip balance minus complete total selected points if affordable; otherwise null. Shortfall = maximum of zero and complete points demand minus balance. With incomplete demand, a known subtotal exceeding balance proves an **at least** shortfall; otherwise affordability is unknown. No points purchase/transfer or cross-trip allocation is assumed.

Net cash avoided for awards = sum of calculator net cash avoided in USD for points stays only. Weighted redemption CPP = that sum ÷ total selected points × 100. Require at least one award, positive known points, complete award alternatives/FX and confirmation of the same products/terms for every award. A noncomparable stay can display illustrative per-stay CPP but no aggregate redemption value. Negative avoided cash stays negative. No simple averaging of stay CPP.

Economic planning cost = complete selected cash in USD + total points × personal USD cents/point ÷ 100. Null valuation makes this unknown while ordinary cash/points totals still work. Paid-stay earnings, credit-card rewards, certificates, transportation and activity costs are excluded and disclosed. Default 0.8¢ valuation and thirty-day quote age warning are planning choices, not Marriott rules.

## Input lifecycle and evidence

Editing prices, method or assumptions recalculates immediately; invalid drafts suppress all totals. Nights changes retain applicable flat nightly room/points prices while clearing room stay totals, total taxes/fees/award cash, final award totals, variable nightly inputs and quote observation date. Date changes clear pricing and observation. Hotel changes reset dates, pricing/product context and reservation status while retaining stay notes/nights. Currency changes clear quote amounts/FX. Basis changes clear the affected amount. Removing/reordering stays and switching trips preserve stable stay identity and notes.

Manual quotes never become catalog claims. Reservation status is a user assertion and does not verify a booking. Observation dates are inspectable; absent, future or over-thirty-day dates prompt review. Availability is not checked. Existing operating-status evidence rendering and links to full factual/editorial detail preserve unknown, stale, disputed and unverified distinctions. No fact is inferred from a manual amount.

Personal data is transient. Ten trips/thirty stays are UI/schema bounds, not saved-profile functionality. Page navigation preserves memory; browser reload closes this workspace. Inspectable JSON is a read-only view, not versioned storage/import/export. Stage 7 remains unimplemented.

## Verification

Independent expected outcomes cover mixed multi-property totals, exact calculator delegation, edit/replay immutability, unknown/zero selected prices, unknown alternatives, trip-wide balance and incomplete minimum shortfalls, separate-stay discount boundaries, FX/currency rounding, weighted/comparable redemption, dates/order/gaps/overlaps, notes/quote age, empty trips, invalid/duplicate/oversized inputs and static-host URL context. DOM and desktop/narrow browser scenarios cover edit invalidation, multiple trips/notes, removal/reorder, live recalculation, partial totals, nightly modes, FX, JSON/evidence, history and reload, alongside every earlier feature regression. Browser screenshots must be inspected before declaring visual QA.
