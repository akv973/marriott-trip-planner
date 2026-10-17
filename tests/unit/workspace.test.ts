import { describe, expect, it } from 'vitest';
import { addPropertyToTrip, addWorkspaceStay, addWorkspaceTrip } from '../../lib/trips/workspace';
import { createStay, createTrip } from '../../lib/trips/trips';
import { emptyPlanner, exportPlanner, importPlanner } from '../../lib/storage/planner';
import { loadFoundation } from '../../lib/catalog/foundation';
import legacy from '../fixtures/planner-stage-7-v1.json';
const catalogResult = loadFoundation();
if (!catalogResult.success) throw new Error('Invalid catalog');
const catalog = catalogResult.data;
const property = 'property-mapito';
const profile = () => emptyPlanner().profile;
const workspace = () => emptyPlanner().workspace;

describe('shared manual workspace additions', () => {
  it('atomically creates a named trip and first stay with existing defaults and safe sequential IDs', () => {
    const original = workspace(); const before = structuredClone(original);
    const result = addPropertyToTrip(original, property, null, profile(), 'Safari');
    expect(result).toMatchObject({ success: true, id: 'stay-2', tripId: 'trip-1', workspace: { activeId: 'trip-1', sequence: 3 } });
    if (!result.success) throw new Error(result.error);
    expect(result.workspace.trips[0]).toEqual({ ...createTrip('trip-1'), name: 'Safari', balance: null, valuationCpp: null, profileDefaults: { balance: true, valuationCpp: true }, stays: [createStay('stay-2', property)] });
    expect(original).toEqual(before);
  });
  it('appends to the chosen inactive trip, preserving old quotes and all other trips', () => {
    const original = { trips: [{ ...createTrip('trip-1'), stays: [{ ...createStay('stay-2', property), notes: 'keep', pricing: { ...createStay('stay-2', property).pricing, cashRoom: 0, awardPoints: 88000 } }] }, createTrip('trip-3')], activeId: 'trip-3', sequence: 4 };
    const result = addPropertyToTrip(original, property, 'trip-1', profile());
    if (!result.success) throw new Error(result.error);
    expect(result.workspace.activeId).toBe('trip-1'); expect(result.workspace.trips[1]).toEqual(original.trips[1]); expect(result.workspace.trips[0]!.stays[0]).toEqual(original.trips[0]!.stays[0]);
    expect(result.workspace.trips[0]!.stays[1]).toEqual(createStay('stay-4', property));
  });
  it('allows deliberate repeat stays with unique identities and independent blank prices', () => {
    const first = addPropertyToTrip(workspace(), property, null, profile()); if (!first.success) throw new Error(first.error);
    const second = addPropertyToTrip(first.workspace, property, first.tripId, profile()); if (!second.success) throw new Error(second.error);
    expect(second.workspace.trips[0]!.stays.map(s => s.id)).toEqual(['stay-2', 'stay-3']);
    expect(second.workspace.trips[0]!.stays[0]!.pricing).not.toBe(second.workspace.trips[0]!.stays[1]!.pricing);
  });
  it('respects the 10-trip and 30-stay limits while allowing additions to another trip', () => {
    const full = { trips: Array.from({ length: 10 }, (_, i) => createTrip(`trip-${i + 1}`)), activeId: 'trip-1', sequence: 11 };
    full.trips[0]!.stays = Array.from({ length: 30 }, (_, i) => createStay(`stay-${i + 11}`, property)); full.sequence = 41;
    const before = structuredClone(full);
    expect(addPropertyToTrip(full, property, null, profile())).toMatchObject({ success: false, error: expect.stringContaining('10-trip limit') });
    expect(addWorkspaceStay(full, 'trip-1', property)).toMatchObject({ success: false, error: expect.stringContaining('30-stay limit') });
    expect(addPropertyToTrip(full, property, 'trip-2', profile()).success).toBe(true); expect(full).toEqual(before);
  });
  it('rejects missing trips, invalid names/drafts, ID collisions and exhausted sequences without mutation', () => {
    expect(addWorkspaceStay(workspace(), 'missing', property).success).toBe(false);
    expect(addWorkspaceTrip(workspace(), profile(), '   ').success).toBe(false);
    for (const w of [
      { trips: [createTrip('trip-1')], activeId: 'trip-1', sequence: 1 },
      { trips: [{ ...createTrip('trip-1'), name: '' }], activeId: 'trip-1', sequence: 2 },
      { ...workspace(), sequence: Number.MAX_SAFE_INTEGER - 2 },
    ]) {
      const before = structuredClone(w); expect(addPropertyToTrip(w, property, null, profile()).success).toBe(false); expect(w).toEqual(before);
    }
  });
  it('reconstructs new additions exactly through v2 export after importing a genuine v1 planner', () => {
    const imported = importPlanner(JSON.stringify(legacy), catalog); if (!imported.success) throw new Error('Import failed');
    const result = addPropertyToTrip(imported.data.workspace, property, null, imported.data.profile, 'New trip'); if (!result.success) throw new Error(result.error);
    const data = { ...imported.data, workspace: result.workspace };
    expect(importPlanner(exportPlanner(data, catalog), catalog)).toEqual({ success: true, data });
    expect(data.workspace.trips.slice(0, -1)).toEqual(legacy.data.workspace.trips); expect(data.profile).toEqual(legacy.data.profile);
  });
});
