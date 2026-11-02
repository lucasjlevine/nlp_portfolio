"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Hw1Data } from "@/lib/types";
import {
  axisLabel,
  chartCursorFill,
  chartMargin,
  chartTick,
  darkTooltipProps,
} from "@/lib/chartTheme";
import { ChapterShell } from "@/components/ChapterShell";
import { Reveal } from "@/components/Reveal";
import { Beat, ChapterClose } from "@/components/story/Beat";
import { ContextCard, StickyContext } from "@/components/story/StickyContext";

const SHORT: Record<string, string> = {
  "Emotional Disclosure": "Disclosure",
  "Attribution of Responsibility": "Attribution",
  "Self-Justification / Defense": "Defense",
  "Therapeutic Reframing": "Reframing",
  "Story / Context": "Story",
};

const COLORS = ["#7ec8ff", "#7c6cff", "#e8a87c", "#3ee0b8", "#f0c75e"];

const FALLBACK_DEFS: Record<string, string> = {
  "Emotional Disclosure":
    "A speaker reveals their own feelings, vulnerability, or inner experience.",
  "Attribution of Responsibility":
    "A speaker connects a problem, negative experience, or feeling to their partner’s behavior.",
  "Self-Justification / Defense":
    "A speaker explains, excuses, or minimizes their own behavior or position.",
  "Therapeutic Reframing":
    "A speaker interprets an interaction as evidence of a deeper emotional or relational pattern, almost always the therapist, Orna.",
  "Story / Context":
    "A speaker narrates events or circumstances mainly to set factual scene for the conversation.",
};

