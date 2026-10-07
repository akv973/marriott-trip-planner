# Marriott Trip Planner

## Project Role

You are building and maintaining a production-quality Marriott Bonvoy trip-planning website.

Treat this document as the governing product, architecture, data-quality, and execution specification.

Work incrementally.

Do not skip stages.

Do not continue automatically from one stage to the next.

At the end of every stage:

1. run all required validation and tests;
2. inspect the resulting application where applicable;
3. document what changed;
4. report the exact commit SHA;
5. report the deployed preview or production URL if one exists;
6. list known limitations or unresolved issues;
7. recommend the next stage;
8. STOP and wait for explicit approval before beginning another stage.

Reliability, explainability, and maintainability are more important than feature count.

---

# 1. Product Mission

Build a web application that helps Marriott Bonvoy travelers:

- discover worthwhile Marriott properties;
- compare hotels;
- plan single-property and multi-property trips;
- evaluate cash versus points;
- understand Bonvoy elite benefits;
- manage future target properties;
- allocate Bonvoy points across future travel;
- eventually monitor award pricing, availability, openings, and other meaningful changes.

The application should ultimately function as a:

**Marriott Bonvoy travel portfolio planner**

rather than simply a hotel directory.

The long-term product should be able to answer questions such as:

> I have 1.2 million Bonvoy points, several travel windows, elite status, and specific trip preferences. What are the best trips I can build, which hotels should I target, and when should I use points versus cash?

---

# 2. Core Product Principles

The following principles apply throughout the project.

## 2.1 Reliability over coverage

A curated catalog of 100 trustworthy properties is more valuable than 10,000 poorly maintained records.

Do not optimize for property count until data quality is strong.

---

## 2.2 Dynamic data is optional

The application must remain useful even if Marriott pricing, award availability, or other external dynamic data cannot be obtained automatically.

Dynamic data is an enhancement, not a dependency.

---

## 2.3 Unknown is an acceptable value

Never invent hotel facts.

If information cannot be verified:

- store it as unknown;
- display it as unavailable where appropriate;
- do not silently infer it.

---

## 2.4 Explain recommendations

Never provide only a score.

Every recommendation should explain:

- why the property fits;
- what makes it attractive;
- what weaknesses exist;
- whether cash or points appear preferable;
- what information is missing or uncertain.

---

## 2.5 Separate facts from opinions

Objective property information and editorial evaluations must be stored separately.

For example:

Objective:

- brand;
- location;
- opening year;
- lounge presence;
- resort fee.

Editorial:

- hardware quality;
- service quality;
- uniqueness;
- destination-worthiness;
- recommended stay length.

---

## 2.6 Sources matter

Important factual claims should retain source provenance.

Do not overwrite conflicting evidence without preserving the conflict.

---

## 2.7 Build modularly

Property data, pricing data, recommendation logic, user profiles, and UI components should remain sufficiently independent that any one source or feature can later be replaced without rebuilding the application.

---

# 3. Explicit V1 Non-Goals

V1 must NOT attempt to:

- scrape Marriott.com;
- circumvent Marriott technical protections;
- depend on undocumented Marriott endpoints;
- automate reservation booking;
- require a Marriott username or password;
- connect directly to a Marriott account;
- ingest Marriott's complete global portfolio;
- provide real-time award availability;
- provide real-time cash pricing as a core dependency;
- optimize flights;
- ingest large volumes of hotel reviews automatically;
- build a cloud account system;
- implement payment functionality;
- generate factual hotel information with an LLM when no supporting evidence exists.

Do not create a scraper simply because a reliable data source is unavailable.

If reliable automation cannot be obtained, preserve manual entry.

---

# 4. Initial Technology Architecture

Use the following initial architecture unless a genuinely blocking technical issue requires deviation.

## Frontend

- React
- TypeScript
- Vite

## Validation

Use:

- Zod

or an equivalent strongly typed schema-validation library if there is a compelling reason.

## Testing

Use:

- Vitest for unit/integration testing;
- Playwright for end-to-end testing once user flows exist.

## Deployment

Initial deployment target:

- GitHub Pages

unless repository constraints make another static deployment method materially better.

## CI/CD

Use GitHub Actions.

Every pull request should run:

1. install;
2. typecheck;
3. lint;
4. schema validation;
5. unit tests;
6. integration tests;
7. production build.

Add Playwright to CI when the application has meaningful user flows.

Production deployment from the main branch must occur only after required checks succeed.

---

# 5. Repository Structure

