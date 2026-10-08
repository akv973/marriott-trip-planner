import type { EvidenceClaim } from '../../types/catalog';
import { claim, fixtureCatalog, AS_OF } from './catalog';
import type { RecommendationInput } from '../../lib/scoring/recommendations';
import { initialRecommendationInput } from '../../lib/scoring/recommendations';

// Independent synthetic scored properties, never production hotel claims or rates.
export function scoredCatalog() {
  const catalog = fixtureCatalog();
  const property = catalog.properties[0]!;
  property.experienceTags = ['desert', 'spa'];
  property.nearestAirport = { name: 'Synthetic Airport', distanceKm: 50 };
  catalog.evidenceClaims.push(claim('experienceTags', property.experienceTags) as EvidenceClaim, claim('nearestAirport', property.nearestAirport) as EvidenceClaim, claim('operatingStatus', 'open') as EvidenceClaim);
  catalog.editorialAssessments.push({ id: 'editorial-fixture', propertyId: property.id, kind: 'editorial', author: 'Synthetic reviewer', hardwareQuality: 8, serviceQuality: 8, uniqueness: 7, rationale: 'Synthetic scoring fixture.', reviewedAt: AS_OF, methodologyVersion: 'synthetic-1', idealTraveler: [], strengths: ['Synthetic strength'], weaknesses: ['Synthetic weakness'] });
  return catalog;
}
export function scoredRequest(): RecommendationInput {
  return { ...initialRecommendationInput(AS_OF), country: 'US', destinationId: 'destination-fixture', preferredTags: ['desert'], maxAirportKm: 100 };
}
