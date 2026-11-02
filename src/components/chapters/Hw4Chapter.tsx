"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Hw4Data } from "@/lib/types";
import {
  axisLabel,
  chartMargin,
  chartTick,
  darkTooltipProps,
} from "@/lib/chartTheme";
import { ChapterShell } from "@/components/ChapterShell";
import { Hw4AblationScatter } from "@/components/chapters/Hw4AblationScatter";
import { Hw4Network } from "@/components/chapters/Hw4Network";
import { Beat, ChapterClose } from "@/components/story/Beat";
import { ContextCard, StickyContext } from "@/components/story/StickyContext";

function isRichNetwork(
  network: Hw4Data["network"],
): network is {
  nodes: { id: number; line: string; song: string; x?: number; y?: number }[];
  edges: {
    source: number;
    target: number;
    score: number;
    kind: string;
    within: boolean;
  }[];
} {
  return Array.isArray(network?.nodes);
}

export function Hw4Chapter({ data }: { data: Hw4Data }) {
  const [t, setT] = useState(data.threshold);
  const [showHomework, setShowHomework] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const network = data.network;
  const rich = isRichNetwork(network);
  const legacyPairs = data.pairs;
  const topPairs = data.topPairs;

  const hist = useMemo(() => {
    if (!data.histogram) return [];
    const { bins, all } = data.histogram;
    return all.map((v, i) => ({
      mid: Number((((bins[i] ?? 0) + (bins[i + 1] ?? 1)) / 2).toFixed(3)),
      all: v,
    }));
  }, [data.histogram]);

  const explorerPairs = useMemo(() => {
    if (topPairs?.length) {
      return [...topPairs]
        .filter((p) => p.lemma >= t - 0.08)
        .sort((a, b) => b.lemma - a.lemma)
        .slice(0, 24)
        .map((p) => ({
          a: p.a,
          b: p.b,
          score: p.lemma,
          within: p.within,
          verdict: p.within ? "within-song" : "cross-song",
        }));
    }
    return [...(legacyPairs ?? [])]
      .filter((p) => p.score >= t - 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, 24)
      .map((p) => ({
        a: p.a,
        b: p.b,
        score: p.score,
        within: p.song_a === p.song_b,
        verdict: p.verdict,
      }));
  }, [topPairs, legacyPairs, t]);

  const aboveCount = useMemo(() => {
    if (topPairs?.length) return topPairs.filter((p) => p.lemma >= t).length;
    return (legacyPairs ?? []).filter((p) => p.score >= t).length;
  }, [topPairs, legacyPairs, t]);

  const networkNodes = rich ? network.nodes : [];
  const visibleEdges = rich
    ? network.edges.filter((e) =>
        e.kind === "solid" ? e.score >= t : e.score >= Math.min(t, 0.6),
      )
    : [];

  const selectedNode = networkNodes.find((n) => n.id === selectedId);
  const fp = data.falsePositive;

  return (
    <ChapterShell id="hw4" num={4} tag="Similarity" title={data.title}>
      <Beat kind="corpus" focus>
        <p className="lead" style={{ textAlign: "center" }}>
          Solo lyrics by Adrianne Lenker, line by line. A new corpus, finer than
          magazine prose: the unit is a single lyric line.
        </p>
        <div className="stat-row stat-row--hero">
          <div className="stat">
            <span className="stat-value">{data.nSongs}</span>
            <span className="stat-label">songs</span>
          </div>
          <div className="stat">
            <span className="stat-value">{data.nLines.toLocaleString()}</span>
            <span className="stat-label">unique lines</span>
          </div>
          <div className="stat">
            <span className="stat-value">{data.nPairs.toLocaleString()}</span>
            <span className="stat-label">pairs scored</span>
          </div>
        </div>
      </Beat>

      <Beat kind="question" focus>
        <p className="story-question">
          Where does “alike” stop? When is a high cosine a real repeat, and when
          is it just a shared frame with one word swapped?
        </p>
      </Beat>

      <Beat kind="evidence" narrow>
        <p className="lead">
          TF-IDF cosine on lemmatized lines: each pair of lyric lines gets a
          score from 0 (no shared weight) to 1 (identical bag of words). I set
          the “same line” threshold by close reading at {data.threshold}
          {data.zeroShare != null
            ? ` (${(data.zeroShare * 100).toFixed(0)}% of pairs are exactly zero)`
            : ""}
          . In the network, solid edges are pairs at or above that line; dashed
          edges are looser shared frames.
        </p>
      </Beat>

      {fp && (
        <Beat kind="evidence" focus>
          <p className="quote-hero-meta">
            False positive above the line · {fp.score.toFixed(2)}
          </p>
          <p className="quote-hero mt-4">“{fp.a}”</p>
          <p className="my-3 text-[var(--star-dim)]">vs</p>
          <p className="quote-hero">“{fp.b}”</p>
          <p className="mt-5 text-sm leading-relaxed text-[var(--star-dim)]">
            Score {fp.score.toFixed(2)} clears the {data.threshold} threshold, so
            the model treats them as a match, but one swapped word (
            <em>waste / taste</em>) makes them different lines.
          </p>
        </Beat>
      )}

      <StickyContext
        rail={
          <>
            <ContextCard label="Threshold T">
              <span className="display text-2xl text-[var(--gold)]">
                {t.toFixed(2)}
              </span>
              <div className="mt-1 text-[var(--star-dim)]">
                Homework chose {data.threshold}
              </div>
            </ContextCard>
            <ContextCard label="Solid edges">
              Score ≥ T: treated as the same line / near-repeat.
            </ContextCard>
            <ContextCard label="Dashed edges">
              Shared frame below T (looser match).
            </ContextCard>
            <ContextCard label="Pairs ≥ T">
              <strong>{aboveCount}</strong> in the explorer set
            </ContextCard>
          </>
        }
      >
      <Beat kind="figure" tall>
        <p className="mb-4 max-w-2xl text-[var(--star-dim)]">
          Ablation check: does lemmatizing change who clears T? Most pairs hug
          the diagonal. The interesting ones sit off it, where one tokenization
          scores a match and the other does not.
        </p>
        {data.scatter && data.scatter.length > 0 ? (
          <div className="mb-8">
            <Hw4AblationScatter
              scatter={data.scatter}
              threshold={data.threshold}
            />
          </div>
        ) : null}
        <p className="mb-4 max-w-2xl text-[var(--star-dim)]">
          Most pairs sit near zero. The interesting mass is the thin right tail,
          where repeats and near-misses live.
        </p>
        {hist.length > 0 && (
          <div className="glass p-4 md:p-5">
            <div className="mono mb-3 text-[0.7rem] tracking-[0.1em] text-[var(--star-dim)] uppercase">
              Similarity mass · lemma cosine &gt; 0
            </div>
            <div className="relative h-52 w-full md:h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hist} margin={chartMargin}>
                  <defs>
                    <linearGradient id="hw4All" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c6cff" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#7c6cff" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(232,238,252,0.08)" vertical={false} />
                  <XAxis
                    dataKey="mid"
                    tick={chartTick}
                    axisLine={false}
                    tickLine={false}
                    height={44}
                    label={axisLabel({ value: "Lemma cosine" })}
                  />
                  <YAxis
                    tick={chartTick}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    label={axisLabel({ value: "Pair count", orient: "y" })}
                  />
                  <Tooltip {...darkTooltipProps} />
                  <Area
                    type="monotone"
                    dataKey="all"
                    stroke="#7c6cff"
                    fill="url(#hw4All)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div
                className="pointer-events-none absolute inset-0"
                aria-hidden
              >
                <div
                  className="absolute top-2 bottom-8 w-px bg-[var(--gold)]/80"
                  style={{ left: `calc(${t * 100}% * 0.92 + 4%)` }}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--star-dim)]">
              Gold line marks the live threshold below.
            </p>
          </div>
        )}
      </Beat>

      <Beat kind="explore" tall>
        <div className="glass p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="mono text-[0.7rem] tracking-[0.08em] text-[var(--star-dim)] uppercase">
              Threshold wire · T = {t.toFixed(2)}
            </div>
            <button
              type="button"
              className="btn-quiet"
              data-active={showHomework}
              onClick={() => setShowHomework((v) => !v)}
            >
              {showHomework ? "Interactive" : "Homework figure"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {showHomework ? (
              <motion.div
                key="hw-fig"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative aspect-square w-full max-w-xl overflow-hidden rounded-xl bg-[rgba(5,8,20,0.5)]"
              >
                <Image
                  src="/figures/network.png"
                  alt="Homework network of lyric lines linked by TF-IDF cosine"
                  fill
                  className="w-full h-full"
                />
              </motion.div>
            ) : (
              <motion.div
                key="live"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <label
                  className="mono block text-xs text-[var(--star-dim)]"
                  htmlFor="thresh"
                >
                  Drag threshold (homework chose {data.threshold})
                </label>
                <input
                  id="thresh"
                  className="range mt-2"
                  type="range"
                  min={0.55}
                  max={1}
                  step={0.01}
                  value={t}
                  onChange={(e) => setT(Number(e.target.value))}
                />
                <p className="mt-2 text-sm text-[var(--star-dim)]">
                  Pairs at or above T in the explorer: {aboveCount}
                  {data.withinSongRepeatLinks != null
                    ? ` · homework: ${data.withinSongRepeatLinks}/14 repeat links within-song`
                    : ""}
                </p>

                {rich && networkNodes.length > 0 && (
                  <Hw4Network
                    nodes={networkNodes}
                    edges={visibleEdges}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                )}

                {selectedNode && (
                  <p className="mt-3 text-sm leading-snug text-[var(--star)]">
                    <span className="mono text-[0.65rem] text-[var(--aurora)] uppercase">
                      {selectedNode.song}
                    </span>
                    <br />
                    “{selectedNode.line}”
                  </p>
                )}

                <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto">
                  {explorerPairs.map((p) => (
                    <li
                      key={`${p.a}-${p.b}-${p.score}`}
                      className="border-t border-[var(--line)] pt-3 text-sm text-[var(--star)]"
                    >
                      <div className="mono text-[0.68rem] text-[var(--star-dim)]">
                        {p.score.toFixed(3)} · {p.verdict}
                        {p.score >= t ? " · ≥ T" : " · near T"}
                      </div>
                      <div className="mt-1 leading-snug">
                        “{p.a}”
                        <br />
                        <span className="text-[var(--star-dim)]">/</span> “{p.b}”
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Beat>
      </StickyContext>

      <ChapterClose
        finding={data.keyFinding}
        whatChanged={data.whatChanged}
        bridge="Next: shared words failed me. Do shared vectors gather the images I hear in these songs?"
      />
    </ChapterShell>
  );
}
