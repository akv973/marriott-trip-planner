# ADR-018: Dynamic data research and provider approval gate

Status: **Accepted research decision; no integration provider approved.** Date: 2026-10-13 UTC.

## Context

Stage 12 is authorized for research only. Public documentation establishes candidate cash and award interfaces but does not establish this planner's production access, permitted redistribution/storage, actual catalog coverage or total ongoing cost. Cash channel quotes and award inventory must be assessed separately. Official opening announcements also differ from completed operation and affiliation evidence.

## Decision

Retain ADR-001, ADR-002, ADR-003, ADR-004 and ADR-006. Defer Stage 13 implementation. Prefer conditional qualification of Rooms.aero for limited cached award discovery and Odynn Awayz Data for negotiated paired data; consider an authorized Marriott/GDS cash route or Expedia Rapid separately. This preference approves neither a vendor nor spending.

An eventual integration proposal must satisfy the written rights/access, coverage, semantics, reliability and budget gates in the [research assessment](../data-methodology/dynamic-data-research.md). Use one replaceable optional provider with source collection time, context and explicit unknown/error states, keeping manual observations authoritative to the user's plan. Cash and award capabilities may differ. A secret-bearing integration needs a separately approved service; the static app cannot secure a shared API secret.

Opening feeds, if separately licensed and approved, supply review candidates rather than automatic catalog truth. Provider failures never trigger scraping, account use or undocumented endpoints. Quotes cannot silently overwrite saved manual inputs or erase conflicting claims.

## Consequences

Stage 12 changes documentation only. Application source, runtime manifest (Stage 11), catalog, engines, persistence/backups, dependencies, tests and workflows stay identical. No provider interface, code, credential, monitoring or external account exists as a result of this decision. Explicit approval is still required for any Stage 13 implementation after qualification; a recommendation is not authorization.

Sources, retrieval limits, cost uncertainty and untested coverage are retained in the [source register](../data-methodology/dynamic-data-sources.md).
