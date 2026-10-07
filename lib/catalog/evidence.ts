import type { EvidenceClaim, EvidenceSubject } from '../../types/catalog';

export interface StalenessPolicy {
  defaultDays: number;
  bySubject?: Partial<Record<EvidenceSubject, number>>;
}

// Overrides can be extended independently of schemas. Affiliation needs closer review.
export const DEFAULT_STALENESS_POLICY: StalenessPolicy = { defaultDays: 365, bySubject: { brandId: 180, operatingStatus: 90 } };
export const CRITICAL_SUBJECTS = ['name', 'brandId', 'city', 'country'] as const;

export function isApplicable(claim: EvidenceClaim, asOf: string): boolean {
  return (!claim.validFrom || claim.validFrom <= asOf) && (!claim.validTo || claim.validTo >= asOf)
    && (!claim.observedAt || claim.observedAt <= asOf) && (!claim.lastVerifiedAt || claim.lastVerifiedAt <= asOf);
}

export function isStale(claim: EvidenceClaim, asOf: string, policy = DEFAULT_STALENESS_POLICY): boolean {
  if (!isApplicable(claim, asOf) || claim.value === null) return false;
  const date = claim.lastVerifiedAt ?? claim.observedAt;
  if (!date) return false;
  const age = (Date.parse(asOf) - Date.parse(date)) / 86_400_000;
  return age > (policy.bySubject?.[claim.subject] ?? policy.defaultDays);
}

// Object key order and set-like experience tag order must not manufacture conflicts.
export function valueKey(value: EvidenceClaim['value']): string {
  if (Array.isArray(value)) return JSON.stringify([...value].sort());
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
  }
  return JSON.stringify(value);
}

export interface EvidenceConflict {
  propertyId: string;
  subject: EvidenceSubject;
  claimIds: string[];
}

export function findConflicts(claims: EvidenceClaim[], asOf: string): EvidenceConflict[] {
  const groups = new Map<string, EvidenceClaim[]>();
  for (const claim of claims) {
    if (!isApplicable(claim, asOf)) continue;
    const key = `${claim.propertyId}:${claim.subject}`;
    groups.set(key, [...(groups.get(key) ?? []), claim]);
  }
  const conflicts: EvidenceConflict[] = [];
  for (const group of groups.values()) {
    const known = group.filter((claim) => claim.value !== null && claim.sourceId !== null && claim.confidence !== 'Unverified');
    if (group.some((claim) => claim.conflictStatus === 'disputed') || new Set(known.map((claim) => valueKey(claim.value))).size > 1) {
      const first = group[0]!;
      conflicts.push({ propertyId: first.propertyId, subject: first.subject, claimIds: group.map((claim) => claim.id).sort() });
    }
  }
  return conflicts.sort((a, b) => `${a.propertyId}:${a.subject}`.localeCompare(`${b.propertyId}:${b.subject}`));
}
