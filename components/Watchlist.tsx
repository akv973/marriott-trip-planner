import { useRemovalFocus } from './useRemovalFocus';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Catalog } from '../types/catalog';
import type { ExplorerQuery } from '../lib/catalog/explorer';
import { profileHref, propertyHref } from '../lib/navigation/routes';
import { createWatchTarget, MAX_WATCH_TARGETS, PRIORITIES, watchTargetSchema } from '../lib/watchlist/watchlist';
import type { WatchTarget } from '../lib/watchlist/watchlist';

const numeric = (value: string) => value.trim() ? Number(value) : null;
const shown = (value: number | null) => value === null || !Number.isFinite(value) ? '' : value;
export function Watchlist({ catalog, targets, setTargets, query, comparisonSlugs, propertySlug }: { catalog: Catalog; targets: WatchTarget[]; setTargets: Dispatch<SetStateAction<WatchTarget[]>>; query: ExplorerQuery; comparisonSlugs: string[]; propertySlug: string | null }) {
  const focusAfterRemoval = useRemovalFocus();
  const linked = catalog.properties.find((p) => p.slug === propertySlug);
  const [propertyId, setPropertyId] = useState(linked?.id ?? catalog.properties[0]?.id ?? '');
  const update = (id: string, patch: Partial<WatchTarget>) => setTargets((current) => current.map((t) => t.id === id ? { ...t, ...patch } : t));
  return <>
    <section className="calculator-hero"><p className="eyebrow">Future stays · Your targets</p><h1 id="page-title" tabIndex={-1}>Keep a stay in mind.</h1><p>Save the places you want to visit, your dates and the nightly rates you hope to find.</p><p className="calculator-context">Desired rates are your planning targets. Current rates and availability are unknown. Blank dates, rates and priorities stay unknown. Targets save in this browser; <a href={profileHref(query, comparisonSlugs)}>export a planner backup</a> for transfer or recovery.</p></section>
    <section className="watchlist-content" aria-label="Watchlist">
      {propertySlug && !linked && <p role="alert">That property link is unavailable. Choose a property from the collection.</p>}
      <div className="watchlist-add"><label className="calculator-field">Target property<select aria-label="Target property" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>{catalog.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button className="primary-link" id="add-watch-target" disabled={!propertyId || targets.length >= MAX_WATCH_TARGETS} onClick={() => setTargets((current) => current.length >= MAX_WATCH_TARGETS ? current : [...current, createWatchTarget(`watch-${crypto.randomUUID()}`, propertyId)])}>Add watch target</button></div>
      <p className="watchlist-count">{targets.length} / {MAX_WATCH_TARGETS} saved targets. You can keep separate travel windows for the same property.</p>
      {!targets.length && <div className="watchlist-empty"><h2>Your next stay starts here.</h2><p>Choose a property above or save one from the explorer. Add dates and rates when you know what you want.</p></div>}
      <div className="watchlist-grid">{targets.map((target, index) => {
        const property = catalog.properties.find((p) => p.id === target.propertyId);
        const valid = watchTargetSchema.safeParse(target);
        return <article className="watch-target" key={target.id} aria-label={`Watch target ${index + 1}`}>
          <div className="watch-target-heading"><div><p className="eyebrow">Target {index + 1} · {target.priority === null ? 'Priority unknown' : `${target.priority} priority`}</p><h2>{property?.name ?? 'Property requires review'}</h2></div>{property && <a className="text-link" href={propertyHref(property.slug, query, comparisonSlugs)}>Property & evidence →</a>}</div>
          <fieldset><legend className="sr-only">Edit watch target {index + 1}</legend><div className="calculator-fields">
            <label className="calculator-field">Target check-in<input id={`watch-${target.id}-check-in`} aria-label="Target check-in" type="date" value={target.checkIn ?? ''} onChange={(e) => update(target.id, { checkIn: e.target.value || null })} /></label>
            <label className="calculator-field">Target check-out<input aria-label="Target check-out" type="date" value={target.checkOut ?? ''} onChange={(e) => update(target.id, { checkOut: e.target.value || null })} /></label>
            <label className="calculator-field">Desired cash rate per night<input aria-label="Desired cash rate per night" type="number" min="0" max="1000000000" step="any" value={shown(target.cashRate)} onChange={(e) => update(target.id, { cashRate: numeric(e.target.value) })} /><span>Your room-rate target before taxes and fees.</span></label>
            <label className="calculator-field">Cash target currency<input aria-label="Cash target currency" type="text" maxLength={3} placeholder="e.g. USD" value={target.currency ?? ''} onChange={(e) => update(target.id, { currency: e.target.value.toUpperCase() || null })} /><span>Three-letter currency code, required with a cash target.</span></label>
            <label className="calculator-field">Desired points rate per night<input aria-label="Desired points rate per night" type="number" min="0" max="1000000000" step="1" value={shown(target.pointsRate)} onChange={(e) => update(target.id, { pointsRate: numeric(e.target.value) })} /><span>Your nightly target before any free-night or certificate adjustment.</span></label>
            <label className="calculator-field">Target priority<select aria-label="Target priority" value={target.priority ?? ''} onChange={(e) => update(target.id, { priority: e.target.value as WatchTarget['priority'] || null })}><option value="">Unknown / unset</option>{PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority[0]!.toUpperCase() + priority.slice(1)}</option>)}</select></label>
            <label className="calculator-field watch-target-notes">Target notes<textarea aria-label="Target notes" rows={3} maxLength={4000} value={target.notes} onChange={(e) => update(target.id, { notes: e.target.value })} /></label>
          </div></fieldset>
          {!valid.success && <div className="watch-target-errors" role="alert"><p>Correct this draft to save. The last valid planner is preserved.</p><ul>{valid.error.issues.map((issue, n) => <li key={n}>{issue.path.join('.')}: {issue.message}</li>)}</ul></div>}
          <button className="text-button" onClick={() => { const remaining = targets.filter((t) => t.id !== target.id); const next = remaining[index] ?? remaining[index - 1]; focusAfterRemoval(next ? `watch-${next.id}-check-in` : 'add-watch-target'); setTargets((current) => current.filter((t) => t.id !== target.id)); }}>Remove target {index + 1}</button>
        </article>;
      })}</div>
    </section>
  </>;
}
