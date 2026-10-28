"use client";

import { useSyncExternalStore } from "react";

/*
 * FR-28: the API key lives in sessionStorage only — cleared when the tab
 * closes, never sent anywhere but the Claude API, never logged.
 */

const KEY = "20q.claudeApiKey";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Pass a key to store it, or null to forget it. */
export function setApiKey(apiKey: string | null): void {
  try {
    if (apiKey) sessionStorage.setItem(KEY, apiKey);
    else sessionStorage.removeItem(KEY);
  } catch {
    // Storage unavailable (private mode): the key just won't survive a reload.
  }
  listeners.forEach((l) => l());
}

export function useApiKey(): string | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => null,
  );
}
