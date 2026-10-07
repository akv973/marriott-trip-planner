# Stage 0 — Foundation completion record

Status: **PASS. Stage 0 is complete and ready for Stage 1 approval.** Stage 1 has not begun. No hotel records, property research, domain engines, dynamic Marriott integration, or scraping were added.

## Implemented

- React/TypeScript/Vite responsive application shell with semantic navigation, skip link, empty catalog, and future capabilities labeled as planned.
- Modular repository layout, strict TypeScript, Zod foundation validation, and explicit invalid-data fallback.
- Vitest unit and React/jsdom integration suites: 8 unit tests and 3 integration tests.
- Schema and empty-catalog health commands, product requirements, V1 non-goals, architecture, deployment/testing runbooks, evidence methodology, and ADR-001 through ADR-006.
- Governing brief preserved byte for byte in `docs/product/project-brief.md`.
- GitHub Actions CI on PRs, main pushes, merge queues, and manual runs. Successful main validation gates the Pages artifact and deployment; dependent live browser checks verify the deployed shell.
- Chromium shell checks at 1366×900 and 390×844, with full-page screenshot evidence and failure traces.
- npm lockfile and Node 24 setup. No external fonts, photos, hotel data, or rates.

## Repository and deployment evidence

- Repository: https://github.com/akv973/marriott-trip-planner
- Original foundation commit: `7a66c1228dc7aff73ca758b0761b8cbae14a3657`, preserved exactly as an ancestor of main.
- Original foundation CI and Pages run: https://github.com/akv973/marriott-trip-planner/actions/runs/37563282727 — SUCCESS.
- Correction PR: https://github.com/akv973/marriott-trip-planner/pull/1
- Correction PR checks: https://github.com/akv973/marriott-trip-planner/actions/runs/37564741300 — SUCCESS.
- Verified corrected-code main commit: `7a6374cd689c993c2794cb419e7141a7b58bd4f2`.
- Corrected-code CI, deployment, and live QA: https://github.com/akv973/marriott-trip-planner/actions/runs/37564833965 — SUCCESS.
- Exact live Pages URL: https://akv973.github.io/marriott-trip-planner/
- Pages source: GitHub Actions; HTTPS enforced.
- Live screenshot/results artifact: https://github.com/akv973/marriott-trip-planner/actions/runs/37564833965/artifacts/11457868886

The successful main run identifies the full source SHA, builds and uploads its Pages artifact, then deploys that artifact in a dependent job. Live HTML and bundled JS/CSS were independently fetched with HTTP 200 and matched the build byte for byte. JS SHA-256: `4f3fbb45e25c4cf58a54d7c339142d344262bb9ad3a8c1309e22d2e2ffc6cf76`. CSS SHA-256: `59189c02bfc8e698128ff71e22750be50503cef60cc2a8dfb6d815d8c003ca2b`.

This record documents the verified application commit before the documentation-only completion PR. The final completion report records the final full main SHA and its successful deployment run; a commit cannot embed its own SHA without changing it. Documentation changes undergo the same complete remote checks, deployment, and live browser QA.

## Validation results

| Check | Result |
| --- | --- |
| Lockfile installation | PASS remotely |
| Typecheck | PASS locally and remotely |
| Lint | PASS locally and remotely |
| Schema validation | PASS — foundation only |
| Unit tests | 8/8 PASS |
| Integration tests | 3/3 PASS |
| Catalog foundation health | PASS — five intentionally empty collections |
| Default production build | PASS locally |
| GitHub Pages production build | PASS locally and remotely |
| Production HTML and asset paths/bytes | PASS — live HTTP 200 and byte matches |
| Local development startup | PASS during the original foundation build |
| Pull-request CI | PASS |
| Main CI and gated Pages deployment | PASS |
| Production-preview browser checks | 4/4 PASS |
| Live Pages browser checks | 4/4 PASS, no skipped or flaky tests |
| Desktop and narrow visual inspection | PASS |
| Fragment navigation and direct reload | PASS after the Stage 0 fix |

