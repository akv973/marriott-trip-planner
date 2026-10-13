# Stage 12 — Dynamic Data Research

Assessment date: **2026-10-13 UTC**. Research only. The deployed application remains Stage 11.

## Recommendation

**Defer Stage 13 integration. No provider is approved for this planner on the evidence presently available.** Retain manual dated cash/points inputs and independent property discovery. This is a completed research outcome, not a failed integration attempt.

If a separately authorized provider qualification proceeds, prioritize **Rooms.aero for a limited cached Bonvoy award discovery pilot**, and **Odynn Awayz Data for a negotiated cash-and-award data license**. Neither is cleared for production: public-display rights, upstream data permissions, actual catalog coverage, comparable room/fee semantics, service commitments and a project-specific cost remain unresolved. Rooms.aero is better documented publicly; Odynn's data-only offering may fit longer stays, but that capability needs confirmation.

For cash-only data, prefer an authorized Marriott/GDS route if attainable. Expedia Rapid is the strongest documented OTA alternative reviewed, but OTA quotes must retain their booking channel and cannot silently become Marriott-direct quotes. Booking.com and Hotelbeds are less suitable for persistent Bonvoy planning. Official opening announcements remain human-reviewed evidence; an RSS feed alone cannot certify opening or affiliation changes.

The brief, [ADR-002](../decisions/ADR-002-no-marriott-scraping.md), [ADR-006](../decisions/ADR-006-dynamic-data-non-blocking.md), and [ADR-018](../decisions/ADR-018-dynamic-data-research-gate.md) govern this conclusion. Candidate preference is an analyst judgment, not a provider performance claim or permission to start Stage 13.

## Method and evidence limits

Reviewed primary provider documentation, published terms, official Marriott help/distribution pages, and official opening sources. Source identifiers below resolve to the dated [source register](dynamic-data-sources.md). Facts supported by documentation are distinct from assessments and proposed acceptance criteria. A published API establishes a possible interface; it does not establish this project's access, rights, coverage or observed uptime.

No provider account, contract, subscription, API key, rate query, booking, scraper, scheduled job or account connection was created. A single read of the explicitly published Marriott investor RSS feed tested whether that source was technically readable. This was source research, not a recurring monitor. No provider was contacted; sales-only questions remain open.

| Evidence level | What this assessment can establish |
| --- | --- |
| Primary documentation / terms | Documented capabilities, request limits, stated restrictions, published consumer prices |
| Provider product descriptions | Claimed scale and capabilities; not independently measured reliability |
| One published-feed read | Feed responded and parsed at the observation time; no uptime or completeness claim |
| Not tested | Actual pricing accuracy, latency, SLA compliance, credentials, catalog matches, date/room coverage and negotiated rights |

**Empirically tested pricing coverage: not assessed for all 100 properties.** This must not be reported as 0% coverage or inferred from a vendor's global property count. Approved providers: 0. Documented award API candidates reviewed: Rooms.aero, Odynn and AwardWallet; MaxMyPoint is a consumer research option, with no public integration contract established in this review.

## Cash pricing and cash availability

