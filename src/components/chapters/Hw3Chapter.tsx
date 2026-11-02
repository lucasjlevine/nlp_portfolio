"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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
import type { Hw3Data } from "@/lib/types";
import {
  axisLabel,
  chartCursorFill,
  chartMargin,
  chartMarginVertical,
  chartTick,
  darkTooltipProps,
} from "@/lib/chartTheme";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { ChapterShell } from "@/components/ChapterShell";
import { Beat, ChapterClose } from "@/components/story/Beat";
import { ContextCard, StickyContext } from "@/components/story/StickyContext";

type Page = "page_07" | "page_29";
type View = "gt" | "tesseract" | "repaired";

export function Hw3Chapter({ data }: { data: Hw3Data }) {
  const [page, setPage] = useState<Page>("page_07");
  const [view, setView] = useState<View>("tesseract");
  const [metric, setMetric] = useState<"CER" | "WER">("CER");

  const scoreRow = useMemo(() => {
    if (data.scores?.length) {
      return data.scores.find((s) => s.page === page) ?? data.scores[0];
    }
    const eng = data.engines;
    if (!eng?.length) return null;
    const tess = eng.find((e) => e.engine === "Tesseract");
    const trocr = eng.find((e) => e.engine.includes("TrOCR"));
    if (!tess) return null;
    return {
      page,
      tesseract: tess[page],
      tesseract_repaired: data.regex?.beforeAfter.find((r) => r.page === page)
        ? {
            CER: data.regex.beforeAfter.find((r) => r.page === page)!.CER_after,
            WER: data.regex.beforeAfter.find((r) => r.page === page)!.WER_after,
          }
        : tess[page],
      trocr: trocr?.[page] ?? { CER: 0, WER: 0 },
    };
  }, [data, page]);

  const chart = useMemo(() => {
    if (!scoreRow) return [];
    return [
      { name: "Tesseract", value: scoreRow.tesseract[metric], fill: "#7c6cff" },
      {
        name: "Tess + regex",
        value: scoreRow.tesseract_repaired[metric],
        fill: "#3ee0b8",
      },
      { name: "TrOCR", value: scoreRow.trocr[metric], fill: "#ff6b6b" },
    ];
  }, [scoreRow, metric]);

  const artists = useMemo(
    () =>
      [...data.artistMentions]
        .sort((a, b) => b.count - a.count)
        .map((a) => ({ ...a, short: a.name })),
    [data.artistMentions],
  );

  const snippet = data.snippets?.[page];
  const snippetText =
    view === "gt"
      ? snippet?.gt
      : view === "repaired"
        ? snippet?.repaired
        : snippet?.tesseract;

  const worstEx = data.worstLines?.[0]?.example;
  const pageMeta = data.pages[page];

  return (
    <ChapterShell id="hw3" num={3} tag="OCR" title={data.title}>
      <Beat kind="corpus" focus>
        <p className="lead" style={{ textAlign: "center" }}>
          A scanned issue of <em>Rolling Stone</em> ({data.document}). New
          corpus: ink on a page, not talk already typed.
        </p>
        <div className="stat-row stat-row--hero">
          <div className="stat">
            <span className="stat-value">2</span>
            <span className="stat-label">hand-transcribed pages</span>
          </div>
          <div className="stat">
            <span className="stat-value">2</span>
            <span className="stat-label">OCR engines</span>
          </div>
          <div className="stat">
            <span className="stat-value">{artists.length}</span>
            <span className="stat-label">artists tracked at scale</span>
          </div>
        </div>
      </Beat>

      <Beat kind="question" focus>
        <p className="story-question">
          Can I pull clean text off a hard 1982 scan, and once I can, who does
          the issue still talk about?
        </p>
      </Beat>

      <Beat kind="evidence" narrow tall>
        <p className="lead">
          I compared Tesseract and TrOCR on two hard pages, then repaired
          Tesseract failures with regexes before scaling the cleaner pipeline.
          Below, <strong className="font-normal text-[var(--star)]">CER</strong>{" "}
          is character error rate: how many character edits it takes to turn OCR
          into my transcription, divided by the length of the reference (1.0 means
          about as many edits as characters).{" "}
          <strong className="font-normal text-[var(--star)]">WER</strong> is the
          same idea at the word level.
        </p>
        {worstEx && (
          <div className="glass mt-6 p-4">
            <div className="mono mb-2 text-[0.7rem] tracking-[0.08em] text-[var(--ember)] uppercase">
              Worst Tesseract line · page 07
            </div>
            <div className="display mb-3 text-[clamp(2.4rem,6vw,3.6rem)] leading-none text-[var(--ember)]">
              CER {worstEx.cer.toFixed(2)}
            </div>
            <p className="mb-3 text-sm text-[var(--star-dim)]">
              Leader dots in the table of contents broke the line so badly that
              edits nearly outnumber the characters I wrote.
            </p>
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div>
                <div className="mono text-[0.65rem] text-[var(--star-dim)] uppercase">
                  My transcription
                </div>
                <pre className="mono mt-1 whitespace-pre-wrap text-xs text-[var(--star)]">
                  {worstEx.ref}
                </pre>
              </div>
              <div>
                <div className="mono text-[0.65rem] text-[var(--star-dim)] uppercase">
                  OCR
                </div>
                <pre className="mono mt-1 whitespace-pre-wrap text-xs text-[var(--ember)]">
                  {worstEx.hyp}
                </pre>
              </div>
            </div>
          </div>
        )}
        <div className="relative mt-5 aspect-[4/3] w-full max-w-xl overflow-hidden rounded-xl border border-[var(--line)] bg-[rgba(5,8,20,0.6)]">
          {pageMeta?.image ? (
            <Image
              src={pageMeta.image}
              alt={pageMeta.label}
              fill
              className="object-contain"
              sizes="(max-width: 960px) 100vw, 40vw"
            />
          ) : (
            <ImageSlot
              id="hw3-page-scans"
              label="Page scans"
              hint="OCR page images missing from /public/ocr-pages."
            />
          )}
        </div>
      </Beat>

      <StickyContext
        rail={
          <>
            <ContextCard label="CER">
              Character error rate: Levenshtein edits (insert, delete, substitute)
              to match my transcription, divided by reference character count.
              Lower is better. Can exceed 1 when OCR invents more junk than the
              page has characters.
            </ContextCard>
            <ContextCard label="WER">
              Same formula at the word level: word edits ÷ reference word count.
              Also can exceed 1 when the hypothesis is much longer than the
              ground truth.
            </ContextCard>
            <ContextCard label="Page" active>
              {data.pages[page]?.label ?? page}
            </ContextCard>
            <ContextCard label="Metric">
              Showing <strong>{metric}</strong>
            </ContextCard>
          </>
        }
      >
      <Beat kind="figure" tall>
        <p className="mb-4 max-w-2xl text-[var(--star-dim)]">
          Error rates by engine. Each bar is edit distance against my hand
          transcription, divided by the length of that transcription: CER at the
          character level, WER at the word level. A score of 0 is a perfect copy;
          1.0 means as many edits as there are characters or words in the
          reference. Values can climb above 1 when the OCR dumps far more text
          than the page actually has (insertions from leader dots, repeated
          garbage, broken layout), so the numerator outruns the denominator.
          Lower is better. Layout still flips the winner: TOC leader dots vs dense
          prose.
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {(["page_07", "page_29"] as Page[]).map((p) => (
            <button
              key={p}
              type="button"
              className="btn-quiet"
              data-active={page === p}
              onClick={() => setPage(p)}
            >
              {data.pages[p]?.label ?? p}
            </button>
          ))}
          {(["CER", "WER"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className="chip"
              data-active={metric === m}
              onClick={() => setMetric(m)}
            >
              {m}
            </button>
          ))}
        </div>
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
                  label={axisLabel({ value: "OCR engine" })}
                />
                <YAxis
                  tick={chartTick}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  label={axisLabel({ value: metric, orient: "y" })}
                />
                <Tooltip
                  cursor={chartCursorFill}
                  {...darkTooltipProps}
                  formatter={(v) =>
                    typeof v === "number" ? v.toFixed(3) : String(v ?? "")
                  }
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={650}>
                  {chart.map((c) => (
                    <Cell key={c.name} fill={c.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Beat>

      {snippet && (
        <Beat kind="explore" tall>
          <p className="mb-4 max-w-2xl text-[var(--star-dim)]">
            Compare ground truth, raw Tesseract, and the regex-repaired text for
            the selected page.
          </p>
          <div className="glass p-4 md:p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              {(
                [
                  ["gt", "Ground truth"],
                  ["tesseract", "Tesseract"],
                  ["repaired", "Tess + regex"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  className="btn-quiet"
                  data-active={view === k}
                  onClick={() => setView(k)}
                >
                  {label}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.pre
                key={`${page}-${view}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="mono max-h-[55vh] overflow-auto whitespace-pre-wrap text-[0.72rem] leading-relaxed text-[var(--star)]"
              >
                {snippetText}
              </motion.pre>
            </AnimatePresence>
          </div>
        </Beat>
      )}

      <Beat kind="figure" tall>
        <p className="mb-4 max-w-2xl text-[var(--star-dim)]">
          After cleaning ten pages, even deep in the issue, The Who still dominate
          the text.
        </p>
        <div className="glass p-4 md:p-5">
          <div className="mono mb-3 text-[0.7rem] tracking-[0.1em] text-[var(--gold)] uppercase">
            Artist mentions · cleaned scale pages
          </div>
          <div className="h-64 w-full md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={artists}
                layout="vertical"
                margin={chartMarginVertical}
              >
                <CartesianGrid stroke="rgba(232,238,252,0.08)" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={chartTick}
                  axisLine={false}
                  tickLine={false}
                  height={44}
                  label={axisLabel({ value: "Mentions" })}
                />
                <YAxis
                  type="category"
                  dataKey="short"
                  width={78}
                  tick={chartTick}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...darkTooltipProps} />
                <Bar dataKey="count" fill="#f0c75e" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {data.trocrNote && (
          <p className="mt-4 text-xs leading-relaxed text-[var(--star-dim)]">
            {data.trocrNote}
          </p>
        )}
      </Beat>
      </StickyContext>

      <ChapterClose
        finding={data.keyFinding}
        whatChanged={data.whatChanged}
        bridge="Next: from magazine prose to lyric lines. Same music world, finer unit."
      />
    </ChapterShell>
  );
}
