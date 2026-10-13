# ADR-019: Manual portfolio allocation before dynamic integration

Date: 2026-10-13
Status: Accepted by explicit Stage 14 authorization

The user explicitly authorized Stage 14 while keeping Stage 13 deferred. This is a deliberate exception to the brief's sequential stage order, consistent with dynamic data being optional (ADR-006) and the qualification gate in ADR-018. Stage 12 is complete; no dynamic provider is approved or implemented. Stage 15 remains unauthorized.

Reuse the reviewed trip, profile, points and certificate engines with manual dated quotes. Add a pure portfolio engine and a read-only scenario comparison. Use one profile balance and certificate pool across all selected trips, preserving reserved commitments even outside the selection. Do not sum independent trip balances, assume future earnings, infer rates, or mutate saved booking choices.

Keep scenario selection, priority, budget and extra certificate confirmations transient. Existing planner schemas, original storage key, v1 migration and v2 backups remain unchanged. Reconstruct calculations from saved manual data after reload; users can inspect the complete scenario input/output in the UI.

Compare minimum actual cash, maximum aggregate points-only redemption value, and minimum priority-weighted cash plus personal point value. Objectives and tie breaks are versioned. Use bounded deterministic exhaustive search; disclose any search limit and never call a limited result globally optimal. Missing comparisons remain fixed/manual and make the assessment incomplete; unknown resource commitments prevent discretionary resource allocation.

Acceptance requires independent arithmetic and constraint tests, backup reconstruction, regression checks, CI, deployment and desktop/narrow visual review. Stop at the Stage 14 completion report.
