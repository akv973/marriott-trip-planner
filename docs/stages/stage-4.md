# Stage 4 — Manual Points Calculator

Status: **Validation in progress.** Stage 4 alone is authorized. Stage 5 has not begun.

Baseline main: `1022dc3b1a1c65ac208eb493fef289f489ab50db`. Branch: `stage-4-manual-points-calculator`.

## Implemented

- Standalone manual single-stay calculator at `#/calculator`, plus navigation and property-specific entry. Preserve explorer filter and comparison selection context; preserve all catalog facts/evidence and unknown booking fields.
- Nightly/total cash room cost, whole-stay taxes and mandatory fees, award cash still due. Blank values remain unknown and explicit zero is distinct.
- Flat nightly, varying nightly and final quoted award totals. Verified Stay for 5, Pay for 4 rules: lowest eligible standard-room nights over the whole stay, earliest ties, no automatic double discount, and explicit unknown/ineligible handling.
- Manual currency/FX, personal USD point valuation, editable thresholds, transparent CPP and economic costs, product-comparability warning, independent optional points-balance check.
- Dated primary-policy links and assumptions; strict validated domain functions outside UI; eight canonical economics fixtures; DOM and desktop/narrow browser flows.

Marriott terms and official benefit guidance were reviewed before implementation on 2026-10-08 UTC. See `docs/architecture/manual-points-calculator.md` for sources, formulas, policy limits and sequencing. This implements booking-value assessment only; hotel fit and recommendations remain Stage 5.

## Local validation completed

Typecheck, lint, schema/reference/evidence validation and build pass. Unit tests: 130/130. Integration tests: 28/28. Eight canonical economics fixtures pass. Catalog health: 25 properties, zero invalid/schema/reference/critical-evidence/conflict/stale/unverified errors. All six catalog collections and empty benefits remain unchanged, as do dependencies and lockfile.

The 36-test combined desktop/narrow browser suite, required PR CI, main deployment, live suite and screenshot inspection are pending. Local Chromium download returned a truncated ZIP; this does not count as a browser pass.

## Known limitations and stage boundary

Manual quotes reset on reload and are never saved as hotel facts. Ten supported currencies require manual FX for non-USD CPP. Availability and fee/eligibility assertions must be confirmed by the user. Paid-stay points earnings, credit-card rewards and elite treatment are excluded and disclosed. Certificates/top-offs remain Stage 7, benefit override Stage 8, multi-hotel aggregation Stage 6. Those future fixtures are pending, without fabricated passing placeholders.

No live pricing integration, scraping, account connection, scoring, trip builder, profile persistence or Stage 5 implementation exists.

Recommended next stage after review: **Stage 5 — Recommendation Engine**. STOP before Stage 5.
