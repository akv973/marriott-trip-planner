# ADR-003: Local-first user profiles

Status: Accepted as Stage 7 direction. Date: 2026-10-06.

## Context

Points balances, status, certificates, preferences, and plans can be useful without an account system. Browser-local storage avoids an early cloud/authentication dependency.

## Decision

Use a replaceable storage interface for local profile and planner persistence. Stage 7 defines versioned schemas, import/export, migrations, and corruption/quota behavior. Do not persist a traveler profile or build authentication in Stage 0. Avoid including personal balances or reservations in static source artifacts.

## Consequences

Initial profiles will be device/browser-local, with user-managed exports for transfer. Cloud synchronization is a later optional need and must supersede this ADR if implemented.
