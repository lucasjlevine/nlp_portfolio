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
import type { Hw6Data } from "@/lib/types";
import {
  axisLabel,
  chartCursorFill,
  chartMargin,
  chartMarginVertical,
  chartTick,
  darkTooltipProps,
} from "@/lib/chartTheme";
import { ChapterShell } from "@/components/ChapterShell";
import { Beat, ChapterClose, CorpusContinuity } from "@/components/story/Beat";
import { ContextCard, StickyContext } from "@/components/story/StickyContext";

const N_COLORS = ["#7ec8ff", "#3ee0b8", "#e8a87c", "#f0c75e"];

export function Hw6Chapter({ data }: { data: Hw6Data }) {
  const [nFocus, setNFocus] = useState(2);
  const [explorerIdx, setExplorerIdx] = useState(0);
  const [explorerN, setExplorerN] = useState("2");

  const copyChart = useMemo(
    () =>
      data.copiedRunAverages.map((d) => ({
        n: `n=${d.n}`,
        avg: Number(d.avg.toFixed(2)),
        nVal: d.n,
      })),
    [data.copiedRunAverages],
  );

  const samplesForN = data.samples.filter((s) => s.n === nFocus);
  const featured = data.samples.filter((s) => s.featured);
  const explorer = data.explorer?.[explorerIdx];
  const dist = explorer?.byN?.[explorerN] ?? [];
  const mashSamples = data.mashup.samples ?? data.mashup.core ?? [];

  return (
    <ChapterShell id="hw6" num={6} tag="Language models" title={data.title}>
      <CorpusContinuity>
        Still the Lenker / Big Thief lyric voice, now as training text for small
        n-gram models, then a Buck Meek mash-up as a stress test.
      </CorpusContinuity>

      <Beat kind="question" focus>
        <p className="story-question">
          When an n-gram “writes” in this voice, is it inventing, or parroting a
          run of words it already saw?
        </p>
      </Beat>

      <Beat kind="evidence" focus>
        <p className="lead" style={{ textAlign: "center" }}>
          {data.corpusTokens.toLocaleString()} tokens of {data.voice}. I trained
          n=1…4 models, scored how long each copied from the corpus, and kept a
          few generations that almost sound like songs.
        </p>
        {featured.length > 0 && (
          <ul className="mt-8 space-y-5">
            {featured.map((s) => (
              <li key={`${s.n}-${s.text}`}>
                <div className="quote-hero-meta">n={s.n}</div>
                <p className="quote-hero mt-2">“{s.text}”</p>
              </li>
            ))}
          </ul>
        )}
      </Beat>

      <StickyContext
        rail={
          <>
            <ContextCard label="Copied run">
              Longest contiguous word sequence that also appears in the training
              lyrics.
            </ContextCard>
            <ContextCard label="Focus n" active>
              <span className="display text-2xl text-[var(--gold)]">n={nFocus}</span>
            </ContextCard>
            {copyChart.map((d) => (
              <ContextCard
                key={d.n}
                label={d.n}
                active={d.nVal === nFocus}
              >
                avg longest copy <strong>{d.avg}</strong>
              </ContextCard>
            ))}
          </>
        }
      >
      <Beat kind="figure" tall>
        <p className="mb-4 max-w-2xl text-[var(--star-dim)]">
          Average length of the copied run rises with <em>n</em>. The 4-gram
          sounds most like a song because it remembered the most.
        </p>
        <div className="glass p-4 md:p-5">
          <div className="mono mb-3 text-[0.7rem] tracking-[0.1em] text-[var(--star-dim)] uppercase">
            Mean longest copied run · click a bar
          </div>
          <div className="h-56 w-full md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={copyChart} margin={chartMargin}>
                <CartesianGrid stroke="rgba(232,238,252,0.08)" vertical={false} />
                <XAxis
                  dataKey="n"
                  tick={chartTick}
                  axisLine={false}
                  tickLine={false}
                  height={44}
                  label={axisLabel({ value: "n-gram order" })}
                />
                <YAxis
                  tick={chartTick}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  label={axisLabel({ value: "Mean copied run", orient: "y" })}
                />
                <Tooltip
                  cursor={chartCursorFill}
                  {...darkTooltipProps}
                />
                <Bar
                  dataKey="avg"
                  radius={[8, 8, 0, 0]}
                  onClick={(d) => {
                    const row = d as { nVal?: number };
                    if (row.nVal) setNFocus(row.nVal);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {copyChart.map((d, i) => (
                    <Cell
                      key={d.n}
                      fill={N_COLORS[i % N_COLORS.length]}
                      fillOpacity={d.nVal === nFocus ? 1 : 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Beat>

      <Beat kind="explore" tall>
        <div className="glass mb-6 p-4 md:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="mono text-[0.7rem] tracking-[0.1em] text-[var(--star-dim)] uppercase">
              Generated samples · n={nFocus}
            </div>
            <div className="flex flex-wrap gap-1">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="chip"
                  data-active={nFocus === n}
                  onClick={() => setNFocus(n)}
                >
                  n={n}
                </button>
              ))}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.ul
              key={nFocus}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="max-h-72 space-y-2 overflow-y-auto"
            >
              {samplesForN.map((s, i) => (
                <li
                  key={`${s.n}-${i}`}
                  className={`rounded-xl border px-3 py-2 text-sm leading-snug ${
                    s.featured
                      ? "border-[rgba(240,199,94,0.45)] bg-[rgba(240,199,94,0.06)] text-[var(--star)]"
                      : "border-[var(--line)] bg-[rgba(5,8,20,0.45)] text-[var(--star-dim)]"
                  }`}
                >
                  <span className="mono mr-2 text-[0.65rem] text-[var(--muted,#9aa8c7)]">
                    copy {s.copy}
                  </span>
                  {s.text}
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>

        {data.prompts.length > 0 && (
          <div className="mb-6 space-y-3">
            {data.prompts.slice(0, 2).map((p) => (
              <div
                key={p.prompt}
                className={`glass p-4 ${
                  p.featured ? "border-[rgba(62,224,184,0.35)]" : ""
                }`}
              >
                <div className="mono mb-1 text-[0.65rem] tracking-[0.1em] text-[var(--star-dim)] uppercase">
                  Prompt
                </div>
                <p className="display text-base text-[var(--star)]">{p.prompt}</p>
                <div className="mono mb-1 mt-3 text-[0.65rem] tracking-[0.1em] text-[var(--gold)] uppercase">
                  Continuation
                </div>
                <p className="text-sm leading-relaxed text-[var(--star-dim)]">
                  {p.continuation}
                </p>
              </div>
            ))}
          </div>
        )}

        {explorer && (
          <div className="glass mb-6 p-4 md:p-5">
            <div className="mono mb-2 text-[0.7rem] tracking-[0.1em] text-[var(--aurora)] uppercase">
              Next-token explorer
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {data.explorer?.map((e, i) => (
                <button
                  key={e.context}
                  type="button"
                  className="btn-quiet"
                  data-active={explorerIdx === i}
                  onClick={() => setExplorerIdx(i)}
                >
                  “{e.context.slice(0, 22)}
                  {e.context.length > 22 ? "…" : ""}”
                </button>
              ))}
            </div>
            <p className="display mb-3 text-lg leading-snug text-[var(--star)]">
              {explorer.context}
            </p>
            <div className="mb-3 flex flex-wrap gap-1">
              {["1", "2", "3", "4"].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="chip"
                  data-active={explorerN === n}
                  onClick={() => setExplorerN(n)}
                >
                  n={n}
                </button>
              ))}
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dist.slice(0, 10)}
                  layout="vertical"
                  margin={chartMarginVertical}
                >
                  <CartesianGrid
                    stroke="rgba(232,238,252,0.08)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={chartTick}
                    axisLine={false}
                    tickLine={false}
                    height={44}
                    label={axisLabel({ value: "Probability" })}
                  />
                  <YAxis
                    type="category"
                    dataKey="token"
                    width={84}
                    tick={chartTick}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip {...darkTooltipProps} />
                  <Bar dataKey="p" fill="#7ec8ff" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {mashSamples.length > 0 && (
          <div className="glass p-4">
            <div className="mono mb-2 text-[0.68rem] tracking-[0.1em] text-[var(--nebula)] uppercase">
              Buck Meek mash-up
            </div>
            <p className="mb-3 text-sm text-[var(--star-dim)]">{data.mashup.note}</p>
            <ul className="space-y-2 text-sm text-[var(--star-dim)]">
              {mashSamples.slice(0, 4).map((s, i) => (
                <li key={i}>
                  <span className="mono mr-2 text-[0.65rem]">copy {s.copy}</span>
                  {s.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Beat>
      </StickyContext>

      <ChapterClose
        finding={data.keyFinding}
        whatChanged={data.whatChanged}
        bridge="That's the last project in this portfolio: generation that can sound like a voice without having one."
      />
    </ChapterShell>
  );
}
