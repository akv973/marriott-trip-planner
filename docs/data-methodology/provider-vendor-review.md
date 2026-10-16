# Vendor questionnaires and outreach drafts

Prepared **2026-10-14 UTC** for user review. **UNSENT.** No email draft was created in a mailbox, no form was submitted, and no recipient was contacted. These repository drafts authorize no account, sandbox, purchase or terms acceptance. The [qualification report](provider-qualification.md) and [validation plan](provider-validation-plan.md) define the requested evidence.

## Response instructions

Please answer each question separately for **cash** and **Marriott Bonvoy award redemptions**. Use supported / unsupported / contract-dependent / unknown, with document/version, applicable clause, payload field or approved sample. Distinguish generally available functionality, negotiated options and roadmap. Identify who can bind the vendor's response on rights, supply provenance and pricing.

Do not send production secrets or traveler data. Samples should be sanitized and explicitly licensed for our stated review/storage audience. A sample restricted from public redistribution can be reviewed privately under separately approved terms; the public repository should record only permitted conclusions.

## Common qualification questionnaire

| ID | Question and requested evidence |
| --- | --- |
| C01 | Can you serve an independent public planning-only website without bookings, referrals, account links, traveler credentials or minimum conversions? What access application, eligibility, contract and evaluation steps apply? |
| C02 | Approve the exact public site and audience in writing. Classify commercial/non-commercial use, required attribution/deep links, geography, user limits and any restrictions if monetization changes. |
| C03 | Describe permitted upstream supply for Marriott cash and awards separately, including collection method and authority for downstream use. Does any path depend on prohibited scraping/parsing, circumvented controls, traveler credentials or consumer sessions? Supply a contractual representation, not just an API capability statement. |
| C04 | Specify browser/server/CDN cache rights and TTLs; storage of raw/normalized historic observations; offline display; quote expiry; deletion requirements; applicable contract precedence. |
| C05 | May a user export provider observations in JSON backups, retain/share them and re-import later? What fields and retention apply after termination? Distinguish data export rights from trade/export-control provisions. |
| C06 | May we compute/display/persist/export net cash avoided, CPP, fifth-night adjustments and portfolio allocation? Can derived outputs be retained if raw observations must be deleted? |
| C07 | Supply complete Marriott inventory with vendor IDs, Marriott codes, name/brand/geography, snapshot time and completeness/pagination markers. Classify all 100 worksheet rows separately for identity, cash and awards; explain gaps, aliases, duplicates and rebrands. |
| C08 | For one room, one/two adults, do you return exact 1-, 4-, 5-, 6-, 7- and 8-night stays? Are prices per night, averages or full totals? Are nightly series available? How do minimum stays, split rooms and partially available stays appear? |
| C09 | Identify loyalty program/currency, standard versus premium redemptions, cash supplements and whether a five-night discount is already included. Can certificate/upgrade eligibility be determined, or is it explicitly unknown? We do not request account-specific eligibility. |
| C10 | Provide room/category and rate-plan identifiers, occupancy/bedding, board and inclusions, cancellation deadlines/penalties, refundable versus non-refundable and public/member/OTA/net channel. Can cash and awards be confirmed to describe the same product? |
| C11 | Itemize included/excluded taxes, resort/destination charges, extra-person costs, award cash charges and pay-at-property amounts. On safari samples identify park/conservation fees, drives, meals and transfers without assuming equivalence. |
| C12 | Define currency code, numeric scale/minor units, zero-/three-decimal handling, rounding, original versus converted amount, FX source/time and currency of your calculated value metrics. |
| C13 | Define available, not offered, unchecked, unsupported, partial, missing, stale and error states. Does absence mean an observed negative or no collection? Is bookability confirmed or merely observed? Supply positive and negative samples. |
| C14 | Supply schema/OpenAPI/version and licensed request/response samples for the validation matrix. Define every timestamp (collection, response, creation, expiry), timezone and booking horizon. May samples and validation observations be stored or published? |
| C15 | State per-property/date/length refresh cadence, freshness distribution/cutoffs, live versus cached operation, async behavior, p50/p95 latency, service targets/SLA, incident history, support/escalation and change/deprecation notice. |
| C16 | Specify daily/monthly/burst/concurrency limits and billing for requests, batch hotels, rows, pages, details, retries and refreshes. Provide auth/permission/quota/upstream/schema failure codes and retry guidance. |
| C17 | Quote separately for evaluation (720 contexts plus 40 rechecks) and 1,000 on-demand contexts/month, with 3,000-context sensitivity. Include setup, license minimum, support, overages, tax, term, cancellation and hard spending cap. Explain batching so contexts are not mistaken for calls. |
| C18 | What integration certification, hosting restrictions, credential rotation, maintenance, schema notices, supply-loss handling, retention audit and termination/deletion work must our named owner perform? Can the data-only service be disabled without impairing independent manual plans? |

## Rooms.aero-specific questionnaire

| ID | Additional question |
| --- | --- |
| R01 | Reconcile the API's personal-use guidance with the general Pro automation wording in the terms. May a shared public planner use a server-held project credential without user OAuth? Please provide applicable written permission and required hotel-data attribution. |
| R02 | Are the published 1–5-night contract and refresh/request allowances different under a negotiated partner agreement? Is 6–8-night continuous Marriott inventory available under a supported contract today? If not, confirm unsupported rather than suggesting stitched shorter stays. |
| R03 | For Marriott, demonstrate `internal_id` matching for JROSK, LKYMP, NBOMJ, TUSRZ and CUNXR and all 100 catalog codes. Confirm brand aliases and how a property unsupported by collection differs from a date with no award. |
| R04 | Supply Marriott detail bodies at 1, 4 and 5 nights, and longer lengths only if supported. Explain occupancy, true room/rate pairing, tax/fee completeness, cash-only collection and any differences between summary rates and individual rooms. |
| R05 | Explain final-stay points, fifth-night handling, currency precision/FX, flags with zero cost and any award charges omitted from reported CPP. Which cases must not be compared economically? |
| R06 | Identify normal Marriott collection cadence and the extent of one refresh (dates, lengths, room classes); contractual freshness/support and commercial cost cannot be inferred from personal subscription terms. |

