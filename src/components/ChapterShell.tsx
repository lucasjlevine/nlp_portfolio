import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";

type Props = {
  id: string;
  num: number;
  tag: string;
  title: string;
  children: ReactNode;
};

export function ChapterShell({ id, num, tag, title, children }: Props) {
  return (
    <section
      id={id}
      className="relative scroll-mt-[2.75rem]"
      aria-labelledby={`${id}-title`}
    >
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="story-beat story-beat--title">
          <header className="story-beat-inner max-w-3xl">
            <div className="mono mb-4 text-[0.72rem] tracking-[0.14em] text-[var(--nebula)] uppercase">
              Project {num} · {tag}
            </div>
            <h2
              id={`${id}-title`}
              className="display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.08] text-[var(--star)]"
            >
              {title}
            </h2>
          </header>
        </Reveal>
        <div className="story-arc">{children}</div>
      </div>
    </section>
  );
}
