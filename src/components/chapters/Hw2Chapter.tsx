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
import type { Hw2Data } from "@/lib/types";
import {
  axisLabel,
  chartMargin,
  chartTick,
  darkTooltipProps,
} from "@/lib/chartTheme";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { ChapterShell } from "@/components/ChapterShell";
import { Beat, ChapterClose, CorpusContinuity } from "@/components/story/Beat";
import { ContextCard, StickyContext } from "@/components/story/StickyContext";

type Mode = "panel" | "minusExamples" | "minusRole" | "minusCoT";

export function Hw2Chapter({ data }: { data: Hw2Data }) {
  const [mode, setMode] = useState<Mode>("panel");

  const rows = useMemo(
    () =>
      data.passages.map((p) => {
        const pred = mode === "minusExamples" ? p.minusExamples : p.panel;
        return { ...p, pred, ok: pred === p.gt };
      }),
    [data.passages, mode],
  );

  const agreement =
    mode === "minusExamples"
      ? data.agreement.minusExamples
      : mode === "minusRole"
        ? data.agreement.minusRole
        : mode === "minusCoT"
          ? data.agreement.minusCoT
          : data.agreement.panel;

  const chart = [
    { name: "Panel", value: data.agreement.panel * 100, fill: "#7c6cff", mode: "panel" as Mode },
    { name: "−Role", value: data.agreement.minusRole * 100, fill: "#9aa8c7", mode: "minusRole" as Mode },
    { name: "−Examples", value: data.agreement.minusExamples * 100, fill: "#3ee0b8", mode: "minusExamples" as Mode },
    { name: "−CoT", value: data.agreement.minusCoT * 100, fill: "#9aa8c7", mode: "minusCoT" as Mode },
  ];

  const disputed = data.passages.find((p) => p.disputed)!;

  return (
    <ChapterShell id="hw2" num={2} tag="Prompt engineering" title={data.title}>
      <CorpusContinuity>
        Still <em>Couples Therapy</em>. Now eight of the coded passages become a
        test set for prompted “therapist” personas.
      </CorpusContinuity>

      <Beat kind="question" focus>
        <p className="story-question">
          If I give Claude three expert personas, does any of them actually
          change how it codes blame and disclosure?
        </p>
      </Beat>

      <Beat kind="evidence" narrow tall>
        <p className="lead">
          Three designed roles. Same eight passages, labeled with the HW1
          codebook (Disclosure, Attribution, Defense, Reframing, Story).
          Leave-one-out ablations on role, few-shot examples, and
          chain-of-thought.
        </p>
        <ul className="mt-6 space-y-4">
          {data.personas.map((p, i) => (
            <motion.li
              key={p.name}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="border-l border-[var(--nebula)] pl-4"
            >
              <div className="display text-lg text-[var(--star)]">{p.name}</div>
              <div className="text-[var(--star-dim)]">“{p.line}”</div>
            </motion.li>
          ))}
        </ul>
        <div className="mt-5">
          <img src="/images/prompt-characters.jpeg" alt="Personas" className="w-full h-auto" />
        </div>
      </Beat>

      <StickyContext
        rail={
          <>
            <ContextCard label="Live agreement">
              <span className="display text-2xl text-[var(--aurora)]">
                {(agreement * 100).toFixed(1)}%
              </span>
              <div className="mt-1 text-[var(--star-dim)]">
                {rows.filter((r) => r.ok).length}/8 correct
              </div>
            </ContextCard>
            {data.personas.map((p) => (
              <ContextCard key={p.name} label={p.name}>
                “{p.line}”
              </ContextCard>
            ))}
            <ContextCard label="Labels from HW1">
              Disclosure · Attribution · Defense · Reframing · Story
            </ContextCard>
          </>
        }
      >
        <Beat kind="figure" tall>
          <p className="mb-4 max-w-2xl text-[var(--star-dim)]">
            Agreement with my ground truth. The full panel and every leave-one-out
            still land at 7/8. Removing examples is the ablation that flips the one
            ambiguous line back to Disclosure.
          </p>
          <div className="glass p-4 md:p-5">
            <div className="h-56 w-full md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={chartMargin}>
                  <CartesianGrid stroke="rgba(232,238,252,0.08)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={chartTick}
                    axisLine={false}
                    tickLine={false}
                    height={44}
                    label={axisLabel({ value: "Prompt setup" })}
                  />
                  <YAxis
                    domain={[70, 100]}
                    tick={chartTick}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    label={axisLabel({ value: "Agreement (%)", orient: "y" })}
                  />
                  <Tooltip
                    {...darkTooltipProps}
                    formatter={(v) =>
                      typeof v === "number" ? `${v.toFixed(1)}%` : String(v ?? "")
                    }
                  />
                  <Bar
                    dataKey="value"
                    radius={[8, 8, 0, 0]}
                    animationDuration={700}
                    onClick={(d) => {
                      const row = d as { mode?: Mode };
                      if (row.mode) setMode(row.mode);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {chart.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.fill}
                        fillOpacity={mode === entry.mode ? 1 : 0.4}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Beat>

        <Beat kind="explore" tall>
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                ["panel", "Full panel"],
                ["minusExamples", "− Examples"],
                ["minusRole", "− Role"],
                ["minusCoT", "− CoT"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="btn-quiet"
                data-active={mode === id}
                onClick={() => setMode(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-[rgba(232,238,252,0.08)]">
            <motion.div
              className="h-full rounded-full bg-[var(--aurora)]"
              animate={{ width: `${agreement * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>

          <div className="glass overflow-x-auto p-4">
            <table className="w-full text-left text-sm text-[var(--star)]">
              <thead className="mono text-[0.68rem] tracking-wide text-[var(--star-dim)] uppercase">
                <tr>
                  <th className="py-1 pr-2">#</th>
                  <th className="py-1 pr-2">Ground truth</th>
                  <th className="py-1 pr-2">Model</th>
                  <th className="py-1">Match</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {rows.map((r) => (
                    <motion.tr
                      key={`${r.id}-${mode}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={r.disputed ? "bg-[rgba(255,107,107,0.08)]" : undefined}
                    >
                      <td className="py-1.5 pr-2 mono">{r.id}</td>
                      <td className="py-1.5 pr-2">{r.gt}</td>
                      <td className="py-1.5 pr-2">{r.pred}</td>
                      <td className="py-1.5">{r.ok ? "✓" : "✗"}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Beat>

        <Beat kind="explore" focus>
          <p className="quote-hero">“{disputed.text}”</p>
          <p className="quote-hero-meta">Passage 5 · the only disagreement</p>
          <p className="mt-5 text-sm leading-relaxed text-[var(--star-dim)]">
            My ground truth was <em>Emotional Disclosure</em>: the speaker is
            naming a feeling. The full panel called it{" "}
            <em>Attribution of Responsibility</em>, hearing blame toward the
            partner instead. Only dropping the few-shot examples flipped the
            model back to Disclosure.
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-left text-sm text-[var(--star-dim)]">
            <div>
              <dt className="mono text-[0.65rem] uppercase">Ground truth</dt>
              <dd className="text-lg text-[var(--star)]">Disclosure</dd>
            </div>
            <div>
              <dt className="mono text-[0.65rem] uppercase">Full panel</dt>
              <dd className="text-lg text-[var(--star)]">Attribution</dd>
            </div>
            <div>
              <dt className="mono text-[0.65rem] uppercase">− Examples</dt>
              <dd className="text-lg text-[var(--aurora)]">Disclosure</dd>
            </div>
            <div>
              <dt className="mono text-[0.65rem] uppercase">− Role / − CoT</dt>
              <dd className="text-lg text-[var(--star)]">No change</dd>
            </div>
          </dl>
        </Beat>
      </StickyContext>

      <ChapterClose
        finding={data.keyFinding}
        whatChanged={data.whatChanged}
        bridge="Next: labels need text. What happens when the text is still ink on a page?"
      />
    </ChapterShell>
  );
}
