import { Watchlist } from '../components/Watchlist';
import { createWatchTarget, MAX_WATCH_TARGETS } from '../lib/watchlist/watchlist';
import type { Property } from '../types/catalog';
import { useEffect, useRef, useState } from 'react';
import { EliteBenefits } from '../components/EliteBenefits';
import { BonvoyProfile } from '../components/BonvoyProfile';
import { browserRepository, emptyPlanner } from '../lib/storage/planner';
import type { PlannerData } from '../lib/storage/planner';
import { TripBuilder } from '../components/TripBuilder';
import { BrandMark } from '../components/BrandMark';
import { FoundationError } from '../components/FoundationError';
import { PropertyExplorer } from '../components/PropertyExplorer';
import { PropertyDetails } from '../components/PropertyDetails';
import { Recommendations } from '../components/Recommendations';
import { PointsCalculator } from '../components/PointsCalculator';
import { PropertyComparison } from '../components/PropertyComparison';
import { ComparisonTray } from '../components/ComparisonTray';
import { ProjectNotes } from '../components/ProjectNotes';
import { loadFoundation } from '../lib/catalog/foundation';
import { calculatorHref, comparisonHref, explorerHref, parseRoute, propertyHref, recommendationsHref, tripsHref, profileHref, benefitsHref, watchlistHref } from '../lib/navigation/routes';
import { resolveComparison, toggleComparison } from '../lib/catalog/comparison';
import type { Catalog } from '../types/catalog';

