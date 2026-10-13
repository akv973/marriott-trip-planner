import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import { loadFoundation } from '../../lib/catalog/foundation';
import { exportPlanner, STORAGE_KEY } from '../../lib/storage/planner';
import { portfolioFixture } from '../fixtures/portfolio';
const loaded = loadFoundation(); if (!loaded.success) throw new Error('Catalog required'); const catalog = loaded.data;
beforeEach(() => { window.history.replaceState(null, '', '#/trips'); vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); Element.prototype.scrollIntoView = vi.fn(); });
describe('Release audit: saved planner recovery', () => {
  it('opens restored trips when a valid backup has no active trip selected', () => {
    const d = portfolioFixture('property-jw-tampa'); d.workspace.activeId = null;
    localStorage.setItem(STORAGE_KEY, exportPlanner(d, catalog)); const before = localStorage.getItem(STORAGE_KEY);
    render(<App />);
    expect(screen.getByLabelText('Choose trip')).toHaveValue('journey-0');
    expect(screen.getByLabelText('Trip name')).toHaveValue('Luxury');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
    fireEvent.change(screen.getByLabelText('Stay notes'), { target: { value: 'Review this stay' } });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).data.workspace.trips[0].stays[0].notes).toBe('Review this stay');
    fireEvent.change(screen.getByLabelText('Choose trip'), { target: { value: 'journey-1' } });
    expect(screen.getByLabelText('Trip name')).toHaveValue('Park');
    expect(within(screen.getByRole('complementary', { name: 'Trip totals' })).getAllByText('$600.00', { exact: true })).toHaveLength(3);
  });
});
