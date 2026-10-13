# Manual portfolio optimization

Stage 14 is authorized before Stage 13 by [ADR-019](../decisions/ADR-019-manual-portfolio-sequencing.md). Dynamic integration stays deferred. The application adds `#/portfolio`, a pure validated `lib/portfolio/optimizer.ts`, and a read-only scenario UI. No provider, scraping, monitoring, account connection or Stage 15 feature is present.

## Inputs and compatibility

Reuse the current planner, ordered trips, manual stay pricing, one profile points balance/valuation, and profile certificate inventory. Reuse the existing points calculator and dated one-night certificate assessment. Trip-level balances are independent earlier planning estimates and are never summed or used as a second resource pool.

Scenario inputs: selected trip IDs, per-trip priority (1/2/3), optional USD cash cap, additional explicitly confirmed certificate-eligible one-night stay IDs, and a required assessment date. They are strictly validated, transient controls. Unknown, invalid, expired and ineligible cases retain their distinctions.

Planner persistence contracts **do not change**: original storage key, strict version-1 migration, version-2 exports and exact old fields remain compatible. Optimizing never changes saved booking methods, profile balances, certificates, watchlists or evidence. Reload reconstructs the default scenario from saved data. The structured input/output audit includes the transient scenario for review; it is not added to the existing backup envelope.

## Alternatives and commitments

An unreserved stay offers cash, points and any eligible certificate alternative only when dates, observation date, both cost choices, fees, currency conversion and product comparability are known. Future observation dates and past stays require review and retain the manual choice. Quotes older than 30 days are still dated scenarios, with explicit reconfirmation warnings. No missing prices or future availability are inferred.

Reserved choices are fixed. Incomplete comparisons retain their selected manual method, show missing information and contribute nullable totals alongside known subtotals. Unknown fixed points/certificate commitments withhold new resource spending. Unknown profile balance withholds positive discretionary points but supports confirmed zero-point choices. Missing personal valuation withholds the balanced strategy. Known fixed commitments over balance and duplicate fixed certificate IDs return review errors without an allocation.

Reserved stays outside selection reserve points/certificates before selected-trip allocation. Their cash is outside selected-trip totals and budget. Unselected unreserved ideas are not commitments. The profile balance must represent the **pre-allocation pool including all modeled commitments**; users whose booked awards were already deducted must adjust the balance or the modeled commitments together. No account synchronization establishes that relationship.

Certificate ID is a global single-use resource. Every top-off consumes the same points balance. One-night eligibility, expiry, face value, maximum top-off and forfeited unused value delegate to the existing certificate engine. Multi-night quotes are not split, certificates are not combined, and fifth-night discounts are not attached to certificate stays. Remaining inventory includes expired/unknown certificates and exposes labels, face values and expiry, without calling them redeemable.

## Objectives, units and deterministic search

Methodology: `manual-portfolio-1`. All strategies consider the same feasible alternatives and constraints. Search visits fixed commitments first; choices are in stable method/expiry/ID order. Returned ledger uses original saved trip/stay order. Balance is depleted once per allocation; outside commitments are deducted once before it.

| Strategy | Primary objective | Tie breaks |
| --- | --- | --- |
| Cash conservation | Minimum actual selected-trip cash in USD minor units | Maximum priority-weighted avoided cash, then lower cash, fewer points, stable allocation key |
| Redemption value | Maximum aggregate net USD cash avoided ÷ points on **points bookings only** | Lower actual cash, fewer points, stable allocation key |
| Balanced | Minimum priority-weighted cash cents + points spent × profile valuation in USD cents/point | Lower actual cash, fewer points, stable allocation key |

CPP comparison uses exact integer cross-products, not rounded individual CPP or an average of stay rates. An allocation with no points-only awards has no displayed CPP and a zero ratio for ranking. Certificate face value and top-off points are excluded from CPP; top-offs remain in total points and balanced opportunity cost. Maximizing CPP can deliberately use fewer points or preserve a certificate when replacing a high-CPP points booking would lower the ratio. Balanced cash weights are 1×/2×/3×; actual cash and weighted cash are displayed separately.

Native money is rounded by the existing calculator to currency minor units. Manually converted USD cash is rounded per allocation before USD summation; net cash avoided is the difference between the separately rounded cash and award USD costs. Original currencies are summed separately. Extreme FX values that could make portfolio arithmetic unsafe are rejected. USD caps reject allocations exceeding known costs; if any chosen cash is unknown, full compliance remains unknown and cannot be certified from partial subtotals.

Search exhaustively enumerates combinations subject to shared resource and known-cash constraints, up to **100,000 visited nodes**. It prunes infeasible partial branches, does not discard dominated states by a different objective, and tracks the best evaluated feasible plan separately for each objective. On exhaustion, a complete assessment is optimal within the **entered saved-stay options**, not across unquoted hotels or future prices. At the bound, feasible incumbents are clearly labeled as limited and global optimality unverified; no candidate is presented as optimal. If none is found, distinguish exhausted infeasibility from no feasible candidate found before the bound. Reduce selected trips/stays to complete the search.

## Outputs and limits

All outputs include methodology/date, request, assumptions, visited/feasible nodes and search limits. Per-strategy output includes actual and partial cash totals, native currencies, total points, certificate IDs, remaining resources, weighted cash, points-only CPP, budget state and completeness/optimality. Each stay exposes date/observation/currency, choice, top-off, forfeiture, fifth-night savings/indices, fixed reason, alternatives, missing inputs, warnings and balances. Per-trip totals and final balances use the same allocation ledger.

Overlapping dates are flagged and leave the assessment incomplete; no separate travelers or rooms are assumed. Trip fit and catalog/editorial quality are not re-scored: the user has already selected the saved properties. Flights, hotel substitutions, future earnings, taxes/fees not entered, transfers, purchases, certificate opportunity cost and booking execution are excluded. This stage optimizes booking allocation rather than redesigning trips.

## Verification

Independent complete enumeration compares 40 varied small portfolios against all three objectives. Focused tests cover cross-trip constraints, fixed/outside reservations, one-use certificates, top-off/expiry bounds, exact date/price/zero/FX distinctions, budgets, fifth-night reuse, stable reconstruction, and disclosure at the bounded search limit. DOM flows verify scenario controls and read-only storage. Browser flows run at 1366×900 and 390×844 on production preview and live Pages; screenshots of controls, strategy cards, ledger, certificate, incomplete, infeasible, error and empty states are reviewed independently. Existing v1/v2 regression flows remain unchanged.

## Policy source verification

The existing rules were rechecked against official Marriott documentation on 2026-10-13. [Free Night Award help](https://help.marriott.com/s/article/marriott-free-night-award) and [program terms §3.3.c](https://www.marriott.com/loyalty/terms/default.mi) support a one-night standard-room award with up to 25,000 additional points, expiry limits and forfeiture. [Stay for 5, Pay for 4 help](https://help.marriott.com/s/article/stay-for-5-pay-for-4-benefit) and terms §3.3.d support the lowest-points-night discount under one qualifying reservation and exclude certificate combinations. These sources confirm the existing engine policy; no new waiver or availability assumption is added.
