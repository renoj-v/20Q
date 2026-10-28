"use client";

import { VARIANTS, setVariant, useVariant, variantsEnabled, type VariantId } from "@/design/variants";

/** Dev-only variant switcher (PRD §8). Never rendered on the live site. */
export function VariantSwitcher() {
  const { id } = useVariant();
  if (!variantsEnabled) return null;

  return (
    <div className="fixed right-3 bottom-3 z-50 flex items-center gap-1 rounded-pill border border-border bg-surface-raised p-1 text-xs shadow-lg">
      <span className="px-2 text-fg-muted">Variant</span>
      {(Object.keys(VARIANTS) as VariantId[]).map((v) => (
        <button
          key={v}
          type="button"
          title={VARIANTS[v].name}
          aria-pressed={v === id}
          onClick={() => setVariant(v)}
          className={`size-7 rounded-pill font-medium uppercase ${v === id ? "bg-accent text-accent-fg" : "hover:bg-surface-sunken"}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
