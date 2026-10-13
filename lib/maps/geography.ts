import type { Catalog, Property } from '../../types/catalog';
import { fieldEvidence } from '../catalog/presentation';
import { coordinateSchema } from './locations';
import type { Coordinate } from './locations';
import type { Trip } from '../trips/trips';

export interface MapStop { id: string; number: number; property: Property | null; coordinate: Coordinate | null; reason: string | null; stale: boolean; label: string }
export function propertyLocation(catalog: Catalog, property: Property, asOf: string) {
  const lat = fieldEvidence(catalog, property, 'latitude', asOf), lon = fieldEvidence(catalog, property, 'longitude', asOf);
  const parsed = coordinateSchema.safeParse({ latitude: lat.value, longitude: lon.value });
  const reason = lat.status === 'conflicted' || lon.status === 'conflicted' ? 'Location requires review — sources conflict.' : lat.status === 'unverified' || lon.status === 'unverified' ? 'Location unknown — evidence is unverified.' : 'Location unknown — no verified coordinate pair.';
  return { coordinate: parsed.success ? parsed.data : null, reason: parsed.success ? null : reason, stale: lat.stale || lon.stale };
}
export function propertyStops(catalog: Catalog, properties: Property[], asOf: string): MapStop[] {
  return properties.map((property, index) => ({ id: property.id, number: index + 1, property, label: property.name, ...propertyLocation(catalog, property, asOf) }));
}
export function tripStops(catalog: Catalog, trip: Trip, asOf: string): MapStop[] {
  return trip.stays.map((stay, index) => {
    const property = catalog.properties.find(p => p.id === stay.propertyId) ?? null;
    return { id: stay.id, number: index + 1, property, label: `Stay ${index + 1} · ${property?.name ?? 'Unknown property'}`, ...(property ? propertyLocation(catalog, property, asOf) : { coordinate: null, reason: 'Location unknown — property is unavailable.', stale: false }) };
  });
}
export const MERCATOR_LIMIT = 85.05112878;
export function project(c: Coordinate): [number, number] {
  const lat = Math.max(-MERCATOR_LIMIT, Math.min(MERCATOR_LIMIT, c.latitude)) * Math.PI / 180;
  return [(c.longitude + 180) / 360, (1 - Math.log(Math.tan(Math.PI / 4 + lat / 2)) / Math.PI) / 2];
}
export interface MapView { x: number; y: number; width: number; height: number }
export const WORLD_VIEW: MapView = { x: 0, y: 0.22, width: 1, height: 0.56 };
export function unwrapX(x: number, start: number) { return x + 1e-12 < start ? x + 1 : x; }
export function fitView(stops: MapStop[]): MapView {
  const points = stops.flatMap(s => s.coordinate ? [project(s.coordinate)] : []);
  if (!points.length) return WORLD_VIEW;
  const xs = points.map(p => p[0]).sort((a,b) => a - b);
  let gap = -1, start = 0;
  xs.forEach((x,i) => { const next = xs[(i + 1) % xs.length]! + (i + 1 === xs.length ? 1 : 0); if (next - x > gap) { gap = next - x; start = next % 1; } });
  const unwrapped = points.map(([x,y]) => [unwrapX(x, start), y]);
  const minX = Math.min(...unwrapped.map(p => p[0]!)), maxX = Math.max(...unwrapped.map(p => p[0]!));
  const minY = Math.min(...points.map(p => p[1])), maxY = Math.max(...points.map(p => p[1]));
  const width = Math.min(1, Math.max(points.length === 1 ? 0.08 : 0.003, (maxX - minX) * 1.3, (maxY - minY) * 1.3 / 0.56));
  return { x: (minX + maxX - width) / 2, y: (minY + maxY - width * 0.56) / 2, width, height: width * 0.56 };
}
export function pointInView(c: Coordinate, view: MapView): [number, number] {
  const [x,y] = project(c);
  const center = view.x + view.width / 2;
  return [x + Math.round(center - x), y];
}
export function zoomView(v: MapView, factor: number): MapView {
  const width = Math.max(0.00024, Math.min(1, v.width * factor));
  return { x: v.x + (v.width - width) / 2, y: v.y + (v.height - width * 0.56) / 2, width, height: width * 0.56 };
}
export function focusView(c: Coordinate): MapView { const [x,y] = project(c); return { x: x - 0.0005, y: y - 0.00028, width: 0.001, height: 0.00056 }; }
export function itinerarySegments(stops: MapStop[]) {
  return stops.flatMap((stop,i) => stop.coordinate && stops[i + 1]?.coordinate ? [{ from: stop, to: stops[i + 1]! }] : []);
}
export function tilesForView(view: MapView) {
  const zoom = Math.max(0, Math.min(18, Math.ceil(Math.log2(3.5 / view.width))));
  const count = 2 ** zoom, size = 1 / count;
  const tiles: { id: string; x: number; y: number; size: number; url: string }[] = [];
  for (let x = Math.floor(view.x * count); x <= Math.floor((view.x + view.width) * count); x++) for (let y = Math.max(0, Math.floor(view.y * count)); y <= Math.min(count - 1, Math.floor((view.y + view.height) * count)); y++) {
    const wrapped = ((x % count) + count) % count;
    tiles.push({ id: `${zoom}/${x}/${y}`, x: x * size, y: y * size, size, url: `https://tile.openstreetmap.org/${zoom}/${wrapped}/${y}.png` });
  }
  return tiles;
}
