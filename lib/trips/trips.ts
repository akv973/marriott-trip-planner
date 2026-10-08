import { z } from 'zod';
import type { Catalog } from '../../types/catalog';
import { dateSchema, idSchema } from '../validation/catalog';
import { calculatePoints, calculatorSchema, DEFAULT_THRESHOLDS, fractionDigits } from '../points/calculator';

const text = z.string().max(2000);
const q = calculatorSchema.shape;
// Stay pricing is independent of trip-level balance and personal valuation.
export const tripPricingSchema = z.strictObject({
  nights: q.nights, currency: q.currency, cashBasis: q.cashBasis, cashRoom: q.cashRoom,
  cashTaxes: q.cashTaxes, cashFees: q.cashFees, awardCash: q.awardCash,
  awardBasis: q.awardBasis, awardPoints: q.awardPoints, nightlyPoints: q.nightlyPoints,
  fifthNight: q.fifthNight, comparable: q.comparable, usdPerCurrency: q.usdPerCurrency,
});
export const tripStaySchema = z.strictObject({
  id: idSchema, propertyId: idSchema, checkIn: dateSchema.nullable(),
  bookingMethod: z.enum(['cash', 'points']), reservationStatus: z.enum(['idea', 'planned', 'reserved']),
  notes: text, observedAt: dateSchema.nullable(), roomType: text, cancellation: text,
  pricing: tripPricingSchema,
}).superRefine((stay, ctx) => {
  if (stay.checkIn && !dateSchema.safeParse(checkout(stay.checkIn, stay.pricing.nights)).success) ctx.addIssue({ code: 'custom', path: ['checkIn'], message: 'Derived check-out must be a supported calendar date.' });
});
export const tripSchema = z.strictObject({
  id: idSchema, name: z.string().trim().min(1).max(200), destination: text,
  travelWindow: text, travelers: z.number().int().min(1).max(100).nullable(), notes: text,
  balance: q.balance, valuationCpp: q.valuationCpp, stays: z.array(tripStaySchema).max(30),
}).superRefine((trip, ctx) => {
  if (new Set(trip.stays.map((stay) => stay.id)).size !== trip.stays.length) ctx.addIssue({ code: 'custom', path: ['stays'], message: 'Stay IDs must be unique.' });
});
export type Trip = z.infer<typeof tripSchema>;
export type TripStay = z.infer<typeof tripStaySchema>;
export const TRIP_VERSION = 'trip-totals-1';
export const EMPTY_PRICING: TripStay['pricing'] = {
  nights: 1, currency: 'USD', cashBasis: 'nightly', cashRoom: null, cashTaxes: null, cashFees: null,
  awardCash: null, awardBasis: 'total', awardPoints: null, nightlyPoints: [], fifthNight: 'unknown',
  comparable: 'unknown', usdPerCurrency: null,
};
export const createTrip = (id: string): Trip => ({ id, name: 'Untitled trip', destination: '', travelWindow: '', travelers: null, notes: '', balance: null, valuationCpp: 0.8, stays: [] });
export const createStay = (id: string, propertyId: string): TripStay => ({ id, propertyId, checkIn: null, bookingMethod: 'cash', reservationStatus: 'idea', notes: '', observedAt: null, roomType: '', cancellation: '', pricing: { ...EMPTY_PRICING, nightlyPoints: [] } });

