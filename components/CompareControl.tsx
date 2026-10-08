import type { Property } from '../types/catalog';
import { MAX_COMPARISON } from '../lib/catalog/comparison';

export function CompareControl({ property, slugs, onToggle }: { property: Property; slugs: string[]; onToggle?: ((slug: string) => void) | undefined }) {
  const selected = slugs.includes(property.slug);
  return <label className={`compare-control${selected ? ' is-selected' : ''}`}>
    <input type="checkbox" checked={selected} disabled={!selected && slugs.length >= MAX_COMPARISON}
      onChange={() => onToggle?.(property.slug)} aria-label={`Compare ${property.name}`} />
    <span>{selected ? 'Selected for comparison' : slugs.length >= MAX_COMPARISON ? 'Comparison full (4/4)' : 'Add to comparison'}</span>
  </label>;
}
