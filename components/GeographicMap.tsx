import { useEffect, useId, useState } from 'react';
import { z } from 'zod';
import { fitView, focusView, itinerarySegments, pointInView, project, tilesForView, WORLD_VIEW, zoomView } from '../lib/maps/geography';
import type { MapStop, MapView } from '../lib/maps/geography';

const landUrl = new URL('../data/maps/land.json', import.meta.url).href;
const landSchema = z.array(z.array(z.tuple([z.number().finite().min(-180).max(180), z.number().finite().min(-90).max(90)] )).min(4)).min(1);
type Land = z.infer<typeof landSchema>;
export default function GeographicMap({ stops, itinerary }: { stops: MapStop[]; itinerary: boolean }) {
  const [land, setLand] = useState<Land | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState(() => fitView(stops));
  const [selected, setSelected] = useState(stops.find(s => s.coordinate)?.id ?? '');
  const [street, setStreet] = useState(false);
  const [streetFailed, setStreetFailed] = useState(false);
  const [tileAttempt, setTileAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const clipId = useId();
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    fetch(landUrl, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('Map unavailable'); return r.json(); }).then(input => { const parsed = landSchema.parse(input); if (!controller.signal.aborted) setLand(parsed); }).catch(() => { if (!controller.signal.aborted) setFailed(true); else if (controller.signal.reason?.name === 'AbortError') setFailed(true); }).finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); controller.abort('unmounted'); };
  }, [attempt]);
  const tiles = tilesForView(view);
  const pending = street && tiles.some(t => !loaded.has(`${tileAttempt}:${t.id}`));
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => { setStreet(false); setStreetFailed(true); setView(fitView(stops)); }, 12_000);
    return () => clearTimeout(timer);
  }, [pending, tileAttempt, view, stops]);
  if (failed) return <div className="map-notice"><p>Geographic map unavailable. Your property list and saved planner remain available.</p><button className="text-button" onClick={() => { setFailed(false); setAttempt(a => a + 1); }}>Retry map</button></div>;
  if (!land) return <p className="map-notice">Loading geographic map… Your property list is available below.</p>;
  const chosen = stops.find(s => s.id === selected) ?? stops.find(s => s.coordinate);
  const points = stops.filter(s => s.coordinate).map(s => ({ ...s, point: pointInView(s.coordinate!, view) }));
  const radius = view.width * 0.017;
  const changeView = (v: MapView) => setView({ ...v, x: ((v.x + v.width / 2) % 1 + 1) % 1 - v.width / 2 });
  const loadStreet = () => { if (chosen?.coordinate) changeView(focusView(chosen.coordinate)); setStreetFailed(false); setStreet(true); setTileAttempt(a => a + 1); };
  return <div className="geographic-map">
    <div className="map-controls" aria-label="Map controls"><button className="text-button" onClick={() => changeView(zoomView(view, 0.5))} disabled={view.width <= 0.00024}>Zoom in</button><button className="text-button" onClick={() => changeView(zoomView(view, 2))} disabled={view.width >= 1}>Zoom out</button><button className="text-button" onClick={() => { setStreet(false); changeView(fitView(stops)); }}>Fit locations</button><button className="text-button" onClick={() => { setStreet(false); changeView(WORLD_VIEW); }}>World view</button>
      {(['north', 'west', 'east', 'south'] as const).map(direction => <button className="text-button" key={direction} aria-label={`Pan ${direction}`} onClick={() => changeView({ ...view, x: view.x + (direction === 'west' ? -0.25 : direction === 'east' ? 0.25 : 0) * view.width, y: Math.max(-view.height, Math.min(1, view.y + (direction === 'north' ? -0.25 : direction === 'south' ? 0.25 : 0) * view.height)) })}>{direction[0]!.toUpperCase() + direction.slice(1)}</button>)}
    </div>
    <label className="map-choice">Focus location<select value={selected} onChange={e => { setSelected(e.target.value); const coordinate = stops.find(s => s.id === e.target.value)?.coordinate; if (coordinate) changeView(focusView(coordinate)); }}>{stops.filter(s => s.coordinate).map(s => <option key={s.id} value={s.id}>{s.number} · {s.property?.name ?? s.label}</option>)}</select></label>
    <svg className="map-canvas" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} role="img" aria-label={itinerary ? 'Trip geography map' : 'Property geography map'}>
      <title>{itinerary ? 'Ordered hotel stays with geographic connections' : 'Published property locations'}</title><desc>Mercator overview. Use the focus selector and location list for individual properties. Small islands may be absent from the geographic overview.</desc>
      <defs><clipPath id={clipId}><rect x={view.x} y={view.y} width={view.width} height={view.height} /></clipPath></defs>
      <g clipPath={`url(#${clipId})`}><rect x={view.x} y={view.y} width={view.width} height={view.height} fill="#dce9ed" />
        {[-1, 0, 1, 2].map(shift => <g key={shift}>{land.map((ring,i) => <path key={i} d={ring.map(([longitude,latitude],n) => { const [x,y] = project({ latitude, longitude }); return `${n ? 'L' : 'M'}${x + shift},${y}`; }).join(' ') + 'Z'} fill="#eceee3" stroke="#a5b9a4" strokeWidth={view.width * 0.0007} />)}</g>)}
        {!street && Array.from({ length: 13 }, (_,i) => <line key={i} x1={view.x + i * view.width / 12} x2={view.x + i * view.width / 12} y1={view.y} y2={view.y + view.height} stroke="#78909a" strokeOpacity="0.13" strokeWidth={view.width * 0.0006} />)}
        {street && tiles.map(t => <image key={`${tileAttempt}:${t.id}`} href={t.url} x={t.x} y={t.y} width={t.size} height={t.size} onLoad={() => setLoaded(current => new Set(current).add(`${tileAttempt}:${t.id}`))} onError={() => { setStreet(false); setStreetFailed(true); setView(fitView(stops)); }} />)}
        {itinerary && itinerarySegments(stops).map(({from,to}) => { const a = pointInView(from.coordinate!, view), b = pointInView(to.coordinate!, view); return Math.abs(a[0] - b[0]) <= 0.5 ? <line className="map-segment" key={`${from.id}:${to.id}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#52683c" strokeWidth={view.width * 0.0025} strokeDasharray={`${view.width * 0.008} ${view.width * 0.006}`} /> : null; })}
        {!street && view.width > 0.2 && [{label:'North America',latitude:48,longitude:-110},{label:'South America',latitude:-16,longitude:-60},{label:'Europe',latitude:55,longitude:20},{label:'Africa',latitude:9,longitude:20},{label:'Asia',latitude:38,longitude:95},{label:'Oceania',latitude:-27,longitude:137}].map(c => { const [x,y] = pointInView(c,view); return <text key={c.label} x={x} y={y} textAnchor="middle" fill="#4e695f" fontSize={view.width * 0.016}>{c.label}</text>; })}
        {points.map(s => <g key={s.id} className="map-pin" data-stop={s.number}><title>{s.number} · {s.label}</title><circle cx={s.point[0]} cy={s.point[1]} r={radius} fill={s.id === selected ? '#984c36' : '#32482f'} stroke="white" strokeWidth={view.width * 0.0025} /><text x={s.point[0]} y={s.point[1]} dy={radius * 0.35} textAnchor="middle" fontSize={radius} fontWeight="700" fill="white">{s.number}</text></g>)}
        {chosen?.coordinate && <circle cx={pointInView(chosen.coordinate,view)[0]} cy={pointInView(chosen.coordinate,view)[1]} r={radius * 1.25} fill="none" stroke="#984c36" strokeWidth={view.width * 0.002} />}
      </g>
    </svg>
    <div className="map-attribution"><span>Geographic overview: <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">Natural Earth · public domain</a></span>{street && <span>Street map: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a> · ODbL · tiles as Produced Work</span>}</div>
    {streetFailed && <p className="map-notice">Street map unavailable. The geographic overview and location list still work. <button className="text-button" onClick={loadStreet}>Retry street map</button></p>}
    <div className="map-street-controls">{street ? <button className="text-button" onClick={() => { setStreet(false); changeView(fitView(stops)); }}>Use geographic overview</button> : <button className="text-button" onClick={loadStreet}>Load street map</button>}<span>Street maps load from OpenStreetMap on request. No planner notes or dates are sent.</span></div>
    <p className="map-caption">{chosen?.label}. Pins sharing a location may overlap; the focus selector and numbered list preserve every stay. Overview coastlines are generalized and can omit small islands. Latitude near the poles is clamped for display.</p>
  </div>;
}
