# Trips

Stage 6 implements strict Trip/TripStay contracts and pure selected-booking totals in `trips.ts`, delegating every stay to the unchanged points calculator. Complete totals, explicit known subtotals, manual FX, trip balance, weighted award redemption and chronology remain independently inspectable. Workspace memory belongs to the application; storage remains Stage 7. See `docs/architecture/trip-builder.md` and ADR-012.
