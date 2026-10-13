import { Component, lazy, Suspense, useState } from 'react';
import type { ReactNode } from 'react';
import type { MapStop } from '../lib/maps/geography';
import { propertyHref } from '../lib/navigation/routes';
import type { ExplorerQuery } from '../lib/catalog/explorer';

const GeographicMap = lazy(() => import('./GeographicMap'));
export class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="map-notice"><p>Map unavailable. Your property list and saved planner remain available.</p><button className="text-button" onClick={() => this.setState({ failed: false })}>Retry map</button> <button className="text-button" onClick={() => window.location.reload()}>Reload page</button></div> : this.props.children; }
}
export function MapPanel({ title, stops, itinerary = false, query, comparisonSlugs }: { title: string; stops: MapStop[]; itinerary?: boolean; query: ExplorerQuery; comparisonSlugs: string[] }) {
  const [visible, setVisible] = useState(false);
  const mapped = stops.filter(s => s.coordinate);
  return <section className="map-panel" aria-label={title}>
    <div className="map-heading"><div><p className="eyebrow">Places in perspective</p><h2>{title}</h2><p>{mapped.length} of {stops.length} {itinerary ? 'stays' : 'properties'} mapped · {stops.length - mapped.length} locations unknown</p></div>{!!mapped.length && <button className="text-button" aria-expanded={visible} onClick={() => setVisible(v => !v)}>{visible ? 'Hide map' : 'Show geographic map'}</button>}</div>
    {itinerary && <p className="map-caption">Numbers follow your saved stay order, including repeat visits. Dashed connections show consecutive known stays, not transport routes. Missing locations break the line. Dates and travel times are not inferred.</p>}
    {!stops.length && <p>Add hotel stays to see your trip geography.</p>}
    {!!stops.length && !mapped.length && <p>Locations are unknown. Properties remain available for discovery and planning.</p>}
    {visible && <MapBoundary key={stops.map(s => `${s.id}:${s.coordinate?.latitude}:${s.coordinate?.longitude}`).join('|')}><Suspense fallback={<p className="map-notice">Loading geographic map… Your property list is available below.</p>}><GeographicMap stops={stops} itinerary={itinerary} /></Suspense></MapBoundary>}
    <ol className="map-locations" aria-label={`${title} locations`}>{stops.map(s => <li key={s.id}><span className="map-list-number" aria-hidden="true">{s.number}</span><div>{s.property ? <a href={propertyHref(s.property.slug, query, comparisonSlugs)}>{s.label}</a> : <strong>{s.label}</strong>}<p>{s.coordinate ? `${s.coordinate.latitude.toFixed(6)}, ${s.coordinate.longitude.toFixed(6)} · Published property pin${s.stale ? ' · Evidence needs review' : ''}` : s.reason}</p>{s.coordinate && <a className="text-link" href={`https://www.openstreetmap.org/?mlat=${s.coordinate.latitude}&mlon=${s.coordinate.longitude}#map=15/${s.coordinate.latitude}/${s.coordinate.longitude}`} target="_blank" rel="noopener noreferrer">Open street map ↗</a>}</div></li>)}</ol>
    {!!mapped.length && <p className="map-caption">Pins are approximate geographic references from dated evidence. Confirm the entrance and access with the hotel before travel. Inspect latitude and longitude sources in property details.</p>}
  </section>;
}
