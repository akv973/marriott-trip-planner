# Stage 7 local Bonvoy profile and planner persistence

## Contracts and boundaries

`lib/profile/profile.ts` defines strict runtime-validated UserProfile and Certificate schemas plus the independent, dated one-night certificate assessment. Profile status, balance, personal USD cents-per-point valuation and optional preferences start unknown. Certificates retain independent ID, label, points value, exact expiry and notes; unknown value/expiry remain null. Profile fields and quote/reservation inputs are user assertions, never catalog evidence. Stage 8 benefit rules remain absent; status does not imply breakfast, lounge access or upgrade eligibility.

Preferences include preferred/disliked brands (mutually exclusive), destinations, trip types, typical nights, desired luxury, cash sensitivity, willingness to change hotels and lounge/suite importance. An explicit Recommendations action applies supported tags, duration and exactly one preferred destination, and copies balance/valuation to existing quotes. Changed duration clears quotes. Multiple destination preferences are not silently reduced to one. Remaining preferences are saved planning context; they are not new scoring or benefit rules.

`lib/storage/planner.ts` owns ProfileRepository, LocalStorageProfileRepository and strict planner/workspace/export schemas. UI data does not depend on Storage directly. Browser profile and ordered trip workspace persist together in one key, `marriott-trip-planner:v1`. No authentication, network request, cloud sync, personal URL parameters, static profile fixture or live pricing integration exists.

## Persistence and failure behavior

Every user edit updates page memory and synchronously attempts one atomic planner write. Import/load validate structure, supported version, catalog references, unique trip/stay IDs, active selection and safe generated-ID sequence. Unknown numeric values remain null; confirmed zero remains zero. Invalid drafts, including nonfinite numeric state, never become JSON null through serialization. The last valid saved planner stays intact while drafts are invalid. Correct the draft to resume saving; reload restores the last valid copy. The visible save status discloses this boundary.

Corrupt or unsupported stored data is retained untouched. Storage-denied/quota errors leave the page usable in memory and advise export. A repository compares the last read/written string before each save; a competing tab cannot be silently overwritten. This is conflict detection, not automatic tab synchronization. Export the page before reload or deliberately replace saved data from Profile. Import and explicit recovery call the replacement path only after successful validation. A validated import still reconstructs in memory if browser storage denies the write, with a visible save-failure message; export remains available. No partial import is applied.

No previous persisted profile schema existed. Version 1 is the first supported format; unsupported older/future envelopes fail with a useful message. No speculative migration or fallback strips fields. A later schema must add an explicit tested migration.

## JSON backup and reconstruction

Envelope: `appId: marriott-trip-planner`, numeric `schemaVersion: 1`, ISO UTC `exportedAt`, `data: {profile, workspace}`. Data includes certificate IDs, complete ordered trips and stays, active trip and ID sequence, manual prices/FX, quote dates/product context, notes, reservation assertions and profile-default flags. It excludes derived calculations and catalog copies; reload/import recomputes against the current catalog and dated policies.

Export offers an actual JSON download plus an inspectable text copy. Import supports a file or pasted text, validates before showing a summary and requires the user's explicit “Import and replace planner” action. Import replaces the entire planner rather than merging. Unsupported versions, malformed JSON, unknown fields, unresolved catalog IDs, invalid values, ID collisions and files over 5 MB fail without replacing current/saved data. Export also enforces the same byte limit. A removed referenced certificate may remain as a plan reference; its calculation becomes unknown and the user must select another award. This preserves plans without guessing inventory.

## Profile defaults versus manual input

New UI trips inherit the live profile balance and valuation using two explicit flags, `profileDefaults.balance` and `.valuationCpp`. Editing either trip field disables that flag, including clearing it to an explicit manual unknown. “Use profile balance and valuation” re-enables both. Import/reload preserves these flags and numeric values; `calculateTrip` resolves the effective values without mutating stored inputs. Older valid Trip objects without flags retain their original manual values. Pure `createTrip` remains backwards compatible with the earlier editable 0.8¢ planning assumption.

The standalone calculator initializes balance/valuation from the profile and retains normal editable inputs. Blank profile valuation means unknown, rather than an automatic 0.8¢ substitution. “Use profile balance and valuation” explicitly copies current values and clears stale results. Calculator and recommendation request drafts remain transient, as before; saved trips, including all their manual quotes, persist.

Trip result methodology is `trip-totals-2`, reflecting the added profile-default and certificate contract. Cash/points-only arithmetic remains identical to Stage 6.

## Certificate rules and calculations

Primary sources reviewed **2026-10-12**: [Bonvoy terms §3.3.c–d](https://www.marriott.com/loyalty/terms/default.mi), [Marriott's current top-off announcement](https://www.marriott.com/offers/free-night-award-OFF-206324/) and [Free Night Award guidance](https://help.marriott.com/s/article/marriott-free-night-award). Version `marriott-fna-2026-10-12`; max top-off **25,000 points** (current rule, replacing the prior 15,000 limit).

One certificate covers one eligible Standard/PointSavers standard-room night. Premium rooms, cash combinations, nonparticipating properties, member-absent/gifted use and excluded Homes & Villas / Yacht Collection use are ineligible. Certificate use is not eligible for Stay for 5, Pay for 4. Unused certificate value is forfeited. Expiry cannot be extended; the planned one-night date must be on or before the entered expiry, and the certificate must not already be expired as of assessment. Profile inventory and confirmation of standard-room eligibility/member presence/property participation are manual inputs, not proof of availability.

The Stage 7 trip UI supports a deliberately bounded one-night certificate stay. For multiple certificate nights, create separate one-night entries. No points-only free-night discount is inferred for other entries in a mixed certificate reservation. The rate entered is the **standard-room night points before certificate**, not a post-certificate top-off quote. Known eligible top-off = max(0, night points − certificate face value), subject to the 25,000 limit. Missing award, value, expiry, night date, quote or eligibility gives unknown selected points. Known violations are ineligible, never a made-up points booking. No point purchase/transfer is assumed.

Certificate stays contribute confirmed top-off points and manually entered award cash to selected trip spending, with the usual whole-trip shortfall check. Duplicate use of one certificate within a trip blocks totals. Trips are independent planning alternatives; no certificates/points are reserved across trips. The existing points calculator remains unchanged and represents a points-only alternative, not a certificate opportunity-cost model. For any trip using certificates, weighted CPP, avoided-cash aggregate and economic planning cost are withheld: certificate face value is not a cash valuation and ignoring its opportunity cost would inflate CPP. Per-stay certificate status, top-off, unused face value, reasons and policy version are inspectable.

Changing hotel/date/nights/product context invalidates the affected quote or certificate eligibility. Removing a certificate or changing its expiry/value recalculates relevant plans immediately. Unknowns, partial subtotals, foreign-currency separation and earlier chronology/quote invalidation remain intact.