Use a clear modular structure such as:

```text
/app
/components
/data
  /properties
  /brands
  /destinations
  /benefits
  /sources
/lib
  /catalog
  /scoring
  /points
  /trips
  /benefits
  /validation
  /storage
/types
/tests
/scripts
/docs
  /architecture
  /decisions
  /data-methodology
/public
```

Do not embed business logic throughout UI components.

---

# 6. Architecture Decision Records

Maintain architectural decisions in:

```text
/docs/decisions
```

Create short ADR documents for major decisions.

Initial ADRs should include:

- ADR-001: Static-first architecture
- ADR-002: No Marriott scraping
- ADR-003: Local-first user profiles
- ADR-004: Evidence-backed factual data
- ADR-005: Recommendation methodology
- ADR-006: Dynamic data is non-blocking

Future architectural changes should update or supersede these records.

---

# 7. Core Data Model

Do not model the application as one giant Property object.

Create separate domain entities.

The architecture should support at least:

```text
Property
Brand
Destination
Airport

Source
EvidenceClaim

BenefitRule
PropertyBenefitOverride

CashRateObservation
AwardRateObservation

UserProfile
Certificate

Trip
TripStay

WatchTarget

RecommendationInput
RecommendationResult
```

---

# 8. Property Entity

Property records should contain stable characteristics.

Suggested fields:

## Identity

- id
- slug
- name
- brandId
- Marriott property code if known
- official URL

## Geography

- destinationId
- city
- state/province
- country
- region
- latitude
- longitude
- nearest airport
- approximate airport distance

## Property characteristics

- property type
- opening year
- renovation year
- room count
- resort flag
- destination-property flag

## Experience tags

Examples:

- safari
- wildlife
- beach
- national-park
- mountain
- desert
- city
- food
- culture
- spa
- golf
- adventure
- ski
- remote
- romantic
- family
- bucket-list

Do not require every field.

Missing data must be supported safely.

---

# 9. Editorial Property Data

Editorial information should remain separate from factual property records.

Possible fields:

- hardware score;
- service score;
- location score;
- uniqueness score;
- destination-worthiness score;
- elite-value score;
- recommended stay length;
- ideal traveler;
- strengths;
- weaknesses;
- rationale;
- reviewedAt;
- methodologyVersion.

Editorial evaluations must be clearly identifiable as editorial rather than objective fact.

---

# 10. Evidence and Sources

Important factual claims should be traceable to evidence.

Create a Source entity with fields such as:

- id;
- title;
- URL;
- publisher;
- source type;
- accessedAt.

Create an EvidenceClaim entity capable of representing:

- propertyId;
- field or subject;
- claimed value;
- sourceId;
- observedAt;
- validFrom;
- validTo;
- lastVerifiedAt;
- confidence;
- notes;
- conflict status.

Not every field requires every timestamp.

The architecture should nevertheless support time-sensitive facts.

Confidence options:

- High
- Medium
- Low
- Unverified

---

# 11. Source Precedence

For factual Marriott information, generally prefer:

1. Marriott corporate or Bonvoy program terms;
2. official Marriott property page;
3. official hotel website;
4. official hotel communication;
5. reputable third-party reporting;
6. community or traveler reports.

Do not assume that a higher-ranked source is automatically newer or correct.

If credible sources conflict:

- preserve both claims;
- mark the field as conflicted;
- expose the conflict to maintainers;
- do not silently discard evidence.

---

# 12. Time-Sensitive Data

Any data that changes over time should be modeled as an observation rather than permanent property metadata.

Examples:

- cash rates;
- award rates;
- availability;
- resort fees;
- elite policies;
- opening dates;
- closures;
- brand affiliations.

Where appropriate record:

- observedAt;
- stay date or date range;
- validFrom;
- validTo;
- source;
- confidence.

A points price without travel dates and observation date should not be treated as authoritative current pricing.

---

# 13. Manual Pricing First

The application must support manually entered pricing before automated pricing exists.

Users should be able to enter:

- stay dates;
- number of nights;
- cash rate;
- currency;
- taxes;
- resort/destination fees;
- award price;
- room type if desired;
- cancellation terms if desired.

The points engine should then evaluate the stay.

This ensures the planner remains useful without an automated Marriott pricing source.

---

# 14. Cash Versus Points Engine

Create a standalone points-economics engine.

It must not be tightly coupled to the recommendation engine.

Support:

