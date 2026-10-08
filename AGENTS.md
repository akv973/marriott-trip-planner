# Project execution rules

Read `docs/product/project-brief.md`, `docs/architecture/technical-architecture.md`, and the latest stage report before changing this project. The attached brief governs the product.

- Execute only the explicitly authorized stage. Stage 5 is complete and is the current stage. Stage 6 is not authorized.
- Stop after each stage's completion report. Approval for a stage does not authorize the next stage.
- Inspect Git state, architecture documents, and relevant tests before edits.
- Keep factual data separate from editorial judgment. Unknown is a supported value; never replace unknown rates with zero.
- No Marriott scraping, undocumented endpoints, account connections, booking automation, secrets, or unlicensed photos.
- Keep business rules outside UI components. Stage 1 domain models are implemented; the independent Stage 4 points engine is implemented; the four-layer Stage 5 recommendation engine is implemented; later-stage engines remain unimplemented.
- Run `npm run check` after substantive changes and update documentation. Run browser flows when a stage introduces them.
- Use focused commits and pull requests. A remote deployment is verified only when its workflow and exact deployed URL are confirmed.
- Do not claim Stage 0 catalog validation verifies hotel facts. Stage 1 schema/reference checks require separately reviewed evidence; optional gaps are allowed.

## Current file boundaries

`app/` and `components/`: responsive explorer, property details, 2–4 property comparison, navigation, manual points inputs, and application shell. `lib/validation/`: Zod foundation and Stage 1 domain schemas. `lib/catalog/`: validated domain ingestion, evidence checks, health, and pure explorer/comparison/presentation functions. `lib/points/`: strict manual input validation, dated policy references and pure single-stay economics. `lib/scoring/`: strict transient recommendation requests, versioned fit weights, eligibility, independent economics and deterministic explanations. `data/`: manifest, unchanged sourced Stage 1 entities, and empty future-stage benefits. `scripts/`: schema and health commands. `tests/`: unit, integration, and browser projects. `.github/workflows/`: checks and gated Pages deployment.
