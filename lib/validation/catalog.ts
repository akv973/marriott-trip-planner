import { z } from 'zod';

export const idSchema = z.string().regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
const text = z.string().trim().min(1);
export const dateSchema = z.iso.date();
const optionalDate = dateSchema.nullable().optional();
const country = z.string().regex(/^[A-Z]{2}$/);
export const regionSchema = z.enum(['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania']);
export const urlSchema = z.url().refine((value) => new URL(value).protocol === 'https:', 'Use an HTTPS source URL.');
const officialUrl = urlSchema.refine((value) => {
  const host = new URL(value).hostname;
  return ['marriott.com', 'ritzcarlton.com'].some((domain) => host === domain || host.endsWith(`.${domain}`));
}, 'Official property locator must be on a Marriott domain.');
export const experienceTagSchema = z.enum([
  'safari', 'wildlife', 'beach', 'national-park', 'mountain', 'desert', 'city', 'food',
  'culture', 'spa', 'golf', 'adventure', 'ski', 'remote', 'romantic', 'family', 'bucket-list',
]);
const tags = z.array(experienceTagSchema).refine((values) => new Set(values).size === values.length, 'Duplicate experience tags.');
const year = z.number().int().min(1000).max(2100);
const airport = z.strictObject({
  name: text,
  iataCode: z.string().regex(/^[A-Z]{3}$/).nullable().optional(),
  distanceKm: z.number().nonnegative().nullable().optional(),
});

export const propertySchema = z.strictObject({
  id: idSchema,
  slug: idSchema,
  name: text,
  brandId: idSchema,
  destinationId: idSchema,
  city: text,
  country,
  region: regionSchema,
  propertyType: z.enum(['hotel', 'resort', 'safari-camp', 'safari-lodge', 'lodge']).nullable().optional(),
  officialUrl: officialUrl.nullable().optional(),
  marriottCode: z.string().regex(/^[A-Z0-9]{5}$/).nullable().optional(),
  administrativeArea: text.nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  nearestAirport: airport.nullable().optional(),
  openingYear: year.nullable().optional(),
  renovationYear: year.nullable().optional(),
  roomCount: z.number().int().positive().nullable().optional(),
  isResort: z.boolean().nullable().optional(),
  isDestinationProperty: z.boolean().nullable().optional(),
  experienceTags: tags.nullable().optional(),
}).superRefine((value, ctx) => {
  if ((value.latitude == null) !== (value.longitude == null)) {
    ctx.addIssue({ code: 'custom', path: ['latitude'], message: 'Provide both coordinates or leave both unknown.' });
  }
  if (value.openingYear != null && value.renovationYear != null && value.renovationYear < value.openingYear) {
    ctx.addIssue({ code: 'custom', path: ['renovationYear'], message: 'Renovation cannot predate hotel opening.' });
  }
});

export const brandSchema = z.strictObject({ id: idSchema, slug: idSchema, name: text, sourceIds: z.array(idSchema).min(1) });
export const destinationSchema = z.strictObject({
  id: idSchema, slug: idSchema, name: text, country, region: regionSchema,
  administrativeArea: text.nullable().optional(), sourceIds: z.array(idSchema).min(1),
});
export const sourceTypeSchema = z.enum([
  'marriott-corporate', 'marriott-property-page', 'hotel-official-website', 'official-hotel-communication',
  'government-tourism-authority', 'reputable-third-party', 'traveler-community-report',
]);
export const sourceSchema = z.strictObject({
  id: idSchema, title: text, url: urlSchema, publisher: text, type: sourceTypeSchema,
  accessedAt: dateSchema, notes: text.nullable().optional(),
});

