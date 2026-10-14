# Released manual planner usability and browser compatibility

Completed on 2026-10-14: **pass within the tested Linux browsers and emulated viewports**. Eight reproduced UI defects were corrected in [PR #28](https://github.com/akv973/marriott-trip-planner/pull/28), merged, deployed through the existing gated workflow, and verified on the [live planner](https://akv973.github.io/marriott-trip-planner/).

Release baseline: `v1.0.0` at `4a2cdc9c32e4c2be1269c4cdb7203113d56aaee8`. Exact deployed application commit: **`b778581b26fabd459916de2136e9713177f1544f`**. The later documentation-only completion record does not change the deployed application.

The bounded pass preserves product scope, catalog evidence, business rules, stored planners and version-1/version-2 backups. No domain engine, catalog data, storage contract, dependency or lockfile changed. Stages 13, 15 and 16 remain deferred. The `v1.0.0` tag still points to the baseline; no new release was published.

## Findings and focused fixes

| Finding | Reproduction | Correction |
| --- | --- | --- |
| UX-001, medium | Focus a watch-target Remove button and press Enter. The button disappears and the remaining target has no usable focus position. | Focus the next target's check-in control, or the previous target when removing the last row; focus Add watch target when empty. |
| UX-002, medium | Keyboard-remove a certificate; focus is lost when the activated button disappears. | Apply the same focus recovery to the remaining Award label or Add certificate. |
| UX-003, medium | Keyboard-remove a hotel stay; focus is lost when the activated button disappears. | Focus the remaining Hotel selector or Add hotel stay. |
| UX-004, low | Firefox at 320px reports a 321px document on Recommendations: the unbroken word in the 34px results heading exceeds its 280px container. | Allow that heading to wrap within its container. Font, layout and content remain unchanged. |
| UX-005, medium | At 320px, horizontally scroll an expanded comparison source column into view. A sticky 112px row label covers its left edge; a 232px property column cannot fit in the remaining 168px. | At widths up to 380px, let row labels scroll horizontally while keeping header vertical stickiness and larger-screen behavior. |
| UX-006, medium | In WebKit, the portfolio ledger overflow container cannot receive focus, preventing keyboard horizontal scrolling. Chromium/Firefox made the scroll container implicitly focusable. | Give the existing ledger region an explicit tab stop, accessible name and visible focus outline. |
| UX-007, low | WebKit at 320px exposes a 369px document on Benefits despite correctly sized selector boxes: native selector content contributes to parent overflow. | Clip the selectors’ containing labels and draw the focus outline inside each control so it stays visible in WebKit. Native selection and the full option inventory are preserved. |
| UX-008, low | WebKit at 390px, with a confirmed certificate night and expanded arithmetic, exposes a 423px document. The long native eligibility selection contributes to parent overflow. | Contain only the certificate-choice selector labels and keep their focus outlines inside the controls. Certificate choices, calculations and full option labels are preserved. |

The three new keyboard regressions, source-occlusion assertion, and WebKit ledger-focus/reflow checks failed on the released application before correction. Firefox's map-pin client rectangle reported roughly 234px while its screenshot showed a correct approximately 28px painted circle. This is a test-measurement issue: the assertion now checks local SVG geometry transformed into screen coordinates, with the same 24–36px bounds. No map behavior or geographic data was changed. Instrumentation and environment failures are distinguished from application findings.

## Matrix and isolation

Playwright 1.63.0 ran the following matrix on both the production preview and the deployed public application. Counts are per run:

| Linux browser | Version | Desktop 1366×900 | Narrow 390×844 | Tablet 768×1024 |
| --- | --- | ---: | ---: | ---: |
| Chromium | 153.0.8010.12 | 68 passed | 68 passed | 11 passed |
| Firefox | 155.0 | 67 passed | 67 passed | 11 passed |
| WebKit | 26.6 | 67 passed | 67 passed | 11 passed |

Desktop and narrow projects run the full functional suite. Tablet projects run the release-audit and bounded-usability journeys. All engines additionally visit nine audited routes at 320, 768 and 1366px wide (900px high) and open source disclosures at 320px. CDP throttling adds one check to each Chromium desktop/narrow project; it is unavailable in the other engines.

Representative screenshots were visually reviewed for the realistic journey, certificate arithmetic, comparison evidence, benefit-selector focus and tablet reflow. All 42 selected live screenshots matched their passing preview counterparts byte for byte; the WebKit narrow benefit focus ring and complete certificate journey were also inspected directly from the live artifact. [Visual comparison evidence](evidence/usability-browser-visual-review.json) records those paths and hashes.

Fresh, ephemeral browser contexts hold synthetic profiles, certificates, quotes, trips and watch targets. No signed-in browser, personal plan or Marriott account is used. Storage failure injection is confined to these contexts. Backups are synthetic version-1/version-2 fixtures; no user's existing browser storage is cleared or replaced.

Coverage includes discovery/filter/search, sourced details, 2–4 property comparison, profile/status, calculator, recommendations, multiple hotel stays, shared portfolio allocations, manual watch targets, exact v2 backup reconstruction and legacy v1 migration. Missing prices/FX/eligibility, invalid numbers/dates/imports, incomplete allocations, impossible budgets, corruption, denied storage reads, quota failures, and another-tab conflicts retain explicit unknowns, review messages, valid saved bytes or exportable in-memory work as appropriate.

Keyboard checks cover route heading focus, skip link, named controls, result focus, native disclosures, map controls, horizontal comparison/portfolio scrolling, and removal recovery. Visual review is separate from semantic/browser assertions. This is a bounded audit, not an assistive-technology or WCAG conformance certification.

## Validation and deployment

The complete validation passed after the fixes:

| Validation | Result | Evidence |
| --- | --- | --- |
| `npm run check`, Node 24.19.0 | 345 unit + 72 integration; type checks, catalog/health checks and production build passed | Repeated locally; also in both Required checks jobs below |
| Final PR head `83b4bfa0e0e88526d26dedb7195859e2dcb47b4b` | Required checks passed; 437/437 browser checks, zero skips or flaky results | [PR workflow 38502224002](https://github.com/akv973/marriott-trip-planner/actions/runs/38502224002), [preview summary](evidence/usability-browser-preview.json) |
| Merged commit `b778581b26fabd459916de2136e9713177f1544f` | Required checks passed, including 417 unit/integration and 437 production-preview browser checks; Pages deployment passed | [Main workflow 38503318741](https://github.com/akv973/marriott-trip-planner/actions/runs/38503318741), Required checks job 115655027644 and deployment job 115657992422 |
| Public application after deployment | 437/437 browser checks; zero skipped, unexpected or flaky results | Same workflow, Live browser QA job 115658063456; [live summary](evidence/usability-browser-live.json) |
| Exact deployment and served assets | All five public files returned HTTP 200 and matched both the clean build of the merged commit and its Pages artifact by SHA-256 | [Asset hashes and provenance](evidence/usability-browser-assets.json) |

The first expanded CI run passed 436/437 browser checks and reproduced UX-008 in the WebKit narrow certificate journey. It blocked merge and deployment. After correcting the defect, all required checks passed before merge, and the complete workflow passed again on main. The workflow still gates Pages deployment on Required checks; it now installs all three engines and repeats the expanded browser matrix on the public URL.

Asset verification used a clean build of the exact merged commit with `VITE_BASE_PATH=/marriott-trip-planner/`, Pages artifact 11866936343 from that commit's successful workflow, and no-cache HTTP retrievals of the public URL. The matching files are `index.html`, `assets/index-CA8VgMWW.css`, `assets/index-BK4VGD9N.js`, `assets/GeographicMap-CoZxvp9e.js` and `assets/land-B4KBD8fO.json`. This checks deployed bytes as well as workflow provenance. Verification time: 2026-10-14T03:04:45Z.

Full reports and screenshots are in the workflow artifacts (90-day browser-artifact retention). Compact summaries and hashes above remain in the repository. No personal data appears in the synthetic test artifacts.

### Loading observations

Cold startup records three new-context samples per engine/viewport, time to a successful search, navigation/resource timings, browser version and supported performance entry types. Optional map renderer/land assets remained absent during discovery in all tested engines. Median successful-search times on the live application were:

| Browser | Desktop | Narrow | Tablet |
| --- | ---: | ---: | ---: |
| Chromium | 526ms | 520ms | 524ms |
| Firefox | 680ms | 660ms | 729ms |
| WebKit | 700ms | 735ms | 686ms |

The separate Chromium-only experiment used 4× CPU slowdown, 150ms latency and 200,000 bytes/s download, with three fresh contexts per viewport:

| Environment / viewport | Median successful search | Median observed LCP |
| --- | ---: | ---: |
| Production preview, desktop | 3,650ms | 2,796ms |
| Production preview, narrow | 3,250ms | 2,432ms |
| Live application, desktop | 2,512ms | 1,952ms |
| Live application, narrow | 2,470ms | 1,944ms |

These are lab observations, not field Core Web Vitals, performance guarantees or comparable browser benchmarks. CI ran two workers; concurrent runner work affects timings. Firefox/WebKit were not CDP-throttled. The roughly 1.25MB decoded main JavaScript bundle (about 205KB gzip) retains Vite's size advisory; no loading failure justified expanding this pass into a code-splitting redesign.

## Remaining limits and short manual checklist

Linux WebKit is **not actual Safari**. Firefox is Playwright's bundled build, not a certification of every retail Firefox/platform version. All sizes are viewport emulation, not physical-device tests. Actual macOS Safari, iPhone/iPad Safari, physical Android devices, touch keyboards, screen readers and OS download dialogs are unavailable in this workspace. The existing large-bundle advisory remains; no new loading feature or code splitting is introduced.

Use a separate browser profile or private test session; export personal plans before any device test and import only a synthetic backup:

1. On macOS Safari and physical iPhone/iPad Safari, create a profile, dated stay and watch target; enter/clear numbers and dates using the real keyboard. Verify blank versus zero and invalid-input recovery.
2. Discover and compare four hotels in portrait/landscape, open evidence, and horizontally scroll comparison and portfolio ledgers. Check text zoom at 200%/400%, tap targets and focus visibility.
3. With a hardware keyboard, traverse navigation/skip links, calculator results, disclosures and map controls; remove first/last target, certificate and hotel stay and verify focus recovery.
4. Export/download v2 JSON, restore it in the isolated session, reload and compare every field; repeat a v1 import. Check the real Files/download/share flow and private-browsing storage warnings.
5. On a physical Android Chrome/Firefox device, repeat the short journey on a slow connection, rotate the screen and return after backgrounding. If storage is disabled, export in-memory work before closing.

The bounded audit is complete. No subsequent stage is started.
