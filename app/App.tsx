import { useEffect, useState } from 'react';
import { BrandMark } from '../components/BrandMark';
import { FoundationError } from '../components/FoundationError';
import { PropertyExplorer } from '../components/PropertyExplorer';
import { PropertyDetails } from '../components/PropertyDetails';
import { ProjectNotes } from '../components/ProjectNotes';
import { loadFoundation } from '../lib/catalog/foundation';
import { explorerHref, parseRoute } from '../lib/navigation/routes';
import type { Catalog } from '../types/catalog';

export function ExplorerApplication({ catalog, asOf }: { catalog: Catalog; asOf: string }) {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const property = route.page === 'property' ? catalog.properties.find((record) => record.slug === route.slug) : undefined;
  const section = route.page === 'explore' ? route.section : null;
  const pageKey = `${route.page}:${property?.slug ?? ''}`;
  useEffect(() => {
    if (section) document.getElementById(section)?.scrollIntoView();
    else {
      window.scrollTo?.(0, 0);
      document.getElementById('page-title')?.focus({ preventScroll: true });
    }
  }, [pageKey, section]);
  useEffect(() => {
    document.title = `${property ? property.name : route.page === 'explore' ? 'Property Explorer' : 'Property not found'} · Marriott Trip Planner`;
  }, [property, route.page]);
  return <>
    <a className="skip-link" href="#main" onClick={(event) => { event.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
    <header className="site-header"><a className="brand" href={explorerHref()} aria-label="Marriott Trip Planner explorer"><BrandMark /><span>Marriott<span className="brand-subtitle">Trip Planner</span></span></a>
      <nav aria-label="Main navigation"><a href={explorerHref()} aria-current={route.page === 'explore' && !section ? 'page' : undefined}>Explorer</a><a href="#foundation">Our approach</a><a href="#roadmap">What’s next</a></nav><span className="stage-pill"><span />Property Explorer · Stage 2</span></header>
    <main id="main" tabIndex={-1}>
      {route.page === 'explore' ? <PropertyExplorer catalog={catalog} query={route.query} asOf={asOf} /> : property ? <PropertyDetails catalog={catalog} property={property} query={route.query} asOf={asOf} /> : <section className="not-found"><p className="eyebrow">An uncharted corner</p><h1 id="page-title" tabIndex={-1}>Property not found.</h1><p>This link doesn’t identify a property in the curated collection.</p><a className="primary-link" href={explorerHref(route.query)}>Return to the explorer <span aria-hidden="true">→</span></a></section>}
      {route.page === 'explore' && <ProjectNotes />}
    </main><footer><p>Marriott Trip Planner <span>·</span> Thoughtful travel, explained.</p><p>Independent planning tool. Not affiliated with Marriott International.</p></footer>
  </>;
}

export function App() {
  const [result] = useState(loadFoundation);
  return result.success ? <ExplorerApplication catalog={result.data} asOf={new Date().toISOString().slice(0, 10)} /> : <FoundationError />;
}
