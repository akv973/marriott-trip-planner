# ADR-013: Versioned local planner and explicit profile defaults

Status: Accepted for authorized Stage 7. Date: 2026-10-12. Implements ADR-003 and supersedes ADR-012's transient-only persistence boundary.

Persist profile and ordered trips as one strict version-1 JSON envelope behind ProfileRepository/LocalStorageProfileRepository. Validate before import/load/save. Atomic local writes preserve the last valid planner during invalid drafts; unsupported/corrupt storage and tab conflicts cannot be overwritten silently. Exports/imports are explicit whole-planner backups; no auth/cloud sync or migration from nonexistent older persisted schemas.

Use separate live-profile inheritance flags for trip balance and valuation. Manual edits, including explicit null, disable inheritance. The calculator copies initial profile assumptions into editable inputs. Recommendations apply supported preferences/quote assumptions only through an explicit action. Save all other preferences as planning context without extending Stage 5 scoring or Stage 8 elite benefits.

Add a standalone dated certificate assessment and bounded one-night certificate trip method. Apply the verified current 25,000-point top-off cap, expiry, manually confirmed eligibility and no free-night discount. Missing facts preserve unknown totals. Withhold certificate CPP/opportunity-cost aggregates instead of treating face value as cash. Prevent duplicate certificate consumption within a trip; trips remain independent alternatives.

See [local profile architecture](../architecture/local-bonvoy-profile.md) for failure behavior, exact backup contract, calculations and verification. No live pricing, benefit engine, watchlist or portfolio allocation is introduced.
