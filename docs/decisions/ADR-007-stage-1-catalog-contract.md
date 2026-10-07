# ADR-007: Stage 1 catalog contracts and evidence health

Status: Accepted. Date: 2026-10-07. Implements ADR-004 without changing static-first hosting.

## Context

The Stage 0 empty-collection boundary must admit sourced hotel records while preserving factual/editorial separation, explicit unknowns, provenance, conflicts and deterministic diagnostics. Optional research should not block trustworthy baseline identity.

## Decision

Separate strict Zod schemas/inferred types for Property, Brand, Destination, Source, EvidenceClaim and EditorialPropertyAssessment. Evidence values are discriminated by subject. Globally unique IDs, per-entity slugs and explicit relationship checks guard ingestion. Critical identity evidence is name, brand, locality and country. Known optional snapshots also require evidence; unknown optional fields are allowed.

Retain dated claims and derive current conflict groups without automatic source-rank or newest-source selection. Optional disputed subjects remain unknown; required identity disputes block admission. Staleness has configurable default/subject thresholds. Every assessment takes a date; CLI defaults to UTC today. Health distinguishes schema validity, structural integrity, research gaps and confidence denominators.

The foundation loader validates the Stage 1 bundle before rendering the shell summary. Benefits remain empty. CLI/CI share the catalog assessment path. No explorer, points/recommendation engine, profile, trip, map, provider or monitoring is added.

## Consequences

Validation cannot independently prove researched facts; manual review remains necessary. Browser validation bundles this small seed catalog/schema code; lazy loading may be evaluated in a future authorized UI stage if growth makes it material. Unknowns and review warnings remain visible without blocking sourced identity. Future migrations must be explicit rather than weakening strict contracts.
