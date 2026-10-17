import { useEffect, useRef, useState } from 'react';
import type { Property } from '../types/catalog';
import type { TripWorkspace } from '../lib/storage/planner';
import { MAX_STAYS, MAX_TRIPS } from '../lib/trips/workspace';

export type AddToTripProps = { onAddToTrip?: ((property: Property, trigger: HTMLButtonElement) => void) | undefined };
export function AddToTripControl({ property, onAddToTrip }: AddToTripProps & { property: Property }) {
  return onAddToTrip ? <button className="text-button" aria-label={`Add to trip: ${property.name}`} onClick={(event) => onAddToTrip(property, event.currentTarget)}>Add to trip <span aria-hidden="true">→</span></button> : null;
}

export function AddToTripDialog({ property, workspace, onCancel, onConfirm }: {
  property: Property; workspace: TripWorkspace; onCancel: () => void;
  onConfirm: (tripId: string | null, name: string) => string | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const destination = useRef<HTMLSelectElement>(null);
  const submitted = useRef(false);
  const available = workspace.trips.filter((trip) => trip.stays.length < MAX_STAYS);
  const [target, setTarget] = useState(available.find((trip) => trip.id === workspace.activeId)?.id ?? available[0]?.id ?? '');
  const [name, setName] = useState('Untitled trip');
  const [error, setError] = useState('');
  const newTrip = target === '';
  const blocked = newTrip ? workspace.trips.length >= MAX_TRIPS : !available.some((trip) => trip.id === target);
  useEffect(() => { dialog.current?.showModal(); destination.current?.focus(); }, []);
  const cancel = () => { dialog.current?.close(); onCancel(); };
  return <dialog ref={dialog} className="add-trip-dialog" aria-labelledby="add-trip-title" aria-describedby="add-trip-description" onCancel={(event) => { event.preventDefault(); cancel(); }}>
    <form onSubmit={(event) => {
      event.preventDefault();
      if (submitted.current || blocked) return;
      submitted.current = true;
      const failure = onConfirm(newTrip ? null : target, name.trim());
      if (failure) { submitted.current = false; setError(failure); }
    }}>
      <p className="eyebrow">Plan a hotel stay</p><h2 id="add-trip-title">Add to trip</h2><p className="add-trip-property">{property.name}</p>
      <p id="add-trip-description">Choose a trip or create one. Prices stay unknown until you enter them. This adds a separate idea for a stay; availability and bookings are not checked.</p>
      <label className="calculator-field">Destination trip<select ref={destination} value={target} onChange={(event) => { setTarget(event.target.value); setError(''); }}>
        {workspace.trips.map((trip) => <option key={trip.id} value={trip.id} disabled={trip.stays.length >= MAX_STAYS}>{trip.name} · {trip.stays.length}/30 stays{trip.stays.length >= MAX_STAYS ? ' · full' : ''}</option>)}
        <option value="" disabled={workspace.trips.length >= MAX_TRIPS}>Create a new trip{workspace.trips.length >= MAX_TRIPS ? ' · 10-trip limit reached' : ''}</option>
      </select></label>
      {newTrip && <label className="calculator-field">New trip name<input required maxLength={200} value={name} onChange={(event) => setName(event.target.value)} /></label>}
      {blocked && <p role="status">No room for this stay. Trips allow up to 30 stays and the planner allows 10 trips. Remove a stay or trip in Trip Builder, then try again.</p>}
      {error && <p role="alert">{error}</p>}
      <div className="trip-actions"><button className="primary-button" type="submit" disabled={blocked || (newTrip && !name.trim())}>Add stay and open trip</button><button className="text-button" type="button" onClick={cancel}>Cancel</button></div>
    </form>
  </dialog>;
}
