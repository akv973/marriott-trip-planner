# Released manual planner usability and browser compatibility

Baseline: `v1.0.0` at `4a2cdc9c32e4c2be1269c4cdb7203113d56aaee8`. Authorized scope: a bounded usability/compatibility pass through the existing manual planner. Stages 13, 15 and 16 remain deferred; no feature, catalog, business-rule, saved-planner schema, tag or release changes are authorized.

## Findings and focused fixes

| Finding | Reproduction | Correction |
| --- | --- | --- |
| UX-001, medium | Focus a watch-target Remove button and press Enter. The button disappears and the remaining target has no usable focus position. | Focus the next target's check-in control, or the previous target when removing the last row; focus Add watch target when empty. |
| UX-002, medium | Keyboard-remove a certificate; focus is lost when the activated button disappears. | Apply the same focus recovery to the remaining Award label or Add certificate. |
| UX-003, medium | Keyboard-remove a hotel stay; focus is lost when the activated button disappears. | Focus the remaining Hotel selector or Add hotel stay. |
| UX-004, low | Firefox at 320px reports a 321px document on Recommendations: the unbroken word in the 34px results heading exceeds its 280px container. | Allow that heading to wrap within its container. Font, layout and content remain unchanged. |

| UX-005, medium | At 320px, horizontally scroll an expanded comparison source column into view. A sticky 112px row label covers its left edge; a 232px property column cannot fit in the remaining 168px. | At widths up to 380px, let row labels scroll horizontally while keeping header vertical stickiness and larger-screen behavior. |

The three new keyboard regressions and source-occlusion assertion failed on the released application before correction. Firefox's map-pin client rectangle reported roughly 234px while its screenshot showed a correct approximately 28px painted circle. This is a test-measurement issue: the assertion now checks local SVG geometry transformed into screen coordinates, with the same 24–36px bounds. No map behavior or geographic data was changed. Instrumentation and environment failures are distinguished from application findings.

## Matrix and isolation

Playwright 1.63.0 tests Linux Chromium, Firefox and WebKit. Each engine runs the full functional suite at 1366×900 and 390×844. The 768×1024 tablet projects run the release-audit and bounded-usability journeys. All engines additionally visit nine routes at 320, 768 and 1366px and open source disclosures at 320px.

Fresh, ephemeral browser contexts hold synthetic profiles, certificates, quotes, trips and watch targets. No signed-in browser, personal plan or Marriott account is used. Storage failure injection is confined to these contexts. Backups are synthetic version-1/version-2 fixtures; no user's existing browser storage is cleared or replaced.

Coverage includes discovery/filter/search, sourced details, 2–4 property comparison, profile/status, calculator, recommendations, multiple hotel stays, shared portfolio allocations, manual watch targets, exact v2 backup reconstruction and legacy v1 migration. Missing prices/FX/eligibility, invalid numbers/dates/imports, incomplete allocations, impossible budgets, corruption, denied storage reads, quota failures, and another-tab conflicts retain explicit unknowns, review messages, valid saved bytes or exportable in-memory work as appropriate.

Keyboard checks cover route heading focus, skip link, named controls, result focus, native disclosures, map controls, horizontal comparison/portfolio scrolling, and removal recovery. Visual review is separate from semantic/browser assertions. This is a bounded audit, not an assistive-technology or WCAG conformance certification.

## Validation and deployment

Baseline `npm run check`: 345 unit and 72 integration tests passed on Node 24.19.0. Candidate and remote verification results will be recorded after completion. The existing workflow continues to gate Pages deployment on successful Required checks. It now installs all three engines and repeats the expanded matrix on the public URL after deployment. Chromium-only CDP throttling is isolated in `loading.spec.ts`; Firefox/WebKit are not described as supporting that instrumentation.

Cold startup records three new-context samples per engine/viewport, time to a successful search, navigation/resource timings, browser version, and supported performance entry types. Optional map chunks/land assets must remain absent during discovery. These unthrottled samples are lab observations, not field Core Web Vitals. The separate Chromium experiment uses 4× CPU slowdown, 150ms latency and 200,000 bytes/s download. CI runs two workers; concurrent runner work can affect measured timings. No performance guarantee or redesign is inferred from these samples.

## Remaining limits and short manual checklist

Linux WebKit is **not actual Safari**. Firefox is Playwright's bundled build, not a certification of every retail Firefox/platform version. All sizes are viewport emulation, not physical-device tests. Actual macOS Safari, iPhone/iPad Safari, physical Android devices, touch keyboards, screen readers and OS download dialogs are unavailable in this workspace. The existing large-bundle advisory remains; no new loading feature or code splitting is introduced.

Use a separate browser profile or private test session; export personal plans before any device test and import only a synthetic backup:

1. On macOS Safari and physical iPhone/iPad Safari, create a profile, dated stay and watch target; enter/clear numbers and dates using the real keyboard. Verify blank versus zero and invalid-input recovery.
2. Discover and compare four hotels in portrait/landscape, open evidence, and horizontally scroll comparison and portfolio ledgers. Check text zoom at 200%/400%, tap targets and focus visibility.
3. With a hardware keyboard, traverse navigation/skip links, calculator results, disclosures and map controls; remove first/last target, certificate and hotel stay and verify focus recovery.
4. Export/download v2 JSON, restore it in the isolated session, reload and compare every field; repeat a v1 import. Check the real Files/download/share flow and private-browsing storage warnings.
5. On a physical Android Chrome/Firefox device, repeat the short journey on a slow connection, rotate the screen and return after backgrounding. If storage is disabled, export in-memory work before closing.

No release is published and the `v1.0.0` tag remains fixed. Stop after the verification completion record.
