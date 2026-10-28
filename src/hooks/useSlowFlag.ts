"use client";

import { useEffect, useState } from "react";
import { timing } from "@/design/motion";

/** FR-14: true once `active` has stayed true for longer than `afterMs`. */
export function useSlowFlag(active: boolean, afterMs: number = timing.slowThinkingMs): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setSlow(true), afterMs);
    return () => {
      clearTimeout(id);
      setSlow(false);
    };
  }, [active, afterMs]);
  return active && slow;
}
