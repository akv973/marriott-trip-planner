import foundation from '../../data/foundation.json';
import benefits from '../../data/benefits/index.json';
import { catalogAt } from './catalog';
import { validateFoundation } from '../validation/foundation';

export function loadFoundation() {
  return validateFoundation({ foundation, ...catalogAt(), benefits });
}