## Browser findings

Desktop header, hero, empty catalog, principles, three roadmap cards, and footer render coherently. At 390×844 the navigation remains visible, sections and cards stack, and text and controls fit without clipping or horizontal overflow. Full-page screenshots were inspected, rather than treating DOM tests alone as visual QA.

Overview, Our approach, and What’s next navigate to their real fragment targets. Reloading the roadmap fragment brings its heading into view after React mounts. Stage 0 has no path-based application routes requiring a Pages rewrite.

No broken script, stylesheet, image, or font requests or application console errors were detected by live Chromium checks. The managed cloud browser reported an unrelated extension metadata error from a `chrome-extension://` URL; no application-origin failure was visible.

## Changes after the original foundation commit

| Files | Reason |
| --- | --- |
| `app/App.tsx` | Restore the initial URL fragment position after React mounts; remote browser QA demonstrated the reload defect. |
| `.github/workflows/ci.yml` | Add meaningful desktop/narrow checks before deployment and repeat them against live Pages, with screenshot/results artifacts. |
| `playwright.config.ts`, `tests/browser/shell.spec.ts` | Verify actual Stage 0 shell behavior, console errors, asset loading, overflow, layout, navigation, and fragment reloads. Preview uses the build’s Pages base path. |
| `package.json`, `package-lock.json` | Pin Playwright and provide the browser-check command. |
| `tsconfig.json` | Include the browser configuration in strict typechecking. |
| `.gitignore` | Exclude generated browser reports and results. |
| `README.md`, `docs/architecture/deployment.md`, `docs/architecture/testing.md`, `docs/stages/stage-0.md` | Replace stale local-only/pending statements, document verified deployment and QA, correct the Pages preview command, and record limitations. |

The first browser QA run failed because the new preview setup used `/` for a build under `/marriott-trip-planner/`; its configuration was corrected. The next run exposed the application’s initial-fragment reload defect. Both failures were diagnosed and resolved before merge, and the full validation suite was rerun. Application architecture, styles, product scope, and catalog data were not changed.

## Catalog health and architecture

Properties: 0. Schema errors: 0. Missing critical evidence, conflicted claims, stale claims, and unverified claims: 0 because the collections are empty. Evidence assessment is false; confidence percentages are null. These checks do not validate hotel facts.

ADR-005 preserves eligibility, trip fit, economics, and explanation as separate layers. Final scoring weights belong to Stage 5. Benefits, profiles, certificates, and regression-fixture sequencing remain documented requirements for their approved stages.

The original foundation’s schema scripts use `node --import tsx` because the tsx CLI IPC listener was blocked in the execution environment. That existing correction is part of the original commit, not a post-foundation change.

## Remaining limitations and unresolved issues

- No unresolved application, remote CI, or Pages deployment issue remains.
- This is a foundation shell; property, benefit, pricing, recommendation, trip, profile, certificate, watchlist, map, and monitoring functionality is not implemented.
- Narrow QA used Chromium at 390×844, not a physical phone. Safari/Firefox and a full accessibility audit were not performed.
- Repository branch protection remains unconfigured. Automatic approval review rejected changing branch protection and administrator bypass settings because those security settings were outside the explicit Stage 0 authorization. CI still gates deployment, but repository-level PR enforcement is a separate recommendation.
- GitHub Actions screenshot artifacts have retention limits. The workflow does not embed a public commit marker in the shell; deployment evidence comes from the run’s source SHA, artifact, successful deploy job, and matching live bytes.
- A temporary bootstrap/import commit is preserved on `stage-0-import`, outside main’s foundation history. The existing `marriott-points-alert` repository was not modified.

## Recommended next stage

**Stage 1 — Data and Evidence Model**, only after explicit approval.

**STOP. Do not begin Stage 1.**
