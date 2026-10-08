import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';

beforeEach(() => { window.history.replaceState(null, '', '#/calculator'); vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); });
const set = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value } });
const calculate = () => fireEvent.click(screen.getByRole('button', { name: 'Calculate value' }));
const fill = () => {
  set('Nightly room rate (USD)', '500'); set('Cash taxes, stay total', '250'); set('Cash mandatory fees, stay total', '100');
  set('Points per night before discount', '50000'); set('Award cash payable', '100');
  set('Stay for 5, Pay for 4 eligibility', 'eligible'); set('Are the two quotes comparable?', 'same');
};
describe('Manual points calculator UI', () => {
  it('starts with unknown prices and exposes dated policy links', () => {
    render(<App />); calculate();
    expect(screen.getByRole('status')).toHaveTextContent('Assessment unavailable');
    expect(screen.getByRole('complementary', { name: 'Calculation results' })).toHaveTextContent('Cash room price');
    expect(screen.getByRole('link', { name: /Marriott terms/ })).toHaveAttribute('href', 'https://www.marriott.com/loyalty/terms/default.mi');
    expect(screen.getByLabelText('Nightly room rate (USD)')).toHaveValue(null);
    for (const label of ['Cash room price basis', 'Award points basis', 'Are the two quotes comparable?']) expect(screen.getByLabelText(label, { exact: true })).toHaveAttribute('aria-label', label);
  });
  it('calculates independently from catalog data, shows the arithmetic and clears a stale result on edit', () => {
    render(<App />); fill(); set('Available points', '199999'); calculate();
    expect(screen.getByRole('status')).toHaveTextContent('Excellent points use');
    expect(screen.getByRole('status')).toHaveTextContent('1.375¢');
    expect(screen.getByText(/\(\$2,850.00 − \$100.00\)/)).toHaveTextContent('200,000');
    expect(screen.getByText(/Insufficient points/)).toHaveTextContent('1 more point');
    set('Cash taxes, stay total', ''); expect(screen.queryByRole('status')).not.toBeInTheDocument(); calculate();
    expect(screen.getByRole('status')).toHaveTextContent('CPP unavailable');
    expect(screen.getByRole('complementary', { name: 'Calculation results' })).toHaveTextContent('Cash taxes');
  });
  it('uses a quoted total as entered and suppresses assessments for different room products', () => {
    render(<App />); fill(); set('Award points basis', 'total');
    expect(screen.getByLabelText('Quoted final points total')).toHaveValue(null);
    set('Quoted final points total', '200000'); set('Are the two quotes comparable?', 'different'); calculate();
    expect(screen.getByRole('status')).toHaveTextContent('1.375¢');
    expect(screen.getByRole('status')).toHaveTextContent('Assessment unavailable');
    expect(screen.getByText(/never deducted twice/)).toBeInTheDocument();
  });
  it('renders validation errors and clears all entries on reset', () => {
    render(<App />); set('Number of nights', '61'); calculate();
    expect(screen.getByRole('alert')).toHaveTextContent('nights');
    fireEvent.click(screen.getByRole('button', { name: 'Clear inputs' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Number of nights')).toHaveValue(5);
  });
  it('preserves navigation context and keeps manual data separate from property evidence', () => {
    window.history.replaceState(null, '', '#/calculator?country=TZ&compare=mapito&compare=mereshi&property=mapito');
    render(<App />);
    expect(screen.getByRole('link', { name: /Back to comparison/ })).toHaveAttribute('href', '#/compare?country=TZ&compare=mapito&compare=mereshi');
    expect(screen.getByText(/Catalog rates and fees remain unknown/)).toBeInTheDocument();
    expect(within(screen.getByRole('form')).getByLabelText('Nightly room rate (USD)')).toHaveValue(null);
  });
  it('requires manual FX without changing the personal USD valuation', () => {
    render(<App />); set('Quote currency', 'BRL');
    expect(screen.getByLabelText(/Exchange rate/)).toHaveValue(null);
    expect(screen.getByLabelText(/Personal value/)).toHaveValue(0.8);
  });
});
