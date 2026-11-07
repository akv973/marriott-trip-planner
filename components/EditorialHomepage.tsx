import { useEffect, useState } from 'react';
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react';
import type { Catalog } from '../types/catalog';
import { compareText, facetValue } from '../lib/catalog/explorer';
import type { ExplorerQuery } from '../lib/catalog/explorer';
import { countryName, humanize } from '../lib/catalog/presentation';
import { calculatorHref, comparisonHref, explorerHref, tripsHref } from '../lib/navigation/routes';
import { LAKE_COMO_PHOTO } from '../lib/embedded-photos/lake-como';
import { KYOTO_PHOTO } from '../lib/embedded-photos/kyoto';
import { DOLOMITES_PHOTO } from '../lib/embedded-photos/dolomites';
import { PAROS_PHOTO } from '../lib/embedded-photos/paros';

const HERO_SLIDES = [
  { photo: LAKE_COMO_PHOTO, alt: 'Historic lakeside villa and cypress trees on Lake Como', place: 'Lake Como, Italy', line: 'Where the journey begins.' },
  { photo: KYOTO_PHOTO, alt: 'Traditional garden and wooden ryokan in Kyoto', place: 'Kyoto, Japan', line: 'Stillness, kept beautifully.' },
  { photo: DOLOMITES_PHOTO, alt: 'Alpine landscape in the Italian Dolomites', place: 'The Dolomites, Italy', line: 'The mountains set the pace.' },
  { photo: PAROS_PHOTO, alt: 'Whitewashed village above the blue Aegean Sea on Paros', place: 'Paros, Greece', line: 'White walls, slow Aegean light.' },
];

const SPLIT_SLIDES = [
  { photo: PAROS_PHOTO, alt: 'Whitewashed village above the blue Aegean Sea on Paros', title: 'An Aegean retreat, in white and blue.', copy: 'Paros moves at the speed of a long lunch. Whitewashed lanes, fishing boats, and water so clear it looks arranged — the Cyclades at their most unhurried.' },
  { photo: KYOTO_PHOTO, alt: 'Traditional garden and wooden ryokan in Kyoto', title: 'Temples, gardens, unhurried mornings.', copy: 'Kyoto rewards the traveller who stays put: one garden, one bowl of noodles, one hour that was not scheduled.' },
  { photo: DOLOMITES_PHOTO, alt: 'Alpine landscape in the Italian Dolomites', title: 'Alpine air and long, slow evenings.', copy: 'The Dolomites ask for nothing but time. Walk until lunch, lunch until dusk, and let the mountains do the rest.' },
];

function scrollToCollection() {
  document.getElementById('collection-grid')?.scrollIntoView();
}

// Navigate to a filtered explorer URL, then bring the collection grid into
// view once the route has settled (the app scrolls to the top on route
// changes, so the scroll has to happen after that).
function goToCollection(href: string) {
  if (href === window.location.hash) {
    scrollToCollection();
    return;
  }
  window.location.assign(href);
  window.setTimeout(scrollToCollection, 200);
}

function collectionLink(href: string) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    goToCollection(href);
  };
}

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // The timer restarts whenever the slide changes, so a manual step is
  // never immediately followed by an automatic one.
  useEffect(() => {
    if (paused) return;
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % HERO_SLIDES.length), 7000);
    return () => window.clearInterval(timer);
  }, [paused, index]);
  const step = (delta: number) => setIndex((current) => (current + delta + HERO_SLIDES.length) % HERO_SLIDES.length);
  return <section className="editorial-hero" aria-roledescription="carousel" aria-label="Featured destinations" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
    {HERO_SLIDES.map((slide, slideIndex) => <figure className={slideIndex === index ? 'editorial-hero-slide is-active' : 'editorial-hero-slide'} aria-hidden={slideIndex !== index} key={slide.place}>
      <img src={slide.photo} alt={slide.alt} />
      <figcaption><span className="editorial-hero-place">{slide.place}</span><span className="editorial-hero-line">{slide.line}</span></figcaption>
    </figure>)}
    <button type="button" className="editorial-hero-arrow editorial-hero-prev" aria-label="Previous photo" onClick={() => step(-1)}>‹</button>
    <button type="button" className="editorial-hero-arrow editorial-hero-next" aria-label="Next photo" onClick={() => step(1)}>›</button>
    <p className="editorial-hero-counter" aria-live="polite">{index + 1} / {HERO_SLIDES.length}</p>
  </section>;
}

function optionLabel(key: 'country' | 'tag', value: string) {
  if (value === 'unknown') return 'Unknown / requires review';
  if (key === 'country') return countryName(value);
  return humanize(value);
}

function optionValues(catalog: Catalog, key: 'country' | 'tag') {
  return [...new Set(catalog.properties.flatMap((property) => key === 'tag' ? property.experienceTags ?? ['unknown'] : [facetValue(property, key)]))]
    .sort((a, b) => a === 'unknown' ? 1 : b === 'unknown' ? -1 : compareText(optionLabel(key, a), optionLabel(key, b)));
}

