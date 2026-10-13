import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MapBoundary, MapPanel } from '../../components/MapPanel';
import GeographicMap from '../../components/GeographicMap';
import { propertyStops, tripStops } from '../../lib/maps/geography';
import { fixtureCatalog } from '../fixtures/catalog';
import { loadCatalog } from '../../lib/catalog/catalog';
import { DEFAULT_QUERY } from '../../lib/catalog/explorer';
import { createStay, createTrip } from '../../lib/trips/trips';

const loaded = loadCatalog('2026-10-13'); if (!loaded.success) throw new Error('Catalog must validate');
const catalog = loaded.data;
const stops = propertyStops(catalog,[catalog.properties[0]!],'2026-10-13');
const land = [[[-120,30],[-110,30],[-110,40],[-120,30]]];
afterEach(()=>vi.unstubAllGlobals());
describe('Map boundaries preserve independent discovery and plans',()=>{
  it('keeps a missing location and unknown itinerary stop visible without starting any map requests',()=>{
    const fetch = vi.fn();vi.stubGlobal('fetch',fetch);
    const c=fixtureCatalog();const trip={...createTrip('trip-map'),stays:[createStay('stay-known',c.properties[0]!.id),createStay('stay-unknown','property-missing')]};
    render(<MapPanel title="Trip geography" stops={tripStops(c,trip,'2026-10-07')} itinerary query={DEFAULT_QUERY} comparisonSlugs={[]} />);
    expect(screen.getByText('0 of 2 stays mapped · 2 locations unknown')).toBeInTheDocument();
    expect(screen.getByRole('link',{name:/Stay 1/})).toBeInTheDocument();
    expect(screen.getByText(/Stay 2 · Unknown property/)).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Show geographic map'})).not.toBeInTheDocument();expect(fetch).not.toHaveBeenCalled();
  });
  it('preserves context and sourced location lists before any optional map is opened',()=>{
    const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
    render(<MapPanel title="Property location" stops={stops} query={{...DEFAULT_QUERY,country:'US'}} comparisonSlugs={['mapito']} />);
    expect(screen.getByRole('link',{name:catalog.properties[0]!.name})).toHaveAttribute('href','#/properties/dove-mountain?country=US&compare=mapito');
    expect(screen.getByText(/32.467144, -111.100096/)).toBeInTheDocument();expect(fetch).not.toHaveBeenCalled();
  });
  it.each(['network','invalid-json','http-error'])('recovers from %s map failure while its location list remains usable',async failure=>{
    const fetch=vi.fn().mockImplementationOnce(()=>failure==='network'?Promise.reject(new Error('Unavailable')):Promise.resolve({ok:failure!=='http-error',json:()=>Promise.resolve(failure==='invalid-json'?{}:land)})).mockResolvedValue({ok:true,json:()=>Promise.resolve(land)});
    vi.stubGlobal('fetch',fetch);
    render(<><GeographicMap stops={stops} itinerary={false}/><MapPanel title="Property location" stops={stops} query={DEFAULT_QUERY} comparisonSlugs={[]}/></>);
    expect(await screen.findByText(/Geographic map unavailable/)).toBeInTheDocument();
    expect(screen.getByRole('link',{name:catalog.properties[0]!.name})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Retry map'}));
    expect(await screen.findByRole('img',{name:'Property geography map'})).toBeInTheDocument();expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('street tile failure returns to the geographic overview and allows a deliberate retry',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:()=>Promise.resolve(land)}));
    const {container}=render(<GeographicMap stops={stops} itinerary={false}/>);
    await screen.findByRole('img',{name:'Property geography map'});
    expect(container.querySelector('image')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'Load street map'}));
    expect(screen.getByRole('link',{name:'© OpenStreetMap contributors'})).toBeInTheDocument();
    fireEvent.error(container.querySelector('image')!);
    expect(screen.getByText(/Street map unavailable/)).toBeInTheDocument();expect(screen.getByRole('img',{name:'Property geography map'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Retry street map'}));
    await waitFor(()=>expect(container.querySelectorAll('image').length).toBeGreaterThan(0));
    for(const image of container.querySelectorAll('image'))fireEvent.load(image);
  });
  it('contains a renderer failure and retries without affecting its surrounding content',()=>{
    let fail=true;const Throws=()=>{if(fail)throw new Error('Synthetic map failure');return <p>Recovered map</p>;};
    const errors=vi.spyOn(console,'error').mockImplementation(()=>{});
    render(<><p>Independent explorer</p><MapBoundary><Throws/></MapBoundary></>);
    expect(screen.getByText('Independent explorer')).toBeInTheDocument();expect(screen.getByText(/Map unavailable/)).toBeInTheDocument();
    fail=false;fireEvent.click(screen.getByRole('button',{name:'Retry map'}));expect(screen.getByText('Recovered map')).toBeInTheDocument();errors.mockRestore();
  });
});
