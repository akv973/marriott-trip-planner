import type { Property } from '../types/catalog';
export type WatchControlProps = { onWatch?: ((property: Property) => void) | undefined; watchedIds?: string[] | undefined };
export function WatchControl({ property, onWatch, watchedIds = [] }: WatchControlProps & { property: Property }) {
  if (!onWatch) return null;
  const saved = watchedIds.includes(property.id);
  return <button className="text-button watch-control" aria-label={`${saved ? 'View watch targets for' : 'Save to watchlist:'} ${property.name}`} onClick={() => onWatch(property)}>{saved ? 'View watch targets' : 'Save to watchlist'} <span aria-hidden="true">→</span></button>;
}
