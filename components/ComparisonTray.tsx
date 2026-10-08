import type { Property } from '../types/catalog';
import type { ExplorerQuery } from '../lib/catalog/explorer';
import { MIN_COMPARISON } from '../lib/catalog/comparison';
import { comparisonHref } from '../lib/navigation/routes';

export function ComparisonTray({ properties, query, onRemove, onClear, comparing }: {
  properties: Property[]; query: ExplorerQuery; onRemove: (slug: string) => void; onClear: () => void; comparing: boolean;
}) {
  if (!properties.length || comparing) return null;
  return <section className="comparison-tray" aria-label="Selected comparison properties">
    <div className="tray-heading"><p className="eyebrow">Your comparison</p><p aria-live="polite">{properties.length} of 4 selected{properties.length < MIN_COMPARISON ? ' · Choose one more property' : ''}</p></div>
    <ul>{properties.map((property) => <li key={property.id}><span>{property.name}</span><button className="remove-comparison" onClick={() => onRemove(property.slug)} aria-label={`Remove ${property.name} from comparison`}>×</button></li>)}</ul>
    <div className="tray-actions">{properties.length >= MIN_COMPARISON ? <a className="primary-link" href={comparisonHref(properties.map((property) => property.slug), query)}>Compare {properties.length} properties <span aria-hidden="true">→</span></a> : <span className="unknown-value">Select at least 2 to compare.</span>}<button className="text-button" onClick={onClear}>Clear comparison</button></div>
  </section>;
}