function PlanBar({ catalog, query, comparisonSlugs }: { catalog: Catalog; query: ExplorerQuery; comparisonSlugs: string[] }) {
  const [country, setCountry] = useState(query.country);
  const [tag, setTag] = useState(query.tag);
  const countries = optionValues(catalog, 'country');
  if (query.country && !countries.includes(query.country)) countries.unshift(query.country);
  const tags = optionValues(catalog, 'tag');
  if (query.tag && !tags.includes(query.tag)) tags.unshift(query.tag);
  function begin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToCollection(explorerHref({ ...query, country, tag }, comparisonSlugs));
  }
  return <form className="editorial-planbar" aria-label="Plan a stay" onSubmit={begin}>
    <p className="editorial-planbar-title">Plan a stay</p>
    <label className="editorial-planbar-field"><span>Destination</span>
      <select value={country} onChange={(event) => setCountry(event.target.value)} aria-label="Destination country">
        <option value="">Anywhere</option>
        {countries.map((value) => <option value={value} key={value}>{optionLabel('country', value)}</option>)}
      </select>
    </label>
    {/* Labelled "Experience type" (not "Experience") so its accessible name
        stays distinct from the filter panel's Experience select below. */}
    <label className="editorial-planbar-field"><span>Experience type</span>
      <select value={tag} onChange={(event) => setTag(event.target.value)}>
        <option value="">Any experience</option>
        {tags.map((value) => <option value={value} key={value}>{optionLabel('tag', value)}</option>)}
      </select>
    </label>
    <div className="editorial-planbar-go"><button type="submit" className="editorial-button-bronze">Begin</button></div>
  </form>;
}

function SplitFeature() {
  const [index, setIndex] = useState(0);
  const slide = SPLIT_SLIDES[index]!;
  const step = (delta: number) => setIndex((current) => (current + delta + SPLIT_SLIDES.length) % SPLIT_SLIDES.length);
  return <div className="editorial-split-wrap">
    <div className="editorial-split">
      <div>
        <p className="eyebrow">Featured destination</p>
        <h2>{slide.title}</h2>
        <p>{slide.copy}</p>
        <div className="editorial-split-nav">
          <button type="button" aria-label="Previous feature" onClick={() => step(-1)}>‹</button>
          <span className="editorial-split-count" aria-live="polite">{index + 1} / {SPLIT_SLIDES.length}</span>
          <button type="button" aria-label="Next feature" onClick={() => step(1)}>›</button>
          <a className="editorial-learn" href="#/explore" onClick={(event) => { event.preventDefault(); scrollToCollection(); }}>Explore the collection ›</a>
        </div>
      </div>
      <img src={slide.photo} alt={slide.alt} />
    </div>
  </div>;
}

function StagesTabs({ query, comparisonSlugs }: { query: ExplorerQuery; comparisonSlugs: string[] }) {
  const stages = [
    { id: 'compare', label: 'Compare', title: 'Compare your contenders', copy: 'See two to four properties together, with unavailable details made explicit — never hidden, never guessed.', linkLabel: 'Open the comparison', href: comparisonHref(comparisonSlugs, query) },
    { id: 'calculator', label: 'Cash & points', title: 'Make your points count', copy: 'Assess cash and points with rates you enter and assumptions you can see. Your quotes, your math.', linkLabel: 'Open the points calculator', href: calculatorHref(query, comparisonSlugs) },
    { id: 'trips', label: 'Build a trip', title: 'Bring your trip together', copy: 'Connect hotel stays and see the cash and points your trip needs, with totals you can inspect line by line.', linkLabel: 'Open the trip builder', href: tripsHref(query, comparisonSlugs) },
  ];
  const [active, setActive] = useState(0);
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = (active + 1) % stages.length;
    else if (event.key === 'ArrowLeft') next = (active - 1 + stages.length) % stages.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = stages.length - 1;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    (event.currentTarget.querySelectorAll('[role="tab"]')[next] as HTMLElement | undefined)?.focus();
  }
  const stage = stages[active]!;
  return <>
    <div className="editorial-stage-tabs" role="tablist" aria-label="Plan in stages" onKeyDown={onKeyDown}>
      {stages.map((entry, entryIndex) => <button key={entry.id} type="button" role="tab" id={`stage-tab-${entry.id}`} aria-selected={active === entryIndex} aria-controls="stage-panel" tabIndex={active === entryIndex ? 0 : -1} onClick={() => setActive(entryIndex)}>{entry.label}</button>)}
    </div>
    <div className="editorial-stage-panel" role="tabpanel" id="stage-panel" aria-labelledby={`stage-tab-${stage.id}`}>
      <h3>{stage.title}</h3>
      <p>{stage.copy}</p>
      <a className="editorial-learn" href={stage.href}>{stage.linkLabel} ›</a>
    </div>
  </>;
}

