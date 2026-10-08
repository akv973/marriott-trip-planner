import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App, ExplorerApplication } from '../../app/App';
import { comparisonHref } from '../../lib/navigation/routes';
import { AS_OF, claim, conflictFixture } from '../fixtures/catalog';
import type { EvidenceClaim } from '../../types/catalog';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
});

const selected = ['mapito', 'mereshi', 'dove-mountain', 'jw-sao-paulo'];
const row = (label: string) => screen.getByRole('rowheader', { name: label }).parentElement!;

describe('Property comparison UI', () => {
  it('updates a controlled checkbox in the click event before hashchange delivery', () => {
    render(<App />);
    const checkbox = screen.getByRole('checkbox', { name: /Compare Mapito/ });
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(window.location.hash).toContain('compare=mapito');
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(window.location.hash).not.toContain('compare=mapito');
  });
  it.each([2, 3, 4])('aligns %i properties under matching column headers and explicit booking unknowns', (count) => {
    window.history.replaceState(null, '', comparisonHref(selected.slice(0, count)));
    render(<App />);
    expect(screen.getByRole('table')).toHaveAccessibleName(`Side-by-side comparison of ${count} properties`);
    expect(screen.getAllByRole('columnheader')).toHaveLength(count + 1);
    expect(within(row('Room count')).getAllByRole('cell')).toHaveLength(count);
    expect(within(row('Cash cost')).getAllByText('Unavailable')).toHaveLength(count);
    expect(within(row('Cents per point')).getAllByText('Unavailable')).toHaveLength(count);
    expect(within(row('Lounge access')).getAllByText('Unknown')).toHaveLength(count);
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });
  it('requires two properties and recovers after removing a comparison partner', async () => {
    window.history.replaceState(null, '', comparisonHref(['mapito', 'mereshi']));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Remove Mereshi/ }));
    expect(await screen.findByRole('heading', { name: 'Choose one more property.' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear comparison' }));
    expect(await screen.findByRole('heading', { name: 'Start with two properties.' })).toBeInTheDocument();
  });
  it('selects from explorer, preserves filtered context, and enforces capacity', async () => {
    window.history.replaceState(null, '', '#/explore?compare=mapito&compare=mereshi&compare=dove-mountain&compare=jw-sao-paulo&country=TZ');
    render(<App />);
    expect(screen.getByRole('checkbox', { name: /Compare Mapito/ })).toBeChecked();
    fireEvent.click(screen.getByRole('checkbox', { name: /Compare Mereshi/ }));
    expect(await screen.findByRole('link', { name: 'Compare 3 properties' })).toHaveAttribute('href', expect.stringContaining('country=TZ'));
    expect(screen.getByRole('link', { name: /View details for Mapito/ })).toHaveAttribute('href', expect.stringContaining('compare=mapito'));
  });
  it('does not replace facts with an editorial opinion and exposes its date/methodology', () => {
    window.history.replaceState(null, '', comparisonHref(['dove-mountain', 'mereshi']));
    render(<App />);
    expect(screen.getByText('Editorial · desk review')).toBeInTheDocument();
    expect(row('Review context')).toHaveTextContent('Planner maintainer');
    expect(row('Review context')).toHaveTextContent('Oct 7, 2026');
    expect(row('Strengths Editorial')).toHaveTextContent('Desert activities');
    expect(row('Hardware quality Editorial')).toHaveTextContent('Unknown');
    expect(within(row('Experience tags')).queryByText(/Editorial/)).not.toBeInTheDocument();
  });
  it('preserves disputed, stale, unverified and historical evidence inside comparison cells', () => {
    const fixture = conflictFixture();
    fixture.properties.push({ ...fixture.properties[0]!, id: 'property-other', slug: 'other', name: 'Other synthetic hotel' });
    fixture.properties[0]!.openingYear = 2000;
    fixture.properties[0]!.isResort = false;
    fixture.evidenceClaims.push(
      claim('openingYear', 2000, { observedAt: '2024-01-01', lastVerifiedAt: '2024-01-01' }) as EvidenceClaim,
      claim('isResort', false) as EvidenceClaim,
      claim('propertyType', 'hotel', { confidence: 'Unverified', lastVerifiedAt: null }) as EvidenceClaim,
      claim('renovationYear', 2010, { validTo: '2026-01-01' }) as EvidenceClaim,
    );
    window.history.replaceState(null, '', comparisonHref(['fixture', 'other']));
    render(<ExplorerApplication catalog={fixture} asOf={AS_OF} />);
    const rooms = row('Room count');
    expect(rooms).toHaveTextContent('Requires review — sources conflict');
    expect(rooms).toHaveTextContent('Claim: 100');
    expect(rooms).toHaveTextContent('Claim: 120');
    expect(within(rooms).getAllByRole('link', { hidden: true })).toHaveLength(2);
    expect(row('Opening year')).toHaveTextContent('Stale evidence — refresh needed');
    expect(row('Opening year')).toHaveTextContent('Jan 1, 2024');
    expect(row('Property type')).toHaveTextContent('Unknown — unverified evidence');
    expect(row('Renovation year')).toHaveTextContent('Outside applicable date range');
    expect(row('Resort designation')).toHaveTextContent('No');
  });
  it('reports malformed/missing/excess selections as text and allows repair', async () => {
    window.history.replaceState(null, '', comparisonHref([...selected, '<script>']));
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent('Property unavailable in this catalog: <script>');
    expect(document.querySelector('script')).toBeNull();
    expect(screen.getAllByRole('columnheader')).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: 'Keep valid selections' }));
    await vi.waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(window.location.hash).not.toContain('script');
  });
});
