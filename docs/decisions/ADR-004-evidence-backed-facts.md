# ADR-004: Evidence-backed factual data

Status: Accepted; implemented in Stage 1 through ADR-007. Date: 2026-10-06.

## Context

Hotel facts, policy exceptions, prices, and affiliations change and may conflict. Editorial impressions cannot establish objective facts.

## Decision

Keep Property, Source, EvidenceClaim, and editorial records separate. Preserve relevant observation/verification dates, confidence, and conflicts. Treat time-sensitive values as observations. Support unknown values and avoid unsupported inference. Define schema and reference checks at ingestion.

## Consequences

Catalog quality can be measured and facts inspected. Maintenance effort limits catalog growth. Empty Stage 0 collections do not prove factual quality; Stage 1 establishes evidence thresholds and effective-value rules.
