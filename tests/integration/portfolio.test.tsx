import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import { exportPlanner, STORAGE_KEY } from '../../lib/storage/planner';
import { loadFoundation } from '../../lib/catalog/foundation';
import { portfolioFixture } from '../fixtures/portfolio';
import legacy from '../fixtures/planner-stage-7-v1.json';
const loaded = loadFoundation(); if (!loaded.success) throw new Error('Catalog required.'); const catalog = loaded.data;
beforeEach(() => { window.history.replaceState(null, '', '#/portfolio'); vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); Element.prototype.scrollIntoView = vi.fn(); });
const seed = (data = portfolioFixture('property-jw-tampa')) => { localStorage.setItem(STORAGE_KEY, exportPlanner(data, catalog)); return localStorage.getItem(STORAGE_KEY); };
const card = (name: string) => within(screen.getByRole('article', { name }));
describe('Read-only portfolio scenario flows', () => {
  it('shows three strategy results and switches inspectable allocation ledgers without saving', () => {
    const before = seed(); render(<App />);
    expect(card('Cash conservation').getByText('$1,000.00')).toBeInTheDocument(); expect(card('Redemption value').getByText('2.000 USD cents/point')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Inspect cash conservation' }));
    expect(within(screen.getByRole('article', { name: 'Allocation 1' })).getByText('points', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveTextContent('Luxury'); expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
  });
  it('changes priority and budget, excludes trips, and resets transient settings on remount', () => {
    const before = seed(); const mounted = render(<App />);
    fireEvent.change(screen.getByLabelText('Priority for City'), { target: { value: '3' } });
    expect(within(screen.getByRole('article', { name: 'Allocation 3' })).getByText('points', { exact: true })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Selected-trip cash budget (USD, optional)'), { target: { value: '999' } }); expect(card('Cash conservation').getByText(/No allocation fits/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Selected-trip cash budget (USD, optional)'), { target: { value: '' } });
    fireEvent.click(screen.getByLabelText('Include Luxury')); expect(screen.queryByRole('article', { name: 'Allocation 3' })).not.toBeInTheDocument(); expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
    mounted.unmount(); render(<App />); expect(screen.getByLabelText('Priority for City')).toHaveValue('1'); expect(screen.getByLabelText('Include Luxury')).toBeChecked();
  });
  it('confirms certificate alternatives and displays single-use inventory and top-off limits', () => {
    const d = portfolioFixture('property-jw-tampa'); d.profile.certificates = [{ id: 'cert-one', label: 'Annual award', points: 60000, expiresOn: '2027-12-31', notes: '' }]; const before = seed(d); render(<App />);
    const controls = screen.getAllByRole('checkbox', { name: /Confirm certificate-eligible/ }); fireEvent.click(controls[2]!); fireEvent.click(screen.getByRole('button', { name: 'Inspect cash conservation' }));
    const allocation = within(screen.getByRole('article', { name: 'Allocation 3' })); expect(allocation.getByText('Top-off points')).toBeInTheDocument(); expect(allocation.getByText('20,000 points')).toBeInTheDocument(); expect(card('Cash conservation').getByText('Points used').parentElement).toHaveTextContent('50,000 points'); expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
  });
  it('keeps unknown costs and invalid drafts visible, and recovers after correcting the budget', () => {
    const d = portfolioFixture('property-jw-tampa'); d.workspace.trips[0]!.stays[0]!.pricing.cashTaxes = null; seed(d); render(<App />);
    expect(card('Cash conservation').getByText('Incomplete assessment')).toBeInTheDocument(); expect(card('Cash conservation').getByText('$400.00 · partial')).toBeInTheDocument(); expect(screen.getByText('Cash quote, taxes or mandatory fees unknown.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Selected-trip cash budget (USD, optional)'), { target: { value: '-1' } }); expect(screen.getByRole('alert')).toHaveTextContent('cashBudgetUsd');
    fireEvent.change(screen.getByLabelText('Selected-trip cash budget (USD, optional)'), { target: { value: '' } }); expect(screen.getByRole('heading', { name: 'Compare your strategies' })).toBeInTheDocument();
  });
  it('loads a genuine Stage 7 v1 backup without rewriting it and preserves route context', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy)); window.history.replaceState(null, '', '#/portfolio?country=TZ&compare=jw-tampa'); render(<App />);
    expect(screen.getByRole('heading', { name: 'Plan your travel portfolio.' })).toBeInTheDocument(); expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(legacy));
    expect(screen.getByRole('navigation').querySelector('[aria-current="page"]')).toHaveTextContent('Portfolio');
    expect(within(screen.getByRole('navigation')).getByRole('link', { name: 'Trip builder' })).toHaveAttribute('href', '#/trips?country=TZ&compare=jw-tampa');
  });
  it('shows empty and corrupt-storage states without invented pricing or loss', () => {
    localStorage.setItem(STORAGE_KEY, 'future data'); render(<App />); expect(screen.getByText(/Saved data needs review/)).toBeInTheDocument(); expect(screen.getByText(/Create saved trips/)).toBeInTheDocument(); expect(localStorage.getItem(STORAGE_KEY)).toBe('future data');
  });
});