export function ExplorerApplication({ catalog, asOf }: { catalog: Catalog; asOf: string }) {
  const [repository] = useState(() => browserRepository(catalog));
  const [initial] = useState(() => repository.load());
  const [data, setData] = useState<PlannerData>(() => initial.success ? initial.data : emptyPlanner());
  const [saveState, setSaveState] = useState(initial.success ? 'Saved in this browser.' : initial.error);
  const dataRef = useRef(data);
  const changeData: typeof setData = (action) => {
    const next = typeof action === 'function' ? action(dataRef.current) : action;
    dataRef.current = next;
    setData(next);
    const result = repository.save(next);
    setSaveState(result.success ? 'Saved in this browser.' : result.error!);
  };
  const setWorkspace: React.Dispatch<React.SetStateAction<PlannerData['workspace']>> = (action) => changeData((current) => ({ ...current, workspace: typeof action === 'function' ? action(current.workspace) : action }));
  const setTargets: React.Dispatch<React.SetStateAction<PlannerData['watchlist']>> = (action) => changeData((current) => ({ ...current, watchlist: typeof action === 'function' ? action(current.watchlist) : action }));
  const replaceSaved = (next: PlannerData) => {
    const result = repository.save(next, true);
    dataRef.current = next; setData(next);
    setSaveState(result.success ? 'Saved in this browser.' : result.error!);
  };
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
    const href = route.page === 'watchlist' ? watchlistHref(route.query, next, route.propertySlug ?? undefined) : route.page === 'benefits' ? benefitsHref(route.query, next, route.propertySlug ?? undefined) : route.page === 'profile' ? profileHref(route.query, next) : route.page === 'trips' ? tripsHref(route.query, next) : route.page === 'recommendations' ? recommendationsHref(route.query, next) : route.page === 'compare' ? comparisonHref(next, route.query) : route.page === 'calculator' ? calculatorHref(route.query, next, route.propertySlug ?? undefined) : route.page === 'property' ? propertyHref(route.slug, route.query, next) : explorerHref(route.query, next);
    window.location.assign(href);
    // Controlled checkboxes must reflect the click before the async hashchange.
    setRoute(parseRoute(href));
  };
  const onToggle = (slug: string) => setSelection(toggleComparison(slugs, slug));
  const onRemove = (slug: string) => setSelection(slugs.filter((entry) => entry !== slug));
  const onClear = () => setSelection([]);
  const onWatch = (property: Property) => {
    if (!dataRef.current.watchlist.some((t) => t.propertyId === property.id) && dataRef.current.watchlist.length < MAX_WATCH_TARGETS) setTargets((targets) => [...targets, createWatchTarget(`watch-${crypto.randomUUID()}`, property.id)]);
    const href = watchlistHref(route.query, slugs, property.slug);
    window.location.assign(href); setRoute(parseRoute(href));
  };
  const watchControls = { onWatch, watchedIds: data.watchlist.map((t) => t.propertyId) };
  const section = route.page === 'explore' ? route.section : null;
  const pageKey = `${route.page}:${property?.slug ?? (route.page === 'benefits' || route.page === 'watchlist' ? route.propertySlug : '')}:${route.page === 'compare' ? slugs.join(',') : ''}`;
  useEffect(() => {
    if (section) document.getElementById(section)?.scrollIntoView();
    else {
      window.scrollTo?.(0, 0);
      document.getElementById('page-title')?.focus({ preventScroll: true });
    }
  }, [pageKey, section]);
  useEffect(() => {
    document.title = `${property ? property.name : route.page === 'watchlist' ? 'Watchlist' : route.page === 'benefits' ? 'Elite Benefit Engine' : route.page === 'profile' ? 'Local Bonvoy Profile' : route.page === 'trips' ? 'Trip Builder' : route.page === 'recommendations' ? 'Recommendations' : route.page === 'calculator' ? 'Manual Points Calculator' : route.page === 'compare' ? 'Property Comparison' : route.page === 'explore' ? 'Property Explorer' : 'Property not found'} · Marriott Trip Planner`;
  }, [property, route.page]);
  return <>
    <a className="skip-link" href="#main" onClick={(event) => { event.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
    <header className="site-header"><a className="brand" href={explorerHref(undefined, slugs)} aria-label="Marriott Trip Planner explorer"><BrandMark /><span>Marriott<span className="brand-subtitle">Trip Planner</span></span></a>
      <nav aria-label="Main navigation"><a href={explorerHref(undefined, slugs)} aria-current={route.page === 'explore' && !section ? 'page' : undefined}>Explorer</a><a href={comparisonHref(slugs, route.query)} aria-current={route.page === 'compare' ? 'page' : undefined}>Compare ({slugs.length})</a><a href={calculatorHref(route.query, slugs)} aria-current={route.page === 'calculator' ? 'page' : undefined}>Points calculator</a><a href={recommendationsHref(route.query, slugs)} aria-current={route.page === 'recommendations' ? 'page' : undefined}>Recommendations</a><a href={tripsHref(route.query, slugs)} aria-current={route.page === 'trips' ? 'page' : undefined}>Trip builder</a><a href={profileHref(route.query, slugs)} aria-current={route.page === 'profile' ? 'page' : undefined}>Profile</a><a href={watchlistHref(route.query, slugs)} aria-current={route.page === 'watchlist' ? 'page' : undefined}>Watchlist</a><a href={benefitsHref(route.query, slugs)} aria-current={route.page === 'benefits' ? 'page' : undefined}>Elite benefits</a><a href={`${explorerHref(route.query, slugs).replace('#/explore', '#foundation')}`}>Our approach</a><a href={`${explorerHref(route.query, slugs).replace('#/explore', '#roadmap')}`}>What’s next</a></nav><span className="stage-pill"><span />100 curated stays · Stage 10</span></header>
    <main id="main" tabIndex={-1}><div className="storage-status" aria-live="polite">{saveState}</div>
      {!!selection.issues.length && <div className="comparison-warning" role="alert"><p>Some comparison selections need review.</p><ul>{selection.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul><button className="text-button" onClick={() => setSelection(slugs)}>Keep valid selections</button></div>}
      <ComparisonTray properties={selection.properties} query={route.query} onRemove={onRemove} onClear={onClear} comparing={route.page === 'compare'} />
      {route.page === 'watchlist' ? <Watchlist key={route.propertySlug ?? 'watchlist'} catalog={catalog} targets={data.watchlist} setTargets={setTargets} query={route.query} comparisonSlugs={slugs} propertySlug={route.propertySlug} /> : route.page === 'benefits' ? <EliteBenefits catalog={catalog} profile={data.profile} asOf={asOf} query={route.query} comparisonSlugs={slugs} propertySlug={route.propertySlug} /> : route.page === 'profile' ? <BonvoyProfile catalog={catalog} data={data} setData={changeData} onReplaceSaved={replaceSaved} /> : route.page === 'trips' ? <TripBuilder catalog={catalog} asOf={asOf} query={route.query} comparisonSlugs={slugs} workspace={data.workspace} setWorkspace={setWorkspace} profile={data.profile} /> : route.page === 'recommendations' ? <Recommendations profile={data.profile} catalog={catalog} asOf={asOf} query={route.query} comparisonSlugs={slugs} /> : route.page === 'calculator' ? <PointsCalculator profile={data.profile} key={route.propertySlug ?? 'manual'} catalog={catalog} query={route.query} comparisonSlugs={slugs} propertySlug={route.propertySlug} /> : route.page === 'compare' ? <PropertyComparison status={data.profile.status} catalog={catalog} properties={selection.properties} query={route.query} asOf={asOf} onRemove={onRemove} onClear={onClear} /> : route.page === 'explore' ? <PropertyExplorer {...watchControls} catalog={catalog} query={route.query} asOf={asOf} comparisonSlugs={slugs} onToggle={onToggle} /> : property ? <PropertyDetails {...watchControls} status={data.profile.status} catalog={catalog} property={property} query={route.query} asOf={asOf} comparisonSlugs={slugs} onToggle={onToggle} /> : <section className="not-found"><p className="eyebrow">An uncharted corner</p><h1 id="page-title" tabIndex={-1}>Property not found.</h1><p>This link doesn’t identify a property in the curated collection.</p><a className="primary-link" href={explorerHref(route.query, slugs)}>Return to the explorer <span aria-hidden="true">→</span></a></section>}
      {route.page === 'explore' && <ProjectNotes />}
    </main><footer><p>Marriott Trip Planner <span>·</span> Thoughtful travel, explained.</p><p>Independent planning tool. Not affiliated with Marriott International.</p></footer>
  </>;
}

export function App() {
  const [result] = useState(loadFoundation);
  return result.success ? <ExplorerApplication catalog={result.data} asOf={new Date().toISOString().slice(0, 10)} /> : <FoundationError />;
}