export function Hw1Chapter({ data }: { data: Hw1Data }) {
  const [theme, setTheme] = useState<string>(data.themes[0]);
  const defs = data.themeDefinitions ?? FALLBACK_DEFS;
  const chart = useMemo(
    () =>
      data.themes.map((t, i) => ({
        theme: SHORT[t] ?? t,
        full: t,
        count: data.primaryCounts[t] ?? 0,
        fill: COLORS[i % COLORS.length],
      })),
    [data],
  );
  const filtered = useMemo(
    () => data.passages.filter((p) => p.themes.includes(theme)),
    [data.passages, theme],
  );
  const hero = data.passages.find((p) => p.hero) ?? data.passages[25];

  const codebookRail = (
    <>
      <ContextCard label="Codebook">
        Five themes. Passages can carry more than one.
      </ContextCard>
      {data.themes.map((t) => (
        <ContextCard key={t} label={SHORT[t] ?? t} active={theme === t}>
          {defs[t]}
        </ContextCard>
      ))}
    </>
  );

  return (
    <ChapterShell id="hw1" num={1} tag="Thematic analysis" title={data.title}>

      <Beat kind="corpus" focus>
        <div className="flex justify-center gap-4 my-4">
          <img
            src="/images/couples-therapy-1.avif"
            alt="Still from Couples Therapy"
            className="w-1/2 max-h-[65vh] rounded-xl object-contain shadow-lg"
          />
          <img
            src="/images/couples-therapy-2.jpeg"
            alt="Still from Couples Therapy"
            className="w-1/2 max-h-[65vh] rounded-xl object-contain shadow-lg"
          />
        </div>
        <p className="lead" style={{ textAlign: "center" }}>
          Transcripts from the Showtime series <em>Couples Therapy</em>: partners
          in session talking about blame, feelings, and excuses.
        </p>
        <div className="stat-row stat-row--hero">
          <div className="stat">
            <span className="stat-value">{data.sampleWords.toLocaleString()}</span>
            <span className="stat-label">words sampled</span>
          </div>
          <div className="stat">
            <span className="stat-value">{data.nPassages}</span>
            <span className="stat-label">coded passages</span>
          </div>
          <div className="stat">
            <span className="stat-value">{data.themes.length}</span>
            <span className="stat-label">theme codes</span>
          </div>
          <div className="stat">
            <span className="stat-value">{data.multiLabelCount}</span>
            <span className="stat-label">multi-label</span>
          </div>
        </div>
      </Beat>

      <Beat kind="question" focus>
        <p className="story-question">
          How do partners talk about blame, feelings, and their own excuses, and
          what jobs is an “explanation” doing while it pretends to explain?
        </p>
      </Beat>

      <Beat kind="evidence" narrow tall>
        <p className="lead">
          I built a five-theme codebook from the sample, then hand-coded{" "}
          {data.nPassages} passages. A passage can get more than one label when
          it does more than one job.
        </p>

        <ul className="mt-6 space-y-3">
          {data.themes.map((t) => (
            <li
              key={t}
              className="rounded-xl border border-[var(--line)] bg-[rgba(5,8,20,0.45)] px-4 py-3"
            >
              <div className="display text-[1.15rem] text-[var(--star)]">{t}</div>
              <p className="mt-1 text-sm leading-relaxed text-[var(--star-dim)]">
                {defs[t]}
              </p>
            </li>
          ))}
        </ul>
      </Beat>

      <StickyContext rail={codebookRail}>
        <Beat kind="evidence" focus>
          <p className="lead" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            With those categories in hand, Katherine&apos;s line does two jobs at
            once.
          </p>
          <blockquote className="mx-auto max-w-xl">
            <p className="quote-hero">“{hero.excerpt}”</p>
            <footer className="quote-hero-meta">
              {hero.speaker} · {hero.location}
            </footer>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {hero.themes.map((t) => (
                <span key={t} className="chip" data-active="true">
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--star-dim)]">
              <em>Emotional Disclosure</em>: she names a hated younger self.{" "}
              <em>Therapeutic Reframing</em>: she reads that hate as a pattern of
              two selves. There is not one word alone that makes this “depressing,”
              and a regex still cannot catch the emotion here.
            </p>
          </blockquote>
        </Beat>

        <Beat kind="figure" tall>
          <p className="mb-4 max-w-2xl text-[var(--star-dim)]">
            Primary theme counts across the sample. Story and Disclosure lead.
            Defense is quieter as a primary label, but it shows up inside
            explanations.
          </p>
          <div className="glass p-4 md:p-5">
            <div className="h-64 w-full md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chart}
                  margin={chartMargin}
                  onClick={(state) => {
                    const payload = (
                      state as {
                        activePayload?: { payload?: { full?: string } }[];
                      } | null
                    )?.activePayload?.[0]?.payload;
                    if (payload?.full) setTheme(payload.full);
                  }}
                >
                  <CartesianGrid stroke="rgba(232,238,252,0.08)" vertical={false} />
                  <XAxis
                    dataKey="theme"
                    tick={chartTick}
                    axisLine={false}
                    tickLine={false}
                    height={44}
                    label={axisLabel({ value: "Theme" })}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={chartTick}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    label={axisLabel({ value: "Passages", orient: "y" })}
                  />
                  <Tooltip
                    cursor={chartCursorFill}
                    {...darkTooltipProps}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} animationDuration={700}>
                    {chart.map((c) => (
                      <Cell
                        key={c.full}
                        fill={c.fill}
                        fillOpacity={theme === c.full ? 1 : 0.45}
                        style={{ cursor: "pointer" }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-[var(--star-dim)]">
              Click a bar to open that theme&apos;s quotes below.
            </p>
          </div>
        </Beat>

        <Beat kind="explore" tall>
          <div className="mb-4 flex flex-wrap gap-2">
            {data.themes.map((t) => (
              <button
                key={t}
                type="button"
                className="btn-quiet"
                data-active={theme === t}
                onClick={() => setTheme(t)}
              >
                {SHORT[t] ?? t}
              </button>
            ))}
          </div>
          <div className="glass p-4 md:p-5">
            <div className="mono mb-3 text-[0.7rem] tracking-[0.08em] text-[var(--aurora)] uppercase">
              Quotes tagged {SHORT[theme]} · {filtered.length}
            </div>
            <ul className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {filtered.map((p) => (
                  <motion.li
                    key={p.excerpt}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-xl border border-[var(--line)] bg-[rgba(5,8,20,0.45)] p-3 text-sm leading-snug text-[var(--star)]"
                  >
                    <span className="text-[var(--star-dim)]">
                      {p.speaker} · {p.location}
                      {p.themes.length > 1
                        ? ` · also ${p.themes.filter((x) => x !== theme).join(", ")}`
                        : ""}
                    </span>
                    <br />
                    “{p.excerpt}”
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </Beat>
      </StickyContext>

      <ChapterClose
        finding={data.keyFinding}
        whatChanged={data.whatChanged}
        bridge="Next question: if half of every explanation is a defense, can a prompted “therapist” hear that?"
      />
    </ChapterShell>
  );
}
