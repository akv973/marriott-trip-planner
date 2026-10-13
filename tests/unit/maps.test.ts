import { describe, expect, it } from 'vitest';
import type { EvidenceClaim } from '../../types/catalog';
import locations from '../../data/maps/locations.json';
import { coordinateSchema, validateLocations, withLocations } from '../../lib/maps/locations';
import { fitView, focusView, itinerarySegments, pointInView, project, propertyLocation, propertyStops, tilesForView, tripStops, zoomView } from '../../lib/maps/geography';
import { loadCatalog, rawCatalog } from '../../lib/catalog/catalog';
import { createStay, createTrip } from '../../lib/trips/trips';
import { fixtureCatalog, claim } from '../fixtures/catalog';

const asOf = '2026-10-13';
const loaded = loadCatalog(asOf); if (!loaded.success) throw new Error('Catalog must validate');
const catalog = loaded.data;
describe('Dated, traceable coordinate admission', () => {
  it('reviews precisely the existing catalog and keeps prior records intact', () => {
    const result = validateLocations(locations, rawCatalog.properties, asOf);
    expect(result.success).toBe(true); expect(locations).toHaveLength(100);
    expect(new Set(locations.map(r => r.propertyId))).toEqual(new Set(rawCatalog.properties.map(p => p.id)));
    expect(catalog.properties.map(p => p.id)).toEqual(rawCatalog.properties.map(p => p.id));
    expect(loaded.health).toMatchObject({ missingCoordinates: 0, missingOptionalEvidence: 0, missingCriticalEvidence: 0, conflictingSubjects: 2, totalSources: 200, totalEvidenceClaims: 1217 });
    expect(catalog.evidenceClaims.slice(0,1017)).toEqual(rawCatalog.evidenceClaims);
    expect(rawCatalog.properties.every(p => p.latitude === null && p.longitude === null)).toBe(true);
  });
  it.each([{ latitude: null, longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: -181 }, { latitude: NaN, longitude: 0 }, { latitude: 0, longitude: Infinity }])('rejects malformed pairs %j', pair => expect(coordinateSchema.safeParse(pair).success).toBe(false));
  it('treats genuine zero coordinates as known, with explicit evidence', () => {
    expect(coordinateSchema.safeParse({ latitude: 0, longitude: 0 }).success).toBe(true);
    const c = fixtureCatalog(); const p = c.properties[0]!;
    p.latitude = 0; p.longitude = 0;
    c.evidenceClaims.push(claim('latitude',0) as EvidenceClaim, claim('longitude',0) as EvidenceClaim);
    expect(propertyLocation(c,p,'2026-10-07').coordinate).toEqual({ latitude: 0, longitude: 0 });
  });
  it.each([{ latitude: null }, { longitude: 181 }, { sourceUrl: null }, { confidence: 'Unverified' }, { publishedMapUrl: 'https://www.google.com/maps/search/?query=0,0' }, { sourceUrl: 'https://www.marriott.com/en-us/hotels/wrong-test/overview/' }, { reviewedAt: '2026-10-14' }, { propertyId: 'property-missing' }])('withholds invalid or untraceable map evidence %j', patch => {
    const input = [{ ...locations[0], ...patch }];
    expect(validateLocations(input,rawCatalog.properties,asOf).success).toBe(false);
  });
  it('rejects duplicate identities and unsupported fields', () => {
    expect(validateLocations([locations[0],locations[0]],rawCatalog.properties,asOf).success).toBe(false);
    expect(validateLocations([{ ...locations[0], cityGuess: 'Somewhere' }],rawCatalog.properties,asOf).success).toBe(false);
  });
  it('admits explicit unknown pairs without manufacturing coordinates or claims', () => {
    const unknown = { ...locations[0], latitude: null, longitude: null, sourceUrl: null, publishedMapUrl: null, confidence: 'Unverified' };
    expect(validateLocations([unknown], rawCatalog.properties, asOf).success).toBe(true);
    expect(withLocations(rawCatalog, asOf, [unknown])).toEqual(rawCatalog);
  });
  it('invalid/missing optional map data does not disable the independent catalog', () => {
    expect(withLocations(rawCatalog,asOf,null)).toBe(rawCatalog);
    expect(withLocations(rawCatalog,asOf,[{ ...locations[0], sourceUrl: 'https://example.com/' }])).toBe(rawCatalog);
    expect(withLocations(rawCatalog,asOf,[])).toEqual(rawCatalog);
    expect(loadCatalog('2026-10-12')).toMatchObject({ success:true, health: { missingCoordinates:100,totalSources:100,totalEvidenceClaims:1017 } });
  });
  it('keeps unknown, disputed and unverified coordinates unplotted, while identifying stale known evidence', () => {
    const c = fixtureCatalog(), p = c.properties[0]!;
    expect(propertyLocation(c,p,'2026-10-07')).toMatchObject({coordinate:null,reason:expect.stringContaining('unknown')});
    p.latitude = 10; p.longitude = 20;
    c.evidenceClaims.push(claim('latitude',10,{ conflictStatus:'disputed' }) as EvidenceClaim,claim('longitude',20) as EvidenceClaim);
    expect(propertyLocation(c,p,'2026-10-07')).toMatchObject({coordinate:null,reason:expect.stringContaining('conflict')});
    c.evidenceClaims[c.evidenceClaims.length-2]!.conflictStatus = 'none';
    c.evidenceClaims[c.evidenceClaims.length-2]!.confidence = 'Unverified';
    expect(propertyLocation(c,p,'2026-10-07').coordinate).toBeNull();
    expect(propertyLocation(catalog,catalog.properties[0]!,'2028-01-01')).toMatchObject({stale:true,coordinate:expect.any(Object)});
  });
});
describe('Independent itinerary geography and finite projection', () => {
  const p = catalog.properties[0]!;
  it('retains unknown stops, duplicate property visits, and saved ordering without mutation', () => {
    const trip = { ...createTrip('trip-map'), stays: [createStay('stay-a',p.id),createStay('stay-b','property-missing'),createStay('stay-c',p.id),createStay('stay-d',p.id)] };
    const before = JSON.stringify(trip), stops = tripStops(catalog,trip,asOf);
    expect(stops.map(s=>s.number)).toEqual([1,2,3,4]); expect(stops[1]!.coordinate).toBeNull();
    expect(stops[0]!.coordinate).toEqual(stops[2]!.coordinate);
    expect(itinerarySegments(stops).map(s=>[s.from.number,s.to.number])).toEqual([[3,4]]);
    expect(JSON.stringify(trip)).toBe(before);
  });
  it.each([-90,-85,0,85,90])('projects pole/latitude %s finitely without changing source coordinates', latitude => {
    const c = {latitude,longitude:180}; expect(project(c).every(Number.isFinite)).toBe(true); expect(c.latitude).toBe(latitude);
  });
  it('fits the antimeridian by the short span and includes every known stop', () => {
    const stops = propertyStops(catalog,[p,p],asOf);
    stops[0]!.coordinate = {latitude:10,longitude:179}; stops[1]!.coordinate = {latitude:11,longitude:-179};
    const view = fitView(stops); expect(view.width).toBeLessThan(0.1);
    for (const s of stops) { const [x,y] = pointInView(s.coordinate!,view); expect(x).toBeGreaterThan(view.x); expect(x).toBeLessThan(view.x+view.width); expect(y).toBeGreaterThan(view.y); expect(y).toBeLessThan(view.y+view.height); }
  });
  it('bounded zoom and visible-tile requests wrap the dateline without prefetching', () => {
    let view = focusView({latitude:0,longitude:179.99});
    for(let n=0;n<20;n++) view=zoomView(view,0.5);
    expect(view.width).toBe(0.00024);
    const tiles=tilesForView(view);expect(tiles.length).toBeLessThanOrEqual(40);
    expect(tiles.every(t=>t.url.startsWith('https://tile.openstreetmap.org/'))).toBe(true);
    for(let n=0;n<20;n++) view=zoomView(view,2);expect(view.width).toBe(1);
  });
});
