# ADR-005: Recommendation methodology

Status: Accepted; Stage 5 weights implemented by ADR-011. Date: 2026-10-06. Updated: 2026-10-08.

## Context

The brief specifies eligibility, trip fit, booking economics, and deterministic explanation as separate layers. Its illustrative scoring table also assigns 20% of trip fit to redemption value, which could double-count economics.

## Decision

Preserve the four layers and the standalone points engine. Display hotel/trip fit separately from cash/points value. Do not embed redemption value in trip-fit scoring merely to match the illustrative table. Define and version final scoring weights in Stage 5, exposing components, assumptions, missing values, strengths, and weaknesses.

Explanations derive deterministically from structured inputs. No LLM is required for factual recommendations. Missing benefits remain unavailable until evidence-backed benefit rules exist.

## Consequences

An excellent hotel can still have a poor redemption, and a high-value redemption can be a weak trip match. Future methodology changes are versioned. No scoring or recommendation engine is implemented in Stage 0.