| Option and sources | Coverage and reliability | Access, costs and permitted use | Stability, frequency and maintenance assessment |
| --- | --- | --- | --- |
| Marriott direct / GDS — S01, S04 | Marriott describes real-time cash rates and availability through Amadeus, Sabre and Travelport. Property/date and special-rate coverage for this project remains untested. Public booking pages are useful to the traveler. | A documented travel-industry channel is not an open developer entitlement. Agency/provider onboarding, pricing, permitted planning-only display and storage must be established. No public turnkey Bonvoy award feed was identified. | Structured contracted access is preferable to page parsing. Query-time cash information still expires; mappings and rate eligibility need maintenance. High onboarding burden; medium operating burden if authorized. |
| Marriott affiliates — S05, S06 | Referral links and hotel/search-date/destination feeds are described. That does not prove a live dated quote or award feed. | Joining is advertised as free but subject to approval. The 2019 published agreement limits price display to approved links or written permission; treat it as historical context and obtain current campaign terms. No affiliate signup performed. | Low effort for approved clickouts; not a demonstrated pricing integration. Feed schema, refresh interval and current terms remain unknown. |
| Expedia Rapid — S08–S12 | Shopping documents live rates, room/rate detail and fees for 700,000 accommodations, up to 250 property IDs per request. Marriott B2B distribution exists, but that inventory is not necessarily retail member pricing. No Bonvoy award redemption support established. | Partner approval, key/secret and launch review required. No applicable public fixed API price established; commercial quote and planning-only use approval needed. Marriott wholesale/channel restrictions also matter (S07). | Public schemas and price-check flow are strengths. Limits depend on shopping load and traffic/revenue; a planner without bookings may be a poor commercial fit. Medium-to-high maintenance: content mappings, taxes, cancellation policies, versioning and rate errors. |
| Booking.com Demand — S13–S16 | Dated cash availability and product price breakdowns; guest and booker-country context can affect rates. Bonvoy points pricing is not established. Actual 100-property coverage unknown. | Managed Affiliate Partner and signed agreement required. Costs are unresolved. Production guidance says **not to store dynamic prices/availability**. Persistent observations and exported provider quotes need explicit contractual resolution. | Documented v3 APIs; account-specific production rate limits and 429 recovery. Query-time data is not a booking guarantee. Medium-to-high burden; incompatible with a persistent quote-history design under the reviewed guidance. |
| Hotelbeds / HBX — S17, S18 | Cash inventory through a bedbank. Pricing models distinguish net and selling rates; raw net rates cannot stand in for a traveler's comparable retail cost. No Bonvoy redemption support established. | Evaluation is limited to 50 calls/day and is not production entitlement. Production commercial terms, display rights and costs must be established. Key/secret required. | Structured API, content and rate workflows; evaluation exhaustion may return 403. Rate model, taxes, board/occupancy and inventory mapping increase maintenance. High fit/operating burden for this small Bonvoy planner. |
| Amadeus Enterprise — S19, S20 | Hotel search/shopping is a documented enterprise capability; Marriott identifies Amadeus as a GDS. Award support and exact catalog coverage unknown. | **Current portal says Self-Service was decommissioned on July 17th.** It does not state a year in the retrieved notice. Older free-quota/pay-per-call tutorials do not prove current access. Enterprise access and quote required. | Do not build around obsolete self-service onboarding or pricing. Enterprise contracts/schema support may be stable, but project access and costs are unresolved. High onboarding burden. |
| Google Hotel Prices — S37 | Official documentation concerns supplying/managing hotel prices in Hotel Center. It is not an established API for consuming Google's complete consumer hotel comparison inventory. | Requires the relevant lodging-partner context. No applicable broad consumer-price retrieval right or Bonvoy award capability established. | Exclude as a general pricing source; a supply-side API name is insufficient evidence. |

Cash availability means a source offered a particular product for a particular request. It does not establish total hotel occupancy, award availability, club/suite upgrade eligibility, or opening status. A missing property, empty response, omitted rate or unsuccessful request must not become a sold-out hotel.

## Award pricing and award availability

Award support must be admitted separately from cash support. Marriott describes flexible redemption pricing; cash cannot be converted into a verified award price through a fixed ratio (S02). Third-party cash channels can be non-qualifying for Bonvoy earning/benefits (S03). Preserve rate channel and qualification uncertainty before comparing economics.

### Rooms.aero

**Documented facts.** Getting Started explicitly includes Marriott Bonvoy. Seats.aero Pro keys can access the hotel API for non-commercial use; commercial use requires written agreement. Access can be restricted by geography/provider discretion. The personal quota is 1,000 calls per UTC day, independent of the flight quota (S21).

Availability is organized by hotel, arrival date and **1–5-night** stay length. Up to 50 hotels can be selected, with pages up to 500 rows; returned arrivals were checked within the preceding 21 days (S22). Concepts documents stay-total points, cash in currency minor units, timestamps and availability flags. Cash is recorded when published alongside awards, and zero values can represent missing rates (S23). Detail requests return individual room types and a booking link (S25). Refresh Hotel permits one refresh per user every 24 hours, shared with the website; new data typically appears within minutes, rather than synchronously (S24).

**Assessment.** Strongest public technical documentation among the award candidates reviewed, but primarily a cached discovery source. No exact room/occupancy/tax completeness, collection cadence or property-level SLA was established. Six-plus-night safari stays are outside the documented stay-length contract; concatenating shorter results cannot establish continuous availability or an exact total. Cheapest standard cash and cheapest standard award products may differ; inspect room details before admitting comparable economics.

