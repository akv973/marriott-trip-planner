import type { Catalog, EvidenceSubject, Property } from '../types/catalog';
import type { ExplorerQuery } from '../lib/catalog/explorer';
import { countryName, displayDate, fieldEvidence, FIELD_LABELS } from '../lib/catalog/presentation';
import { EvidenceValue } from './EvidenceValue';
import { CompareControl } from './CompareControl';
import { calculatorHref, explorerHref } from '../lib/navigation/routes';

const GROUPS: { title: string; fields: EvidenceSubject[] }[] = [
  { title: 'Identity & location', fields: ['name', 'brandId', 'marriottCode', 'city', 'administrativeArea', 'country', 'region', 'latitude', 'longitude'] },
  { title: 'The property & its setting', fields: ['propertyType', 'isResort', 'isDestinationProperty', 'openingYear', 'renovationYear', 'roomCount', 'experienceTags', 'operatingStatus'] },
  { title: 'Airport logistics', fields: ['nearestAirport'] },
];

function Fact({ catalog, property, subject, asOf }: { catalog: Catalog; property: Property; subject: EvidenceSubject; asOf: string }) {
  return <div className="fact-row"><dt>{FIELD_LABELS[subject]}</dt><dd><EvidenceValue catalog={catalog} property={property} subject={subject} asOf={asOf} /></dd></div>;
}

export function PropertyDetails({ catalog, property, query, asOf, comparisonSlugs = [], onToggle }: { catalog: Catalog; property: Property; query: ExplorerQuery; asOf: string; comparisonSlugs?: string[]; onToggle?: (slug: string) => void }) {
  const official = fieldEvidence(catalog, property, 'officialUrl', asOf);
  const editorial = catalog.editorialAssessments.filter((assessment) => assessment.propertyId === property.id);
  const brand = catalog.brands.find((record) => record.id === property.brandId)?.name;
  return <>
    <a className="back-link" href={explorerHref(query, comparisonSlugs)}>← Back to your collection</a>
    <section className="detail-hero" aria-labelledby="page-title"><p className="eyebrow">{brand}</p><h1 id="page-title" tabIndex={-1}>{property.name}</h1>
      <p className="detail-location">{property.city}, {countryName(property.country)} <span>·</span> {property.region}</p>
      {typeof official.value === 'string' ? <a className="primary-link" href={official.value} target="_blank" rel="noopener noreferrer">Official property page <span aria-hidden="true">↗</span></a> : <p className="unknown-value">Official property page: {official.label}</p>}
      {official.stale && <p className="review-label">The official locator evidence needs a refresh.</p>}
    </section>
    <div className="detail-compare-control"><CompareControl property={property} slugs={comparisonSlugs} onToggle={onToggle} /></div>
    <div className="detail-layout">
      <div>
        <div className="facts-intro"><p className="eyebrow">Facts with a trail</p><h2>Know what’s behind the details.</h2><p>Confidence reflects the maintainer’s evidence assessment. Dates show when information was checked, and unknown values stay visible.</p></div>
        {GROUPS.map((group) => <section className="fact-section" key={group.title} aria-label={group.title}><h2>{group.title}</h2><dl>{group.fields.map((subject) => <Fact key={subject} catalog={catalog} property={property} subject={subject} asOf={asOf} />)}</dl></section>)}
        <section className="fact-section" aria-label="Official locator evidence"><h2>Official locator evidence</h2><dl><Fact catalog={catalog} property={property} subject="officialUrl" asOf={asOf} /></dl></section>
      </div>
      <aside className="detail-sidebar" aria-label="Planning context">
        <section className="planning-note"><p className="eyebrow">A starting point</p><h2>Leave room for research.</h2><p>The catalog records a property’s identity and setting. A listing doesn’t confirm current operation, availability, or future brand affiliation.</p><p>Airport distances, where sourced, are approximate published figures rather than route estimates. Experience tags don’t establish service quality or guaranteed amenities.</p><p className="assessment-date">Evidence assessed as of {displayDate(asOf)}.</p></section>
        <section className="unavailable-panel" aria-labelledby="booking-title"><h2 id="booking-title">Booking information</h2><dl><div><dt>Cash price</dt><dd>Unavailable</dd></div><div><dt>Award price</dt><dd>Unavailable</dd></div><div><dt>Elite breakfast</dt><dd>Unknown</dd></div><div><dt>Lounge access</dt><dd>Unknown</dd></div><div><dt>Resort / destination fees</dt><dd>Unknown</dd></div></dl><p>Check current terms and rates directly before making plans.</p><a className="primary-link" href={calculatorHref(query, comparisonSlugs, property.slug)}>Calculate with your own rates →</a></section>
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
