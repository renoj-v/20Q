import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:opacity-90",
  secondary: "border border-border-strong bg-surface text-fg hover:bg-surface-sunken",
  ghost: "text-fg-muted hover:bg-surface-sunken hover:text-fg",
};

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  /** Keyboard shortcut hint shown as a key cap (the shortcut itself is wired elsewhere). */
  shortcut?: string;
};

export function Button({ variant = "secondary", shortcut, className = "", children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      aria-keyshortcuts={shortcut}
      {...props}
    >
      {children}
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      aria-hidden
      className="hidden rounded border border-current/30 px-1.5 font-mono text-[11px] leading-5 opacity-70 sm:inline-block"
    >
      {children}
    </kbd>
  );
}
