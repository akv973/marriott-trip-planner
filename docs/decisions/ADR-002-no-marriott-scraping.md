# ADR-002: No Marriott scraping

Status: Accepted. Date: 2026-10-06.

## Context

Hotel and award automation can be fragile or unavailable. The product must not depend on circumventing Marriott protections or undocumented interfaces.

## Decision

V1 has no Marriott scraper, account connection, credentials, booking automation, or undocumented rate endpoint. Use curated factual evidence and manual rate entry. Stage 12 researches reliable sources; Stage 13 requires an approved provider and explicit approval. Scraping is never a fallback merely because a source is missing.

## Consequences

The user can plan without automated availability. Future proposals must document terms, stability, provenance, failure modes, and maintenance cost. No pricing integration exists in Stage 0.
