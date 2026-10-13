# ADR-016: Local watchlist and compatible version-two backups

Status: Accepted for explicitly authorized Stage 10. Date: 2026-10-13.

Use a separate strict WatchTarget collection for desired windows/rates, currency, priority and notes. Targets are personal planning intent, not observed pricing or factual evidence. Preserve nulls, permit independent windows for one hotel and validate referential IDs. Keep domain rules outside React components; keep all earlier engines and sourced catalog records unchanged.

Extend the planner envelope to version 2, importing strict version 1 by adding only an empty watchlist. Retain the existing storage key/repository and atomic draft, quota, corruption and stale-tab protection. Load never eagerly rewrites legacy data; a valid edit saves v2. Exports always use v2; do not strip watch fields to create older backups. Backup preview exposes target count before whole-planner replacement.

Use the existing hash routing and design system for explorer/detail save controls and the Watchlist editor. No monitoring/provider calls, observed rate history, pricing calculations, account integration, maps or Stage 11. See [architecture](../architecture/watchlist.md).
