import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App, ExplorerApplication } from '../../app/App';
import * as catalog from '../../lib/catalog/foundation';
import { validateFoundation } from '../../lib/validation/foundation';
import { AS_OF, conflictFixture, fixtureCatalog, staleFixture } from '../fixtures/catalog';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
});

describe('Validated explorer and detail pages', () => {
  it('loads the shipped catalog and renders all 25 properties with no later-stage controls', () => {
    expect(catalog.loadFoundation().success).toBe(true);
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Find a stay worth');
    expect(screen.getByRole('status')).toHaveTextContent('25 of 25 properties');
    expect(document.querySelectorAll('.property-card')).toHaveLength(25);
    expect(screen.getAllByText('Planned', { exact: true })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /save|add to trip/i })).not.toBeInTheDocument();
  });
  it('restores combined filters from the URL and keeps context in detail links', () => {
    window.history.replaceState(null, '', '#/explore?country=TZ&tag=wildlife&sort=name-desc');
    render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent('2 of 25');
    expect(screen.getByRole('combobox', { name: 'Country / territory' })).toHaveValue('TZ');
    expect(screen.getByRole('link', { name: /View details for Mereshi/ })).toHaveAttribute('href', '#/properties/mereshi?country=TZ&tag=wildlife&sort=name-desc');
  });
  it('renders unknowns, dated sources, and separately labeled editorial notes on a direct detail URL', () => {
    window.history.replaceState(null, '', '#/properties/dove-mountain?tag=desert');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('The Ritz-Carlton, Dove Mountain');
    expect(screen.getByRole('link', { name: /Back to your collection/ })).toHaveAttribute('href', '#/explore?tag=desert');
    const identity = screen.getByRole('region', { name: 'Identity & location' });
    expect(within(identity).getByText('Latitude').nextElementSibling).toHaveTextContent('Unknown');
    expect(screen.getByText('Editorial · desk review')).toBeInTheDocument();
    const booking = screen.getByRole('region', { name: 'Booking information' });
    expect(within(booking).getAllByText('Unavailable')).toHaveLength(2);
    const source = within(identity).getAllByRole('link')[0]!;
    expect(source).toHaveAttribute('href', expect.stringContaining('ritzcarlton.com'));
    expect(source).toHaveAttribute('rel', 'noopener noreferrer');
    expect(within(identity).getAllByText(/Last verified:/)[0]).toHaveTextContent('Oct 7, 2026');
  });
  it('supports meaningful search submissions and a visible empty state', async () => {
    render(<App />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'no such stay' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(await screen.findByRole('heading', { name: 'No properties match these choices.' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/explore?q=no+such+stay');
    expect(screen.getByRole('link', { name: /View all properties/ })).toHaveAttribute('href', '#/explore');
  });
  it('handles a missing slug and malicious query text as text with a recovery link', () => {
    window.history.replaceState(null, '', '#/properties/missing?q=%3Cscript%3E');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Property not found.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return to the explorer/ })).toHaveAttribute('href', '#/explore?q=%3Cscript%3E');
    expect(document.querySelector('script')).toBeNull();
  });
  it('keeps the skip link accessible without replacing the active detail route', () => {
    window.history.replaceState(null, '', '#/properties/mereshi');
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'Skip to content' }));
    expect(document.getElementById('main')).toHaveFocus();
    expect(window.location.hash).toBe('#/properties/mereshi');
  });
  it('renders minimally populated optional data without invented factual or editorial values', () => {
    window.history.replaceState(null, '', '#/properties/fixture');
    render(<ExplorerApplication catalog={fixtureCatalog()} asOf={AS_OF} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Synthetic Hotel');
    expect(screen.getByText(/No editorial assessment yet/)).toBeInTheDocument();
    expect(screen.getByText('Room count').nextElementSibling).toHaveTextContent('Unknown');
    expect(screen.queryByRole('link', { name: 'Official property page' })).not.toBeInTheDocument();
  });
  it('exposes both sides of a synthetic conflict and a stale verification date', () => {
    const fixture = conflictFixture();
    const stale = staleFixture();
    fixture.properties[0]!.openingYear = 2000;
    fixture.evidenceClaims.push(stale.evidenceClaims.at(-1)!);
    window.history.replaceState(null, '', '#/properties/fixture');
    render(<ExplorerApplication catalog={fixture} asOf={AS_OF} />);
    const row = screen.getByText('Room count').parentElement!;
    expect(within(row).getByText('Requires review — sources conflict')).toBeInTheDocument();
    expect(within(row).getByText('Claim: 100')).toBeInTheDocument();
    expect(within(row).getByText('Claim: 120')).toBeInTheDocument();
    expect(within(row).getAllByRole('link')).toHaveLength(2);
    expect(screen.getByText('Stale evidence — refresh needed')).toBeInTheDocument();
    expect(screen.getByText('Verified Jan 1, 2024')).toBeInTheDocument();
  });
  it('shows an honest fallback when catalog validation fails', () => {
    const spy = vi.spyOn(catalog, 'loadFoundation').mockReturnValue(validateFoundation(null));
    try {
      render(<App />);
      expect(screen.getByRole('heading', { name: 'The planner couldn’t load.' })).toBeInTheDocument();
      expect(screen.queryByRole('search')).not.toBeInTheDocument();
    } finally { spy.mockRestore(); }
  });
});
