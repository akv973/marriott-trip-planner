# STAGE COMPLETION REPORT

Stage: **14 — Portfolio Optimization**

Status: **IMPLEMENTED; final CI, deployment and visual verification pending.**

## Sequencing and scope

Explicit approval authorizes Stage 14 using manual dated pricing while keeping Stage 13 deferred. [ADR-019](../decisions/ADR-019-manual-portfolio-sequencing.md) records this sequencing exception to the brief. Stage 12 research and ADR-018 remain in effect; no provider is approved. Stage 15 has not begun.

## Implemented

- `#/portfolio`: three explainable strategies across saved trips — cash conservation, aggregate points-only redemption value and balanced priority-weighted cash plus personal point value.
- Independent strict pure allocation engine; one shared profile balance and certificate pool. Reserved choices stay fixed, including resource commitments outside the selected trips. Duplicate fixed certificates and known fixed over-allocation return review errors.
- Inspectable per-stay and per-trip cash/points/certificate usage, top-offs, forfeited value, fifth-night savings, quote dates, alternatives, missing inputs, assumptions and remaining balances; structured input/output audit.
- Optional selected-trip USD cash cap, trip priority and explicit standard-room certificate confirmations. These controls are transient and do not mutate saved bookings or resources.
- Manual unknown prices, dates, FX, comparable product eligibility, balances and incomplete chosen costs remain explicit, with nullable totals and labeled known subtotals. Unknown fixed resource commitments withhold discretionary allocations.
- Versioned bounded exhaustive search. Complete feasible scenarios are optimal within entered options; the 100,000-node limit is disclosed and limited results never claim global optimality.

## Compatibility and preservation

Original persistence key, profile/trip/watchlist schemas, v1 migration and v2 export/import envelope remain unchanged. Scenario calculations leave saved data byte-identical. Independent catalog, explorer, comparison, calculator, recommendations, trips, profile, benefits, watchlist and maps remain available. Catalog records/evidence, existing business engines, dependencies, lockfile and workflow are unchanged; runtime manifest admits only authorized Stage 14 and still rejects deferred/later runtime stages.

## Verification

Independent arithmetic enumeration, focused resource/unknown/date/budget/FX/fifth-night tests and exact backup reconstruction are implemented, together with six new DOM flows and six new browser scenarios at desktop and narrow widths. Final results, screenshot review and workflow/commit evidence will replace this pending section after verification.

## Known limits

- Manual quotes are dated planning inputs, not current rates or verified availability. Stale quotes remain visibly dated and require reconfirmation.
- The shared balance must include modeled award commitments before allocation. Already-debited reservations require a corresponding manual balance/commitment adjustment.
- Certificates are supported on separately quoted one-night stays; no multi-night splitting or reservation merging is inferred. Remaining inventory can include expired/unverified awards.
- Cash cap applies to selected trips; outside reserved cash is excluded. Unknown costs cannot certify compliance.
- Search is bounded; no hotel substitutions, future rate assumptions, account integration, future earnings, purchases, transfers, certificate opportunity cost, transport or activities.
- Scenario controls reset on leaving/reloading; existing backups reconstruct the default scenario from saved quotes rather than storing these transient settings.

## Boundary

**Stage 13 remains deferred. Stage 15 has not begun.** Stop after this report. Any future stage requires separate approval, and monitoring still requires qualified reliable dynamic data.
