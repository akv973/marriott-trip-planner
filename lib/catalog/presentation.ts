import type { Catalog, EvidenceClaim, EvidenceSubject, Property } from '../../types/catalog';
import { findConflicts, isApplicable, isStale, valueKey } from './evidence';

export const FIELD_LABELS: Record<EvidenceSubject, string> = {
  name: 'Property name', brandId: 'Brand', city: 'City', country: 'Country / territory', region: 'Region',
  officialUrl: 'Official property page', marriottCode: 'Marriott property code', propertyType: 'Property type',
  administrativeArea: 'State / province', latitude: 'Latitude', longitude: 'Longitude', nearestAirport: 'Nearest airport',
  openingYear: 'Opening year', renovationYear: 'Renovation year', roomCount: 'Room count', isResort: 'Resort designation',
  isDestinationProperty: 'Destination-property designation', experienceTags: 'Experience tags', operatingStatus: 'Operating status',
};

export function countryName(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
}

export function humanize(value: string) {
  return value.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export function displayDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

export function formatValue(subject: EvidenceSubject, value: EvidenceClaim['value'], catalog: Catalog): string {
  if (value == null) return 'Unknown';
  if (subject === 'brandId') return catalog.brands.find((brand) => brand.id === value)?.name ?? String(value);
  if (subject === 'country') return countryName(String(value));
  if (Array.isArray(value)) return value.length ? value.map(humanize).join(', ') : 'None recorded';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    return `${value.name}${value.iataCode ? ` (${value.iataCode})` : ''} · ${value.distanceKm == null ? 'Distance unknown' : `about ${value.distanceKm.toFixed(1)} km`}`;
  }
  if (subject === 'propertyType' || subject === 'operatingStatus') return humanize(String(value));
  return String(value);
}

// A view never resolves disputes or promotes an unverified claim into a fact.
// All claims (including expired/unknown/disputed ones) remain inspectable.
export function fieldEvidence(catalog: Catalog, property: Property, subject: EvidenceSubject, asOf: string) {
  const claims = catalog.evidenceClaims.filter((claim) => claim.propertyId === property.id && claim.subject === subject);
  const active = claims.filter((claim) => isApplicable(claim, asOf));
  const conflicted = findConflicts(active, asOf).length > 0;
  let value: EvidenceClaim['value'] = subject === 'operatingStatus' ? null : property[subject] ?? null;
  if (subject === 'operatingStatus' && !conflicted) value = active.find((claim) => claim.confidence !== 'Unverified' && claim.value !== null)?.value ?? null;
  const matching = active.filter((claim) => claim.value !== null && value !== null && valueKey(claim.value) === valueKey(value) && claim.confidence !== 'Unverified');
  const status = conflicted ? 'conflicted' : value !== null && matching.length ? 'known' : active.some((claim) => claim.value !== null && claim.confidence === 'Unverified') ? 'unverified' : 'unknown';
  const levels = [...new Set(matching.map((claim) => claim.confidence))];
  const verifiedDates = matching.flatMap((claim) => claim.lastVerifiedAt ? [claim.lastVerifiedAt] : []).sort();
  return {
    value: status === 'known' ? value : null,
    status,
    claims,
    confidence: levels.join(' / '),
    lastVerifiedAt: verifiedDates.at(-1) ?? null,
    stale: matching.some((claim) => isStale(claim, asOf)),
    label: status === 'conflicted' ? 'Requires review — sources conflict' : status === 'unverified' ? 'Unknown — unverified evidence' : status === 'unknown' ? 'Unknown' : formatValue(subject, value, catalog),
  };
}
