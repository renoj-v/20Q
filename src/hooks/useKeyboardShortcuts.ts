"use client";

import { useEffect, useRef } from "react";

/**
 * Single-key shortcuts (NFR-2). Ignored while typing in a field or when a
 * modifier is held, so they never fight the browser or assistive tech.
 */
export function useKeyboardShortcuts(handlers: Partial<Record<string, () => void>>, enabled = true) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const handler = handlersRef.current[e.key.toLowerCase()];
      if (handler) {
        e.preventDefault();
        handler();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
