import { useEffect, useState } from 'react';
import { BrandMark } from '../components/BrandMark';
import { FoundationError } from '../components/FoundationError';
import { PropertyExplorer } from '../components/PropertyExplorer';
import { PropertyDetails } from '../components/PropertyDetails';
import { PointsCalculator } from '../components/PointsCalculator';
import { PropertyComparison } from '../components/PropertyComparison';
import { ComparisonTray } from '../components/ComparisonTray';
import { ProjectNotes } from '../components/ProjectNotes';
import { loadFoundation } from '../lib/catalog/foundation';
import { calculatorHref, comparisonHref, explorerHref, parseRoute, propertyHref } from '../lib/navigation/routes';
import { resolveComparison, toggleComparison } from '../lib/catalog/comparison';
import type { Catalog } from '../types/catalog';

export function ExplorerApplication({ catalog, asOf }: { catalog: Catalog; asOf: string }) {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const property = route.page === 'property' ? catalog.properties.find((record) => record.slug === route.slug) : undefined;
  const selection = resolveComparison(catalog, route.comparisonSlugs);
  const slugs = selection.properties.map((record) => record.slug);
  const setSelection = (next: string[]) => {
    const href = route.page === 'compare' ? comparisonHref(next, route.query) : route.page === 'calculator' ? calculatorHref(route.query, next, route.propertySlug ?? undefined) : route.page === 'property' ? propertyHref(route.slug, route.query, next) : explorerHref(route.query, next);
    window.location.assign(href);
    // Controlled checkboxes must reflect the click before the async hashchange.
    setRoute(parseRoute(href));
  };
  const onToggle = (slug: string) => setSelection(toggleComparison(slugs, slug));
  const onRemove = (slug: string) => setSelection(slugs.filter((entry) => entry !== slug));
  const onClear = () => setSelection([]);
  const section = route.page === 'explore' ? route.section : null;
  const pageKey = `${route.page}:${property?.slug ?? ''}:${route.page === 'compare' ? slugs.join(',') : ''}`;
  useEffect(() => {
    if (section) document.getElementById(section)?.scrollIntoView();
    else {
      window.scrollTo?.(0, 0);
      document.getElementById('page-title')?.focus({ preventScroll: true });
    }
  }, [pageKey, section]);
  useEffect(() => {
    document.title = `${property ? property.name : route.page === 'calculator' ? 'Manual Points Calculator' : route.page === 'compare' ? 'Property Comparison' : route.page === 'explore' ? 'Property Explorer' : 'Property not found'} · Marriott Trip Planner`;
  }, [property, route.page]);
  return <>
    <a className="skip-link" href="#main" onClick={(event) => { event.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
    <header className="site-header"><a className="brand" href={explorerHref(undefined, slugs)} aria-label="Marriott Trip Planner explorer"><BrandMark /><span>Marriott<span className="brand-subtitle">Trip Planner</span></span></a>
      <nav aria-label="Main navigation"><a href={explorerHref(undefined, slugs)} aria-current={route.page === 'explore' && !section ? 'page' : undefined}>Explorer</a><a href={comparisonHref(slugs, route.query)} aria-current={route.page === 'compare' ? 'page' : undefined}>Compare ({slugs.length})</a><a href={calculatorHref(route.query, slugs)} aria-current={route.page === 'calculator' ? 'page' : undefined}>Points calculator</a><a href={`${explorerHref(route.query, slugs).replace('#/explore', '#foundation')}`}>Our approach</a><a href={`${explorerHref(route.query, slugs).replace('#/explore', '#roadmap')}`}>What’s next</a></nav><span className="stage-pill"><span />Manual Points Calculator · Stage 4</span></header>
    <main id="main" tabIndex={-1}>
      {!!selection.issues.length && <div className="comparison-warning" role="alert"><p>Some comparison selections need review.</p><ul>{selection.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul><button className="text-button" onClick={() => setSelection(slugs)}>Keep valid selections</button></div>}
      <ComparisonTray properties={selection.properties} query={route.query} onRemove={onRemove} onClear={onClear} comparing={route.page === 'compare'} />
      {route.page === 'calculator' ? <PointsCalculator key={route.propertySlug ?? 'manual'} catalog={catalog} query={route.query} comparisonSlugs={slugs} propertySlug={route.propertySlug} /> : route.page === 'compare' ? <PropertyComparison catalog={catalog} properties={selection.properties} query={route.query} asOf={asOf} onRemove={onRemove} onClear={onClear} /> : route.page === 'explore' ? <PropertyExplorer catalog={catalog} query={route.query} asOf={asOf} comparisonSlugs={slugs} onToggle={onToggle} /> : property ? <PropertyDetails catalog={catalog} property={property} query={route.query} asOf={asOf} comparisonSlugs={slugs} onToggle={onToggle} /> : <section className="not-found"><p className="eyebrow">An uncharted corner</p><h1 id="page-title" tabIndex={-1}>Property not found.</h1><p>This link doesn’t identify a property in the curated collection.</p><a className="primary-link" href={explorerHref(route.query, slugs)}>Return to the explorer <span aria-hidden="true">→</span></a></section>}
      {route.page === 'explore' && <ProjectNotes />}
    </main><footer><p>Marriott Trip Planner <span>·</span> Thoughtful travel, explained.</p><p>Independent planning tool. Not affiliated with Marriott International.</p></footer>
  </>;
}

export function App() {
  const [result] = useState(loadFoundation);
  return result.success ? <ExplorerApplication catalog={result.data} asOf={new Date().toISOString().slice(0, 10)} /> : <FoundationError />;
}
