import type { Catalog, EditorialPropertyAssessment, EvidenceSubject } from '../../types/catalog';

export const MIN_COMPARISON = 2;
export const MAX_COMPARISON = 4;

export function resolveComparison(catalog: Catalog, slugs: string[]) {
  const unique = [...new Set(slugs)];
  const missing = unique.filter((slug) => !catalog.properties.some((property) => property.slug === slug));
  const known = unique.flatMap((slug) => {
    const property = catalog.properties.find((record) => record.slug === slug);
    return property ? [property] : [];
  });
  return {
    properties: known.slice(0, MAX_COMPARISON),
    issues: [
      ...missing.map((slug) => `Property unavailable in this catalog: ${slug || '(empty selection)'}.`),
      ...(unique.length > MAX_COMPARISON ? ['A comparison supports at most four properties. Only the first four valid selections are shown.'] : []),
    ],
  };
}

export function toggleComparison(slugs: string[], slug: string): string[] {
  const unique = [...new Set(slugs)];
  return unique.includes(slug) ? unique.filter((entry) => entry !== slug)
    : unique.length < MAX_COMPARISON ? [...unique, slug] : unique;
}

export const COMPARISON_FACT_GROUPS: { title: string; subjects: EvidenceSubject[] }[] = [
  { title: 'Sourced identity & setting', subjects: ['brandId', 'city', 'administrativeArea', 'country', 'region', 'propertyType', 'experienceTags', 'isResort', 'isDestinationProperty', 'operatingStatus'] },
  { title: 'Sourced property details', subjects: ['openingYear', 'renovationYear', 'roomCount'] },
  { title: 'Sourced airport logistics', subjects: ['nearestAirport'] },
];

// These dimensions have no admitted rates/benefit model in the Stage 3 catalog.
// They are deliberately explicit, never inferred from the brand or setting.
export const UNAVAILABLE_COMPARISON_ROWS = [
  { label: 'Cash cost', value: 'Unavailable' },
  { label: 'Points cost', value: 'Unavailable' },
  { label: 'Cents per point', value: 'Unavailable' },
  { label: 'Elite benefits', value: 'Unknown' },
  { label: 'Elite breakfast', value: 'Unknown' },
  { label: 'Lounge access', value: 'Unknown' },
  { label: 'Resort / destination fees', value: 'Unknown' },
] as const;

export const EDITORIAL_COMPARISON_ROWS = [
  { key: 'hardwareQuality', label: 'Hardware quality' },
  { key: 'serviceQuality', label: 'Service quality' },
  { key: 'locationQuality', label: 'Location quality' },
  { key: 'uniqueness', label: 'Uniqueness' },
  { key: 'destinationWorthiness', label: 'Destination-worthiness' },
  { key: 'eliteValuePotential', label: 'Elite-value potential' },
  { key: 'recommendedStayLength', label: 'Recommended stay' },
  { key: 'idealTraveler', label: 'Ideal traveler / trip fit' },
  { key: 'strengths', label: 'Strengths' },
  { key: 'weaknesses', label: 'Limitations' },
] as const;
export type EditorialComparisonKey = typeof EDITORIAL_COMPARISON_ROWS[number]['key'];

export function editorialComparisonValue(assessment: EditorialPropertyAssessment, key: EditorialComparisonKey): string {
  const value = assessment[key];
  if (value == null) return 'Unknown';
  if (typeof value === 'number') return `${value} / 10`;
  if (Array.isArray(value)) return value.length ? value.join(' · ') : 'None recorded';
  return `${value.minNights}–${value.maxNights} nights`;
}
