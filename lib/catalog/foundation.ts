import foundation from '../../data/foundation.json';
import properties from '../../data/properties/index.json';
import brands from '../../data/brands/index.json';
import destinations from '../../data/destinations/index.json';
import benefits from '../../data/benefits/index.json';
import sources from '../../data/sources/index.json';
import { validateFoundation } from '../validation/foundation';

export function loadFoundation() {
  return validateFoundation({ foundation, properties, brands, destinations, benefits, sources });
}
