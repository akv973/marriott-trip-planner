import { useState } from 'react';
import type { Catalog, Property } from '../types/catalog';
import type { UserProfile } from '../lib/profile/profile';
import { STATUSES } from '../lib/profile/profile';
import { benefits, effectiveBenefits } from '../lib/benefits/engine';
import { BENEFIT_LABELS } from '../lib/benefits/schema';
import type { BenefitBundle } from '../lib/benefits/schema';
import type { EffectiveBenefit } from '../lib/benefits/engine';
import { displayDate, humanize } from '../lib/catalog/presentation';
import type { ExplorerQuery } from '../lib/catalog/explorer';
import { benefitsHref, profileHref, propertyHref } from '../lib/navigation/routes';

const contextLabels: Record<string, string> = { resort: 'Resort classification', convention: 'Convention hotel', lounge: 'Executive lounge', small: '25 rooms or fewer', scope: 'Loyalty program rules', regionGroup: 'Welcome-gift region' };
const contextValues: Record<string, string> = { standard: 'Standard Bonvoy terms', 'all-inclusive': 'All-Inclusive supplemental terms', 'us-canada-europe': 'U.S., Canada or Europe', other: 'Outside U.S., Canada and Europe' };

export function BenefitCard({ result, catalog, bundle = benefits }: { result: EffectiveBenefit; catalog: Catalog; bundle?: BenefitBundle }) {
  const sources = [...catalog.sources, ...bundle.sources];
  return <article className={`benefit-card benefit-${result.outcome.state}`} aria-label={BENEFIT_LABELS[result.category]}>
    <div className="benefit-card-top"><h3>{BENEFIT_LABELS[result.category]}</h3><span className="benefit-badge">{result.conflict ? 'Sources conflict' : result.outcome.state === 'included' ? 'Included in stay' : humanize(result.outcome.state)}</span></div>
    <p className="benefit-label">{result.outcome.label}</p><p>{result.outcome.detail}</p>
    <p className="fact-meta">{result.outcome.basis === 'included' ? 'Published stay inclusion' : result.outcome.basis === 'elite' ? 'Official elite rule' : 'Policy assessment'}</p>
    {result.outcome.state !== 'unknown' && result.reasons.map(reason => <p className="benefit-reason" key={reason}>{reason}</p>)}
    <details className="benefit-trace"><summary>Inspect {BENEFIT_LABELS[result.category].toLowerCase()} rules & sources</summary>
      {!result.trace.length && <p>No sourced applicable rule.</p>}
      {result.trace.map(({ rule, match, selected, reasons }) => <div className={`benefit-rule ${selected ? 'rule-selected' : ''}`} key={rule.id}>
        <p><strong>{humanize(rule.layer)} {rule.layer === 'property' ? 'override' : 'rule'}</strong> · {selected ? (result.outcome.state === 'unknown' ? 'Requires review' : 'Selected') : 'Retained context'} · {humanize(match)}</p>
        <p>{rule.outcome.label}</p><p>{rule.outcome.detail}</p>
        <p className="fact-meta">{rule.id} · {rule.confidence} confidence · {rule.section} · Verified {displayDate(rule.verifiedAt)}{rule.conflictStatus === 'disputed' ? ' · Disputed' : ''}</p>
        <p className="fact-meta">Status: {rule.selector.statuses.map(humanize).join(', ')}. Conditions: {Object.entries(rule.selector.conditions).map(([k,v]) => `${k}: ${String(v)}`).join('; ') || 'None'}.</p>
        {reasons.map(reason => <p key={reason}>{reason}</p>)}
        <ul>{rule.sourceIds.map(id => { const s = sources.find(source => source.id === id); return <li key={id}>{s ? <><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗</a><span className="fact-meta"> {s.type} · Accessed {displayDate(s.accessedAt)}</span></> : 'Source unavailable'}</li>; })}</ul>
      </div>)}
    </details>
  </article>;
}

