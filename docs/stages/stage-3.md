# Stage 3 — Property Comparison

Status: Implementation complete; CI/deployment/live acceptance pending. Stage 4 is not authorized and has not begun.

Baseline: exact verified Stage 2 main `07c69b08d7a205ed1a5cccb85ebd1544119aba5f`. Branch: `stage-3-property-comparison`. Governing brief, React/TypeScript/Vite/Zod architecture, dependencies and lockfile are preserved.

## Implemented

- Select 2–4 properties from explorer/details, remove/replace/clear, and enforce capacity without losing filtered-out selections.
- Pages-safe URL selection, reload/shared links/native history, explorer-query return context, explicit empty/single/duplicate/missing/oversized recovery and safe escaped invalid input.
- Semantic side-by-side table with aligned property metrics, sticky headers/row labels and named keyboard-scrolling region.
- Shared factual evidence display with confidence, verification dates, source disclosures and preserved conflicts/staleness/unverified/historical evidence.
- Separate editorial assessment rows with dates, authors, methodology, rationale, ratings/stay-length unknowns, trip-fit/strengths/limitations. No rank/winner or inferred quality.
- Cash cost, points cost and CPP remain Unavailable. Benefits, breakfast, lounge and fees remain Unknown. No manual inputs/calculator or later-stage engine exists.
- Pure comparison functions, ADR-009, comparison behavior documentation and manifest Stage 3 admission/Stage 4 rejection.

## Catalog preservation

All six sourced catalog collections are byte-for-byte unchanged: 25 properties, six brands, 24 destinations, 14 countries/territories, 25 sources, 260 claims (185 High, 75 Medium), one separate desk review. No schema/reference/duplicate/critical-evidence errors. All 25 records retain optional gaps and unknown coordinates. No production stale/conflicted/unverified claims.

## Validation to date

Local `npm ci`, typecheck, lint, schema/reference/evidence validation, unit tests (88), integration tests (22), default build, Pages-base build and `git diff --check` pass. Synthetic DOM comparison fixtures retain disputed/stale/unverified/historical claims and false/unknown distinctions. Three aligned 2/3/4-property DOM scenarios and immediate checkbox state updates pass; no Stage 4 controls.

Six comparison browser scenarios per desktop/narrow viewport are added to the existing eight explorer scenarios (28 total). Required CI, merge, Pages deployment, live suite and visual inspection are pending and are not claimed as passing here. Local Chromium download failed (truncated ZIP), and the cloud browser could not open the local preview. CI installs Chromium independently.

## Scope and stop

No Stage 4 implementation, new facts, catalog expansion, pricing, recommendations, profiles/storage, watchlist, trips, maps, benefits engine, dynamic data or monitoring. No credentials/scraping/Marriott requests. Stage 4 requires separate explicit approval after this completion report.
