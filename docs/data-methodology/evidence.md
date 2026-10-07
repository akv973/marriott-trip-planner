# Data and evidence methodology

## Current foundation

All five domain collections are intentionally empty. Stage 0 implements the validation framework, not hotel schemas, evidence resolution, editorial scoring, or a researched catalog. The foundation schema rejects prematurely seeded records.

## Stage 1 approach

Stable property identity is separate from editorial evaluation and date-sensitive observations. Important claims need a Source and EvidenceClaim, with relevant dates, confidence, and conflicts. Missing data is allowed; it must be distinguishable from known absence and zero cost.

Source precedence generally follows Marriott corporate/Bonvoy terms, the official Marriott property page, the official hotel website, official hotel communication, reputable reporting, then community/traveler reports. Rank does not override recency or validity. Preserve conflicting claims and explain any effective-value resolution.

Record claim values, field/subject, property reference, source reference, observation/verification dates, applicable validity periods, confidence, notes, and conflict state where relevant. Store editorial strengths, weaknesses, ratings, stay recommendations, and rationale with their own review date and methodology version.

Prices must include currency, stay dates, observation date, room comparability, taxes/fees, and booking terms where known. A standalone points number is not current availability or a current rate. Affiliation changes, resort fees, benefits, openings, closures, and availability are observations rather than timeless facts.

## Catalog health

Stage 1 defines critical evidence requirements, missing references, stale thresholds by claim type, unresolved conflicts, and confidence denominators. Report counts and percentages with explicit denominators. Empty evidence does not yield 100% confidence.

The Stage 0 `catalog:health` command reports properties and schema errors, zero claims, `evidenceAssessed: false`, and `confidencePercentages: null`. Full completeness/staleness/conflict evaluation does not yet exist. Serious conflicts or schema failures must block bulk expansion at Stage 9.

No facts should be invented to fill a schema. No images or proprietary datasets are copied. Manually captured evidence must preserve its source and verification date, with maintainer review before promotion.