// Each subject carries its own value validator; unknown is explicit null.
const claimBase = {
  id: idSchema, propertyId: idSchema, sourceId: idSchema.nullable(),
  observedAt: optionalDate, validFrom: optionalDate, validTo: optionalDate, lastVerifiedAt: optionalDate,
  confidence: z.enum(['High', 'Medium', 'Low', 'Unverified']),
  conflictStatus: z.enum(['none', 'disputed']), notes: text.nullable().optional(),
};
function claim<S extends string, V extends z.ZodType>(subject: S, value: V) {
  return z.strictObject({ ...claimBase, subject: z.literal(subject), value: value.nullable() });
}
const fields = propertySchema.shape;
export const evidenceClaimSchema = z.discriminatedUnion('subject', [
  claim('name', text), claim('brandId', idSchema), claim('city', text), claim('country', country),
  claim('region', regionSchema), claim('officialUrl', officialUrl), claim('marriottCode', fields.marriottCode.unwrap().unwrap()),
  claim('propertyType', fields.propertyType.unwrap().unwrap()), claim('administrativeArea', text),
  claim('latitude', z.number().min(-90).max(90)), claim('longitude', z.number().min(-180).max(180)),
  claim('nearestAirport', airport), claim('openingYear', year), claim('renovationYear', year),
  claim('roomCount', z.number().int().positive()), claim('isResort', z.boolean()),
  claim('isDestinationProperty', z.boolean()), claim('experienceTags', tags),
  // A listing is not evidence that a hotel is currently operating.
  claim('operatingStatus', z.enum(['open', 'planned', 'temporarily-closed', 'closed'])),
]).superRefine((value, ctx) => {
  if (value.value !== null && value.sourceId === null) {
    ctx.addIssue({ code: 'custom', path: ['sourceId'], message: 'Known factual claims require a source, regardless of confidence.' });
  }
  if (value.confidence !== 'Unverified' && (value.sourceId === null || value.value === null || !value.lastVerifiedAt)) {
    ctx.addIssue({ code: 'custom', path: ['confidence'], message: 'Verified confidence requires a known value, source, and verification date.' });
  }
  if (value.confidence === 'Unverified' && value.lastVerifiedAt) {
    ctx.addIssue({ code: 'custom', path: ['lastVerifiedAt'], message: 'Unverified claims cannot assert verification.' });
  }
  if (!value.observedAt && !value.lastVerifiedAt) {
    ctx.addIssue({ code: 'custom', path: ['observedAt'], message: 'Record an observation or verification date.' });
  }
  if (value.validFrom && value.validTo && value.validFrom > value.validTo) {
    ctx.addIssue({ code: 'custom', path: ['validTo'], message: 'Invalid validity interval.' });
  }
  if (value.observedAt && value.lastVerifiedAt && value.lastVerifiedAt < value.observedAt) {
    ctx.addIssue({ code: 'custom', path: ['lastVerifiedAt'], message: 'Verification cannot predate observation.' });
  }
});

const rating = z.number().min(0).max(10).nullable().optional();
export const editorialAssessmentSchema = z.strictObject({
  id: idSchema, propertyId: idSchema, kind: z.literal('editorial'), author: text,
  hardwareQuality: rating, serviceQuality: rating, locationQuality: rating, uniqueness: rating,
  destinationWorthiness: rating, eliteValuePotential: rating,
  recommendedStayLength: z.strictObject({ minNights: z.number().int().positive(), maxNights: z.number().int().positive() })
    .refine((value) => value.maxNights >= value.minNights).nullable().optional(),
  idealTraveler: z.array(text), strengths: z.array(text), weaknesses: z.array(text),
  rationale: text, reviewedAt: dateSchema, methodologyVersion: text,
});

export const catalogEnvelopeSchema = z.strictObject({
  properties: z.array(z.unknown()), brands: z.array(z.unknown()), destinations: z.array(z.unknown()),
  sources: z.array(z.unknown()), evidenceClaims: z.array(z.unknown()), editorialAssessments: z.array(z.unknown()),
});
export const catalogSchema = z.strictObject({
  properties: z.array(propertySchema), brands: z.array(brandSchema), destinations: z.array(destinationSchema),
  sources: z.array(sourceSchema), evidenceClaims: z.array(evidenceClaimSchema), editorialAssessments: z.array(editorialAssessmentSchema),
});
