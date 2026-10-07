# Project execution rules

Read `docs/product/project-brief.md`, `docs/architecture/technical-architecture.md`, and the latest stage report before changing this project. The attached brief governs the product.

- Execute only the explicitly authorized stage. Stage 0 is the current stage; Stage 1 is not authorized.
- Stop after each stage's completion report. Approval for a stage does not authorize the next stage.
- Inspect Git state, architecture documents, and relevant tests before edits.
- Keep factual data separate from editorial judgment. Unknown is a supported value; never replace unknown rates with zero.
- No Marriott scraping, undocumented endpoints, account connections, booking automation, secrets, or unlicensed photos.
- Keep business rules outside UI components. Domain models start in Stage 1.
- Run `npm run check` after substantive changes and update documentation. Run browser flows when a stage introduces them.
- Use focused commits and pull requests. A remote deployment is verified only when its workflow and exact deployed URL are confirmed.
- Do not claim Stage 0 catalog validation verifies hotel facts. The catalog is intentionally empty.

## Current file boundaries

`app/` and `components/`: responsive application shell. `lib/validation/`: Zod foundation schema. `lib/catalog/`: loading validated foundation data. `data/`: manifest and empty collections. `scripts/`: schema and health commands. `tests/`: unit and integration projects. `.github/workflows/`: checks and gated Pages deployment.
