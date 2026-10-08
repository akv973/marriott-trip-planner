# ADR-010: Independent manual single-stay economics

Status: Accepted for authorized Stage 4. Date: 2026-10-08 UTC.

The app must assess manual quotes while catalog pricing remains unknown. Implement a pure, validated economics engine and a transient calculator route. Preserve explorer filters and comparison selection without persisting quote or profile data. Use explicit nullable costs, user-confirmed discount eligibility, configurable value bands and manually entered non-USD FX. Handle final quoted points totals without another discount; use all eligible nightly quotes to select the lowest nights across the stay. Keep affordability independent from value.

Marriott policy is manually verified and dated, linked in the UI and engine context. No property fee/eligibility override is inferred from the catalog. Numeric inputs and assumptions remain inspectable. Certificate use/top-off follows the documented Stage 7 model; Stage 5 owns hotel-fit recommendations. The Stage 4 value label is single-stay booking economics only.

Consequences: manual entry works offline after application load and remains useful without providers. Missing inputs prevent only dependent results. Quotes reset on reload; no live prices, persistent profile, certificate redemption or trip allocation is available. Future stages can consume the independent typed engine.
