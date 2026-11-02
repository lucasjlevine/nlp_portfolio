"use client";

import { useMemo } from "react";
import { ZoomablePlot, fitBounds } from "@/components/charts/ZoomablePlot";

type Point = { lemma: number; raw: number };

export function Hw4AblationScatter({
  scatter,
  threshold,
}: {
  scatter: Point[];
  threshold: number;
}) {
  // Negate Y so higher lemma scores sit at the top (matplotlib-style).
  const points = useMemo(
    () =>
      scatter.map((p) => ({
        x: p.raw,
        y: -p.lemma,
      })),
    [scatter],
  );

  const fit = useMemo(
    () =>
      fitBounds(
        [
          { x: 0, y: 0 },
          { x: 1, y: -1 },
          ...points,
        ],
        { pad: 0.06, square: true },
      ),
    [points],
  );

  return (
    <div>
      <div className="mono mb-3 text-[0.7rem] tracking-[0.1em] text-[var(--star-dim)] uppercase">
        Ablation · raw tokens vs lemmas · {scatter.length.toLocaleString()} pairs
      </div>
      <ZoomablePlot
        fit={fit}
        fitKey="ablation"
        aspectClassName="aspect-square max-w-xl"
        hint="Scroll zoom · drag pan"
      >
        {({ strokeScale }) => {
          const r = 0.0045 * strokeScale;
          const axisW = 0.002 * strokeScale;
          const dash = `${0.018 * strokeScale} ${0.012 * strokeScale}`;
          return (
            <>
              <rect
                x={0}
                y={-1}
                width={1}
                height={1}
                fill="none"
                stroke="rgba(232,238,252,0.12)"
                strokeWidth={axisW}
                pointerEvents="none"
              />
              {[0.2, 0.4, 0.6, 0.8].map((t) => (
                <g key={t} pointerEvents="none">
                  <line
                    x1={t}
                    y1={0}
                    x2={t}
                    y2={-1}
                    stroke="rgba(232,238,252,0.06)"
                    strokeWidth={axisW * 0.7}
                  />
                  <line
                    x1={0}
                    y1={-t}
                    x2={1}
                    y2={-t}
                    stroke="rgba(232,238,252,0.06)"
                    strokeWidth={axisW * 0.7}
                  />
                </g>
              ))}
              <line
                x1={threshold}
                y1={0}
                x2={threshold}
                y2={-1}
                stroke="#ff6b6b"
                strokeWidth={axisW * 1.4}
                strokeDasharray={dash}
                opacity={0.9}
                pointerEvents="none"
              />
              <line
                x1={0}
                y1={-threshold}
                x2={1}
                y2={-threshold}
                stroke="#ff6b6b"
                strokeWidth={axisW * 1.4}
                strokeDasharray={dash}
                opacity={0.9}
                pointerEvents="none"
              />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill="#7ec8ff"
                  fillOpacity={0.28}
                  pointerEvents="none"
                />
              ))}
              <text
                x={0.5}
                y={0.08}
                textAnchor="middle"
                fill="#9aa8c7"
                fontSize={0.035 * strokeScale}
                fontFamily="var(--font-mono), monospace"
                pointerEvents="none"
              >
                TF-IDF cosine, raw tokens
              </text>
              <text
                x={-0.08}
                y={-0.5}
                textAnchor="middle"
                fill="#9aa8c7"
                fontSize={0.035 * strokeScale}
                fontFamily="var(--font-mono), monospace"
                transform="rotate(-90 -0.08 -0.5)"
                pointerEvents="none"
              >
                TF-IDF cosine, lemmas
              </text>
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => (
                <g key={`tick-${t}`} pointerEvents="none">
                  <text
                    x={t}
                    y={0.04}
                    textAnchor="middle"
                    fill="#9aa8c7"
                    fontSize={0.028 * strokeScale}
                    fontFamily="var(--font-mono), monospace"
                  >
                    {t.toFixed(1)}
                  </text>
                  <text
                    x={-0.025}
                    y={-t}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fill="#9aa8c7"
                    fontSize={0.028 * strokeScale}
                    fontFamily="var(--font-mono), monospace"
                  >
                    {t.toFixed(1)}
                  </text>
                </g>
              ))}
            </>
          );
        }}
      </ZoomablePlot>
      <p className="mt-2 text-xs text-[var(--star-dim)]">
        Red dashed lines mark T = {threshold.toFixed(2)}. Pairs above both wires
        clear the threshold under either tokenization.
      </p>
    </div>
  );
}
