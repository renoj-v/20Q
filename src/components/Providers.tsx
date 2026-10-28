"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** NFR-3: Motion animations respect prefers-reduced-motion everywhere. */
export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
