# ADR-009: URL-backed, evidence-preserving property comparison

Status: Accepted for Stage 3.

## Context

The approved brief requires 2–4 aligned properties, explicit unavailable values, clear entry/exit and responsive comparison. Stage 4 economics and Stage 8 benefits are not authorized. The small catalog already separates factual claims and editorial assessments.

## Decision

Extend the existing Pages-safe hash routes with `/compare` and repeated `compare` slug parameters. Persist selection in URLs alongside the explorer query, with pure selection/capacity functions. Reject missing properties visibly, deduplicate slugs, and disclose oversized shared selections. No local storage or router dependency is introduced.

Use a semantic comparison table with identical rows, sticky property headers/row labels and a named keyboard-scrollable container. Reuse the same evidence component on details and comparison. Preserve all claims and assessments; do not rank hotels or resolve competing evidence/editorial opinions. Unsupported booking dimensions remain Unknown/Unavailable until their authorized stage.

## Consequences

Comparison can be shared/reloaded and retains filter context without accounts. Wide tables require horizontal scrolling on phones; instructions, sticky labels and keyboard/browser coverage mitigate this. Sparse catalog rows remain useful evidence of research gaps. No rates, policies, catalog expansion or dependencies change.