Seats.aero's August 12, 2026 terms require visible attribution/linking and commercial API permission, and disclaim stale/omitted/phantom availability. The terms' general Pro automation wording and the API-specific personal-use guidance need reconciliation for this exact use. The flight-specific public-display restriction must not be invented as a hotel rule; hotel redistribution, cache, export, retention and third-party audience rights remain unresolved (S26). Provider permission alone also does not prove upstream Marriott authorization.

**Disposition:** conditional lead for a narrow cached-award discovery pilot, not a live-availability promise. Medium estimated maintenance: ID matching, timestamp admission, pagination/deduplication, unit/flag normalization, 401/429 handling, contract review and upstream disruption. Commercial service commitments and refresh allowances may differ from the personal plan and must be negotiated.

### Odynn / Awayz Data

**Documented facts.** Odynn describes a separately licensable Awayz Data module offering paired cash/award data, historical series and live queries, with roughly 23 million prices captured daily across its data operation (S27). Its developer page offers requested sandbox access (S28). These are provider statements; aggregate volume does not imply a daily refresh for every Marriott property/date.

**Assessment.** Potentially the best negotiated combined-data route, subject to proving that Bonvoy redemption points are distinct from proprietary points-as-cash payment. Public evidence reviewed does not establish the exact Marriott property set, six-plus-night support, room/occupancy context, fees, per-observation freshness, schemas, quotas, SLA, upstream authorization or enterprise price. Consumer Awayz access is not a redistribution license. Current Odynn terms reserve copying/display/distribution rights except where authorized and provide no general accuracy warranty (S29).

**Disposition:** conditional data-only licensing candidate. Exclude account aggregation, transfers, booking portals and booking automation from any proposed scope. Medium-to-high estimated maintenance, with confidence low until schemas, provenance, retention rights and commercial commitments can be inspected. No consumer subscription price is substituted for enterprise API cost.

### MaxMyPoint

**Documented facts.** Help describes Marriott points calendars, full-stay and any-day award alerts, and a daily-change feature. Marriott cash alerts are described as future support on the reviewed help page, rather than confirmed current support (S31, S32). Membership pages advertise free and paid plans with differing alert priority (S30). The indexed alternative pricing page shows Gold $39.99/year and Platinum $79.99/year; the main pricing page was not text-readable. Treat these as indicative consumer prices requiring checkout confirmation, not an API quote (S33). Its privacy page identifies third-party aggregated data and disclaims accuracy, completeness and timeliness (S34).

**Assessment/disposition:** useful external human research tool; no public documented API license, redistribution right, collection schedule or SLA was established. Do not parse its pages, alerts or emails into the application as an undeclared provider. Low integration maintenance if used only externally; high/unknown burden for unsupported automation. Preserve the mismatch between future cash-support help wording and any broader marketing claims.

The membership help also describes daily-change functionality as forthcoming, while the alert help describes it as a Platinum option. That documentation conflict remains unresolved; do not treat either wording as a contracted feature guarantee.

### AwardWallet Hotel Award Search API

**Documented facts.** Documentation includes a Marriott request, queued asynchronous searches, callback delivery after website parsing, optional loyalty credentials, cash-comparison fields and multiple error/challenge states (S35). Its API overview directs pricing/access inquiries to the provider (S36).

**Assessment/disposition:** technically relevant but excluded under the current no-scraping/no-account boundary unless a materially different authorized data path is established. Optional credentials do not mean all requests require a Bonvoy login, but the documented website-parsing path still conflicts with this project's constraints. Do not implement callbacks, account handling or parsing. Public API documentation does not itself establish upstream permission. High estimated maintenance: queues, timeout/warning states, challenges, parser changes and rate semantics. Exact fees, hotel completeness and retention rights remain unknown.

### Direct pages, scraper services and inferred rates

Marriott's reviewed Terms of Use restrict automated collection/monitoring and circumvention without written permission (S01). A vendor returning JSON from page parsing does not automatically satisfy ADR-002 or establish authorized supply. Reverse-engineered endpoints, browser extensions, headless account sessions and scraping-as-a-service are excluded. No provider unavailability can trigger such a fallback. The existing manual planner remains the fallback; this research grants no new data-republication right.

## Opening, closure and affiliation changes

