import { z } from 'zod';
import { calculatorSchema } from '../points/calculator';
import { dateSchema, experienceTagSchema, idSchema } from '../validation/catalog';

const ids = z.array(idSchema).max(100).refine((v) => new Set(v).size === v.length, 'Selections must be unique.');
const importance = z.enum(['low', 'medium', 'high']).nullable();
export const STATUSES = ['member', 'silver', 'gold', 'platinum', 'titanium', 'ambassador'] as const;
export const certificateSchema = z.strictObject({
  id: idSchema, label: z.string().max(200), points: z.number().int().positive().max(1e9).nullable(),
  expiresOn: dateSchema.nullable(), notes: z.string().max(2000),
});
export const profileSchema = z.strictObject({
  status: z.enum(STATUSES).nullable(), balance: calculatorSchema.shape.balance,
  valuationCpp: calculatorSchema.shape.valuationCpp,
  certificates: z.array(certificateSchema).max(50),
  preferences: z.strictObject({
    preferredBrands: ids, dislikedBrands: ids, destinationIds: ids,
    tripTypes: z.array(experienceTagSchema).max(17).refine((v) => new Set(v).size === v.length, 'Trip types must be unique.'),
    typicalNights: z.number().int().min(1).max(60).nullable(), luxuryLevel: importance,
    cashSensitivity: importance, hotelChanges: z.enum(['avoid', 'willing']).nullable(),
    loungeImportance: importance, suiteImportance: importance,
  }),
}).superRefine((p, ctx) => {
  if (new Set(p.certificates.map((c) => c.id)).size !== p.certificates.length) ctx.addIssue({ code: 'custom', path: ['certificates'], message: 'Certificate IDs must be unique.' });
  if (p.preferences.preferredBrands.some((id) => p.preferences.dislikedBrands.includes(id))) ctx.addIssue({ code: 'custom', path: ['preferences'], message: 'A brand cannot be both preferred and disliked.' });
});
export type UserProfile = z.infer<typeof profileSchema>;
export type Certificate = z.infer<typeof certificateSchema>;
export const emptyProfile = (): UserProfile => ({ status: null, balance: null, valuationCpp: null, certificates: [], preferences: { preferredBrands: [], dislikedBrands: [], destinationIds: [], tripTypes: [], typicalNights: null, luxuryLevel: null, cashSensitivity: null, hotelChanges: null, loungeImportance: null, suiteImportance: null } });
export const CERTIFICATE_POLICY = { version: 'marriott-fna-2026-10-12', verifiedAt: '2026-10-12', maxTopOff: 25000, terms: 'https://www.marriott.com/loyalty/terms/default.mi', help: 'https://help.marriott.com/s/article/marriott-free-night-award' } as const;
export const certificateRequestSchema = z.strictObject({ certificate: certificateSchema.nullable(), nightPoints: calculatorSchema.shape.awardPoints, stayDate: dateSchema.nullable(), eligibility: z.enum(['unknown', 'eligible', 'ineligible']), asOf: dateSchema });
export function assessCertificate(input: unknown) {
  const parsed = certificateRequestSchema.safeParse(input);
  if (!parsed.success) return { state: 'invalid' as const, topOff: null, unusedValue: null, reasons: parsed.error.issues.map((i) => i.message), policyVersion: CERTIFICATE_POLICY.version };
  const { certificate: c, nightPoints, stayDate, eligibility, asOf } = parsed.data;
  const reasons: string[] = [];
  if (eligibility === 'ineligible') reasons.push('This night is not eligible for a Free Night Award.');
  if (c?.expiresOn && c.expiresOn < asOf) reasons.push('Certificate has expired as of the assessment date.');
  if (c?.expiresOn && stayDate && stayDate > c.expiresOn) reasons.push('The planned night is after certificate expiry.');
  if (c?.points != null && nightPoints !== null && nightPoints > c.points + CERTIFICATE_POLICY.maxTopOff) reasons.push('The night exceeds certificate value plus the 25,000-point top-off limit.');
  if (reasons.length) return { state: 'ineligible' as const, topOff: null, unusedValue: null, reasons, policyVersion: CERTIFICATE_POLICY.version };
  if (!c) reasons.push('Select a certificate.');
  if (c?.points == null) reasons.push('Certificate points value is unknown.');
  if (c?.expiresOn == null) reasons.push('Certificate expiry is unknown.');
  if (stayDate === null) reasons.push('Planned night date is unknown.');
  if (nightPoints === null) reasons.push('Standard-room night points are unknown.');
  if (eligibility === 'unknown') reasons.push('Confirm an eligible standard-room Standard/PointSavers award, member presence and property participation.');
  if (reasons.length) return { state: 'unknown' as const, topOff: null, unusedValue: null, reasons, policyVersion: CERTIFICATE_POLICY.version };
  return { state: 'eligible' as const, topOff: Math.max(0, nightPoints! - c!.points!), unusedValue: Math.max(0, c!.points! - nightPoints!), reasons: ['Planning eligibility only; Marriott availability and acceptance are not verified. Unused certificate value is forfeited.'], policyVersion: CERTIFICATE_POLICY.version };
}
