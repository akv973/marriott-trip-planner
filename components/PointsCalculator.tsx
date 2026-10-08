import { useEffect, useState } from 'react';
import type { Catalog } from '../types/catalog';
import type { ExplorerQuery } from '../lib/catalog/explorer';
import { comparisonHref, explorerHref, propertyHref } from '../lib/navigation/routes';
import { calculatePoints, CURRENCIES, DEFAULT_THRESHOLDS, formatMoney, formatPoints } from '../lib/points/calculator';
import { POINTS_POLICY } from '../lib/points/policy';

type Form = {
  nights: string; currency: typeof CURRENCIES[number]; cashBasis: 'nightly' | 'total'; cashRoom: string; cashTaxes: string; cashFees: string; awardCash: string;
  awardBasis: 'flat' | 'varying' | 'total'; awardPoints: string; fifthNight: 'unknown' | 'eligible' | 'ineligible'; comparable: 'unknown' | 'same' | 'different';
  usdPerCurrency: string; valuationCpp: string; balance: string; checkIn: string; observedAt: string; roomType: string; cancellation: string;
  stronglyCash: string; cash: string; good: string; excellent: string;
};
const INITIAL: Form = { nights: '5', currency: 'USD', cashBasis: 'nightly', cashRoom: '', cashTaxes: '', cashFees: '', awardCash: '', awardBasis: 'flat', awardPoints: '', fifthNight: 'unknown', comparable: 'unknown', usdPerCurrency: '', valuationCpp: '0.8', balance: '', checkIn: '', observedAt: '', roomType: '', cancellation: '', stronglyCash: '0.5', cash: '0.9', good: '1.1', excellent: '1.5' };
const numeric = (value: string) => value.trim() === '' ? null : Number(value);
type Result = ReturnType<typeof calculatePoints>;