| Source and evidence | Coverage, cadence and reliability | Access/use, failures and maintenance |
| --- | --- | --- |
| Official Marriott news / regional releases — S40, S42 | Good evidence of what was announced at publication time. Announcements can be plans rather than completed openings. The April 29, 2025 Mapito announcement describes an expected Q3 2025 debut; it is not a current status certification. Cadence is event-driven, with no exhaustive event SLA established. | Read and cite relevant announcements; do not assume a web page permits automated harvesting or full-text republication. Preserve publication, observation and planned-effective dates. Human review burden is moderate. |
| Newly opened / pipeline pages — S38, S39 | The new-hotels page may include renovations; “new” can mean about 12–24 months. The reviewed upcoming-openings page is Asia Pacific excluding China, not a complete global feed. A listed quarter is a projection, not an exact opening date. | HTML/labels and regional scope can change, while old projections remain visible. No documented global status-change API or update frequency established. Use selected human verification; do not implement page-diff monitoring. |
| Explicit investor RSS — S41 | Single research read: HTTP 200, RSS XML parsed, 10 items. Latest item was an October 9, 2026 earnings-release-date announcement; the following items concerned a conference and debt redemption. It establishes usable syndication, not complete hotel-opening coverage. | Publisher supplies a feed for RSS readers. Application redistribution/retention still needs confirmation; subscription permission is not a blanket content license. Feed truncation, duplicate/edited entries, outages and missed regional news require review. Low technical, medium editorial burden. |
| Official property/operator evidence, already retained catalog URLs | Targeted evidence can clarify renamed properties, operating changes and delayed openings, but a single page or future booking window is not definitive operation/affiliation proof. No common machine feed or cadence established. | Keep separate dated, attributable claims. Conflicting old/new claims must survive review. No catalog edits or operator outreach occurred in Stage 12. Higher manual burden for disputed targets. |
| OTA content / availability changes | A removed listing or absent rate is a channel observation, not evidence that a property closed or left Marriott. | Treat as a possible review lead only under permitted content use. False closure/affiliation conclusions are an unacceptable failure mode. |

**Recommendation:** maintain curated opening evidence. If later authorized, an explicitly licensed publisher feed could populate a review inbox behind a separate event-source boundary; it must not auto-promote catalog status or promise complete coverage. No such inbox, recurring fetch or monitoring is implemented here.

## Cost and workload

| Route | Established cost evidence | Budget limitation |
| --- | --- | --- |
| Existing manual inputs | No new provider spend or infrastructure introduced | Human verification effort remains |
| Seats.aero Pro / Rooms personal API — S21, S26 | Published Pro: $9.99/month or $99.99/year; eligible personal API access included subject to restrictions | Does not price a public/commercial planner, guarantee access or license redistribution |
| MaxMyPoint consumer — S30, S33 | Free tier; indexed alternative annual prices above | Current checkout and API licensing unverified |
| Odynn / AwardWallet | Requested access/quote, S28, S36 | No applicable public API price established |
| Expedia / Booking / HBX / GDS / Amadeus | Partnership/evaluation evidence described above | No project-specific production cost, minimum volume, look-to-book condition or contract established |
| Published Marriott RSS | No feed subscription fee presented | Permission and editorial work, not price alone, determine suitability |

A future quote must separate setup/certification, license minimum, request or record charges, commercial display/storage rights, support, hosting, overage, cancellation and tax. **No vendor cost or “free API” is assumed where unverified.**

Planning estimate, not vendor pricing: a bounded adapter plus secure request service, normalization, failure UX and acceptance QA could require roughly 5–10 engineering days after permissions and schema access, with 2–4 hours/month for source/contract/schema review and additional incident time. A legacy distribution/booking-oriented integration could take materially longer; procurement duration is unknown. These estimates are uncertain and are not an authorization or budget commitment.

Illustrative workload: 20 pilot properties × 3 arrival windows × 3 stay lengths × 2 occupancies = **360 quote contexts per pass**, before room detail, paging or retries. This is not necessarily 360 calls: batching and cached-provider rows differ. Scanning 100 properties × 365 arrivals × 5 lengths already creates 182,500 stay contexts before occupancy variants. Quotas and query costs must be modeled from actual endpoints; do not turn the watchlist into an unauthorized monitor. A cache is allowed only if the selected license permits it.

