import type { UserProfile } from '../profile/profile';
import { workspaceSchema } from '../storage/planner';
import type { TripWorkspace } from '../storage/planner';
import { createStay, createTrip } from './trips';

export const MAX_TRIPS = 10;
export const MAX_STAYS = 30;

// Share the Trip Builder's constructors, profile inheritance and monotonic IDs.
export function addWorkspaceTrip(workspace: TripWorkspace, profile?: UserProfile, name = 'Untitled trip') {
  if (workspace.trips.length >= MAX_TRIPS) return { success: false as const, error: 'The 10-trip limit has been reached. Choose an existing trip or remove a trip in Trip Builder.' };
  const id = `trip-${workspace.sequence}`;
  const trip = { ...createTrip(id), name, ...(profile ? { balance: null, valuationCpp: null, profileDefaults: { balance: true, valuationCpp: true } } : {}) };
  return checked({ trips: [...workspace.trips, trip], activeId: id, sequence: workspace.sequence + 1 }, id);
}

export function addWorkspaceStay(workspace: TripWorkspace, tripId: string, propertyId: string) {
  const trip = workspace.trips.find((entry) => entry.id === tripId);
  if (!trip) return { success: false as const, error: 'Choose an existing trip.' };
  if (trip.stays.length >= MAX_STAYS) return { success: false as const, error: 'This trip has reached the 30-stay limit. Choose another trip or remove a stay in Trip Builder.' };
  const id = `stay-${workspace.sequence}`;
  return checked({ ...workspace, activeId: tripId, sequence: workspace.sequence + 1, trips: workspace.trips.map((entry) => entry.id === tripId ? { ...entry, stays: [...entry.stays, createStay(id, propertyId)] } : entry) }, id);
}

function checked(workspace: TripWorkspace, id: string) {
  if (!workspaceSchema.safeParse(workspace).success) return { success: false as const, error: 'Correct invalid trip drafts in Trip Builder before adding a trip or stay. The ID sequence must also have room for a new entry.' };
  return { success: true as const, workspace, id };
}

// A new trip and its first stay are one in-memory and persistence operation.
export function addPropertyToTrip(workspace: TripWorkspace, propertyId: string, tripId: string | null, profile: UserProfile, name?: string) {
  const target = tripId === null ? addWorkspaceTrip(workspace, profile, name) : { success: true as const, workspace, id: tripId };
  if (!target.success) return target;
  const added = addWorkspaceStay(target.workspace, target.id, propertyId);
  return added.success ? { ...added, tripId: target.id } : added;
}
