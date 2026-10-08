import { useState } from 'react';
import type { Property } from '../types/catalog';
import type { ManualQuote } from '../lib/scoring/recommendations';
import { calculatePoints, CURRENCIES, DEFAULT_THRESHOLDS } from '../lib/points/calculator';

export function RecommendationQuote({ property, nights, appliedQuote, onApply, onRemove }: { property: Property; nights: number; appliedQuote: ManualQuote | undefined; onApply: (quote: ManualQuote) => void; onRemove: () => void }) {
  const [values, setValues] = useState(() => {
    const v = appliedQuote?.calculator;
    const text = (value: number | null | undefined) => value == null ? '' : String(value);
    return { cashRoom: text(v?.cashRoom), cashTaxes: text(v?.cashTaxes), cashFees: text(v?.cashFees), awardCash: text(v?.awardCash), awardPoints: text(v?.awardPoints), valuationCpp: v ? text(v.valuationCpp) : '0.8', balance: text(v?.balance), usdPerCurrency: text(v?.usdPerCurrency), checkIn: appliedQuote?.checkIn ?? '', observedAt: appliedQuote?.observedAt ?? '' };
  });
  const [currency, setCurrency] = useState<typeof CURRENCIES[number]>(appliedQuote?.calculator.currency ?? 'USD');
  const [comparable, setComparable] = useState<'unknown' | 'same' | 'different'>(appliedQuote?.calculator.comparable ?? 'unknown');
  const [message, setMessage] = useState('');
  const number = (value: string) => value.trim() ? Number(value) : null;
  const field = (key: keyof typeof values, label: string, type = 'number') => <label className="calculator-field" key={key}>{label}<input aria-label={label} type={type} min={type === 'number' ? 0 : undefined} step={['awardPoints', 'balance'].includes(key) ? '1' : 'any'} value={values[key]} onChange={(e) => { setValues((v) => ({ ...v, [key]: e.target.value })); setMessage('Draft changed; apply to replace the last applied quote.'); }} /></label>;
  return <form className="calculator-form recommendation-quote" noValidate aria-label={`Manual recommendation quote for ${property.name}`} onSubmit={(event) => {
    event.preventDefault();
    const calculator = { nights, currency, cashBasis: 'total' as const, cashRoom: number(values.cashRoom), cashTaxes: number(values.cashTaxes), cashFees: number(values.cashFees), awardCash: number(values.awardCash), awardBasis: 'total' as const, awardPoints: number(values.awardPoints), nightlyPoints: [], fifthNight: 'unknown' as const, comparable, usdPerCurrency: number(values.usdPerCurrency), valuationCpp: number(values.valuationCpp), balance: number(values.balance), thresholds: { ...DEFAULT_THRESHOLDS } };
    const result = calculatePoints(calculator);
    if (!result.success) { setMessage(result.errors.join(' ')); return; }
    onApply({ propertyId: property.id, checkIn: values.checkIn || null, observedAt: values.observedAt || null, calculator: result.input });
    setMessage('Quote applied. Recommendations use the last applied quote; editing this draft does not change it.');
  }}>
    <fieldset><legend>Manual quote · {property.name}</legend><p className="calculator-help">All prices below are totals for {nights} nights. Blank means unknown; 0 means a confirmed zero charge. Final award points must already include any fifth-night discount or upgrade. Compare the same room, guests, inclusions and cancellation terms.</p>
      <div className="calculator-fields"><label className="calculator-field">Recommendation quote currency<select aria-label="Recommendation quote currency" value={currency} onChange={(e) => { setCurrency(e.target.value as typeof currency); setValues((v) => ({ ...v, cashRoom: '', cashTaxes: '', cashFees: '', awardCash: '', usdPerCurrency: '' })); setMessage('Currency changed; cash amounts cleared. Apply the revised quote.'); }}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        {field('cashRoom', `Room cost, stay total (${currency})`)}{field('cashTaxes', `Taxes, stay total (${currency})`)}{field('cashFees', `Mandatory fees, stay total (${currency})`)}{field('awardPoints', 'Final quoted award points')}{field('awardCash', `Cash due on award, stay total (${currency})`)}
        {field('valuationCpp', 'Quote personal value (USD cents per point)')}{field('balance', 'Quote available points (optional)')}
        {currency !== 'USD' && field('usdPerCurrency', `Quote FX (USD per 1 ${currency})`)}{field('checkIn', 'Quote check-in date', 'date')}{field('observedAt', 'Quote observed on', 'date')}
        <label className="calculator-field">Quote products and terms<select aria-label="Quote products and terms" value={comparable} onChange={(e) => { setComparable(e.target.value as typeof comparable); setMessage('Draft changed; apply the revised quote.'); }}><option value="unknown">Not confirmed</option><option value="same">Comparable</option><option value="different">Different</option></select></label>
      </div></fieldset><div className="calculator-actions"><button className="primary-link" type="submit">Apply quote</button><button className="text-button" type="button" onClick={() => { onRemove(); setMessage('Applied quote removed. Draft retained.'); }}>Remove applied quote</button></div>{message && <p role="status" className="calculator-help">{message}</p>}
  </form>;
}
