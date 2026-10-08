import type { Catalog, EvidenceSubject, Property } from '../types/catalog';
import { displayDate, fieldEvidence, formatValue, humanize } from '../lib/catalog/presentation';
import { isApplicable, isStale } from '../lib/catalog/evidence';

export function EvidenceValue({ catalog, property, subject, asOf }: { catalog: Catalog; property: Property; subject: EvidenceSubject; asOf: string }) {
  const evidence = fieldEvidence(catalog, property, subject, asOf);
  return <>
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
  </>;
}

