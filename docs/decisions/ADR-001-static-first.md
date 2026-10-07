# ADR-001: Static-first architecture

Status: Accepted for Stage 0. Date: 2026-10-06.

## Context

The first milestone needs a curated catalog, manual economics, and browser-local planning. None requires a server or authentication. The user selected React, TypeScript, Vite, Zod, and GitHub Pages.

## Decision

Build a static React/TypeScript app with Vite, runtime validation with Zod, and a production artifact in `dist/`. Use Node 24 for local tooling and CI. Keep domain logic modular and out of UI components. Use the committed npm lockfile.

## Consequences

The application remains simple to host and useful without dynamic providers. Secrets cannot be embedded in the browser bundle. Stage 2 must choose navigation compatible with direct-link reloads on Pages. A future server would require a new ADR and a concrete product need.
