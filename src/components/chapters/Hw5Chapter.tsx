"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Hw5Data, Hw5Point } from "@/lib/types";
import { ChapterShell } from "@/components/ChapterShell";
import { Hw5EmbeddingMap } from "@/components/chapters/Hw5EmbeddingMap";
import { Beat, ChapterClose, CorpusContinuity } from "@/components/story/Beat";
import { ContextCard, StickyContext } from "@/components/story/StickyContext";

export function Hw5Chapter({ data }: { data: Hw5Data }) {
  const [selected, setSelected] = useState<Hw5Point | null>(null);

  const byId = useMemo(() => {
    const m = new Map<string, Hw5Point>();
    for (const p of data.points) m.set(p.id, p);
    return m;
  }, [data.points]);

  const neighbors =
    selected && data.anchorNeighbors?.[selected.id]
      ? data.anchorNeighbors[selected.id]
      : [];

  const mismatchAnchor = byId.get(data.anchorMismatch.anchor);
  const mismatchNeighbor = byId.get(data.anchorMismatch.neighbor);
  const nature = data.neighborhoods[0];
  const selectedHood = selected?.neighborhood
    ? data.neighborhoods.find((n) => n.name === selected.neighborhood)
    : null;

  return (
    <ChapterShell id="hw5" num={5} tag="Embeddings" title={data.title}>
      <CorpusContinuity>
        Same lyric world. Now Adrianne Lenker solo lines plus Big Thief, embedded
        as vectors instead of bag-of-words pairs.
      </CorpusContinuity>

      <Beat kind="question" focus>
        <p className="story-question">
          What kinds of lyrical images gather near one another across the solo
          catalog and Big Thief, and can a 2d map be trusted?
        </p>
      </Beat>

      <Beat kind="evidence" focus>
        <p className="lead" style={{ textAlign: "center" }}>
          {data.nPoints} lyric lines encoded with {data.model} into {data.dims}
          -dimensional vectors. Nearby means similar meaning more than shared
          words.
        </p>
        <div className="stat-row stat-row--hero">
          <div className="stat">
            <span className="stat-value">{data.nAL}</span>
            <span className="stat-label">Lenker lines</span>
          </div>
          <div className="stat">
            <span className="stat-value">{data.nBT}</span>
            <span className="stat-label">Big Thief lines</span>
          </div>
          {nature && (
            <>
              <div className="stat">
                <span className="stat-value">
                  {nature.mean_full_space_cosine.toFixed(3)}
                </span>
                <span className="stat-label">nature pocket</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {nature.random_set_mean.toFixed(3)}
                </span>
                <span className="stat-label">random baseline</span>
              </div>
            </>
          )}
        </div>
        {nature && (
          <p className="mt-5 text-sm text-[var(--star-dim)]">
            Selected passages sit {nature.difference_from_random_mean.toFixed(3)}{" "}
            above the random mean; mid-95% of random groups ran{" "}
            {nature.random_set_2_5_percentile.toFixed(3)} to{" "}
            {nature.random_set_97_5_percentile.toFixed(3)}.
          </p>
        )}
      </Beat>

      <StickyContext
        side="right"
        rail={
          <>
            {nature && (
              <ContextCard label="Nature pocket">
                Mean cosine{" "}
                <strong>{nature.mean_full_space_cosine.toFixed(3)}</strong>
                <br />
                vs random <strong>{nature.random_set_mean.toFixed(3)}</strong>
              </ContextCard>
            )}
            <ContextCard label="Map modes">
              Catalog colors, or the four close-reading neighborhoods from the
              homework map.
            </ContextCard>
            <ContextCard label="Trust">
              Full-space cosine is the truth. The 2d map is a sketch.
            </ContextCard>
            {selected && (
              <ContextCard label="Selected" active>
                {selected.id}
                <br />
                {selected.label} · {selected.song}
                {selected.neighborhood ? (
                  <>
                    <br />
                    {selected.neighborhood}
                  </>
                ) : null}
              </ContextCard>
            )}
            {selectedHood && (
              <ContextCard label="Pocket cosine">
                <strong>
                  {selectedHood.mean_full_space_cosine.toFixed(3)}
                </strong>{" "}
                vs random {selectedHood.random_set_mean.toFixed(3)}
              </ContextCard>
            )}
          </>
        }
      >
        <Beat kind="figure" tall>
          <p className="mb-4 max-w-2xl text-[var(--star-dim)]">
            A 2d sketch of the embedding space. Switch to Neighborhoods to see
            the four map-first candidate pockets from the homework close reading.
          </p>
          <Hw5EmbeddingMap
            data={data}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
        </Beat>

        <Beat kind="explore" tall>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="glass p-5"
              >
                <div className="mono mb-2 text-[0.68rem] tracking-[0.12em] text-[var(--star-dim)] uppercase">
                  {selected.id} · {selected.label} · {selected.song}
                  {selected.album ? ` · ${selected.album}` : ""}
                </div>
                <p className="display text-[1.2rem] leading-snug text-[var(--star)]">
                  “{selected.text}”
                </p>
                {neighbors.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    <li className="mono text-[0.65rem] tracking-[0.1em] text-[var(--gold)] uppercase">
                      Nearest in full space
                    </li>
                    {neighbors.slice(0, 5).map((n) => (
                      <li
                        key={n.id}
                        className="rounded-xl border border-[var(--line)] bg-[rgba(5,8,20,0.45)] px-3 py-2 text-sm"
                      >
                        <div className="mb-0.5 flex justify-between gap-2 text-[0.68rem] text-[var(--star-dim)]">
                          <span>
                            {n.label} · {n.song}
                          </span>
                          <span className="mono text-[var(--aurora)]">
                            {n.cosine.toFixed(3)}
                          </span>
                        </div>
                        <div className="leading-snug text-[var(--star)]">
                          {n.text}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-[var(--star-dim)]">
                    Click a point with precomputed neighbors to open its
                    full-space list.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-[var(--star-dim)]"
              >
                Click a point on the map. Neighborhoods mode opens the four
                candidate pockets from the homework close reading.
              </motion.p>
            )}
          </AnimatePresence>

          <div className="glass mt-5 border-[var(--ember)]/35 p-4">
            <div className="mono mb-2 text-[0.68rem] tracking-[0.1em] text-[var(--ember)] uppercase">
              Projection lie
            </div>
            <p className="text-sm leading-relaxed text-[var(--star-dim)]">
              Anchor “
              {(mismatchAnchor?.text ?? data.anchorMismatch.anchor).slice(0, 52)}
              …” looks near “
              {(
                mismatchNeighbor?.text ?? data.anchorMismatch.neighbor
              ).slice(0, 52)}
              …” in 2d, but full-space cosine is only{" "}
              <span className="mono text-[var(--star)]">
                {data.anchorMismatch.fullSpaceCosine.toFixed(3)}
              </span>
              . {data.anchorMismatch.note}
            </p>
          </div>
        </Beat>
      </StickyContext>

      <ChapterClose
        finding={data.keyFinding}
        whatChanged={data.whatChanged}
        bridge="Next: if neighborhoods hold images, can an n-gram invent a line without copying a run from the lyrics?"
      />
    </ChapterShell>
  );
}
