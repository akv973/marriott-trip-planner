# Stage 3 property comparison

The unchanged 25-property Stage 1 catalog supplies all compared information. Comparison supports 2–4 properties, in selection order, with no ranking or winner. Rates, benefits, fees, economics, saved targets, profiles and trips remain unimplemented.

## Selection and navigation

Explorer cards and property details expose a named checkbox. Selected properties appear in a removable tray, including properties hidden by the current filters. Four selections disable additional unchecked boxes; checked boxes remain removable. Clearing comparison preserves search/filter/sort state. Resetting filters preserves comparison. Main navigation can open the comparison even when empty; a table requires at least two properties. Removing down to one returns an explicit chooser state.

Repeated `compare` parameters in the hash hold slugs. For example:

`#/compare?country=TZ&sort=name-desc&compare=mapito&compare=mereshi`

Explorer, details, comparison, approach and roadmap links retain selections. Return links retain the explorer query. Reload, native back/forward and shared links need no storage, account or Pages rewrite. Selection/disclosure scroll positions are not persisted. A page transition focuses its heading; filtering or selecting on the explorer does not move focus. Removing a column on comparison focuses the heading because the removed button no longer exists.

Duplicate slugs are deduplicated in their original order. Missing/malformed selections produce visible warnings. Oversized shared URLs retain four valid properties with an explicit limit warning; the parser retains one excess selection to bound input while preserving overflow detection. “Keep valid selections” repairs the URL. No missing property is substituted. Slug entries are bounded to 100 characters and displayed only as escaped text.

`lib/catalog/comparison.ts` owns selection resolution, capacity, row definitions and editorial formatting. `lib/navigation/routes.ts` owns URL parsing and serialization. Business rules remain outside React components.

## Aligned dimensions

The semantic table has property column headers and fixed row labels. Factual rows compare brand, geography, property type, experience tags, resort/destination designations, operating status, opening/renovation, room count and published airport logistics. Cost/benefit rows explicitly show three Unavailable values (cash, points, cents per point) and four Unknown values (elite benefits, breakfast, lounge, fees). No manual input or calculator exists in Stage 3.

A separately styled editorial row group includes review context/rationale, ratings, uniqueness, destination-worthiness, elite-value potential, recommended stay, ideal traveler/trip fit, strengths and limitations. Every available assessment is preserved, with author/date/methodology; no newest or preferred editorial winner is silently chosen. A missing assessment is explicit. Zero, null, empty lists and absent stay length remain distinct. The shipped desk review has no numeric scores or stay recommendation.

## Evidence

`EvidenceValue` is shared with property details and uses the existing pure `fieldEvidence` contract. Confidence, verification date, freshness warnings and native evidence disclosures accompany each factual cell. Disputes retain every claim without a factual winner. Unverified claims are not promoted; stale evidence stays dated; historical/out-of-range claims remain inspectable. Unknown snapshots are not filled from unadmitted claims.

Disclosures retain claim values, dates/validity, dispute/applicability/staleness, notes and source links/type/publisher/access dates. External links use noopener/noreferrer. Setting tags do not assert quality or guaranteed amenities. The table explicitly dates the evidence assessment.

## Responsive and accessible behavior

The table scrolls inside a named keyboard-focusable region with visible focus and instructions, while the document fits its viewport. Row labels and property headers remain sticky during horizontal/vertical scrolling. Two, three and four columns use the same metric order. At narrow widths the row-label column is reduced, rather than stacking properties into misaligned independent cards. Native checkboxes, disclosures, table headers, links and remove/clear buttons have accessible names.

Browser QA covers 2/3/4 columns, selection limits, details, filters, reloads/history, source disclosure, explicit unknowns, empty/invalid/oversized recovery and keyboard scrolling at desktop and narrow Chromium viewports. DOM fixtures separately cover conflict/stale/unverified/historical claims and editorial distinctions. Neither viewport testing nor jsdom constitutes a full accessibility or cross-browser audit.