export function BenefitPanel({ catalog, property, status, asOf, bundle = benefits }: { catalog: Catalog; property: Property; status: UserProfile['status']; asOf: string; bundle?: BenefitBundle }) {
  const view = effectiveBenefits(catalog, property, status, asOf, bundle);
  return <section className="benefit-panel" aria-label="Effective elite benefits">
    <div className="section-heading"><div><p className="eyebrow">Benefits with a reason</p><h2>Your effective benefits.</h2></div><span className="quiet-label">{status ? humanize(status) : 'Status unknown'} · {displayDate(asOf)}</span></div>
    <p className="benefit-assumption">Assumes a participating property, an eligible direct paid or award stay, member presence and one personal room. Paid packages, upgrade awards and courtesy treatment are separate. These are planning rules; availability and your booked rate require confirmation.</p>
    <details className="benefit-context"><summary>Inspect property conditions & review</summary><dl>{Object.entries(view.context).map(([key,value]) => <div key={key}><dt>{contextLabels[key] ?? humanize(key)}</dt><dd>{value === null ? 'Unknown' : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (contextValues[String(value)] ?? String(value))}</dd></div>)}</dl><p>{view.review?.notes ?? 'Property benefit review unavailable.'}</p>{view.review && <p className="fact-meta">Reviewed {displayDate(view.review.verifiedAt)}{view.reviewStale ? ' · Review needs refresh' : ''}</p>}<p className="fact-meta">Methodology {view.version} · Property override → brand rule → status rule. Contradictory official entitlements require review. Missing classifications preserve unknown results.</p></details>
    <div className="benefit-grid">{view.results.map(result => <BenefitCard key={result.category} result={result} catalog={catalog} bundle={bundle} />)}</div>
    <aside className="benefit-editorial" aria-label="Editorial benefit observations"><span className="editorial-badge">Editorial observations · opinion</span>{!view.observations.length ? <p>No benefit treatment observations recorded. Upgrade likelihood and typical generosity are unknown.</p> : view.observations.map(o => <p key={o.id}>{o.text} <span className="fact-meta">Reviewed {displayDate(o.reviewedAt)}.</span></p>)}<p>Editorial observations never establish an entitlement or change official rule precedence.</p></aside>
  </section>;
}

export function EliteBenefits({ catalog, profile, asOf, query, comparisonSlugs, propertySlug }: { catalog: Catalog; profile: UserProfile; asOf: string; query: ExplorerQuery; comparisonSlugs: string[]; propertySlug: string | null }) {
  const [previewStatus, setPreviewStatus] = useState('profile');
  const property = propertySlug ? catalog.properties.find(p => p.slug === propertySlug) : catalog.properties[0];
  const status = previewStatus === 'profile' ? profile.status : previewStatus === 'unknown' ? null : previewStatus as UserProfile['status'];
  return <>
    <section className="benefits-hero"><p className="eyebrow">Know the terms of your stay</p><h1 id="page-title" tabIndex={-1}>Understand your elite benefits.</h1><p>See what your status offers, how a property changes the rules, and what still needs confirmation.</p></section>
    <div className="benefits-controls"><label>Benefit property<select aria-label="Benefit property" value={property?.slug ?? ''} onChange={e => window.location.assign(benefitsHref(query, comparisonSlugs, e.target.value))}>{!property && <option value="">Property unavailable</option>}{catalog.properties.map(p => <option key={p.id} value={p.slug}>{p.name}</option>)}</select></label>
      <label>Benefit status preview<select aria-label="Benefit status preview" value={previewStatus} onChange={e => setPreviewStatus(e.target.value)}><option value="profile">Use saved profile ({profile.status ? humanize(profile.status) : 'Unknown'})</option><option value="unknown">Unknown</option>{STATUSES.map(s => <option key={s} value={s}>{humanize(s)}</option>)}</select></label>
      <p>Previewing another status leaves your saved profile unchanged. <a href={profileHref(query, comparisonSlugs)}>Edit profile</a>{property && <> · <a href={propertyHref(property.slug, query, comparisonSlugs)}>Property details</a></>}</p>
    </div>
    {property ? <BenefitPanel catalog={catalog} property={property} status={status} asOf={asOf} /> : <section className="not-found"><h2>Property unavailable in this catalog.</h2><a href={benefitsHref(query, comparisonSlugs)}>Choose a catalog property</a></section>}
  </>;
}
