const listeners = new Set<() => void>();

/** Subscribe to near-vision history invalidation events. */
export function subscribeNearVisionHistoryInvalidation(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notify subscribers that near-vision history should be reloaded. */
export function invalidateNearVisionHistory(): void {
  for (const listener of listeners) listener();
}
