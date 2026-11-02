"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Keeps prior context visible while later beats scroll.
 * Desktop: sticky left/right rail. Mobile: sticky top strip.
 */
export function StickyContext({
  rail,
  children,
  side = "left",
  className,
}: {
  rail: ReactNode;
  children: ReactNode;
  side?: "left" | "right";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky-context",
        side === "right" ? "sticky-context--right" : "sticky-context--left",
        className,
      )}
    >
      <aside className="sticky-context-rail" aria-label="Context from earlier">
        {rail}
      </aside>
      <div className="sticky-context-main">{children}</div>
    </div>
  );
}

export function ContextCard({
  label,
  children,
  active = false,
}: {
  label?: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <div className={cn("context-card", active && "context-card--active")}>
      {label ? <div className="context-card-label">{label}</div> : null}
      <div className="context-card-body">{children}</div>
    </div>
  );
}
