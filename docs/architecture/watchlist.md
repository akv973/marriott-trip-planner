# Local Watchlist — Stage 10

Approved scope: target-property saving with dates, desired cash/points rates, priority and notes, browser persistence and compatible backup reconstruction. No automatic monitoring, pricing ingestion, account integration or maps.

## Independent target contract

`lib/watchlist/watchlist.ts` defines strict WatchTarget and watchlist schemas. Targets contain stable ID, catalog property ID, nullable ISO check-in/check-out dates, nullable nonnegative cash rate, nullable uppercase three-letter currency, nullable nonnegative integer points rate, nullable high/medium/low priority and plain-text notes. Rates are **desired nightly thresholds**: cash room rate before taxes/fees; points before any free-night/certificate adjustment. A target is not a current rate, availability observation, catalog evidence or quote. No threshold is applied to trip totals, recommendations or benefits. Existing catalog evidence and editorial judgments remain unchanged.

Either date may be unknown; when both are present check-out must follow check-in. Date validation rejects impossible dates. Blank rates and priority are null; explicit zero remains zero. Cash rates require a currency code, whose syntax is validated without claiming currency conversion or current legal tender. Currency is not inferred from hotel location. Notes are bounded to 4,000 characters; rates to one billion units; the watchlist to 200 targets. IDs are unique within the target collection. Multiple targets for the same hotel are intentional independent travel windows, never duplicate-ID overwrites. New targets use UUIDs and do not consume trip/stay sequence numbers.

## UX and persistence

`#/watchlist` preserves explorer query and comparison context. Explorer and details offer a keyboard-accessible save button. The first save creates an unknown-valued target; later catalog saves open existing targets without duplication. The Watchlist's Add action deliberately creates another window for the selected property. Editors persist each valid change through the existing whole-planner repository, preserving the same quota, corruption, invalid-draft and stale-tab protections. Individual target errors are inspectable; invalid drafts remain in memory while the whole last valid planner is retained. Removal deletes only the selected target and persists normally. Saved state and failures remain explicit. At capacity Add is disabled; existing targets remain editable/removable.

Property details remain the source/evidence view. Target notes render as text. Invalid linked property context produces a recoverable message and catalog selection; an orphaned property in a backup is rejected without replacing existing plans.

## Compatible versioned backups

Version 2 is `{appId, schemaVersion: 2, exportedAt, data: {profile, workspace, watchlist}}`. Version 1 remains a strict `{profile, workspace}` data contract. Import discriminates the envelope version; a valid v1 adds exactly `watchlist: []` in memory, preserving every profile/trip/manual quote/inheritance field. v2 requires watchlist. Unknown fields, invalid dates/rates, duplicate targets, unresolved property references, malformed/foreign/future versions and oversized backups are rejected. Both versions retain the existing 5 MB UTF-8 limit.

The storage key remains **`marriott-trip-planner:v1`** so existing saved planners are found. Its name identifies the original slot, not the current envelope version. Load does not rewrite or discard old data; the next valid edit atomically writes v2. No eager migration or extra competing storage slot is introduced. Exports always emit `marriott-planner-v2.json`, with exact profile/workspace/watch target reconstruction. Older releases cannot import v2; downgrade is unsupported to avoid silent target loss.

Backup review includes target count and still requires the explicit whole-planner replacement action. Importing a v1 intentionally restores an empty watchlist, and this is shown before replacement. Invalid drafts cannot export. Import/write failures preserve in-memory reconstructed data with an honest save warning, as before. Catalog/policies and derived outputs stay outside backups.

## Verification

Watchlist unit and integration suites cover unknown/zero, real/partial/reversed windows, currencies, finite/bounded/integer rates, duplicate IDs/limits, Unicode/script-looking text, strict imports, original-key v1 migration without writes, exact v2 reconstruction, removals, orphan rejection and storage failures. Browser flows run at 1366×900 and 390×844 against preview and live, covering reload, reviewed file backup, invalid drafts, catalog controls, keyboard action, preserved URL context, multiple windows, removals and old backup restoration. Screenshot artifacts include empty/filled watchlists, import review, property control and invalid draft. Visual review is separate from DOM assertions.
