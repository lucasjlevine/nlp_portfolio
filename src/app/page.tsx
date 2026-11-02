import { TimelineNav } from "@/components/TimelineNav";
import { Starfield } from "@/components/Starfield";
import { Hw1Chapter } from "@/components/chapters/Hw1Chapter";
import { Hw2Chapter } from "@/components/chapters/Hw2Chapter";
import { Hw3Chapter } from "@/components/chapters/Hw3Chapter";
import { Hw4Chapter } from "@/components/chapters/Hw4Chapter";
import { Hw5Chapter } from "@/components/chapters/Hw5Chapter";
import { Hw6Chapter } from "@/components/chapters/Hw6Chapter";
import type {
  Hw1Data,
  Hw2Data,
  Hw3Data,
  Hw4Data,
  Hw5Data,
  Hw6Data,
  SiteMeta,
} from "@/lib/types";
import siteJson from "../../public/data/site.json";
import hw1Json from "../../public/data/hw1.json";
import hw2Json from "../../public/data/hw2.json";
import hw3Json from "../../public/data/hw3.json";
import hw4Json from "../../public/data/hw4.json";
import hw5Json from "../../public/data/hw5.json";
import hw6Json from "../../public/data/hw6.json";

const site = siteJson as SiteMeta;
const hw1 = hw1Json as Hw1Data;
const hw2 = hw2Json as Hw2Data;
const hw3 = hw3Json as Hw3Data;
const hw4 = hw4Json as Hw4Data;
const hw5 = hw5Json as Hw5Data;
const hw6 = hw6Json as Hw6Data;

export default function HomePage() {
  return (
    <main className="star-shell relative z-[1]">
      <Starfield />
      <TimelineNav chapters={site.chapters} />

      <section id="open" className="page-screen relative px-4">
        <div className="mx-auto w-full max-w-6xl">
          <p className="mono mb-4 text-[0.75rem] tracking-[0.16em] text-[var(--gold)] uppercase">
            {site.student} · {site.course} · mid-semester portfolio
          </p>
          <h1 className="display max-w-4xl text-[clamp(2.8rem,8vw,5.8rem)] leading-[0.95] text-[var(--star)]">
            {site.siteTitle}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--star-dim)]">
            Six NLP mini-projects. Therapy talk and lyric catalogs, looked at
            with different methods, checking where a surface pattern stops being
            enough.
          </p>
          <p className="mt-8 mono text-xs tracking-[0.12em] text-[var(--nebula)] uppercase">
            Scroll to read the curator&apos;s statement
          </p>
        </div>
      </section>

      <section
        id="curator"
        className="page-screen border-t border-[var(--line)] px-4"
      >
        <div className="mx-auto max-w-3xl glass p-6 md:p-8">
          <h2 className="mono mb-5 text-[0.72rem] tracking-[0.14em] text-[var(--aurora)] uppercase">
            Curator&apos;s statement
          </h2>
          <p className="display text-[clamp(1.15rem,2.2vw,1.45rem)] leading-[1.55] text-[var(--star)]">
            {site.curator}
          </p>
        </div>
      </section>

      <Hw1Chapter data={hw1} />
      <Hw2Chapter data={hw2} />
      <Hw3Chapter data={hw3} />
      <Hw4Chapter data={hw4} />
      <Hw5Chapter data={hw5} />
      <Hw6Chapter data={hw6} />

      <section
        id="close"
        className="page-screen border-t border-[var(--line)] px-4"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="display text-[clamp(2rem,4vw,2.8rem)] text-[var(--star)]">
            What I learned / what&apos;s next
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--star-dim)]">
            Mid-semester, I trust close reading and negative results more than
            flashy agreement scores. Personas that don&apos;t move labels. OCR
            that wins by page type. Cosine that can&apos;t hear a shared heart.
            Maps that exile true neighbors. N-grams that sound lyrical because
            they remembered. Those are the findings I want to keep.
          </p>
        </div>
      </section>

      <section className="page-screen border-t border-[var(--line)] px-4">
        <div className="mx-auto max-w-3xl">
          <p className="lead">
            Next I would compute inter-annotator κ on the therapy codebook, score
            OCR against full-page ground truth, try a second embedding model on
            the lyric map, and put a small neural LM next to the n-gram samples
            without pretending counts invent meaning.
          </p>
          <div className="mt-10 glass p-5">
            <div className="mono text-[0.7rem] tracking-[0.1em] text-[var(--star-dim)] uppercase">
              Companion code
            </div>
            <p className="mt-2 text-[var(--star-dim)]">
              Homework folders and precompute scripts live beside this site. Drop
              a GitHub URL here when the companion repo is public.
            </p>
            <p className="mt-3 mono text-sm text-[var(--gold)]">
              [GitHub companion link]
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
