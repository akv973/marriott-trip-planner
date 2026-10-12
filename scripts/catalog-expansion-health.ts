import { createHash } from 'node:crypto';
import manifest from '../docs/data-methodology/stage-9-batches/index.json';
import { rawCatalog, loadCatalog } from '../lib/catalog/catalog';
import { assessCatalog } from '../lib/catalog/health';
import { benefits, effectiveBenefits } from '../lib/benefits/engine';
import { benefitReferenceErrors, BENEFIT_LABELS } from '../lib/benefits/schema';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  return JSON.stringify(value);
}
const digest = (v: unknown) => createHash('sha256').update(canonical(v)).digest('hex');
const loaded = loadCatalog(manifest.reviewedAt);
if (!loaded.success) throw new Error('Expanded catalog fails admission.');
const catalog = loaded.data;
const errors: string[] = [];
const collections = { properties: rawCatalog.properties, brands: rawCatalog.brands, destinations: rawCatalog.destinations, sources: rawCatalog.sources, evidence: rawCatalog.evidenceClaims, editorial: rawCatalog.editorialAssessments };
for (const [name, baseline] of Object.entries(manifest.baseline)) if (digest(collections[name as keyof typeof collections].slice(0, baseline.count)) !== baseline.sha256) errors.push(`Stage 8 baseline changed: ${name}`);
for (const [name, baseline] of Object.entries(manifest.baselineBenefits)) if (digest(benefits[name as keyof typeof manifest.baselineBenefits].slice(0, baseline.count)) !== baseline.sha256) errors.push(`Stage 8 benefit baseline changed: ${name}`);
const added = manifest.batches.flatMap(b => b.propertyIds);
if (manifest.batches.length !== 5 || manifest.batches.some(b => b.propertyIds.length !== 15) || new Set(added).size !== 75 || catalog.properties.length !== manifest.target) errors.push('Expansion requires five disjoint batches and exactly 100 properties.');
if (JSON.stringify(catalog.properties.slice(25).map(p => p.id)) !== JSON.stringify(added)) errors.push('Batch admission order does not match catalog.');
if (new Set(catalog.properties.map(p => p.marriottCode)).size !== 100) errors.push('Duplicate or missing Marriott property codes.');
const allowed = new Set(catalog.properties.slice(0, 25).map(p => p.id));
const batchHealth = manifest.batches.map(batch => {
  batch.propertyIds.forEach(id => allowed.add(id));
  const partial = { ...catalog, properties: catalog.properties.filter(p => allowed.has(p.id)), evidenceClaims: catalog.evidenceClaims.filter(c => allowed.has(c.propertyId)), editorialAssessments: catalog.editorialAssessments.filter(e => allowed.has(e.propertyId)) };
  const assessed = assessCatalog(partial, manifest.reviewedAt);
  const bundle = { ...benefits, rules: benefits.rules.filter(r => !r.propertyId || allowed.has(r.propertyId)), reviews: benefits.reviews.filter(r => allowed.has(r.propertyId)), observations: benefits.observations.filter(o => allowed.has(o.propertyId)) };
  const references = benefitReferenceErrors(bundle, partial);
  if (!assessed.success || references.length) errors.push(`Batch ${batch.id} fails catalog or benefit admission.`);
  return { batch: batch.id, properties: partial.properties.length, claims: partial.evidenceClaims.length, errors: assessed.health.errors.length, missingCriticalEvidence: assessed.health.missingCriticalEvidence, conflictingSubjects: assessed.health.conflictingSubjects, benefitReviews: bundle.reviews.length, benefitReferenceErrors: references.length };
});
const states = ['eligible', 'conditional', 'excluded', 'included', 'unknown'] as const;
const effective = Object.fromEntries(Object.keys(BENEFIT_LABELS).map(key => [key, Object.fromEntries(states.map(s => [s, 0]))])) as Record<string, Record<typeof states[number], number>>;
const benefitConflicts: { propertyId: string; category: string }[] = [];
for (const property of catalog.properties) for (const r of effectiveBenefits(catalog, property, 'platinum', manifest.reviewedAt).results) {
  effective[r.category]![r.outcome.state]++;
  if (r.conflict) benefitConflicts.push({ propertyId: property.id, category: r.category });
}
const expectedConflicts = [
  { propertyId: 'property-al-bustan', subject: 'operatingStatus' },
  { propertyId: 'property-st-regis-deer-valley', subject: 'roomCount' },
];
if (JSON.stringify(loaded.health.conflicts.map(({ propertyId, subject }) => ({ propertyId, subject }))) !== JSON.stringify(expectedConflicts)) errors.push('Catalog conflicts changed: review and explicitly record them.');
if (JSON.stringify(benefitConflicts) !== JSON.stringify([{ propertyId: 'property-athenee-bangkok', category: 'lounge' }])) errors.push('Benefit contradictions changed: review and explicitly record them.');
const countBy = (values: string[]) => Object.fromEntries([...new Set(values)].sort().map(v => [v, values.filter(x => x === v).length]));
const optional = ['latitude', 'nearestAirport', 'openingYear', 'renovationYear', 'roomCount', 'isResort', 'isDestinationProperty'] as const;
const report = {
  stage: 9, asOf: manifest.reviewedAt, properties: catalog.properties.length, additions: added.length, countries: new Set(catalog.properties.map(p => p.country)).size, destinations: catalog.destinations.length,
  regions: countBy(catalog.properties.map(p => p.region)), brands: countBy(catalog.properties.map(p => p.brandId)), experiences: countBy(catalog.properties.flatMap(p => p.experienceTags ?? [])),
  catalogSources: catalog.sources.length, officialCatalogSources: catalog.sources.filter(s => ['marriott-property-page', 'marriott-corporate', 'hotel-official-website'].includes(s.type)).length,
  evidenceClaims: catalog.evidenceClaims.length, confidenceCounts: loaded.health.confidenceCounts, confidencePercentages: loaded.health.confidencePercentages,
  criticalIdentityCoverage: { covered: 400 - loaded.health.missingCriticalEvidence, total: 400 }, schemaErrors: loaded.health.schemaErrors, missingCriticalEvidence: loaded.health.missingCriticalEvidence, missingOptionalEvidence: loaded.health.missingOptionalEvidence,
  staleClaims: loaded.health.staleEvidence.length, unverifiedClaims: loaded.health.unverifiedClaims, conflictingSubjects: loaded.health.conflictingSubjects, conflictingClaims: loaded.health.conflictingClaims,
  optionalKnown: Object.fromEntries(optional.map(k => [k, catalog.properties.filter(p => p[k] != null).length])), editorialAssessments: catalog.editorialAssessments.length,
  benefitReviews: benefits.reviews.length, benefitRules: benefits.rules.length, propertyOverrides: benefits.rules.filter(r => r.layer === 'property').length, unknownProgramScope: benefits.reviews.filter(r => r.scope === null).length,
  benefitContradictions: benefitConflicts, platinumEffectiveStates: effective, batchHealth, errors,
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