export function JourneyGallery() {
  return <section className="journey-gallery" aria-labelledby="page-title">
    <div><p className="eyebrow">Places that linger</p><h2 id="page-title" tabIndex={-1}>Journeys to linger over.</h2>
      <p className="journey-note">Destination photographs from the travel concept — not photographs of catalog hotels.</p></div>
    <div className="journey-grid">
      <figure><img src={KYOTO_PHOTO} alt="Traditional garden and wooden ryokan in Kyoto" loading="lazy" /><figcaption><strong>Kyoto</strong><span>A measured stay shaped by garden mornings, intimate meals, and time set aside simply to notice.</span></figcaption></figure>
      <figure><img src={DOLOMITES_PHOTO} alt="Alpine landscape in the Italian Dolomites" loading="lazy" /><figcaption><strong>The Dolomites</strong><span>Crisp mountain air, long lunches, and a landscape that invites you to leave the schedule behind.</span></figcaption></figure>
      <figure><img src={PAROS_PHOTO} alt="Whitewashed village above the blue Aegean Sea on Paros" loading="lazy" /><figcaption><strong>Paros</strong><span>Salt air, whitewashed lanes, and generous days that begin late and finish by the water.</span></figcaption></figure>
    </div>
  </section>;
}

export function EditorialHomepage({ catalog, query, comparisonSlugs }: { catalog: Catalog; query: ExplorerQuery; comparisonSlugs: string[] }) {
  const countryCount = new Set(catalog.properties.map((property) => property.country)).size;
  const japanHref = explorerHref({ ...query, country: 'JP' }, comparisonSlugs);
  const italyHref = explorerHref({ ...query, country: 'IT' }, comparisonSlugs);
  return <>
    <HeroCarousel />
    {/* The key resets the form whenever the URL query changes, so the plan
        bar always opens on the filters that are actually applied. */}
    <PlanBar key={`${query.country}|${query.tag}`} catalog={catalog} query={query} comparisonSlugs={comparisonSlugs} />
    <section className="editorial-intro" aria-labelledby="page-title">
      <p className="eyebrow">The Collection</p>
      <h1 id="page-title" tabIndex={-1}>One hundred addresses,<br />chosen with intent.</h1>
      <p>Six brands, thirty-four countries, every property verified against its sources. No noise, no sponsored order — just the stays worth your journey.</p>
      <p className="editorial-rule" aria-hidden="true" />
    </section>
    <section className="editorial-duo" aria-label="Featured destinations">
      <article>
        <figure><img src={KYOTO_PHOTO} alt="Traditional garden and wooden ryokan in Kyoto" /><figcaption>Kyoto, Japan</figcaption></figure>
        <h3>Where stillness meets ceremony</h3>
        <p>Temple mornings, garden afternoons, and ryokan-quiet evenings — the Japan entries in the collection reward going slowly.</p>
        <a className="editorial-learn" href={japanHref} onClick={collectionLink(japanHref)}>Learn more ›</a>
      </article>
      <article>
        <figure><img src={DOLOMITES_PHOTO} alt="Alpine landscape in the Italian Dolomites" /><figcaption>The Dolomites, Italy</figcaption></figure>
        <h3>Where the mountains set the pace</h3>
        <p>Alpine air, long lunches, and lodges that understand the difference between a stop and a stay.</p>
        <a className="editorial-learn" href={italyHref} onClick={collectionLink(italyHref)}>Learn more ›</a>
      </article>
    </section>
    <SplitFeature />
    <section className="editorial-teal">
      <div className="editorial-teal-grid">
        <div>
          <p className="eyebrow">New to the collection</p>
          <h2>Fresh addresses, same standard.</h2>
          <p>Every addition is checked the same way: sources, confidence, and a verification date you can inspect. If a detail is unknown, it stays unknown — it is never filled in for effect.</p>
        </div>
        <div>
          <p className="editorial-stat">{catalog.properties.length}<small>Curated properties</small></p>
          <p className="editorial-stat editorial-stat-small">{countryCount}<small>Countries &amp; territories</small></p>
        </div>
      </div>
    </section>
    <section className="editorial-stages" aria-labelledby="stages-heading">
      <p className="eyebrow">Plan in stages</p>
      <h2 id="stages-heading">Compare, calculate, then go.</h2>
      <StagesTabs query={query} comparisonSlugs={comparisonSlugs} />
    </section>
    <section className="editorial-browse">
      <p className="eyebrow">The full collection</p>
      <h2>Browse all one hundred properties.</h2>
      <p>The complete catalog is one step away — filter by region, brand, experience, and property type, and sort however you like. The grid is still there when you want it; it just stops being the front door.</p>
      <button type="button" className="editorial-button-bronze" onClick={() => goToCollection(explorerHref(undefined, comparisonSlugs))}>Browse the collection</button>
    </section>
  </>;
}
