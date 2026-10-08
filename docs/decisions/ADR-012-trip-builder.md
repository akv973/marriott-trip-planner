# ADR-012: Ordered transient trips and inspectable selected-booking totals

Status: Accepted for authorized Stage 6. Date: 2026-10-08.

## Decision

Implement strict separate `Trip` and `TripStay` contracts and pure aggregation in `lib/trips/`. A stay references a validated catalog property and carries manual quote context, notes, dates, reservation status, selected cash/points method and calculator pricing. The existing calculator is the sole source of stay economics; its policies, thresholds and implementation are unchanged.

Trip totals use the selected booking method only. Unknown selected values make their complete aggregate null; known subtotals and missing counts remain separately inspectable. Currencies are never added directly. Optional manually entered FX supplies a USD aggregate. Weighted redemption considers comparable points stays only, using aggregate avoided cash divided by aggregate points rather than averaging stay CPP. The trip balance is checked once against total selected points. An incomplete total can establish a minimum shortfall, but never a remaining balance.

Stay order is explicit and editable. Derive UTC check-out from check-in plus nights, count adjacent different-property changes, and flag overlaps, gaps and unknown chronology. Never merge separate stays or apply a free night across hotels. Notes and trips remain in application memory across hash navigation. Reload clears the workspace. No storage, profile, import/export, certificates or portfolio allocation is introduced; ADR-003 reserves persistence for Stage 7.

## Consequences

`#/trips` preserves explorer/comparison URL context while personal trip data is absent from URLs and static artifacts. Up to ten transient trips and thirty stays per trip bound the editor. Trips have independent balances; points are not reserved across trips. Pricing remains a user assertion, separated from existing evidence and editorial views. Changes to hotel, date, nights, currency or quote basis invalidate affected quotes rather than reinterpret stale totals. JSON inspection supports deterministic replay with the same catalog, policy, trip methodology and assessment date. This inspection is not a persistence or import/export facility.
