# Stage 9 catalog expansion

Stage 9 appends data through the existing independent Property, Destination, Source, EvidenceClaim, EditorialPropertyAssessment and BenefitBundle models. No new runtime entity, data provider, account connection or pricing path is added. Existing property IDs, slugs and all Stage 8 records/rules/reviews remain semantically identical.

`docs/data-methodology/stage-9-batches/index.json` records the baseline commit, canonical JSON SHA-256 hashes and five ordered addition batches. The health snapshots record actual admission checks at 40, 55, 70, 85 and 100 properties. `scripts/catalog-expansion-health.ts` reconstructs every cumulative batch from the shipped collections, checks references/reviews and baseline preservation, and emits region/brand/experience coverage, confidence, optional completeness and Platinum effective-benefit states. `npm run validate:schema` runs this command, so ordinary PR/main checks gate it without changing the deployment workflow.

The final metrics date is the research date; normal `catalog:health` remains date-sensitive and reports aging evidence. The frozen expansion gate measures admission at the research date, not current freshness forever. Policy review refresh remains due after 180 days. Maintainers must explicitly review new disputes before amending the gate's conflict inventory.

The UI uses the existing dynamic explorer/filter lists and detail/comparison/trip/profile selectors. The original explorer unit contract remains tested against its frozen 25-property subset; new tests cover the complete catalog. Browser loops now inspect all 100 details and 100 benefit routes at both widths, with additional new-destination, real-conflict, Waikiki, policy-contradiction and saved-trip flows. Earlier saved-planner reconstruction checks remain intact.

The manifest admits Stage 9, requires the benefit bundle for stages 8–9 and rejects Stage 10. Existing business engines, storage key, version-one export schema, dependency lockfile and GitHub Pages workflow stay unchanged. See ADR-015 and the research audit.
