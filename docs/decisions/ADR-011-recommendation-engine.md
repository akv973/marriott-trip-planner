# ADR-011: Separate recommendations with explicit partial fit

Status: Accepted. Date: 2026-10-08.

## Context

Stage 5 is approved. ADR-005 requires separate eligibility, fit, economics and explanation. The seed has no numeric editorial ratings or benefit rules. Renormalizing setting tags into a complete hotel score would exaggerate sparse evidence.

## Decision

Implement strict transient requests and pure structured outputs in `lib/scoring/`. Default **trip-fit-1** weights: quality 30, destination 20, experience 20, elite 15, uniqueness 10, logistics 5. Redemption has no fit weight. Unknown active components retain null and their weight; display bounds/coverage and a full score only when fully supported. Custom weights have an explicit version label and complete values in inspected inputs.

Order by eligibility, supported lower bound, coverage and property ID. Unknown requirements remain provisional; known failures are excluded but inspectable. Use existing fresh factual evidence and separately labeled reviewed editorial values. No brand-derived luxury or guaranteed elite treatment.

Delegate optional matching manual quotes to the unchanged points engine. Value, budget and balance are independent. Quote data never enters the catalog. Fixed templates produce explanations from structured fields. No LLM, pricing integration or network dependency.

## Consequences

The current catalog yields honest partial fits for settings/geography. Quality, benefits and availability remain uncertain. UI and replay JSON expose all inputs, versions, components and assumptions. Stage 6 trip construction is unimplemented. See [engine architecture](../architecture/recommendation-engine.md).
