import type { CSSProperties } from 'react';
import type { Catalog, Property } from '../types/catalog';
import type { ExplorerQuery } from '../lib/catalog/explorer';
import { COMPARISON_FACT_GROUPS, EDITORIAL_COMPARISON_ROWS, editorialComparisonValue, MIN_COMPARISON, UNAVAILABLE_COMPARISON_ROWS } from '../lib/catalog/comparison';
import { displayDate, FIELD_LABELS } from '../lib/catalog/presentation';
import { explorerHref, propertyHref } from '../lib/navigation/routes';
import { EvidenceValue } from './EvidenceValue';

export function PropertyComparison({ catalog, properties, query, asOf, onRemove, onClear }: {
  catalog: Catalog; properties: Property[]; query: ExplorerQuery; asOf: string; onRemove: (slug: string) => void; onClear: () => void;
}) {
  const slugs = properties.map((property) => property.slug);
  return <>
    <a className="back-link" href={explorerHref(query, slugs)}>← Back to your collection</a>
    <section className="comparison-hero" aria-labelledby="page-title"><p className="eyebrow">A closer look, together</p><h1 id="page-title" tabIndex={-1}>Compare your contenders.</h1>
      <p>Align the details that matter. Facts carry their evidence; opinions have their own place. Unknown doesn’t mean no.</p>
      <div className="comparison-actions"><a className="text-link" href={explorerHref(query, slugs)}>Choose properties</a>{properties.length > 0 && <button className="text-button" onClick={onClear}>Clear comparison</button>}<span aria-live="polite">{properties.length} of 4 selected</span></div>
    </section>
    {properties.length < MIN_COMPARISON ? <section className="comparison-empty"><h2>{properties.length ? 'Choose one more property.' : 'Start with two properties.'}</h2><p>Select 2–4 from the collection to see aligned comparison rows.</p>
      {properties.map((property) => <div className="single-selection" key={property.id}><span>{property.name}</span><button className="text-button" onClick={() => onRemove(property.slug)} aria-label={`Remove ${property.name} from comparison`}>Remove</button></div>)}
      <a className="primary-link" href={explorerHref(query, slugs)}>Explore properties <span aria-hidden="true">→</span></a></section> : <section className="comparison-section" aria-label="Property comparison">
      <p id="comparison-scroll-help" className="comparison-help">Scroll within the table to see every row and property. Property names and row labels stay in view. Evidence assessed as of {displayDate(asOf)}.</p>
      <div className="comparison-scroll" role="region" aria-label="Scrollable property comparison table" aria-describedby="comparison-scroll-help" tabIndex={0} style={{ '--property-count': properties.length } as CSSProperties}>
        <table className="comparison-table"><caption>Side-by-side comparison of {properties.length} properties</caption>
          <colgroup><col className="comparison-label-column" />{properties.map((property) => <col key={property.id} />)}</colgroup>
          <thead><tr><th scope="col">Comparison dimension</th>{properties.map((property) => <th scope="col" key={property.id}><a href={propertyHref(property.slug, query, slugs)}>{property.name}</a><button className="text-button" onClick={() => onRemove(property.slug)} aria-label={`Remove ${property.name} from comparison`}>Remove</button></th>)}</tr></thead>
          {COMPARISON_FACT_GROUPS.map((group) => <tbody key={group.title}><tr className="comparison-group"><th colSpan={properties.length + 1} scope="rowgroup">{group.title}</th></tr>
            {group.subjects.map((subject) => <tr key={subject}><th scope="row">{FIELD_LABELS[subject]}</th>{properties.map((property) => <td key={property.id}><EvidenceValue catalog={catalog} property={property} subject={subject} asOf={asOf} /></td>)}</tr>)}
          </tbody>)}
          <tbody><tr className="comparison-group"><th colSpan={properties.length + 1} scope="rowgroup">Booking costs & benefits — not yet researched</th></tr>{UNAVAILABLE_COMPARISON_ROWS.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{properties.map((property) => <td className="unknown-value" key={property.id}>{row.value}</td>)}</tr>)}</tbody>
          <tbody className="comparison-editorial"><tr className="comparison-group"><th colSpan={properties.length + 1} scope="rowgroup">Editorial assessments — opinion</th></tr>
            <tr><th scope="row">Review context</th>{properties.map((property) => {
              const assessments = catalog.editorialAssessments.filter((assessment) => assessment.propertyId === property.id);
              return <td key={property.id}>{!assessments.length ? <span className="unknown-value">No editorial assessment yet.</span> : assessments.map((assessment) => <div className="comparison-assessment" key={assessment.id}><span className="editorial-badge">{assessment.methodologyVersion.startsWith('desk-review') ? 'Editorial · desk review' : 'Editorial assessment'}</span><p>{assessment.rationale}</p><p className="fact-meta">{assessment.author} · Reviewed {displayDate(assessment.reviewedAt)} · {assessment.methodologyVersion}</p></div>)}</td>;
            })}</tr>
            {EDITORIAL_COMPARISON_ROWS.map((row) => <tr key={row.key}><th scope="row">{row.label} <span className="editorial-row-label">Editorial</span></th>{properties.map((property) => {
              const assessments = catalog.editorialAssessments.filter((assessment) => assessment.propertyId === property.id);
              return <td key={property.id}>{!assessments.length ? <span className="unknown-value">Unknown — no assessment</span> : assessments.map((assessment) => <div className="comparison-assessment" key={assessment.id}><span>{editorialComparisonValue(assessment, row.key)}</span><span className="editorial-row-label">Editorial · {assessment.methodologyVersion} · {displayDate(assessment.reviewedAt)}</span></div>)}</td>;
            })}</tr>)}
          </tbody>
        </table>
      </div>
      <p className="comparison-footnote">Setting tags describe sourced activities or surroundings. They don’t guarantee amenities or hotel quality. Prices, fees, and benefits need current research; no booking value or recommendation is calculated here.</p>
    </section>}
  </>;
}
