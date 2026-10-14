# Provider qualification — source register

Reviewed **2026-10-14 UTC**. This follow-up preserves the historical [Stage 12 register](dynamic-data-sources.md). All accepted external evidence below is primary provider documentation. The evidence establishes statements and published examples, not licensed access or independently measured accuracy. No full pages or datasets are archived.

## Q01

Rooms — [Getting Started](https://developers.seats.aero/reference/rooms-getting-started). Direct public text read. Supports API access/authentication and personal quotas; corresponds to S21. No credentials obtained or request executed. Contact link is email-protected in the rendered text; use the separately published support route for any approved routing request.

## Q02

Rooms — [Get Availability](https://developers.seats.aero/reference/rooms-get-availability). Direct public text read. Supports query filters, arrival/stay model, paging and returned-data window; S22. No live response tested.

## Q03

Rooms — [Concepts](https://developers.seats.aero/reference/rooms-concepts). Direct public documentation and embedded Hyatt example only; S23. No production transaction inspected.

## Q04

Rooms — [Get Availability Details](https://developers.seats.aero/reference/rooms-get-availability-detail). Direct public text description read; S25. The correct linked route is singular `detail`. The plural route failed. A rendered response-body selector was not an inspected payload. No detailed room schema/body obtained.

## Q05

Rooms — [Get Hotels](https://developers.seats.aero/reference/rooms-get-hotels). Direct public text read. Supports program-code matching and inventory paging. No actual hotel-directory response obtained, so this does not verify any of the 100 catalog properties.

## Q06

Rooms — [Search](https://developers.seats.aero/reference/rooms-search). Directly indexed primary documentation. Confirms arrival-window and 1–5-night model; not used to infer cash-only coverage. Complete cash discovery is assessed from Q02. No search executed.

## Q07

Seats — [Terms and Conditions](https://seats.aero/terms). Direct read; page says August 12, 2026. Applicable to Rooms through Q01's reference; S26. Contract interpretation remains a qualification question. Public flight restrictions are not represented as hotel rules. Published consumer price is not an enterprise quote.

## Q08

Odynn — [Platform / Awayz Data](https://www.odynn.com/platform/). Direct read; S27. Data module and paired-data/live-query descriptions are provider claims. The page also describes distinct portal/account/transfer products, which are outside the requested data-only use. No property-level coverage, service guarantee or schema inferred from aggregate scale.

## Q09

Odynn — [Developers](https://www.odynn.com/developers/). Direct public text read; S28. Lists API/white-label resources and invites sandbox requests; no inspectable Marriott response or linked public schema obtained. Search-indexed text also mentions system status, but the direct text did not expose a usable status link; no uptime history verified. Public footer publishes `support@odynn.com`.

## Q10

Odynn — [Terms of Service](https://www.odynn.com/legal/terms-of-service/). Direct read; page says September 3, 2026; S29. Relevant sections: 1 (eligibility), 5 (license), 11 (conduct), 14–15 (termination/ownership) and 17 (warranties). No terms accepted or negotiated exception obtained. Older Awayz terms are not substituted for this current reference.

## Q11

Odynn — [FAQ](https://www.odynn.com/faq/). Primary directly indexed content. Distinguishes modules, awards and points-as-cash; not a payload contract. Broad platform inventory and integration-duration marketing do not establish Marriott data-only coverage or a quote.

## Q12

Rooms — [Refresh Hotel](https://developers.seats.aero/reference/rooms-refresh-hotel). Direct public text read; S24. Queue/refresh allowance description only. No POST, polling or refresh action performed.

## Retrieval and sample limits

The public [documentation index](https://developers.seats.aero/llms.txt) advertises Markdown variants. Reads of the hotel-directory and availability-detail `.md` pages failed in the web tool; direct documentation reads returned HTTP 403 for both. Normal public HTML descriptions were sufficient for the statements above. No anti-bot challenge was bypassed, logged-in surface probed or undocumented endpoint used. A `/seats.aero/pro` lookup returned 404; the price reference is Q07 rather than that route.

Odynn site/product searches did not yield a usable public hotel data schema or sample. This limited search does not prove that private documentation or samples do not exist. Ask the vendor through the reviewed draft rather than manufacture missing fields.

The [qualification report](provider-qualification.md) uses Q01–Q12 references; original S01–S42 records and ADR-018 remain unchanged. Local catalog facts derive from `data/properties/index.json`, `data/brands/index.json` and `data/maps/locations.json` at baseline `d0ab9ddc15a426b71d2b95971dcde30fa0d8dc44`; catalog facts are not vendor support evidence.