- cash price;
- taxes;
- mandatory fees;
- fees still owed on award bookings;
- points price;
- fifth-night-free;
- user point valuation;
- certificates;
- certificate top-off where applicable;
- available points balance;
- mixed cash/points itineraries.

Primary calculation:

```text
net cash avoided / points spent
```

Calculate net cash avoided carefully.

Consider:

```text
comparable cash room cost
+ avoidable taxes
+ avoidable charges
- unavoidable award-booking costs
```

Do not compare materially different room products without warning the user.

Output should classify value approximately as:

- excellent points use;
- good points use;
- approximately neutral;
- cash preferred;
- strongly cash preferred.

Thresholds should be configurable.

---

# 15. Recommendation Architecture

Do not reduce the entire product to one weighted score.

Use four conceptual layers.

## Layer 1 — Eligibility

Determine whether a property meaningfully fits the request.

Examples:

- geography;
- budget;
- trip type;
- date constraints;
- required amenities.

---

## Layer 2 — Trip Fit

Evaluate factors such as:

- property quality;
- destination fit;
- experience fit;
- luxury fit;
- logistics;
- uniqueness.

---

## Layer 3 — Booking Economics

Evaluate independently:

- cash price;
- award price;
- points value;
- fifth-night-free;
- certificates;
- user point valuation;
- cash conservation;
- remaining points balance.

---

## Layer 4 — Explanation

Generate a deterministic explanation from structured facts and scores.

Examples:

> Excellent hotel fit and strong redemption value. Points are preferred.

> Excellent property fit, but award pricing is poor. Cash is preferred.

> Good redemption value, but this hotel is a weaker match for the requested trip style.

Do not depend on an LLM to create factual explanations.

The underlying recommendation must remain traceable to structured inputs.

---

# 16. Scoring

Initial configurable trip-fit weights may use approximately:

- Property quality: 30%
- Destination/trip fit: 20%
- Redemption value: 20%
- Elite benefits: 15%
- Uniqueness: 10%
- Logistics: 5%

These percentages are starting assumptions, not immutable architecture.

Store methodology versions so future scoring changes do not become ambiguous.

---

# 17. Bonvoy Benefit Engine

Model:

```text
Brand-level benefit rule
        ↓
Property-specific override
        ↓
User elite status
        ↓
Effective benefit
```

Possible benefit categories:

- breakfast;
- lounge access;
- late checkout;
- suite upgrades;
- resort-specific restrictions;
- club-level restrictions;
- welcome benefit.

Distinguish:

- official program rule;
- property exception;
- editorial observations about typical treatment.

Do not present anecdotal upgrade experience as guaranteed policy.

---

# 18. Local-First User Profile

Do not build authentication during the initial product stages.

Store the user profile locally in the browser.

Support fields such as:

- Bonvoy status;
- points balance;
- personal point valuation;
- certificates;
- preferred brands;
- preferred destinations;
- disliked brands;
- preferred trip types;
- typical trip duration;
- desired luxury level;
- cash sensitivity;
- willingness to change hotels;
- lounge importance;
- suite importance.

Support:

- export profile/planner data as JSON;
- import previously exported data.

Architect storage through an interface so cloud persistence can replace local storage later.

---

# 19. Property Explorer

Build a curated property explorer.

Potential filters:

- destination;
- country;
- region;
- brand;
- property type;
- luxury tier;
- trip style;
- beach;
- safari;
- wildlife;
- national parks;
- mountain;
- city;
- food/culture;
- adventure;
- lounge;
- elite breakfast;
- destination-worthy;
- opening year;
- recently renovated.

Users should be able to:

- search;
- filter;
- sort;
- open property details;
- compare properties;
- save targets;
- add properties to trips.

---

# 20. Property Comparison

Property comparison is a core early feature.

Allow approximately 2–4 properties to be compared side by side.

Potential comparison dimensions:

- property quality;
- location;
- trip fit;
- cash cost;
- points cost;
- cents per point;
- elite benefits;
- lounge;
- breakfast;
- resort fees;
- airport logistics;
- uniqueness;
- recommended stay;
- strengths;
- weaknesses.

Handle unavailable values gracefully.

---

# 21. Trip Planner

The guided planner should accept:

- destination or region;
- exact or approximate dates;
- number of nights;
- number of travelers;
- points balance;
- cash budget;
- Bonvoy status;
- certificates;
- preferred trip type;
- desired luxury level;
- preferred activities;
- willingness to move hotels;
- maximum properties;
- cash-versus-points preference.

Return ranked recommendations with explanations.

---

# 22. Trip Builder

