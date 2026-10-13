import { z } from 'zod';
import type { Catalog } from '../../types/catalog';
import { profileSchema, emptyProfile } from '../profile/profile';
import { tripSchema } from '../trips/trips';
import { idSchema } from '../validation/catalog';
import { watchlistSchema } from '../watchlist/watchlist';

export const STORAGE_KEY = 'marriott-trip-planner:v1';
export const MAX_IMPORT_BYTES = 5_000_000;
export const workspaceSchema = z.strictObject({ trips: z.array(tripSchema).max(10), activeId: idSchema.nullable(), sequence: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER - 1) }).superRefine((w, ctx) => {
  const ids = w.trips.flatMap((t) => [t.id, ...t.stays.map((s) => s.id)]);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'Trip and stay IDs must be globally unique.' });
  if (w.activeId !== null && !w.trips.some((t) => t.id === w.activeId)) ctx.addIssue({ code: 'custom', message: 'Active trip does not exist.' });
  if (ids.some((id) => /^(trip|stay)-\d+$/.test(id) && Number(id.split('-')[1]) >= w.sequence)) ctx.addIssue({ code: 'custom', message: 'ID sequence would overwrite an existing trip or stay.' });
});
export type TripWorkspace = z.infer<typeof workspaceSchema>;
const legacyPlannerSchema = z.strictObject({ profile: profileSchema, workspace: workspaceSchema });
export const plannerSchema = legacyPlannerSchema.extend({ watchlist: watchlistSchema });
export type PlannerData = z.infer<typeof plannerSchema>;
export const emptyPlanner = (): PlannerData => ({ profile: emptyProfile(), workspace: { trips: [], activeId: null, sequence: 1 }, watchlist: [] });
const envelopeFields = { appId: z.literal('marriott-trip-planner'), exportedAt: z.iso.datetime() };
const legacyExportSchema = z.strictObject({ ...envelopeFields, schemaVersion: z.literal(1), data: legacyPlannerSchema });
export const exportSchema = z.strictObject({ ...envelopeFields, schemaVersion: z.literal(2), data: plannerSchema });
const importSchema = z.discriminatedUnion('schemaVersion', [legacyExportSchema, exportSchema]);
export function validatePlanner(input: unknown, catalog: Catalog) {
  const parsed = plannerSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) };
  const errors: string[] = [];
  const p = parsed.data.profile.preferences;
  for (const id of [...p.preferredBrands, ...p.dislikedBrands]) if (!catalog.brands.some((b) => b.id === id)) errors.push(`Unknown brand: ${id}`);
  for (const id of p.destinationIds) if (!catalog.destinations.some((d) => d.id === id)) errors.push(`Unknown destination: ${id}`);
  for (const trip of parsed.data.workspace.trips) for (const stay of trip.stays) if (!catalog.properties.some((p) => p.id === stay.propertyId)) errors.push(`Unknown property: ${stay.propertyId}`);
  for (const target of parsed.data.watchlist) if (!catalog.properties.some((p) => p.id === target.propertyId)) errors.push(`Unknown watch property: ${target.propertyId}`);
  return errors.length ? { success: false as const, errors } : { success: true as const, data: parsed.data };
}
export function importPlanner(json: string, catalog: Catalog) {
  if (new TextEncoder().encode(json).length > MAX_IMPORT_BYTES) return { success: false as const, errors: ['Import exceeds the 5 MB limit.'] };
  try {
    const envelope = importSchema.safeParse(JSON.parse(json));
    if (!envelope.success) return { success: false as const, errors: ['Unsupported or malformed planner JSON. Schema versions 1 and 2 are supported; no data was replaced.', ...envelope.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)] };
    return validatePlanner(envelope.data.schemaVersion === 1 ? { ...envelope.data.data, watchlist: [] } : envelope.data.data, catalog);
  } catch { return { success: false as const, errors: ['JSON could not be read. No data was replaced.'] }; }
}
export function exportPlanner(data: PlannerData, catalog: Catalog, exportedAt = new Date().toISOString()) {
  const checked = validatePlanner(data, catalog);
  if (!checked.success) throw new Error('Correct invalid drafts before exporting.');
  const json = JSON.stringify(exportSchema.parse({ appId: 'marriott-trip-planner', schemaVersion: 2, exportedAt, data: checked.data }), null, 2);
  if (new TextEncoder().encode(json).length > MAX_IMPORT_BYTES) throw new Error('Planner exceeds the 5 MB backup limit.');
  return json;
}
export type StorageResult = { success: true; data: PlannerData } | { success: false; error: string };
export interface ProfileRepository { load(): StorageResult; save(data: PlannerData, replace?: boolean): { success: boolean; error?: string } }
export class LocalStorageProfileRepository implements ProfileRepository {
  private baseline: string | null = null;
  private blocked = false;
  constructor(private storage: Pick<Storage, 'getItem' | 'setItem'> | null, private catalog: Catalog) {}
  load(): StorageResult {
    try {
      if (!this.storage) throw new Error();
      this.baseline = this.storage.getItem(STORAGE_KEY);
      if (this.baseline === null) return { success: true, data: emptyPlanner() };
      const result = importPlanner(this.baseline, this.catalog);
      if (result.success) return result;
      this.blocked = true;
      return { success: false, error: 'Saved data needs review. It is preserved and will not be overwritten. Import a valid backup or explicitly replace saved data from Profile.' };
    } catch { this.blocked = true; return { success: false, error: 'Browser storage is unavailable. Keep this page open and export a backup; changes are in memory only.' }; }
  }
  save(data: PlannerData, replace = false) {
    const checked = validatePlanner(data, this.catalog);
    if (!checked.success) return { success: false, error: 'Invalid draft is in memory only. Last valid saved data is preserved; correct the inputs to save.' };
    try {
      if (!this.storage) throw new Error();
      if (!replace && (this.blocked || this.storage.getItem(STORAGE_KEY) !== this.baseline)) return { success: false, error: 'Saved data changed in another tab or needs review. Export this page before reloading, or explicitly replace saved data from Profile.' };
      const json = exportPlanner(checked.data, this.catalog);
      this.storage.setItem(STORAGE_KEY, json);
      this.baseline = json; this.blocked = false;
      return { success: true };
    } catch { return { success: false, error: 'Could not save to this browser (storage blocked or full). Changes remain in memory; export a backup.' }; }
  }
}
export function browserRepository(catalog: Catalog) {
  try { return new LocalStorageProfileRepository(window.localStorage, catalog); }
  catch { return new LocalStorageProfileRepository(null, catalog); }
}