export function PointsCalculator({ catalog, query, comparisonSlugs, propertySlug }: { catalog: Catalog; query: ExplorerQuery; comparisonSlugs: string[]; propertySlug: string | null }) {
  const [form, setForm] = useState<Form>(INITIAL);
  const [nightly, setNightly] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  useEffect(() => { if (result) document.getElementById('calculator-result-title')?.focus(); }, [result]);
  const property = catalog.properties.find((record) => record.slug === propertySlug);
  const change = <K extends keyof Form>(key: K, value: Form[K]) => { setForm((current) => ({ ...current, [key]: value })); setResult(null); };
  const count = Number(form.nights);
  const validNights = Number.isInteger(count) && count >= 1 && count <= 60;
  const numberField = (key: keyof Form, label: string, help?: string, integer = false) => <label className="calculator-field" key={key}>{label}<input aria-label={label} aria-describedby={help ? `${key}-hint` : undefined} type="number" min="0" step={integer ? '1' : 'any'} value={form[key]} onChange={(event) => change(key, event.target.value)} />{help && <span id={`${key}-hint`}>{help}</span>}</label>;
  const run = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(calculatePoints({ nights: numeric(form.nights), currency: form.currency, cashBasis: form.cashBasis, cashRoom: numeric(form.cashRoom), cashTaxes: numeric(form.cashTaxes), cashFees: numeric(form.cashFees), awardCash: numeric(form.awardCash), awardBasis: form.awardBasis, awardPoints: numeric(form.awardPoints), nightlyPoints: validNights ? Array.from({ length: count }, (_, i) => numeric(nightly[i] ?? '')) : [], fifthNight: form.fifthNight, comparable: form.comparable, usdPerCurrency: numeric(form.usdPerCurrency), valuationCpp: numeric(form.valuationCpp), balance: numeric(form.balance), thresholds: { stronglyCash: numeric(form.stronglyCash), cash: numeric(form.cash), good: numeric(form.good), excellent: numeric(form.excellent) } }));
  };
  const ready = result?.success ? result : null;
  return <>
    <a className="back-link" href={comparisonSlugs.length >= 2 ? comparisonHref(comparisonSlugs, query) : explorerHref(query, comparisonSlugs)}>← Back to {comparisonSlugs.length >= 2 ? 'comparison' : 'your collection'}</a>
    <section className="calculator-hero"><p className="eyebrow">Rates you enter · Assumptions you can inspect</p><h1 id="page-title" tabIndex={-1}>Make your points count.</h1><p>Compare the cash you would avoid with the points you would spend. Use quotes for the same room, guests, inclusions and cancellation terms.</p>
      {property ? <p className="calculator-context">Planning for <a href={propertyHref(property.slug, query, comparisonSlugs)}>{property.name} ↗</a>. Catalog rates and fees remain unknown.</p> : propertySlug ? <p className="review-label">This property is unavailable in the catalog. You can still calculate a manual stay.</p> : <p className="calculator-context">One stay at one property. Your entries stay in this page and are cleared on reload.</p>}
    </section>
    <div className="calculator-layout">
      <form className="calculator-form" onSubmit={run} noValidate aria-label="Manual cash and points inputs">
        <fieldset><legend>01 · Your stay</legend><div className="calculator-fields">
          {numberField('nights', 'Number of nights', '1–60 consecutive nights.', true)}
          <label className="calculator-field">Quote currency<select aria-label="Quote currency" value={form.currency} onChange={(e) => { setForm((current) => ({ ...current, currency: e.target.value as Form['currency'], cashRoom: '', cashTaxes: '', cashFees: '', awardCash: '', usdPerCurrency: '' })); setResult(null); }}>{CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}</select><span>Changing currency clears quote amounts and exchange rate.</span></label>
          <label className="calculator-field">Check-in date (optional)<input type="date" value={form.checkIn} onChange={(e) => change('checkIn', e.target.value)} /></label>
          <label className="calculator-field">Quote observed on (optional)<input type="date" value={form.observedAt} onChange={(e) => change('observedAt', e.target.value)} /></label>
          <label className="calculator-field">Room / guests / inclusions (optional)<input maxLength={200} value={form.roomType} onChange={(e) => change('roomType', e.target.value)} /></label>
          <label className="calculator-field">Cancellation terms (optional)<input maxLength={200} value={form.cancellation} onChange={(e) => change('cancellation', e.target.value)} /></label>
        </div></fieldset>
        <fieldset><legend>02 · The cash option</legend><p className="calculator-help">Enter the room price before taxes and fees. All extras below are totals for the entire stay. Blank means unknown; enter 0 only for a confirmed zero charge.</p><div className="calculator-fields">
          <label className="calculator-field">Cash room price basis<select aria-label="Cash room price basis" value={form.cashBasis} onChange={(e) => { change('cashBasis', e.target.value as Form['cashBasis']); change('cashRoom', ''); }}><option value="nightly">Nightly room rate</option><option value="total">Total room cost</option></select></label>
          {numberField('cashRoom', form.cashBasis === 'nightly' ? `Nightly room rate (${form.currency})` : `Total room cost (${form.currency})`)}
          {numberField('cashTaxes', `Cash taxes, stay total (${form.currency})`)}
          {numberField('cashFees', `Cash mandatory fees, stay total (${form.currency})`)}
        </div></fieldset>
        <fieldset><legend>03 · The award option</legend><div className="calculator-fields">
          <label className="calculator-field">Award points basis<select aria-label="Award points basis" value={form.awardBasis} onChange={(e) => { change('awardBasis', e.target.value as Form['awardBasis']); change('awardPoints', ''); }}><option value="flat">Flat nightly points</option><option value="varying">Variable nightly points</option><option value="total">Final quoted points total</option></select></label>
          {form.awardBasis !== 'varying' && numberField('awardPoints', form.awardBasis === 'total' ? 'Quoted final points total' : 'Points per night before discount', undefined, true)}
          {form.awardBasis === 'varying' && validNights && <div className="nightly-points" role="group" aria-label="Points by night">{Array.from({ length: count }, (_, index) => <label className="calculator-field" key={index}>Night {index + 1} points<input type="number" min="0" step="1" value={nightly[index] ?? ''} onChange={(e) => { setNightly((current) => { const next = [...current]; next[index] = e.target.value; return next; }); setResult(null); }} /></label>)}</div>}
          {form.awardBasis !== 'total' && <label className="calculator-field">Stay for 5, Pay for 4 eligibility<select aria-label="Stay for 5, Pay for 4 eligibility" value={form.fifthNight} onChange={(e) => change('fifthNight', e.target.value as Form['fifthNight'])}><option value="unknown">Unknown / not confirmed</option><option value="eligible">Eligible standard points stay</option><option value="ineligible">Ineligible / do not apply</option></select><span>{POINTS_POLICY.fifthNight}</span></label>}
          {form.awardBasis === 'total' && <p className="calculator-help">Use the final Marriott quote including any discount and point upgrades. This calculator will not subtract another free night.</p>}
          {numberField('awardCash', `Award cash payable, stay total (${form.currency})`, 'Include every tax, mandatory fee, cash upgrade or other amount still due. No fee waiver is assumed.')}
          <label className="calculator-field">Are the two quotes comparable?<select aria-label="Are the two quotes comparable?" value={form.comparable} onChange={(e) => change('comparable', e.target.value as Form['comparable'])}><option value="unknown">Not confirmed</option><option value="same">Same products and terms</option><option value="different">Products or terms differ</option></select></label>
        </div></fieldset>
        <fieldset><legend>04 · Your assumptions</legend><div className="calculator-fields">
          {numberField('valuationCpp', 'Personal value (USD cents per point)', 'Planning default: 0.8¢. Change it to your own value; this is not Marriott policy.')}
          {numberField('balance', 'Available points (optional)', 'Blank leaves affordability unknown. No account connection.', true)}
          {form.currency !== 'USD' && numberField('usdPerCurrency', `Exchange rate (USD per 1 ${form.currency})`, 'Enter a manual rate for your quote. No exchange rate is fetched or assumed.')}
        </div><details className="calculator-thresholds"><summary>Assessment thresholds</summary><p>Compare actual CPP with your personal value. Ratios below the thresholds move through strongly cash, cash, neutral, good and excellent. These are configurable planning choices.</p><div className="calculator-fields">{numberField('stronglyCash', 'Strongly cash below ratio')}{numberField('cash', 'Cash below ratio')}{numberField('good', 'Good from ratio')}{numberField('excellent', 'Excellent from ratio')}</div><p>Defaults: {Object.values(DEFAULT_THRESHOLDS).join(' / ')} × your personal point value.</p></details></fieldset>
        <div className="calculator-actions"><button className="primary-link" type="submit">Calculate value <span aria-hidden="true">→</span></button><button type="button" className="text-button" onClick={() => { setForm(INITIAL); setNightly([]); setResult(null); }}>Clear inputs</button></div>
      </form>
      <aside className="calculator-results" aria-label="Calculation results">
        <p className="eyebrow">The booking economics</p><h2 id="calculator-result-title" tabIndex={-1}>Your cash-versus-points assessment</h2>
        {!result ? <p className="calculator-help">Enter your quote and calculate. Unknown inputs stay visible, and no catalog price is assumed.</p> : !result.success ? <div role="alert"><h3>Check your inputs.</h3><ul>{result.errors.map((error, i) => <li key={i}>{error}</li>)}</ul></div> : ready && <>
          <div role="status" className="calculator-verdict"><strong>{ready.band ?? 'Assessment unavailable'}</strong><span className="cpp-value">{ready.cpp === null ? 'CPP unavailable' : `${ready.cpp.toFixed(3)}¢ / point`}</span><span>USD cents per Bonvoy point{form.comparable !== 'same' && ready.cpp !== null ? ' · illustrative' : ''}</span></div>
          <dl className="calculator-breakdown"><div><dt>Cash room cost</dt><dd>{formatMoney(ready.room, form.currency)}</dd></div><div><dt>Cash total, including extras</dt><dd>{formatMoney(ready.cashTotal, form.currency)}</dd></div><div><dt>Cash still due on award</dt><dd>{formatMoney(ready.awardCash, form.currency)}</dd></div><div><dt>Net cash avoided</dt><dd>{formatMoney(ready.netCashAvoided, form.currency)}</dd></div><div><dt>Points before discount / quoted total</dt><dd>{formatPoints(ready.grossPoints)}</dd></div><div><dt>Stay for 5, Pay for 4 savings</dt><dd>{form.awardBasis === 'total' ? 'Included in your quote, if applicable' : formatPoints(ready.savings)}</dd></div><div><dt>Points spent</dt><dd>{formatPoints(ready.pointsSpent)}</dd></div><div><dt>Personal value of points spent</dt><dd>{formatMoney(ready.pointsValue, 'USD')}</dd></div><div><dt>Award economic cost (cash + point value)</dt><dd>{formatMoney(ready.awardEconomicCostUsd, 'USD')}</dd></div><div><dt>Points balance check</dt><dd>{ready.pointsShortfall === null ? 'Unknown' : ready.pointsShortfall > 0 ? `${formatPoints(ready.pointsShortfall)} short` : `${formatPoints(ready.remainingBalance)} remaining`}</dd></div></dl>
          {!!ready.missing.length && <div className="calculator-notice"><h3>Still unknown</h3><ul>{ready.missing.map((item) => <li key={item}>{item}</li>)}</ul></div>}
          {!!ready.warnings.length && <div className="calculator-notice"><h3>Assumptions to review</h3><ul>{ready.warnings.map((item) => <li key={item}>{item}</li>)}</ul></div>}
          <details className="calculator-formula" open><summary>How CPP was calculated</summary><p>Cash total = room cost + stay taxes + stay mandatory fees.</p><p>Net cash avoided = cash total − all cash still payable on the award.</p><p>USD CPP = (net cash avoided × USD exchange rate ÷ points spent) × 100.</p><p className="formula-numbers">({formatMoney(ready.cashTotal, form.currency)} − {formatMoney(ready.awardCash, form.currency)}) × {ready.fx ?? 'unknown FX'} ÷ {ready.pointsSpent?.toLocaleString('en-US') ?? 'unknown points'} × 100 = {ready.cpp === null ? 'unavailable' : `${ready.cpp.toFixed(3)} USD cents/point`}.</p>
            {!!ready.freeNightIndices.length && <p>Discounted nights: {ready.freeNightIndices.map((index) => index + 1).join(', ')}. Lowest nightly prices across the whole stay; ties use the earliest night.</p>}
            <p>Personal valuation: {form.valuationCpp || 'unknown'} USD cents/point. Threshold ratios: {form.stronglyCash} / {form.cash} / {form.good} / {form.excellent}.</p><p>Check-in: {form.checkIn || 'unknown'} · {form.nights} nights. Quote observed: {form.observedAt || 'unknown'}.</p><p>Room / guests / inclusions: {form.roomType || 'unknown'}. Cancellation: {form.cancellation || 'unknown'}.</p>
          </details>
        </>}
        <div className="calculator-policy"><h3>Policy & calculation context</h3><p>Policy reviewed {POINTS_POLICY.verifiedAt}. <a href={POINTS_POLICY.terms} target="_blank" rel="noopener noreferrer">Marriott terms §§3.2.f, 3.3.d ↗</a> · <a href={POINTS_POLICY.fifthNightHelp} target="_blank" rel="noopener noreferrer">Stay for 5, Pay for 4 guidance ↗</a></p><p>{POINTS_POLICY.fees}</p><p>For premium rooms or point upgrades, use a final quoted points total and enter any cash due. Availability and special property rules must be confirmed with Marriott.</p><p>Amounts are rounded to the quote currency’s minor unit; CPP uses unrounded arithmetic and is displayed to three decimals.</p><p>This assessment considers your entered costs and personal point value. Points earned on paid stays, credit-card rewards, elite treatment, certificates and trip fit are excluded.</p></div>
      </aside>
    </div>
  </>;
}