Allow users to build trips containing one or more hotel stays.

Trip fields may include:

- name;
- destination;
- travel window;
- travelers;
- notes;
- planned activities.

Each TripStay may include:

- property;
- check-in;
- check-out;
- nights;
- cash/points booking method;
- points amount;
- cash amount;
- reservation status;
- notes.

Trip summary should calculate:

- total nights;
- total points;
- total cash;
- estimated redemption value;
- hotel changes;
- points remaining.

---

# 23. Watchlist

Users should be able to save target properties.

WatchTarget may include:

- property;
- desired travel dates;
- target award price;
- target cash price;
- opening date interest;
- priority;
- notes;
- reason for tracking.

Initial implementation does not need automated monitoring.

Build the data model so monitoring can be added later.

---

# 24. Portfolio Optimization

This is a later-stage feature.

Eventually allow users to ask questions such as:

> I have 1.2 million Bonvoy points and want three major trips over the next two years.

Generate alternative strategies such as:

- maximum luxury;
- maximum redemption value;
- minimum cash;
- balanced strategy.

Consider:

- points balance;
- cash budget;
- trip priorities;
- certificates;
- fifth-night-free;
- hotel quality;
- destination fit;
- points remaining after each trip.

Do not implement this until the property, trip, profile, and economics engines are reliable.

---

# 25. Catalog Health System

Build catalog-quality reporting early.

Catalog validation must evaluate more than schema correctness.

Generate a report containing metrics such as:

```text
Property count

Complete records
Incomplete records

Missing critical evidence
Stale evidence
Conflicted evidence
Unverified claims

Missing coordinates
Missing destination metadata
Missing benefit information

High-confidence %
Medium-confidence %
Low-confidence %
Unverified %
```

The report may initially be developer-only.

Rule:

**Catalog growth is subordinate to catalog health.**

Do not continue bulk property expansion while unresolved schema-validation failures or serious source conflicts exist.

---

# 26. Data Inspector

Eventually provide a maintainer-facing Data View for properties.

Example:

```text
St. Regis Example Resort

Brand                      HIGH
Opening year               HIGH
Breakfast policy           HIGH
Lounge                     MEDIUM
Airport logistics          HIGH

Recommended stay           EDITORIAL
Hardware score             EDITORIAL
Service score              EDITORIAL

3 facts last verified >180 days ago
1 conflicting claim
0 schema errors
```

This can initially exist as a developer tool rather than public-facing functionality.

---

# 27. Photography and Copyright

Do not copy or redistribute Marriott or third-party photography without appropriate permission or a supported usage mechanism.

V1 may use:

- placeholders;
- original assets;
- properly licensed imagery;
- permitted externally referenced imagery;
- or no property image.

Photography must not block development of the core planner.

---

# 28. Failure Behavior

The application should fail gracefully.

Examples:

If points pricing is unavailable:

> Current award pricing unavailable.

If cash pricing is unavailable:

> Current cash pricing unavailable.

If evidence is stale:

display the verification date where relevant.

If sources conflict:

indicate that the information requires review.

Never:

- invent a value;
- hide an otherwise valid property;
- crash a trip;
- substitute zero for unknown pricing.

---

# 29. Testing Strategy

Maintain several testing layers.

## Schema tests

Validate all:

- properties;
- destinations;
- benefit rules;
- evidence;
- pricing observations;
- trips.

---

## Unit tests

Cover:

- points calculations;
- fifth-night-free;
- certificates;
- scoring;
- trip totals;
- effective elite benefits.

---

## Integration tests

Test combinations such as:

```text
property
+ evidence
+ benefit rules
+ user profile
+ trip preferences
→ recommendation
```

---

## End-to-end tests

Once relevant UI exists, cover flows such as:

```text
Explorer
→ property comparison
→ enter cash/points rate
→ evaluate booking
→ add property to trip
→ inspect trip totals
```

---

# 30. Canonical Regression Fixtures

Create stable regression scenarios.

At minimum include:

1. five-night points stay;
2. four-night points stay;
3. cash clearly superior;
4. points clearly superior;
5. missing award price;
6. missing cash price;
7. insufficient points;
8. certificate use;
9. certificate plus points top-off;
10. property-specific benefit override;
11. stale source;
12. conflicting evidence;
13. incomplete property record;
14. multi-hotel trip;
15. missing optional data.

These fixtures should remain stable as the application evolves.

---

# 31. Stage Roadmap

## Stage 0 — Foundation

Create:

