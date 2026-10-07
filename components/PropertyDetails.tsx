import type { Catalog, EvidenceSubject, Property } from '../types/catalog';
import type { ExplorerQuery } from '../lib/catalog/explorer';
import { countryName, displayDate, fieldEvidence, FIELD_LABELS, formatValue, humanize } from '../lib/catalog/presentation';
import { isApplicable, isStale } from '../lib/catalog/evidence';
import { explorerHref } from '../lib/navigation/routes';

const GROUPS: { title: string; fields: EvidenceSubject[] }[] = [
  { title: 'Identity & location', fields: ['name', 'brandId', 'marriottCode', 'city', 'administrativeArea', 'country', 'region', 'latitude', 'longitude'] },
  { title: 'The property & its setting', fields: ['propertyType', 'isResort', 'isDestinationProperty', 'openingYear', 'renovationYear', 'roomCount', 'experienceTags', 'operatingStatus'] },
  { title: 'Airport logistics', fields: ['nearestAirport'] },
];

function Fact({ catalog, property, subject, asOf }: { catalog: Catalog; property: Property; subject: EvidenceSubject; asOf: string }) {
  const evidence = fieldEvidence(catalog, property, subject, asOf);
  return <div className="fact-row"><dt>{FIELD_LABELS[subject]}</dt><dd>
    <div className={evidence.status === 'known' ? 'fact-value' : 'fact-value unknown-value'}>{evidence.label}</div>
    {evidence.status === 'known' && <p className="fact-meta"><span className="confidence-badge">{evidence.confidence} confidence</span>{evidence.lastVerifiedAt && <span>Verified {displayDate(evidence.lastVerifiedAt)}</span>}{evidence.stale && <strong className="review-label">Stale evidence — refresh needed</strong>}</p>}
    {!!evidence.claims.length && <details className="evidence-details"><summary>Sources & evidence ({evidence.claims.length})</summary>
      <ul>{evidence.claims.map((claim) => {
        const source = catalog.sources.find((record) => record.id === claim.sourceId);
        return <li key={claim.id}>
          <p className="claim-value">Claim: {formatValue(subject, claim.value, catalog)}</p>
          <p>{claim.confidence} confidence · {claim.conflictStatus === 'disputed' ? 'Disputed' : 'No declared dispute'}{!isApplicable(claim, asOf) ? ' · Outside applicable date range' : ''}{isStale(claim, asOf) ? ' · Stale' : ''}</p>
          {source ? <><a className="source-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.title} <span aria-hidden="true">↗</span></a><p>{source.publisher} · {humanize(source.type)} · Accessed {displayDate(source.accessedAt)}</p>{source.notes && <p>{source.notes}</p>}</> : <p>Source unavailable</p>}
          <p>Observed: {claim.observedAt ? displayDate(claim.observedAt) : 'Not recorded'}<br />Last verified: {claim.lastVerifiedAt ? displayDate(claim.lastVerifiedAt) : 'Not verified'}</p>
          {(claim.validFrom || claim.validTo) && <p>Valid from {claim.validFrom ? displayDate(claim.validFrom) : 'unspecified'} to {claim.validTo ? displayDate(claim.validTo) : 'unspecified'}</p>}
          {claim.notes && <p>{claim.notes}</p>}
        </li>;
      })}</ul>
    </details>}
  </dd></div>;
}

export function PropertyDetails({ catalog, property, query, asOf }: { catalog: Catalog; property: Property; query: ExplorerQuery; asOf: string }) {
  const official = fieldEvidence(catalog, property, 'officialUrl', asOf);
  const editorial = catalog.editorialAssessments.filter((assessment) => assessment.propertyId === property.id);
  const brand = catalog.brands.find((record) => record.id === property.brandId)?.name;
  return <>
    <a className="back-link" href={explorerHref(query)}>← Back to your collection</a>
    <section className="detail-hero" aria-labelledby="page-title"><p className="eyebrow">{brand}</p><h1 id="page-title" tabIndex={-1}>{property.name}</h1>
      <p className="detail-location">{property.city}, {countryName(property.country)} <span>·</span> {property.region}</p>
      {typeof official.value === 'string' ? <a className="primary-link" href={official.value} target="_blank" rel="noopener noreferrer">Official property page <span aria-hidden="true">↗</span></a> : <p className="unknown-value">Official property page: {official.label}</p>}
      {official.stale && <p className="review-label">The official locator evidence needs a refresh.</p>}
    </section>
    <div className="detail-layout">
      <div>
        <div className="facts-intro"><p className="eyebrow">Facts with a trail</p><h2>Know what’s behind the details.</h2><p>Confidence reflects the maintainer’s evidence assessment. Dates show when information was checked, and unknown values stay visible.</p></div>
        {GROUPS.map((group) => <section className="fact-section" key={group.title} aria-label={group.title}><h2>{group.title}</h2><dl>{group.fields.map((subject) => <Fact key={subject} catalog={catalog} property={property} subject={subject} asOf={asOf} />)}</dl></section>)}
        <section className="fact-section" aria-label="Official locator evidence"><h2>Official locator evidence</h2><dl><Fact catalog={catalog} property={property} subject="officialUrl" asOf={asOf} /></dl></section>
      </div>
      <aside className="detail-sidebar" aria-label="Planning context">
        <section className="planning-note"><p className="eyebrow">A starting point</p><h2>Leave room for research.</h2><p>The catalog records a property’s identity and setting. A listing doesn’t confirm current operation, availability, or future brand affiliation.</p><p>Airport distances, where sourced, are approximate published figures rather than route estimates. Experience tags don’t establish service quality or guaranteed amenities.</p><p className="assessment-date">Evidence assessed as of {displayDate(asOf)}.</p></section>
        <section className="unavailable-panel" aria-labelledby="booking-title"><h2 id="booking-title">Booking information</h2><dl><div><dt>Cash price</dt><dd>Unavailable</dd></div><div><dt>Award price</dt><dd>Unavailable</dd></div><div><dt>Elite breakfast</dt><dd>Unknown</dd></div><div><dt>Lounge access</dt><dd>Unknown</dd></div><div><dt>Resort / destination fees</dt><dd>Unknown</dd></div></dl><p>Check current terms and rates directly before making plans.</p></section>
        <section className="editorial-panel" aria-labelledby="editorial-title"><p className="eyebrow">Opinion, kept separate</p><h2 id="editorial-title">Editorial notes</h2>
          {!editorial.length ? <p>No editorial assessment yet. Quality ratings and recommended stay length are unknown.</p> : editorial.map((assessment) => <article key={assessment.id}>
            <span className="editorial-badge">{assessment.methodologyVersion.startsWith('desk-review') ? 'Editorial · desk review' : 'Editorial assessment'}</span><p>{assessment.rationale}</p>
            {[{ title: 'Ideal traveler', items: assessment.idealTraveler }, { title: 'Strengths', items: assessment.strengths }, { title: 'Limitations', items: assessment.weaknesses }].map(({ title, items }) => <div key={title}><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>)}
            <dl className="editorial-ratings">{(['hardwareQuality', 'serviceQuality', 'locationQuality', 'uniqueness', 'destinationWorthiness', 'eliteValuePotential'] as const).map((field) => <div key={field}><dt>{field.replace(/([A-Z])/g, ' $1')}</dt><dd>{assessment[field] == null ? 'Unknown' : `${assessment[field]} / 10 · Editorial`}</dd></div>)}<div><dt>Recommended stay</dt><dd>{assessment.recommendedStayLength ? `${assessment.recommendedStayLength.minNights}–${assessment.recommendedStayLength.maxNights} nights · Editorial` : 'Unknown'}</dd></div></dl>
            <p className="fact-meta">{assessment.author} · Reviewed {displayDate(assessment.reviewedAt)} · {assessment.methodologyVersion}</p>
          </article>)}
        </section>
      </aside>
    </div>
  </>;
}
