import { describe, expect, it } from 'vitest';
import { recommendProperties, initialRecommendationInput } from '../../lib/scoring/recommendations';
import type { RecommendationInput } from '../../lib/scoring/recommendations';
import { DEFAULT_WEIGHTS } from '../../lib/scoring/methodology';
import { scoredCatalog, scoredRequest } from '../fixtures/recommendations';
import { AS_OF, claim, fixtureCatalog } from '../fixtures/catalog';
import { pointsInput } from '../fixtures/points';
import type { EvidenceClaim } from '../../types/catalog';
import { rawCatalog } from '../../lib/catalog/catalog';
import { catalogSchema } from '../../lib/validation/catalog';

function run(catalog = scoredCatalog(), input: RecommendationInput = scoredRequest()) {
  const result = recommendProperties(catalog, input);
  if (!result.success) throw new Error(result.errors.join('\n'));
  return result;
}

describe('Stage 5 deterministic recommendation layers', () => {
  it('uses independent expected weights, contributions, coverage and bounds', () => {
    expect(DEFAULT_WEIGHTS).toEqual({ quality: 30, destination: 20, experience: 20, elite: 15, uniqueness: 10, logistics: 5 });
    const r = run().results[0]!;
    expect(r.eligibility).toBe('eligible');
    expect(r.fit.components.map((c) => c.score)).toEqual([80, 100, 100, null, 70, 50]);
    expect(r.fit.components.map((c) => c.contribution)).toEqual([24, 20, 20, null, 7, 2.5]);
    expect(r.fit).toMatchObject({ score: null, coverage: 85, lowerBound: 73.5, upperBound: 88.5, activeWeight: 100, knownWeight: 85 });
    expect(r.economics).toBeNull();
  });
  it('returns byte-identical output for repeated input without mutation', () => {
    const catalog = scoredCatalog(); const input = scoredRequest();
    const before = JSON.stringify({ catalog, input });
    expect(JSON.stringify(run(catalog, input))).toBe(JSON.stringify(run(catalog, input)));
    expect(JSON.stringify({ catalog, input })).toBe(before);
  });
  it('preserves all missing ratings and booking prices as unknown', () => {
    const r = run(fixtureCatalog(), initialRecommendationInput(AS_OF)).results[0]!;
    expect(r.eligibility).toBe('provisional');
    expect(r.fit.score).toBeNull(); expect(r.fit.coverage).toBe(0);
    expect(r.fit.lowerBound).toBe(0); expect(r.fit.upperBound).toBe(100);
    expect(r.fit.components.every((c) => c.score === null)).toBe(true);
    expect(r.economics).toBeNull();
    expect(r.explanation.summary).toContain('Booking value unavailable');
  });
  it('keeps excellent hotel fit separate from poor award value', () => {
    const request = scoredRequest();
    request.quotes = [{ propertyId: 'property-fixture', checkIn: null, observedAt: AS_OF, calculator: pointsInput({ cashRoom: 100, cashTaxes: 0, cashFees: 0, awardCash: 0 }) }];
    const r = run(scoredCatalog(), request).results[0]!;
    expect(r.fit.lowerBound).toBe(73.5);
    expect(r.economics?.band).toBe('Strongly cash preferred');
    expect(r.explanation.bookingAction).toContain('Cash is favored');
  });
  it('does not promote a weak fit because redemption is excellent', () => {
    const request = scoredRequest(); request.preferredTags = ['beach'];
    request.quotes = [{ propertyId: 'property-fixture', checkIn: null, observedAt: AS_OF, calculator: pointsInput({ cashRoom: 1500 }) }];
    const r = run(scoredCatalog(), request).results[0]!;
    expect(r.fit.lowerBound).toBe(53.5); expect(r.economics?.band).toBe('Excellent points use');
    expect(r.explanation.weaknesses.join(' ')).toContain('Experience preference');
  });
  it('separates award value from insufficient balance and retains a valid cash option', () => {
    const input = scoredRequest(); input.maxCashUsd = 3000;
    input.quotes = [{ propertyId: 'property-fixture', checkIn: null, observedAt: AS_OF, calculator: pointsInput({ balance: 199999 }) }];
    const r = run(scoredCatalog(), input).results[0]!;
    expect(r.eligibility).toBe('eligible'); expect(r.economics?.pointsShortfall).toBe(1);
    expect(r.economics?.band).toBe('Excellent points use'); expect(r.explanation.bookingAction).toContain('cannot fund');
    input.bookingMethod = 'points'; expect(run(scoredCatalog(), input).results[0]!.eligibility).toBe('excluded');
  });
  it('handles budget unknown, confirmed zero and both paths over budget', () => {
    const input = scoredRequest(); input.maxCashUsd = 0;
    expect(run(scoredCatalog(), input).results[0]!.eligibility).toBe('provisional');
    input.quotes = [{ propertyId: 'property-fixture', checkIn: null, observedAt: AS_OF, calculator: pointsInput({ awardCash: 0, balance: 200000 }) }];
    expect(run(scoredCatalog(), input).results[0]!.eligibility).toBe('eligible');
    input.quotes[0]!.calculator.awardCash = 100;
    expect(run(scoredCatalog(), input).results[0]!.eligibility).toBe('excluded');
  });
  it('does not reuse quotes for changed nights or dates', () => {
    const input = scoredRequest(); input.quotes = [{ propertyId: 'property-fixture', checkIn: '2027-01-10', observedAt: AS_OF, calculator: pointsInput() }];
    input.nights = 4; expect(run(scoredCatalog(), input).results[0]!.economics).toBeNull();
    input.nights = 5; input.checkIn = '2027-01-11'; expect(run(scoredCatalog(), input).results[0]!.economics).toBeNull();
    input.checkIn = '2027-01-10'; expect(run(scoredCatalog(), input).results[0]!.economics?.cpp).toBe(1.375);
  });
  it('retains unknown fees, valuation, comparability, FX and zero-points limitations', () => {
    for (const overrides of [{ cashTaxes: null }, { comparable: 'different' as const }, { valuationCpp: null }, { currency: 'BRL' as const, usdPerCurrency: null }, { awardBasis: 'total' as const, awardPoints: 0 }]) {
      const input = scoredRequest(); input.quotes = [{ propertyId: 'property-fixture', checkIn: null, observedAt: null, calculator: pointsInput(overrides) }];
      const r = run(scoredCatalog(), input).results[0]!;
      expect(r.economics?.band).toBeNull(); expect(r.fit.lowerBound).toBe(73.5);
      expect(r.explanation.bookingAction).toContain('Confirm comparable');
    }
  });
  it('does not double-discount a final award quote', () => {
    const input = scoredRequest(); input.quotes = [{ propertyId: 'property-fixture', checkIn: null, observedAt: AS_OF, calculator: pointsInput({ awardBasis: 'total', awardPoints: 200000 }) }];
    expect(run(scoredCatalog(), input).results[0]!.economics?.pointsSpent).toBe(200000);
  });
  it('preserves source conflicts, stale and unverified evidence without score credit', () => {
    for (const kind of ['conflict', 'stale', 'unverified']) {
      const catalog = scoredCatalog(); const tag = catalog.evidenceClaims.find((c) => c.subject === 'experienceTags')!;
      if (kind === 'conflict') catalog.evidenceClaims.push(claim('experienceTags', ['beach'], { id: 'claim-conflicting-tag', conflictStatus: 'disputed' }) as EvidenceClaim);
      if (kind === 'stale') { tag.lastVerifiedAt = '2024-01-01'; tag.observedAt = '2024-01-01'; }
      if (kind === 'unverified') { tag.confidence = 'Unverified'; tag.lastVerifiedAt = null; }
      const input = scoredRequest(); input.requiredTag = 'desert';
      const r = run(catalog, input).results[0]!;
      expect(r.eligibility).toBe('provisional'); expect(r.fit.components.find((c) => c.key === 'experience')?.score).toBeNull();
    }
  });
  it('treats unknown lounge rules as provisional, never as a guarantee', () => {
    const input = scoredRequest(); input.requireLounge = true;
    const r = run(scoredCatalog(), input).results[0]!;
    expect(r.eligibility).toBe('provisional'); expect(r.fit.components.find((c) => c.key === 'elite')?.score).toBeNull();
  });
  it('excludes known geography, recorded-tag and operating-status mismatches', () => {
    expect(run(scoredCatalog(), { ...scoredRequest(), country: 'TZ' }).results[0]!.eligibility).toBe('excluded');
    expect(run(scoredCatalog(), { ...scoredRequest(), requiredTag: 'ski' }).results[0]!.eligibility).toBe('excluded');
    for (const status of ['planned', 'closed', 'temporarily-closed']) {
      const catalog = scoredCatalog(); catalog.evidenceClaims.find((c) => c.subject === 'operatingStatus')!.value = status as 'planned';
      expect(run(catalog).results[0]!.eligibility).toBe('excluded');
    }
  });
  it('supports versioned custom weights, zero active weight and a fully supported score', () => {
    const input = scoredRequest(); input.weights = { quality: 30, destination: 20, experience: 20, elite: 0, uniqueness: 25, logistics: 5 };
    const result = run(scoredCatalog(), input); expect(result.methodologyVersion).toBe('trip-fit-1-custom');
    expect(result.results[0]!.fit).toMatchObject({ score: 84, coverage: 100, lowerBound: 84, upperBound: 84 });
    input.destinationId = null; input.weights = { quality: 0, destination: 100, experience: 0, elite: 0, uniqueness: 0, logistics: 0 };
    expect(run(scoredCatalog(), input).results[0]!.fit).toMatchObject({ score: null, lowerBound: null, upperBound: null, activeWeight: 0 });
  });
  it('selects editorial reviews deterministically and keeps strengths labeled editorial', () => {
    const catalog = scoredCatalog(); const assessment = catalog.editorialAssessments[0]!;
    catalog.editorialAssessments.push({ ...assessment, id: 'editorial-future', reviewedAt: '2027-01-01', hardwareQuality: 10, serviceQuality: 10 });
    const r = run(catalog).results[0]!; expect(r.fit.components[0]!.score).toBe(80);
    expect(r.explanation.editorialStrengths).toEqual(['Synthetic strength']);
    expect(r.fit.components[0]!.kind).toBe('editorial');
  });
  it('uses stable ID tie-breaking independent of catalog order and quote value', () => {
    const catalog = scoredCatalog(); const first = catalog.properties[0]!;
    const second = { ...first, id: 'property-alpha', slug: 'alpha', name: 'Second synthetic hotel' };
    catalog.properties.push(second);
    catalog.evidenceClaims.push(...catalog.evidenceClaims.map((c) => ({ ...c, id: `${c.id}-alpha`, propertyId: second.id })));
    catalog.editorialAssessments.push({ ...catalog.editorialAssessments[0]!, id: 'editorial-alpha', propertyId: second.id });
    const input = scoredRequest(); input.quotes = [{ propertyId: first.id, checkIn: null, observedAt: AS_OF, calculator: pointsInput({ cashRoom: 1500 }) }];
    expect(run(catalog, input).results.map((r) => r.propertyId)).toEqual(['property-alpha', 'property-fixture']);
    catalog.properties.reverse(); expect(run(catalog, input).results.map((r) => r.propertyId)).toEqual(['property-alpha', 'property-fixture']);
  });
  it('rejects invalid schemas, weights, duplicates, IDs and dates gracefully', () => {
    const input = scoredRequest();
    for (const change of [null, { ...input, weights: { ...input.weights, quality: 0 } }, { ...input, nights: 0 }, { ...input, asOf: 'invalid' }, { ...input, destinationId: 'missing' }, { ...input, unknown: true }, { ...input, preferredTags: ['desert', 'desert'] }]) expect(recommendProperties(scoredCatalog(), change).success).toBe(false);
    const quote = { propertyId: 'property-fixture', checkIn: null, observedAt: AS_OF, calculator: pointsInput() };
    expect(recommendProperties(scoredCatalog(), { ...input, quotes: [quote, quote] }).success).toBe(false);
    expect(recommendProperties(scoredCatalog(), { ...input, quotes: [{ ...quote, observedAt: '2027-01-01' }] }).success).toBe(false);
    expect(recommendProperties(scoredCatalog(), { ...input, quotes: [{ ...quote, propertyId: 'property-missing' }] }).success).toBe(false);
  });
  it('keeps the unchanged 25-property catalog usable with honestly partial scores', () => {
    const result = run(catalogSchema.parse(rawCatalog), { ...initialRecommendationInput('2026-10-08'), preferredTags: ['wildlife'] });
    expect(result.results).toHaveLength(25); expect(result.results.every((r) => r.fit.score === null && r.economics === null)).toBe(true);
    expect(result.results[0]!.fit.components.find((c) => c.key === 'experience')?.score).toBe(100);
  });
});