export function checkout(checkIn: string | null, nights: number) {
  if (checkIn === null || !dateSchema.safeParse(checkIn).success || !Number.isInteger(nights) || nights < 1 || nights > 60) return null;
  const date = new Date(`${checkIn}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + nights);
  const result = date.toISOString().slice(0, 10);
  return dateSchema.safeParse(result).success ? result : null;
}
const sum = (values: (number | null)[]) => {
  const known = values.filter((value): value is number => value !== null);
  return { total: known.length === values.length ? known.reduce((a, b) => a + b, 0) : null, knownSubtotal: known.reduce((a, b) => a + b, 0), missingCount: values.length - known.length };
};
const round = (value: number, currency: string) => Math.round((value + Number.EPSILON) * 10 ** fractionDigits(currency)) / 10 ** fractionDigits(currency);

export function calculateTrip(input: unknown, catalog: Catalog, asOf: string) {
  const parsed = tripSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, errors: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'Trip'}: ${issue.message}`) };
  const trip = parsed.data;
  const errors: string[] = [];
  const stays = trip.stays.flatMap((stay, index) => {
    const property = catalog.properties.find((record) => record.id === stay.propertyId);
    if (!property) { errors.push(`Stay ${index + 1}: property is unavailable in the catalog.`); return []; }
    const economics = calculatePoints({ ...stay.pricing, balance: null, valuationCpp: trip.valuationCpp, thresholds: DEFAULT_THRESHOLDS });
    if (!economics.success) { errors.push(...economics.errors.map((error) => `Stay ${index + 1}: ${error}`)); return []; }
    const selectedCash = stay.bookingMethod === 'cash' ? economics.cashTotal : economics.awardCash;
    const selectedPoints = stay.bookingMethod === 'cash' ? 0 : economics.pointsSpent;
    const missing: string[] = [];
    if (selectedCash === null) missing.push(stay.bookingMethod === 'cash' ? 'Cash room price, taxes or mandatory fees' : 'Cash payable on award');
    if (selectedPoints === null) missing.push('Award points price or discount eligibility');
    if (economics.fx === null) missing.push('Manual USD exchange rate');
    const warnings = [...economics.warnings];
    if (stay.checkIn === null) warnings.push('Stay dates unknown; availability is not checked.');
    if (stay.observedAt === null) warnings.push('Quote observation date unknown.');
    else if (stay.observedAt > asOf) warnings.push('Quote observation date is in the future; review your entry.');
    else if (Date.parse(`${asOf}T00:00:00Z`) - Date.parse(`${stay.observedAt}T00:00:00Z`) > 30 * 86400000) warnings.push('Manual quote is over 30 days old; reconfirm pricing.');
    return [{ stay, propertyId: property.id, propertyName: property.name, checkOut: checkout(stay.checkIn, stay.pricing.nights), economics, selectedCash, selectedPoints, cashUsd: selectedCash === null || economics.fx === null ? null : selectedCash * economics.fx, missing, warnings }];
  });
  if (errors.length) return { success: false as const, errors };
  const cashByCurrency = [...new Set(stays.map((entry) => entry.stay.pricing.currency))].sort().map((currency) => {
    const group = sum(stays.filter((entry) => entry.stay.pricing.currency === currency).map((entry) => entry.selectedCash));
    return { currency, ...group, total: group.total === null ? null : round(group.total, currency), knownSubtotal: round(group.knownSubtotal, currency) };
  });
  const points = sum(stays.map((entry) => entry.selectedPoints));
  const usd = sum(stays.map((entry) => entry.cashUsd));
  const cashUsd = { ...usd, total: usd.total === null ? null : round(usd.total, 'USD'), knownSubtotal: round(usd.knownSubtotal, 'USD') };
  const awards = stays.filter((entry) => entry.stay.bookingMethod === 'points');
  const avoided = sum(awards.map((entry) => entry.economics.netCashAvoided === null || entry.economics.fx === null ? null : entry.economics.netCashAvoided * entry.economics.fx));
  const redemptionCpp = !awards.length || points.total === null || points.total === 0 || avoided.total === null || awards.some((entry) => entry.stay.pricing.comparable !== 'same') ? null : avoided.total * 100 / points.total;
  const warnings: string[] = [];
  for (let i = 1; i < stays.length; i++) {
    const prior = stays[i - 1]!; const next = stays[i]!;
    if (prior.checkOut && next.stay.checkIn) {
      if (next.stay.checkIn < prior.checkOut) warnings.push(`Stays ${i} and ${i + 1} overlap or are out of itinerary order; review dates.`);
      if (next.stay.checkIn > prior.checkOut) warnings.push(`There is a gap between stays ${i} and ${i + 1}; transport or other accommodation is excluded.`);
    } else warnings.push(`Chronology between stays ${i} and ${i + 1} is unknown.`);
  }
  const shortfall = trip.balance === null ? null : points.total !== null ? Math.max(0, points.total - trip.balance) : points.knownSubtotal > trip.balance ? points.knownSubtotal - trip.balance : null;
  const remainingPoints = trip.balance === null || points.total === null || points.total > trip.balance ? null : trip.balance - points.total;
  if (shortfall !== null && shortfall > 0) warnings.push(`${points.total === null ? 'At least ' : ''}${shortfall.toLocaleString('en-US')} points short; no purchase or transfer is assumed.`);
  return { success: true as const, version: TRIP_VERSION, assessedAt: asOf, trip, stays, nights: stays.reduce((total, entry) => total + entry.stay.pricing.nights, 0), hotelChanges: stays.slice(1).filter((entry, index) => entry.propertyId !== stays[index]!.propertyId).length, points, cashByCurrency, cashUsd, redemptionCpp, netCashAvoidedUsd: awards.length ? avoided.total : null, remainingPoints, shortfall, economicCostUsd: cashUsd.total === null || points.total === null || trip.valuationCpp === null ? null : cashUsd.total + points.total * trip.valuationCpp / 100, warnings };
}
