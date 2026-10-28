import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Interaction studies (PRD §8). The `.dev.tsx` extension keeps these routes
 * out of production builds — see pageExtensions in next.config.ts.
 */
export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <nav className="flex gap-4 text-sm text-fg-muted">
        <Link href="/lab" className="font-semibold text-fg">
          Lab
        </Link>
        <Link href="/lab/states">State matrix</Link>
        <Link href="/lab/thinking">Thinking &amp; streaming</Link>
        <Link href="/" className="ml-auto">
          ← Game
        </Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