- repository structure;
- README;
- product requirements document;
- technical architecture;
- V1 non-goals;
- ADRs;
- core TypeScript setup;
- validation framework;
- testing framework;
- GitHub Actions CI;
- initial deployment configuration.

No meaningful property catalog yet.

### Acceptance criteria

- local development works;
- production build succeeds;
- typecheck succeeds;
- lint succeeds;
- tests run;
- CI runs on pull requests;
- architecture is documented.

STOP after completion.

---

## Stage 1 — Data and Evidence Model

Implement:

- Property;
- Brand;
- Destination;
- Source;
- EvidenceClaim;
- editorial data model;
- schema validation.

Create approximately 25 representative properties.

Include multiple brands and trip types.

Suggested brand mix:

- Ritz-Carlton;
- St. Regis;
- Luxury Collection;
- EDITION;
- JW Marriott;
- Autograph Collection.

Suggested experiences:

- city;
- safari;
- beach;
- desert;
- mountain;
- national-park access;
- international resort.

### Acceptance criteria

- all 25 records validate;
- evidence model works;
- factual and editorial data remain separate;
- malformed records fail validation;
- catalog health report works;
- no invented hotel facts.

STOP.

---

## Stage 2 — Property Explorer

Build:

- property grid;
- search;
- filters;
- sorting;
- property detail pages;
- responsive layout.

Do not add maps yet.

### Acceptance criteria

- filters combine correctly;
- missing data does not break pages;
- URLs support meaningful navigation;
- mobile and desktop layouts work;
- end-to-end explorer tests pass.

STOP.

---

## Stage 3 — Property Comparison

Build comparison for approximately 2–4 properties.

### Acceptance criteria

- comparable metrics align clearly;
- unavailable values are explicit;
- user can enter/exit comparison easily;
- responsive comparison works;
- comparison tests pass.

STOP.

---

## Stage 4 — Manual Points Calculator

Implement manual cash and award input.

Support:

- nightly/total cash cost;
- taxes;
- fees;
- points cost;
- fifth-night-free;
- personal point valuation;
- recommendation output.

### Acceptance criteria

- canonical regression fixtures pass;
- calculations are transparent;
- users can inspect how CPP was calculated;
- no live Marriott pricing integration exists.

STOP.

---

## Stage 5 — Recommendation Engine

Implement:

- eligibility;
- trip-fit scoring;
- economics;
- deterministic explanation.

### Acceptance criteria

- same input produces same result;
- score components are inspectable;
- recommendation explanation derives from structured inputs;
- user can distinguish hotel fit from booking value.

STOP.

---

## Stage 6 — Trip Builder

Implement:

- create trip;
- add hotel stays;
- assign nights;
- choose booking method;
- calculate totals;
- save notes.

### Acceptance criteria

- multi-hotel trips work;
- points and cash totals are correct;
- changing one stay recalculates the trip;
- incomplete pricing does not break totals.

STOP.

---

## Stage 7 — Local Bonvoy Profile

Implement local profile persistence.

Support:

- status;
- points balance;
- valuation;
- certificates;
- preferences;
- export;
- import.

### Acceptance criteria

- profile persists locally;
- no login required;
- exported data can reconstruct the profile;
- profile changes affect relevant calculations.

STOP.

---

## Stage 8 — Elite Benefit Engine

Implement:

- brand rules;
- status rules;
- property overrides;
- source evidence.

### Acceptance criteria

- effective benefits can be explained;
- property override precedence works;
- anecdotal/editorial observations remain distinct from program rules;
- contradictory rules are surfaced.

STOP.

---

## Stage 9 — Catalog Expansion

Expand toward approximately 100–200 curated properties.

Prioritize compelling leisure and destination hotels.

### Acceptance criteria

- catalog health remains within approved quality thresholds;
- no schema errors;
- no silent conflicts;
- every factual expansion follows sourcing rules.

STOP.

---

## Stage 10 — Watchlist

Implement target-property saving.

### Acceptance criteria

Users can save:

- target dates;
- desired cash rate;
- desired points rate;
- priority;
- notes.

No automated monitoring required.

STOP.

---

## Stage 11 — Maps

Add maps only after the explorer is otherwise mature.

Maps should support:

- property locations;
- trip geography;
- multi-property itineraries where useful.

Do not allow mapping infrastructure to become a dependency for property discovery.

STOP.

---

## Stage 12 — Dynamic Data Research

Research reliable ways to obtain:

- cash pricing;
- award pricing;
- availability;
- opening changes.

Before implementing anything, produce a written assessment covering:

