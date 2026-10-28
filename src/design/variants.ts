"use client";

import { useSyncExternalStore } from "react";

/*
 * Interaction variants (PRD §8). Each variant is a position on one design
 * question; the config below is the knob set components read from.
 * Placeholder: variants differ only on how much of the AI's mind is shown
 * until the design phase defines them.
 *
 * Dev-only switching: `?variant=b` or the floating switcher. Production
 * always renders SHIPPED_VARIANT unless NEXT_PUBLIC_ENABLE_VARIANTS=true.
 */

export type VariantId = "a" | "b" | "c";

export type VariantConfig = {
  name: string;
  /** How the hypothesis panel (status line + candidates) appears. */
  hypothesis: "always" | "status-only" | "hidden";
};

export const VARIANTS: Record<VariantId, VariantConfig> = {
  a: { name: "A · Glass box", hypothesis: "always" },
  b: { name: "B · Status only", hypothesis: "status-only" },
  c: { name: "C · Minimal", hypothesis: "hidden" },
};

export const SHIPPED_VARIANT: VariantId = "a";

export const variantsEnabled =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_VARIANTS === "true";

const listeners = new Set<() => void>();

function readVariant(): VariantId {
  if (!variantsEnabled) return SHIPPED_VARIANT;
  const param = new URLSearchParams(window.location.search).get("variant");
  return param && param in VARIANTS ? (param as VariantId) : SHIPPED_VARIANT;
}

export function setVariant(id: VariantId): void {
  const url = new URL(window.location.href);
  url.searchParams.set("variant", id);
  window.history.replaceState(null, "", url);
  listeners.forEach((l) => l());
}

export function useVariant(): { id: VariantId; config: VariantConfig } {
  const id = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readVariant,
    () => SHIPPED_VARIANT,
  );
  return { id, config: VARIANTS[id] };
}
