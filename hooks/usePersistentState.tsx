'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Like useState, but persists the value in sessionStorage under `key`.
 *
 * Used to keep UI view state (active tabs, search terms, filters, sorting)
 * alive when the user navigates into a detail view and back: the list page
 * remounts fresh, but the stored value is read straight back from
 * sessionStorage. State lives for as long as the browser tab is open and is
 * cleared when it closes.
 *
 * Backed by useSyncExternalStore so that server rendering and hydration use the
 * default value (no hydration mismatch), while the client reads the persisted
 * value immediately after. Use a stable, page-scoped key, e.g. "schueler:tab".
 */

// Per-key subscribers, notified when we write to storage in the same tab
// (the native "storage" event only fires for *other* tabs).
const listeners = new Map<string, Set<() => void>>();

// Cache the parsed snapshot per key so getSnapshot returns a referentially
// stable value while the underlying raw string is unchanged (required by
// useSyncExternalStore to avoid infinite re-render loops).
const snapshots = new Map<string, { raw: string | null; value: unknown }>();

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(onStoreChange);

      const onStorage = (e: StorageEvent) => {
        if (e.key === key) {
          snapshots.delete(key);
          onStoreChange();
        }
      };
      window.addEventListener('storage', onStorage);

      return () => {
        set?.delete(onStoreChange);
        window.removeEventListener('storage', onStorage);
      };
    },
    [key]
  );

  const getSnapshot = useCallback((): T => {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(key);
    } catch {
      // Storage unavailable — fall back to the default.
    }

    const cached = snapshots.get(key);
    if (cached && cached.raw === raw) {
      return cached.value as T;
    }

    let value = defaultValue;
    if (raw !== null) {
      try {
        value = JSON.parse(raw) as T;
      } catch {
        value = defaultValue;
      }
    }
    snapshots.set(key, { raw, value });
    return value;
  }, [key, defaultValue]);

  // Server render and hydration use the default, matching the server HTML.
  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (next) => {
      let current = defaultValue;
      try {
        const raw = sessionStorage.getItem(key);
        if (raw !== null) current = JSON.parse(raw) as T;
      } catch {
        // Keep the default as the basis for the update.
      }

      const resolved =
        typeof next === 'function' ? (next as (prev: T) => T)(current) : next;

      try {
        sessionStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Ignore storage write failures (e.g. private mode quota).
      }
      snapshots.delete(key);
      notify(key);
    },
    [key, defaultValue]
  );

  return [value, setValue];
}
