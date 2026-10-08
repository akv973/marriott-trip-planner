import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';

beforeEach(() => { window.history.replaceState(null, '', '#/trips'); vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); Element.prototype.scrollIntoView = vi.fn(); });
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const set = (label: string, value: string, scope: Pick<typeof screen, 'getByLabelText'> = screen) => fireEvent.change(scope.getByLabelText(label, { exact: true }), { target: { value } });
const start = () => { render(<App />); click('Create trip'); click('Add hotel stay'); };
const summary = () => screen.getByRole('complementary', { name: 'Trip totals' });
const fillCash = (scope = within(screen.getByRole('article', { name: 'Stay 1' }))) => {
  set('Nightly room rate (USD)', '500', scope); set('Cash taxes, stay total (USD)', '50', scope); set('Cash mandatory fees, stay total (USD)', '0', scope);
};

describe('Trip Builder editing and independent totals', () => {
  it('creates trips and immediately recalculates chosen cash/points and incomplete subtotals', () => {
    start(); set('Trip points balance', '300000'); fillCash();
    expect(summary()).toHaveTextContent('$550.00');
    click('Add hotel stay'); const second = within(screen.getByRole('article', { name: 'Stay 2' }));
    set('Hotel', 'property-mapito', second); set('Booking method', 'points', second); set('Final quoted award points', '200000', second); set('Award cash payable, stay total (USD)', '100', second);
    expect(summary()).toHaveTextContent('2 stays · 2 nights · 1 hotel change');
    expect(summary()).toHaveTextContent('$650.00'); expect(summary()).toHaveTextContent('100,000 points');
    set('Cash taxes, stay total (USD)', '', within(screen.getByRole('article', { name: 'Stay 1' })));
    expect(summary()).toHaveTextContent('Known subtotal: $100.00'); expect(summary()).toHaveTextContent('incomplete stays');
  });
  it('keeps alternative prices separate, clears stale totals on nights/date/currency/hotel edits', () => {
    start(); fillCash(); const first = within(screen.getByRole('article', { name: 'Stay 1' }));
    set('Final quoted award points', '200000', first); expect(summary()).toHaveTextContent('Total points spent0 points');
    set('Nights', '2', first); expect(first.getByLabelText('Final quoted award points')).toHaveValue(null); expect(first.getByLabelText('Cash taxes, stay total (USD)')).toHaveValue(null); expect(summary()).toHaveTextContent('1 stays · 2 nights');
    set('Check-in date', '2027-01-01', first); expect(first.getByLabelText('Nightly room rate (USD)')).toHaveValue(null); expect(first.getByText(/Check-out:/)).toHaveTextContent('2027-01-03');
    fillCash(first); set('Stay currency', 'EUR', first); expect(first.getByLabelText('Nightly room rate (EUR)')).toHaveValue(null);
    set('Hotel', 'property-mapito', first); expect(first.getByLabelText('Check-in date')).toHaveValue(''); expect(first.getByLabelText('Stay currency')).toHaveValue('USD');
  });
  it('supports notes, independent trips, removal, reorder, and validation recovery', () => {
    start(); set('Trip name', 'Safari'); set('Trip notes / planned activities', '<script>walk</script>'); const first = within(screen.getByRole('article', { name: 'Stay 1' })); set('Stay notes', 'Transfer after lunch', first); fillCash();
    click('Create trip'); set('Trip name', 'Desert'); expect(summary()).toHaveTextContent('0 stays');
    set('Choose trip', 'trip-1'); expect(screen.getByLabelText('Trip notes / planned activities')).toHaveValue('<script>walk</script>'); expect(within(screen.getByRole('article', { name: 'Stay 1' })).getByLabelText('Stay notes')).toHaveValue('Transfer after lunch');
    click('Add hotel stay'); set('Hotel', 'property-mapito', within(screen.getByRole('article', { name: 'Stay 2' }))); click('Move stay 2 earlier');
    expect(within(screen.getByRole('article', { name: 'Stay 1' })).getByLabelText('Hotel')).toHaveValue('property-mapito');
    click('Remove stay 1'); expect(summary()).toHaveTextContent('$550.00');
    set('Nights', '61', within(screen.getByRole('article', { name: 'Stay 1' }))); expect(screen.getByRole('alert')).toHaveTextContent('nights'); expect(summary()).not.toHaveTextContent('$550.00');
    set('Nights', '1', within(screen.getByRole('article', { name: 'Stay 1' }))); expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    click('Delete this trip'); expect(screen.getByLabelText('Trip name')).toHaveValue('Desert');
  });
  it('renders variable nightly blanks as unknown and aggregates FX only when entered', () => {
    start(); const first = within(screen.getByRole('article', { name: 'Stay 1' }));
    set('Booking method', 'points', first); set('Nights', '5', first); set('Award points basis', 'varying', first);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument(); expect(summary()).toHaveTextContent('Known points subtotal0 points');
    set('Stay currency', 'EUR', first); set('Booking method', 'cash', first); set('Nightly room rate (EUR)', '100', first); set('Cash taxes, stay total (EUR)', '0', first); set('Cash mandatory fees, stay total (EUR)', '0', first);
    expect(summary()).toHaveTextContent('Total cash (EUR)€500.00'); expect(summary()).toHaveTextContent('Manual USD exchange rate');
    set('Exchange rate (USD per 1 EUR)', '1.2', first); expect(summary()).toHaveTextContent('$600.00');
  });
  it('preserves in-memory trips across navigation without writing personal data to storage or URL', async () => {
    const local = vi.spyOn(Storage.prototype, 'setItem'); start(); set('Trip name', 'My trip'); set('Trip notes / planned activities', 'Private note');
    window.location.hash = '#/calculator?country=TZ'; fireEvent(window, new HashChangeEvent('hashchange')); expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Make your points');
    window.location.hash = '#/trips?country=TZ'; fireEvent(window, new HashChangeEvent('hashchange')); expect(await screen.findByLabelText('Trip name')).toHaveValue('My trip');
    expect(screen.getByLabelText('Trip notes / planned activities')).toHaveValue('Private note'); expect(local).not.toHaveBeenCalled(); expect(window.location.hash).not.toContain('Private');
    expect(screen.getByRole('link', { name: 'Trip builder' })).toHaveAttribute('href', '#/trips?country=TZ');
  });
});
