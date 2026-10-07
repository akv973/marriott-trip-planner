# Seed catalog research — 2026-10-07

The 25-property sample stresses six brands and 14 countries/territories. It is a curated test catalog, not a complete directory or ranked recommendations. Research manually consulted official public overview pages through search/browsing. No scraper or automated bulk hotel retrieval was created. The 25 canonical sources live in `data/sources/index.json`, with access date, publisher/type and review notes. Claims and Brand/Destination metadata reference Source IDs.

Names/codes follow official headings/URLs. Locality/country follow location sections with ISO country normalization. Broad region, property type and neutral experience tags are constrained maintainer classifications from sourced geography/explicit activities, labeled Medium. Tags do not imply quality or guaranteed wildlife. Resort flags are true only for explicitly described resorts; absence of wording remains unknown. Destination-worthiness is unassessed.

| Brand | Seed properties |
| --- | --- |
| The Ritz-Carlton (4) | Dove Mountain; Half Moon Bay; Lake Tahoe; Grand Cayman |
| St. Regis (4) | New York; Aspen; Maldives Vommuli; Washington, D.C. |
| The Luxury Collection (4) | Gritti Palace, Venice; Mystique, Santorini; Imperial, Vienna; Marqués de Riscal, Elciego |
| EDITION (4) | New York; Reykjavik; Tokyo Toranomon; Miami Beach |
| JW Marriott (5) | Sao Paulo; Masai Mara Lodge; Hotel Nairobi; Tampa Water Street; Phuket Resort & Spa |
| Autograph Collection (4) | Mapito; Mereshi; Cloudveil, Jackson; Elephant Weimar |

Full names and official URLs are in Source/Property records. Countries/territories: AT, BR, DE, ES, GR, IS, IT, JP, KE, KY, MV, TH, TZ, US. Types: hotel, resort, safari-camp, safari-lodge. Experience coverage: city, safari, wildlife, beach, desert, mountain, ski, national-park access, food, culture, spa, golf and adventure. Cloudveil's national-park tag reflects its stated Grand Teton/Yellowstone access, not a location inside a park.

## Suggested properties and identity decisions

- Dove Mountain: official Ritz-Carlton page confirms Marana, Arizona, desert resort context and code TUSRZ.
- Mapito: current Marriott listing names **Mapito Safari Camp, Serengeti, Autograph Collection**, JROSK, in the Serengeti/Robanda/Ikoma area. This establishes observed affiliation; no operating-status, safari-inclusion or award-availability assertion follows.
- Mereshi: official listing names **Mereshi Safari Camp Serengeti, Autograph Collection**, LKYMP, at Mereshi Plains Safari Camp, Robanda village. Use that name instead of inventing a separate Mereshi Plains hotel. The overview describes 18 tents. A New badge does not establish opening year/operating status. The Kenyan-format phone on the Tanzania page was not copied or used to infer location.
- JW Sao Paulo: official heading is **JW Marriott Hotel Sao Paulo**, SAOJW. No lounge benefits, construction-status observations or transfer prices enter Stage 1.

## Optional data and limitations

All 25 coordinate pairs are unknown; no geocoding guesses. Explicit hotel history supports only Imperial's 1873 opening, Marqués de Riscal's 2006 opening and Elephant Weimar's 2018 renovation/reopening. Building dates and vague reimagined wording were not converted into hotel dates.

Unambiguous published accommodation-unit counts: Maldives 33 land + 44 overwater villas = 77; Reykjavik 253 total; Tokyo 206; Mystique 42; Imperial 79 rooms + 59 suites = 138; Marqués de Riscal 61; Mereshi 18 tents; Elephant Weimar 99. Units are not bedrooms. Nairobi's rooms/apartments, Aspen's category breakdown and Masai Mara's family tent counting remain unknown to avoid ambiguous totals.

Only three closest-airport records were captured from explicit FAQs: Dove Mountain (Tucson, 33.5 miles), Cloudveil (Jackson Hole, 9.6 miles), Elephant Weimar (Erfurt Weimar, 23 km). Exact conversion factor: 1 mile = 1.609344 km. Distances remain approximate hotel-published data, not routes, flight suitability or transfer inclusions/costs. Listing several airports does not establish the nearest suitable major gateway.

All 25 records are incomplete by research-breadth metrics while meeting baseline admission. No elite benefits, upgrade likelihood, lounge entitlement, operating status, availability, prices, quality scores or hotel ranking were inferred. One limited editorial desk assessment is separate from the 260 factual claims. Artificial conflicts/stale evidence live in independent test fixtures, not real hotel records.

At research date: 25 sources, 260 claims: High 185 (71.15%), Medium 75 (28.85%), Low 0, Unverified 0. Unknown optional fields do not require artificial Unverified claims. Historical snapshots age; affiliation evidence becomes due for review after 180 days.