## Odynn / Awayz Data-specific questionnaire

| ID | Additional question |
| --- | --- |
| O01 | Can Awayz Data be licensed on its own for this small planning-only application, without White-Label, Traveler DNA, Points Exchange, OdynnBot, booking commitments or traveler account links? Is a hobby/independent developer eligible? |
| O02 | Identify applicable data-only agreement and its precedence over the published terms, specifically similar-service/competitive-use, automation, copying, public display, derived works and export restrictions. |
| O03 | Demonstrate actual Bonvoy redemption point prices and availability, distinct from proprietary points-as-cash or transferable bank currency. Identify cash source/channel and whether cash/award observations were collected together for the same room and context. |
| O04 | Supply the documented Marriott hotel inventory, supported query interface/schema and sanitized responses for all six stay lengths and both occupancies, including the five mandatory properties. State gaps explicitly. |
| O05 | Separate historical series/feed delivery from query-time data. Provide per-Marriott-property/date freshness and failure behavior; aggregate records/day and portal latency do not answer those questions. |
| O06 | Supply data-only limits, sandbox terms, minimum fees, support and maintenance requirements at the small volumes in C17; distinguish portal implementation claims from an executable data contract. |

## Outreach draft — Rooms.aero

Proposed routing: `support@seats.aero`, published on the [terms page](https://seats.aero/terms). Ask to route to API partnerships; this is a public support address, not a verified named commercial representative. Confirm routing before any separately approved send.

**Subject:** Rooms.aero data qualification for an independent Marriott planning website

Hello Rooms.aero team,

I maintain an independent Marriott trip-planning website at https://akv973.github.io/marriott-trip-planner/ with a curated 100-property catalog. It currently uses manually entered dated cash and Bonvoy award prices. I am evaluating whether a licensed, on-demand data source would fit the planner.

Could your API/partnerships team review a planning-only use case with public display, local saved observations, JSON backup/export/import and independently calculated redemption value? I need written clarification of permitted use and upstream supply, plus access options that do not require traveler account connections or booking activity.

I can provide a 100-property matching worksheet and questionnaire. The validation set spans six brands and includes Mapito, Mereshi, JW Marriott Masai Mara, Ritz-Carlton Dove Mountain and St. Regis Kanai. Please distinguish cash support from Bonvoy awards and confirm supported exact stay lengths, including whether continuous 6–8-night stays are available. Sanitized, licensed Marriott request/response examples would be useful before any evaluation account is considered.

Please also outline data freshness, quotas, error handling and pricing for a small project: an evaluation matrix of 720 stay contexts plus 40 rechecks, followed by an illustrative 1,000 user-initiated contexts per month. I understand billable API calls may differ from stay contexts.

This is an information request only. I am not requesting account activation, paid access or acceptance of terms at this stage.

Thank you,
Adam

## Outreach draft — Odynn / Awayz Data

Proposed routing: `support@odynn.com`, published on the [developer page](https://www.odynn.com/developers/). Ask to route to Awayz Data sales/engineering. No named representative is verified and no request-access form has been submitted.

**Subject:** Awayz Data qualification for a small Marriott cash-and-award planner

Hello Odynn team,

I maintain an independent Marriott trip planner at https://akv973.github.io/marriott-trip-planner/ with 100 curated properties and manual dated pricing. I would like to understand whether Awayz Data can be licensed independently for a small public planning-only website.

The potential use is on-demand cash and actual Marriott Bonvoy redemption observations, displayed with source/time context and used in explainable cash-versus-points calculations. I would need permission for local saved observations and compatible JSON backup/export/import. The project does not need booking, loyalty-account aggregation, transfers or a white-label portal.

Could you provide the applicable data-only licensing/access requirements, a Marriott property inventory and documented, sanitized payload examples? The representative set covers all six catalog brands and includes Mapito, Mereshi, JW Marriott Masai Mara, Ritz-Carlton Dove Mountain and St. Regis Kanai. Exact 1-, 4-, 5-, 6-, 7- and 8-night stays for one and two adults need separate qualification, including fees, room equivalence, availability semantics, timestamps and fifth-night treatment. Please distinguish Bonvoy awards from points-as-cash payment.

I have a matching worksheet and questionnaire for review. Please outline supply authorization, public display/storage/export/derived-calculation rights, refresh/service commitments, limits and total costs for 720 evaluation contexts plus 40 rechecks, then an illustrative 1,000 on-demand contexts/month with a 3,000-context sensitivity case.

Please do not create an account, activate a subscription or treat this inquiry as acceptance of any terms. I am requesting information for review before deciding whether to proceed.

Thank you,
Adam

## Review boundary

These drafts are ready for review, not sending. Any approved send should include only the chosen draft and reviewed supporting documents; do not attach private plans, account balances, credentials or personal trip notes. Confirm recipient routing at sending time. A reply inviting a trial does not authorize signup, paid access or terms acceptance. No follow-up monitoring is requested or configured.
