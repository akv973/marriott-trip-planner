import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import { AddToTripDialog } from '../../components/AddToTrip';
import { emptyPlanner, STORAGE_KEY } from '../../lib/storage/planner';
import { createStay, createTrip } from '../../lib/trips/trips';
import { loadFoundation } from '../../lib/catalog/foundation';
import legacy from '../fixtures/planner-stage-7-v1.json';
const catalog = loadFoundation(); if (!catalog.success) throw new Error('Invalid catalog');
const property = catalog.data.properties.find(p => p.id === 'property-mapito')!;
const navigate = (hash: string) => { window.location.hash = hash; fireEvent(window, new HashChangeEvent('hashchange')); };
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const set = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
const open = () => click(/Add to trip: Mapito/);
const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!).data;
beforeEach(() => {
  // Use the actual catalog slug rather than a duplicated fixture assumption.
  window.history.replaceState(null, '', `#/properties/${property.slug}?country=TZ&compare=jw-tampa`);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); Element.prototype.scrollIntoView = vi.fn();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
describe('Add to trip application flow', () => {
  it('creates one trip/stay, opens the correct hotel control, saves unknowns and preserves route context', () => {
    const mounted = render(<App />); open(); expect(screen.getByLabelText('Destination trip')).toHaveFocus();
    set('New trip name', 'My safari'); click('Add stay and open trip');
    const hotel = within(screen.getByRole('article', { name: 'Stay 1' })).getByLabelText('Hotel'); expect(hotel).toHaveValue(property.id); expect(hotel).toHaveFocus();
    expect(screen.getByLabelText('Trip name')).toHaveValue('My safari'); expect(window.location.hash).toBe('#/trips?country=TZ&compare=jw-tampa');
    expect(saved().workspace.trips[0].stays[0]).toEqual(createStay('stay-2', property.id));
    const before = saved(); mounted.unmount(); render(<App />); expect(saved()).toEqual(before); expect(screen.getByLabelText('Hotel')).toHaveValue(property.id);
  });
  it('cancels from Explorer with no writes/sequence change and returns focus to the invoking button', () => {
    navigate('#/explore?q=Mapito&country=TZ&compare=jw-tampa'); render(<App />);
    const trigger = screen.getByRole('button', { name: /Add to trip: Mapito/ }); trigger.focus(); fireEvent.click(trigger); const destination = screen.getByLabelText('Destination trip');
    fireEvent.keyDown(destination, { key: 'Tab', shiftKey: true }); expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Cancel' }), { key: 'Tab' }); expect(destination).toHaveFocus();
    set('New trip name', 'Discard this'); click('Cancel');
    expect(trigger).toHaveFocus(); expect(localStorage.getItem(STORAGE_KEY)).toBeNull(); expect(window.location.hash).toBe('#/explore?q=Mapito&country=TZ&compare=jw-tampa');
    open(); expect(screen.getByLabelText('New trip name')).toHaveValue('Untitled trip');
  });
  it('adds to a chosen inactive trip and leaves existing profile, quotes and stays intact', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy)); render(<App />); open();
    set('Destination trip', ''); set('New trip name', 'Separate trip'); click('Add stay and open trip'); const before = saved();
    navigate(`#/properties/${property.slug}?country=TZ&compare=jw-tampa`); open(); set('Destination trip', legacy.data.workspace.trips[0]!.id); click('Add stay and open trip');
    expect(screen.getByLabelText('Choose trip')).toHaveValue(legacy.data.workspace.trips[0]!.id);
    expect(saved().workspace.trips[0].stays.slice(0, -1)).toEqual(legacy.data.workspace.trips[0]!.stays);
    expect(saved().workspace.trips.at(-1)).toEqual(before.workspace.trips.at(-1)); expect(saved().profile).toEqual(legacy.data.profile);
    expect(screen.getAllByLabelText('Hotel').at(-1)).toHaveFocus();
  });
  it('uses a synchronous latch to block rapid submit events while allowing a new deliberate repeat', () => {
    const confirm = vi.fn(() => null);
    const mounted = render(<AddToTripDialog property={property} workspace={emptyPlanner().workspace} onCancel={vi.fn()} onConfirm={confirm} />);
    const form = screen.getByRole('button', { name: 'Add stay and open trip' }).closest('form')!;
    fireEvent.submit(form); fireEvent.submit(form); expect(confirm).toHaveBeenCalledTimes(1); mounted.unmount();
    render(<App />); open(); click('Add stay and open trip'); navigate(`#/properties/${property.slug}`); open(); click('Add stay and open trip');
    expect(saved().workspace.trips).toHaveLength(1); expect(saved().workspace.trips[0].stays).toHaveLength(2);
  });
  it('disables full destinations and permits cancellation at both limits without changing saved plans', () => {
    const data = emptyPlanner(); data.workspace = { trips: Array.from({ length: 10 }, (_, i) => ({ ...createTrip(`trip-${i + 1}`), stays: Array.from({ length: 30 }, (_, j) => createStay(`stay-${11 + i * 30 + j}`, property.id)) })), activeId: 'trip-1', sequence: 311 };
    const json = JSON.stringify({ ...legacy, schemaVersion: 2, data }); localStorage.setItem(STORAGE_KEY, json); render(<App />); open();
    expect(screen.getByRole('button', { name: 'Add stay and open trip' })).toBeDisabled(); expect(screen.getByRole('option', { name: /Create a new trip/ })).toBeDisabled();
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('No room'); click('Cancel'); expect(localStorage.getItem(STORAGE_KEY)).toBe(json);
  });
  it('keeps storage failures/conflicts in memory and preserves existing saved bytes', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy)); render(<App />); open(); const before = localStorage.getItem(STORAGE_KEY);
    const denial = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota'); }); click('Add stay and open trip');
    expect(screen.getByText(/Could not save to this browser/)).toBeInTheDocument(); expect(localStorage.getItem(STORAGE_KEY)).toBe(before); expect(screen.getAllByLabelText('Hotel').at(-1)).toHaveFocus(); denial.mockRestore();
  });
  it('rejects invalid workspace drafts without a partial write and retries after correction', () => {
    render(<App />); open(); click('Add stay and open trip'); const before = localStorage.getItem(STORAGE_KEY);
    set('Trip name', ''); navigate(`#/properties/${property.slug}`); open(); click('Add stay and open trip');
    expect(screen.getByRole('alert')).toHaveTextContent('Correct invalid trip drafts'); expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
    expect(screen.getByRole('dialog')).toBeInTheDocument(); click('Cancel'); navigate('#/trips');
    expect(screen.getAllByLabelText('Hotel')).toHaveLength(1); set('Trip name', 'Corrected trip'); navigate(`#/properties/${property.slug}`); open(); click('Add stay and open trip');
    expect(saved().workspace.trips[0].stays).toHaveLength(2); expect(screen.getAllByLabelText('Hotel').at(-1)).toHaveFocus();
  });
  it('shows validation errors without partial additions and allows retry after choosing a valid name', () => {
    render(<App />); open(); set('New trip name', ' '); expect(screen.getByRole('button', { name: 'Add stay and open trip' })).toBeDisabled();
    set('New trip name', 'Valid trip'); click('Add stay and open trip'); expect(saved().workspace.trips).toHaveLength(1);
  });
});
