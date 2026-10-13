import properties from '../../data/properties/index.json';
import brands from '../../data/brands/index.json';
import destinations from '../../data/destinations/index.json';
import sources from '../../data/sources/index.json';
import evidenceClaims from '../../data/evidence/index.json';
import editorialAssessments from '../../data/editorial/index.json';
import { assessCatalog } from './health';
import { withLocations } from '../maps/locations';

export const rawCatalog = { properties, brands, destinations, sources, evidenceClaims, editorialAssessments };
export const catalogAt = (asOf: string = new Date().toISOString().slice(0, 10)) => withLocations(rawCatalog, asOf);

export function loadCatalog(asOf: string = new Date().toISOString().slice(0, 10)) {
  const result = assessCatalog(catalogAt(asOf), asOf);
  return result.success
    ? { success: true as const, data: result.catalog, health: result.health }
    : { success: false as const, health: result.health };
}
