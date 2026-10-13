# Local planner storage

Stage 7 implements strict versioned planner backups and ProfileRepository/LocalStorageProfileRepository in planner.ts. See [architecture](../../docs/architecture/local-bonvoy-profile.md). No authentication/cloud persistence.

Stage 10 exports version 2 with watch targets and strictly imports versions 1 and 2. The original storage key remains stable. Load migrates v1 in memory without writing; the next valid user edit saves v2. See [watchlist architecture](../../docs/architecture/watchlist.md).
