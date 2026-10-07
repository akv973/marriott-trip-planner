# ADR-008: Static-safe explorer URLs and evidence presentation

Status: Accepted and implemented in Stage 2.

## Context

GitHub project Pages does not provide SPA path rewrites. Explorer search/filter/sort state needs meaningful shared URLs, reloads and return navigation. The seed catalog contains sparse optional details and separately recorded evidence/editorial data; the UI must not flatten those into certainty.

## Decision

Use a small typed hash-route parser and URLSearchParams serializer without a new routing dependency. Recognize explorer and slug-based detail routes, retain query state in detail/return links, and recover unknown routes visibly. Keep native informational anchors. Native hash history supports back/forward; page transitions focus the heading while filters preserve focus.

Pure catalog functions implement search, AND filters, deterministic sorting and evidence presentation. Use snapshot facets, with unknown distinct from false/zero and optional disputed fields withheld. Display evidence confidence, dates, all conflicting/historical claims and sources. Keep editorial content in a separate panel. Missing pricing and benefits remain unavailable/unknown.

## Consequences

Direct property URLs reload safely at the repository root and shared queries do not depend on local storage. URL fragments are visible to users and are not private profile storage. One select per facet and exact year filters keep Stage 2 bounded. Invalid filters produce a removable empty state; invalid sorts fall back safely. Optional form/disclosure and scroll state are not persisted. Catalog admission, source methodology and the existing staleness policy remain unchanged. Comparison and other Stage 3+ features require separate approval.