- data source;
- reliability;
- legality/terms;
- technical stability;
- update frequency;
- expected failure modes;
- maintenance burden.

Do not implement scraping without explicit approval.

STOP after research.

---

## Stage 13 — Approved Dynamic Integration

Only proceed if Stage 12 identifies a sufficiently reliable source and explicit approval is given.

Implement behind a provider interface.

Example:

```text
RateProvider
```

The application must continue working when the provider fails.

STOP.

---

## Stage 14 — Portfolio Optimization

Implement multi-trip Bonvoy allocation.

Provide different optimization strategies.

### Acceptance criteria

- strategies are explainable;
- calculations are deterministic;
- users can inspect point allocation;
- optimizer never assumes unavailable future rates are known.

STOP.

---

## Stage 15 — Monitoring and Alerts

Only build monitoring after reliable dynamic data exists.

Potential events:

- award price below threshold;
- cash rate below threshold;
- award availability appears;
- hotel opening date changes;
- property joins or leaves Marriott;
- relevant benefit changes.

STOP.

---

## Stage 16 — Optional Cloud Accounts

Only consider cloud profiles and synchronization if there is a clear user need.

Do not retrofit authentication merely for technical sophistication.

---

# 32. Stage Completion Manifest

Every completed stage must end with a report in this format:

```text
STAGE COMPLETION REPORT

Stage:
<stage number and name>

Status:
PASS / PARTIAL / FAIL

Implemented:
✓ ...
✓ ...

Validation:
Typecheck: PASS/FAIL
Lint: PASS/FAIL
Schema validation: PASS/FAIL
Unit tests: X/X passed
Integration tests: X/X passed
E2E tests: X/X passed or N/A
Production build: PASS/FAIL

Catalog Health:
Properties:
Schema errors:
Missing critical evidence:
Conflicting claims:
Stale claims:
Unverified claims:

Commit:
<full SHA>

Deployment:
<exact URL or N/A>

Known limitations:
- ...

Unresolved issues:
- ...

Recommended next stage:
...

STOPPING HERE FOR REVIEW.
```

Do not begin the recommended next stage automatically.

---

# 33. Change Discipline

Before modifying the project:

1. inspect current repository state;
2. inspect existing architecture documentation;
3. inspect relevant tests;
4. identify files likely to change;
5. preserve existing working behavior unless intentionally superseded.

After changes:

1. run appropriate tests;
2. run full required validation;
3. inspect the UI if visual behavior changed;
4. update documentation;
5. commit with a descriptive message.

Do not mark a task complete merely because code was written.

---

# 34. Git Rules

Use GitHub as the project's source of truth.

Prefer:

- focused commits;
- clear commit messages;
- pull requests for meaningful changes;
- protected passing CI before merge.

Do not commit:

- credentials;
- secret API keys;
- copied proprietary datasets;
- unlicensed images.

---

# 35. Initial Product Success Definition

The project has reached its first meaningful product milestone when a user can:

1. browse a trustworthy curated Marriott catalog;
2. filter and compare hotels;
3. enter a cash and points rate manually;
4. receive a transparent points-versus-cash assessment;
5. provide trip preferences;
6. receive explainable recommendations;
7. assemble hotels into a trip;
8. see total points and cash requirements;
9. save their Bonvoy profile locally;
10. understand where important hotel facts came from.

The first success milestone does NOT require:

- live Marriott award availability;
- automated Marriott pricing;
- every Marriott hotel;
- user accounts;
- reservation booking.

---

# 36. Long-Term North Star

The mature application should eventually answer:

> You have 1.2 million Bonvoy points, these certificates, this elite status, these travel windows, and these travel preferences.

> Here are the strongest trips you can build.

> Here is where points create exceptional value.

> Here is where cash is preferable.

> Here is how many points to allocate to each trip.

> Here are the properties worth monitoring.

> Here are the assumptions and sources behind those recommendations.

The goal is not to create another Marriott search interface.

The goal is to create an explainable decision engine for planning high-value Marriott travel.

---

# 37. First Assignment

Execute **Stage 0 only**.

Create the project's technical foundation, documentation, architecture, CI, testing framework, and deployment structure.

Do not begin Stage 1 property research.

Do not populate a meaningful hotel catalog.

Do not implement Marriott scraping or dynamic pricing.

At completion:

- run every Stage 0 acceptance check;
- commit the completed work;
- deploy a basic working shell if deployment is configured;
- provide the Stage Completion Report;
- STOP for review.