## Failure behavior required of any later proposal

These are proposed design requirements, not implemented Stage 13 code.

| Situation | Required planning outcome |
| --- | --- |
| No matching hotel / unsupported nights or occupancy | Explicit unsupported/unknown; keep manual entry |
| Successful exact-context source response explicitly lacks a product | “Not offered by this source when checked,” not total hotel sold out |
| Empty response with incomplete coverage / missing flags | Unknown, never zero price or unavailable by inference |
| 401/403, 429, timeout, 5xx or invalid schema | Recoverable provider error; bounded retries only where allowed; no scraping fallback |
| Cached or stale data | Show source collection time and age, distinct from retrieval time; no live label or automatic confirmed booking |
| Source zero sentinel / total versus nightly ambiguity | Normalize absence to unknown, verify units and total semantics before economics |
| Currency, taxes, meals, occupancy, room or cancellation mismatch | Mark comparison incomplete; do not copy vendor CPP into this planner's calculator |
| Fifth-night benefit already included in a stay quote | Do not apply it twice; preserve provider-total versus nightly-series distinction |
| Continuous stay longer than supported | Do not stitch independent daily/short-stay availability into a verified stay |
| Conflicting opening/affiliation evidence | Keep both dated claims; require review before changing effective catalog state |
| Provider termination / license revoked | Disable optional integration; remove/restrict retained data as required, while preserving permitted manual plans and exports |

## Proposed Stage 13 qualification and scope

**Current decision: NO-GO for production integration.** A consumer subscription or API key alone does not clear the gate. Before a Stage 13 implementation approval is proposed, the following evidence is needed:

1. **Rights and access:** written confirmation for this exact public planner, commercial/non-commercial classification, upstream permitted supply, visible attribution, public display, export/import, caching/retention, derived economics and termination deletion requirements. No traveler account/Bonvoy credentials, booking obligations or prohibited parsing. Resolve the Rooms terms/API wording and Booking persistent-storage conflict rather than ignoring them.
2. **Coverage:** vendor-supplied property inventory mapped against all 100 stable catalog IDs, with matched/unmatched/ambiguous counts and separate cash/award results. A future pilot should include at least 20 properties across all six catalog brands/regions and explicitly include Mapito, Mereshi, JW Masai Mara, Dove Mountain and St. Regis Kanai. Unsupported targets may remain unknown; no exact-match claim without verified identity.
3. **Semantics:** inspect approved sample payloads for 1-, 4-, 5- and 6–8-night stays, one/two adults, room types, full/partial availability, cash currencies, fees, cancellation and total-versus-nightly award pricing. Confirm actual Bonvoy points, benefit inclusion and cash channel. Six-plus-night support is essential before offering a complete safari quote.
4. **Reliability:** agreed collection cadence, timestamps, limits, latency/service targets, version/change notice and support contacts. In a separately authorized pilot, record every attempt, compare same-context observations with contemporaneous authoritative traveler verification, and report errors and price/availability mismatches rather than a single accuracy percentage. No SLA or accuracy result has been measured here.
5. **Affordability/maintenance:** a written quote at the modeled request volume, user-approved ongoing budget, secure deployment cost and named maintenance owner. No open-ended subscription or implied paid approval.

Proposed acceptance thresholds are project choices, not vendor promises: every admitted record must have a verified property/context mapping, source collection timestamp and understood units; every missing/error case must preserve manual planning; rights must cover every displayed/persisted field. Price-mismatch tolerances must be agreed after taxes, rounding and quote age are characterized. Publish cash/award coverage separately and limit the pilot to supported contexts, even if overall vendor coverage is broad.

If these gates pass and the user explicitly approves Stage 13, propose **one provider, on-demand observations only**, disabled by default, behind a replaceable provider boundary. Retain GitHub Pages as the static application; secrets need a separately approved server-side service, not a Vite variable, public repository, browser storage or JSON backup. Transmit only property/stay query context, not profile/balance/notes. Opening evidence uses a separate reviewable event boundary. Do not add monitoring, account integrations, booking or catalog expansion to that scope.

Do not create provider interfaces, adapters, secret storage, new persistence schemas, fetch jobs or sample provider fixtures in Stage 12. Stage 13 remains unstarted. If qualification cannot meet the gate, keep the fully usable manual application and defer integration indefinitely.
