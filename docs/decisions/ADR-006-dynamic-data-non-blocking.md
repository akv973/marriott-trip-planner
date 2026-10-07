# ADR-006: Dynamic data is non-blocking

Status: Accepted. Date: 2026-10-06.

## Context

No reliable automated Marriott cash/award data provider is assumed. External sources can fail, change, or become unavailable.

## Decision

Manual dated rate observations support the initial planner. Dynamic providers, if approved after Stage 12 research, live behind an interface and return observations with provenance and freshness. Provider errors or absent rates leave manual entry and existing trips usable. Never treat missing prices as zero.

## Consequences

Dynamic data improves the product without becoming essential. Alerts require a reliable provider. Stage 0 includes no provider, rate observations, calculator, or monitoring.
