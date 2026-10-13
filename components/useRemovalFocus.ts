import { useLayoutEffect, useRef } from 'react';

// The activated removal button disappears. Restore focus after React commits
// the remaining item, or the existing Add control when the list becomes empty.
export function useRemovalFocus() {
  const pendingId = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (pendingId.current === null) return;
    const id = pendingId.current; pendingId.current = null;
    document.getElementById(id)?.focus();
  });
  return (id: string) => { pendingId.current = id; };
}
