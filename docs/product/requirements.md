# Product requirements

The unmodified [project brief](project-brief.md) is the governing specification. This document summarizes its intent and records scope boundaries for implementation.

## Mission and first success milestone

Help travelers discover trustworthy Marriott properties, compare options, assess manually observed cash and points prices, receive explainable recommendations, assemble hotel stays into trips, and preserve a local Bonvoy profile. Users must be able to inspect factual sources and booking assumptions.

The long-term goal is multi-trip allocation of a points balance, certificates, cash budget, travel windows, and preferences. A portfolio with 1.2 million points is a motivating scenario, not a default account balance or current user record.

## Stage 0 scope

- React, TypeScript, Vite, and Zod foundation.
- Strict TypeScript setup, ESLint, Vitest unit and integration projects.
- Responsive, accessible application shell with truthful empty state.
- Repository layout, product documentation, architecture, and six initial ADRs.
- GitHub Actions PR checks and main deployment configuration for GitHub Pages.
- No populated catalog or domain logic.

## Functional roadmap

| Stage | Capability | Dependency or boundary |
| --- | --- | --- |
| 0 | Foundation | Complete |
| 1 | Data and evidence models; approximately 25 sourced hotels | Strong schemas; no invented facts |
| 2 | Explorer, filters, navigation, detail pages | Stage 2 authorized; meaningful explorer browser flows |
| 3 | Comparison of 2–4 properties | Not authorized; unknown prices and benefits remain unavailable |
| 4 | Manual cash/points assessment | Independent economics engine and regression fixtures |
| 5 | Explainable recommendations | Eligibility, trip fit, economics, explanation |
| 6 | Single- and multi-hotel trip builder | Safe partial totals and point balances |
| 7 | Local profile, certificates, import/export | Versioned storage boundary; no login |
| 8 | Evidence-backed elite benefit rules | Explicit overrides and conflicts |
| 9 | Curated catalog expansion | Quality thresholds approved before bulk growth |
| 10 | Manual watchlist | Monitoring is not required |
| 11 | Maps | Discovery remains useful without maps |
| 12 | Dynamic data research | Written source assessment; no integration yet |
| 13 | Approved provider integration | Explicit approval and graceful provider failure |
| 14 | Portfolio optimization | Reliable trip and economics engines first |
| 15 | Monitoring and alerts | Reliable dynamic data is a prerequisite |
| 16 | Optional cloud accounts | Clear user need, rather than technical preference |

## Nonfunctional requirements

- Reliability and maintainability before catalog size or feature count.
- Facts, editorial opinions, rates, and policy observations remain separate.
- Unknown and conflicting values remain visible and never become fake zeros.
- Recommendations are deterministic and explainable from structured inputs.
- Manual entry remains sufficient when external providers fail or do not exist.
- Keyboard access, readable contrast, semantic landmarks, and responsive layouts.
- No unlicensed photography or proprietary copied datasets.
- Production deploys only after required checks pass.

## Specification tensions to resolve at their stages

1. **Scoring:** Section 16 includes redemption value in a trip-fit weight table, while Sections 14–15 require separate economics. ADR-005 prioritizes the separate four-layer architecture. No scoring formula is implemented in Stage 0. Stage 5 must establish and version the final weights.
2. **Benefits:** Recommendations precede the benefit engine. Until Stage 8, missing benefits must be unavailable or explicitly provisional; no invented benefit scores.
3. **Profiles:** Planner inputs may exist before profile persistence. Stage 7 adds versioned storage and import/export; Stage 5 does not silently create authentication or persistence.
4. **Certificates:** Stage 4 lists basic manual calculations; the full engine specification also requires certificates and top-offs. Their rules and staged delivery must be explicit before implementation, with approved, dated policy sources and regression fixtures. No certificate behavior is assumed now.
5. **Regression fixtures:** Add behavior assertions when each corresponding engine exists. Do not fabricate passing placeholders for unimplemented business logic.

## Stage gate

Complete the checks, document limitations, report the full commit SHA and exact verified deployment URL if one exists, recommend the next stage, and stop. Partial infrastructure verification must be reported as partial, not presented as a live deployment.
