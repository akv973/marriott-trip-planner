import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { App, ExplorerApplication } from '../../app/App';
import { scoredCatalog } from '../fixtures/recommendations';
import { AS_OF, claim } from '../fixtures/catalog';
import type { EvidenceClaim } from '../../types/catalog';

beforeEach(() => {
  window.history.replaceState(null, '', '#/recommendations');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
});
const generate = () => fireEvent.click(screen.getByRole('button', { name: 'Generate recommendations' }));

it('generates inspectable partial recommendations and preserves comparison/filter links', () => {
  window.history.replaceState(null, '', '#/recommendations?country=TZ&compare=mapito&compare=mereshi');
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Find a fit');
  expect(screen.getByRole('link', { name: /Back to your collection/ })).toHaveAttribute('href', '#/explore?country=TZ&compare=mapito&compare=mereshi');
  fireEvent.change(screen.getByLabelText('Required country', { exact: true }), { target: { value: 'TZ' } });
  fireEvent.click(within(screen.getByRole('group', { name: 'Preferred experiences' })).getByLabelText('Wildlife'));
  generate();
  expect(within(screen.getByRole('region', { name: 'Your recommendations' })).getByRole('status')).toHaveTextContent('2 candidates');
  expect(screen.getByRole('heading', { name: 'Your recommendations' })).toHaveFocus();
  const card = screen.getByRole('article', { name: /Recommendation for Mapito/ });
  expect(within(card).getByText('Partial trip fit')).toBeInTheDocument();
  expect(within(card).getByText('Booking value unavailable')).toBeInTheDocument();
  expect(within(card).getByText('Elite benefits · 15% weight')).toBeInTheDocument();
  expect(screen.getByText('Inspect request and structured results (JSON)').nextElementSibling).toHaveTextContent('"methodologyVersion": "trip-fit-1"');
  expect(within(within(card).getByRole('heading', { level: 3 })).getByRole('link')).toHaveAttribute('href', '#/properties/mapito?country=TZ&compare=mapito&compare=mereshi');
  fireEvent.change(screen.getByLabelText('Required country', { exact: true }), { target: { value: '' } });
  expect(screen.queryByRole('article', { name: /Recommendation for/ })).not.toBeInTheDocument();
});

it('applies a manual quote separately from fit, and clears quotes when nights change', () => {
  render(<ExplorerApplication catalog={scoredCatalog()} asOf={AS_OF} />);
  for (const [label, value] of [['Room cost, stay total (USD)', '500'], ['Taxes, stay total (USD)', '0'], ['Mandatory fees, stay total (USD)', '0'], ['Cash due on award, stay total (USD)', '0'], ['Final quoted award points', '200000']]) fireEvent.change(screen.getByLabelText(label!, { exact: true }), { target: { value } });
  fireEvent.change(screen.getByLabelText('Quote products and terms', { exact: true }), { target: { value: 'same' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply quote' })); generate();
  const card = screen.getByRole('article', { name: 'Recommendation for Synthetic Hotel' });
  expect(within(card).getByText('Strongly cash preferred', { exact: true })).toBeInTheDocument();
  expect(within(card).getByRole('region', { name: 'Booking economics' })).toHaveTextContent('0.250¢ / point');
  expect(within(card).getByRole('region', { name: 'Booking economics' })).toHaveTextContent('200,000 points');
  fireEvent.change(screen.getByLabelText('Stay length (nights)', { exact: true }), { target: { value: '4' } }); generate();
  expect(within(screen.getByRole('article', { name: 'Recommendation for Synthetic Hotel' })).getByText('Booking value unavailable')).toBeInTheDocument();
});

it('shows unknown requirements, exclusions and input errors without inventing values', () => {
  render(<ExplorerApplication catalog={scoredCatalog()} asOf={AS_OF} />);
  fireEvent.click(screen.getByLabelText('Require lounge access')); generate();
  expect(screen.getByRole('article')).toHaveTextContent('Provisional candidate');
  fireEvent.change(screen.getByLabelText('Required recorded experience', { exact: true }), { target: { value: 'ski' } }); generate();
  expect(screen.getByRole('status')).toHaveTextContent('0 candidates · 1 excluded');
  fireEvent.click(screen.getByRole('button', { name: 'Show excluded properties (1)' }));
  expect(screen.getByRole('article')).toHaveTextContent('Required ski tag is not recorded');
  fireEvent.change(screen.getByLabelText('Property quality weight (%)', { exact: true }), { target: { value: '1' } }); generate();
  expect(screen.getByRole('alert')).toHaveTextContent('Weights must total 100');
  fireEvent.click(screen.getByRole('button', { name: 'Clear recommendation inputs' }));
  expect(screen.getByLabelText('Require lounge access')).not.toBeChecked();
  expect(screen.getByLabelText('Property quality weight (%)', { exact: true })).toHaveValue(30);
});

it('exposes both conflicting sources and leaves the affected fit component unknown', () => {
  const catalog = scoredCatalog();
  catalog.evidenceClaims.push(claim('experienceTags', ['beach'], { id: 'claim-tags-conflict', conflictStatus: 'disputed' }) as EvidenceClaim);
  render(<ExplorerApplication catalog={catalog} asOf={AS_OF} />);
  fireEvent.click(within(screen.getByRole('group', { name: 'Preferred experiences' })).getByLabelText('Desert')); generate();
  const card = screen.getByRole('article');
  expect(within(card).getByText('Requires review — sources conflict')).toBeInTheDocument();
  expect(within(card).getByText('Claim: Beach')).toBeInTheDocument();
  expect(within(card).getByText('Claim: Desert, Spa')).toBeInTheDocument();
});
