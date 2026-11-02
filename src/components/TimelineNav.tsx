"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SiteMeta } from "@/lib/types";

export function TimelineNav({ chapters }: { chapters: SiteMeta["chapters"] }) {
  const [active, setActive] = useState<string>("open");
  const activeChapter = chapters.find((c) => c.id === active) ?? null;

  useEffect(() => {
    const ids = ["open", "curator", ...chapters.map((c) => c.id), "close"];

    const update = () => {
      const probe = window.innerHeight * 0.32;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= probe && rect.bottom > probe) {
          current = id;
          break;
        }
      }
      setActive((prev) => (prev === current ? prev : current));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [chapters]);

  return (
    <AnimatePresence initial={false}>
      {activeChapter ? (
        <motion.div
          key={activeChapter.id}
          role="status"
          aria-live="polite"
          aria-label={`Viewing project ${activeChapter.num}`}
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="project-sticky fixed top-0 inset-x-0 z-40 border-b border-[var(--line)] bg-[rgba(5,8,20,0.78)] backdrop-blur-xl"
        >
          <div className="mx-auto flex max-w-6xl items-baseline gap-2 px-4 py-2.5">
            <span className="mono shrink-0 text-[0.68rem] tracking-[0.12em] text-[var(--nebula)] uppercase">
              Project {activeChapter.num} · {activeChapter.tag}
            </span>
            <span className="display truncate text-[0.95rem] text-[var(--star)]">
              {activeChapter.title}
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
