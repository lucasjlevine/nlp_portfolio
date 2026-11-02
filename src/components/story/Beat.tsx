"use client";

import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/cn";

export type BeatKind =
  | "corpus"
  | "question"
  | "evidence"
  | "figure"
  | "explore"
  | "finding"
  | "changed"
  | "bridge";

const LABELS: Record<BeatKind, string> = {
  corpus: "The data",
  question: "The question",
  evidence: "What I looked at",
  figure: "The figure",
  explore: "Explore",
  finding: "What I found",
  changed: "What I changed",
  bridge: "Next",
};

export function Beat({
  kind,
  children,
  className,
  narrow = false,
  tall = false,
  /** Large, centered speakable moment (question, quote, finding) */
  focus = false,
}: {
  kind: BeatKind;
  children: ReactNode;
  className?: string;
  narrow?: boolean;
  tall?: boolean;
  focus?: boolean;
}) {
  return (
    <Reveal
      className={cn(
        "story-beat",
        tall && "story-beat--tall",
        focus && "story-beat--focus",
        className,
      )}
    >
      <div
        className={cn(
          "story-beat-inner",
          narrow || focus ? "max-w-2xl" : "w-full",
          focus && "mx-auto",
        )}
      >
        <p className="beat-label">{LABELS[kind]}</p>
        {children}
      </div>
    </Reveal>
  );
}

export function CorpusContinuity({ children }: { children: ReactNode }) {
  return (
    <Reveal className="story-beat story-beat--focus">
      <div className="story-beat-inner mx-auto max-w-2xl">
        <p className="beat-label">Still the same corpus</p>
        <p className="story-question story-question--soft">{children}</p>
      </div>
    </Reveal>
  );
}

export function ChapterClose({
  finding,
  bridge,
}: {
  finding: string;
  bridge: string;
  /** Kept optional so callers can still pass it without rendering */
  whatChanged?: string;
}) {
  return (
    <>
      <Beat kind="finding" focus>
        <p className="finding">{finding}</p>
      </Beat>
      <Beat kind="bridge" focus>
        <p className="bridge">{bridge}</p>
      </Beat>
    </>
  );
}
