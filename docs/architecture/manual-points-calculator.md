# Stage 4 — Manual Points Calculator

## Scope and sequencing

Stage 4 adds one transient manual stay assessment at `#/calculator`. Explorer, details and 2–4 property comparison keep their catalog facts, unknown prices and evidence semantics. Detail links carry an optional property locator; comparison selection and explorer filters remain URL context. User rates are never URL parameters, catalog facts, account data or persisted profile data. Reload clears rates. No network provider, Marriott integration, certificate, trip builder, hotel-fit score or Stage 5 recommendation engine exists.

`lib/points/calculator.ts` owns strict Zod validation, monetary normalization, discount eligibility and economics. UI manages raw form strings, converts blanks to null, displays errors and formats domain results. Invalid submitted input does not produce partial arithmetic. Editing clears the old result. Changing currency or quote basis clears money/points fields whose meaning changes. A calculation moves focus to the summary heading, including on narrow screens.

## Inputs and unknowns

1–60 consecutive nights; quote currency; optional check-in, quote observation date, room/occupancy/inclusions and cancellation notes. Dates/notes describe user quotes and establish no current hotel fact.

Cash room cost is either one nightly amount multiplied by nights or one total before extras. Taxes and mandatory fees are separate entire-stay amounts. Users with an all-in cash quote can enter it as a total and explicitly enter zero extras to avoid double counting. Award cash payable includes all amounts still due. There is no inferred fee waiver. Blank money/points/FX/balance is null. An explicit zero charge is valid; zero points produces undefined CPP rather than division by zero.

Award input modes:

- Flat nightly points before any discount.
- One points quote for every night before any discount; all nights must be known.
- Final quoted total containing any discounts and upgrade points: never subtract again.

The UI limits supported currencies to USD/EUR/GBP/CAD/BRL/TZS/ZAR/JPY/AUD/CHF. Non-USD CPP requires a manually entered USD per quote-currency unit conversion; no FX estimate or fetch. Personal point valuation always uses USD cents. Monetary arithmetic normalizes to currency minor units; CPP remains unrounded internally and displays three decimals.

## Policy verification, 2026-10-08 UTC

Primary sources reviewed before implementation:

- Marriott Bonvoy terms, marked Updated September 2026: https://www.marriott.com/loyalty/terms/default.mi — §§3.2.b, 3.2.f, 3.3.d–f.
- Official Stay for 5, Pay for 4 help: https://help.marriott.com/s/article/stay-for-5-pay-for-4-benefit — current retrieved guidance dated July 16, 2026, including the ten-night example.

Eligible consecutive standard-room Standard/PointSavers points stays use one property and one reservation. For each complete five nights, remove one lowest standard-room points night; ten nights remove the two lowest across the entire stay. Ties use the earliest night. No deduction applies to ineligible inputs, certificates or Cash + Points. Unknown eligibility for a stay of at least five nights leaves net points unknown. Final quoted totals are accepted directly. Premium/upgrade point costs are not discounted by this engine; use a final quote for those products.

Cash still payable is entered manually because general award inclusions, all-inclusive participation and property exceptions differ. The general award rules cover room tax but leave many non-room charges payable. Eligibility selection is a user assertion, not a property benefit rule or booking validation. Sources are static links and a dated policy version in `policy.ts`, not runtime requests.

## Formula and classification

Cash total = room cost + stay taxes + stay mandatory fees.

Net cash avoided = cash total − award cash payable.

USD CPP = net cash avoided × manual USD conversion × 100 ÷ net points spent.

Award economic cost = award cash payable in USD + net points × personal USD CPP ÷ 100.

For comparable products, classify actual CPP / personal CPP. Default threshold ratios: below 0.5 strongly cash preferred; 0.5 to below 0.9 cash preferred; 0.9 to below 1.1 approximately neutral; 1.1 to below 1.5 good points use; 1.5 or higher excellent points use. Four increasing positive ratios are editable. Defaults are versioned planning choices, not Marriott policy. Unknown personal valuation or comparable-product confirmation prevents classification. Different products show illustrative CPP with a review warning. Negative avoided cash is retained and favors cash.

A transient optional points balance produces an independent shortfall/remaining check. Insufficient points does not pretend that an economically good redemption is affordable, and no purchase or transfer is assumed. Unknown balance remains unknown. Exclude paid-stay points earnings, credit-card rewards, elite treatment and certificate opportunity costs; disclose these omissions.

## Verification and stage boundary

Canonical fixtures independently specify five nights, four nights, cash superior, points superior, missing award, missing cash, insufficient points and optional missing balance. Unit tests additionally exercise whole-stay ten-night discounts, varying rates, earliest ties, fourteen/fifteen nights, unknown eligibility, total double-deduction protection, explicit zeros, missing nightly quotes, minor-unit money, FX, negative value, assessment boundaries and malformed input. DOM/browser checks cover the form, arithmetic, unknowns, invalid input, reset, currency/basis changes, source links and preserved history/context.

The brief's stale/conflicting/incomplete property scenarios continue in the existing suites. Certificate and top-off cases remain pending Stage 7; benefit override Stage 8; multi-hotel totals Stage 6; hotel eligibility/trip-fit integration Stage 5. Pending cases have no skipped/placeholder passing tests.
