"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Node = {
  id: number;
  line: string;
  song: string;
  x?: number;
  y?: number;
};

type Edge = {
  source: number;
  target: number;
  score: number;
  kind: string;
  within: boolean;
};

type ViewBox = { x: number; y: number; w: number; h: number };

function clientToSvg(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

export function Hw4Network({
  nodes,
  edges,
  selectedId,
  onSelect,
}: {
  nodes: Node[];
  edges: Edge[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    lastX: number;
    lastY: number;
  }>({ active: false, moved: false, lastX: 0, lastY: 0 });

  const positioned = useMemo(
    () => nodes.filter((n) => n.x != null && n.y != null) as (Node & {
      x: number;
      y: number;
    })[],
    [nodes],
  );

  const byId = useMemo(() => {
    const m = new Map<number, (typeof positioned)[number]>();
    for (const n of positioned) m.set(n.id, n);
    return m;
  }, [positioned]);

  const fit = useMemo((): ViewBox => {
    if (positioned.length === 0) return { x: 0, y: 0, w: 1, h: 1 };
    const xs = positioned.map((n) => n.x);
    const ys = positioned.map((n) => n.y);
    let minX = Math.min(...xs);
    let maxX = Math.max(...xs);
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);
    const spanX = Math.max(maxX - minX, 0.05);
    const spanY = Math.max(maxY - minY, 0.05);
    const pad = 0.1 * Math.max(spanX, spanY);
    minX -= pad;
    maxX += pad;
    minY -= pad;
    maxY += pad;
    // Keep a square view so the aspect-square container doesn't crop sides.
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const side = Math.max(maxX - minX, maxY - minY);
    return { x: midX - side / 2, y: midY - side / 2, w: side, h: side };
  }, [positioned]);

  const [view, setView] = useState<ViewBox>(fit);

  useEffect(() => {
    setView(fit);
  }, [fit]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const focus = clientToSvg(svg, e.clientX, e.clientY);
      const factor = e.deltaY > 0 ? 1.12 : 1 / 1.12;
      setView((prev) => {
        const nextW = Math.min(fit.w * 4, Math.max(fit.w * 0.25, prev.w * factor));
        const nextH = (nextW / prev.w) * prev.h;
        const scale = nextW / prev.w;
        return {
          x: focus.x - (focus.x - prev.x) * scale,
          y: focus.y - (focus.y - prev.y) * scale,
          w: nextW,
          h: nextH,
        };
      });
    };

    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [fit.w]);

  const strokeScale = Math.max(view.w, 0.5);

  return (
    <div className="relative mt-4 aspect-square w-full max-w-xl overflow-hidden rounded-xl border border-[var(--line)] bg-[rgba(5,8,20,0.55)]">
      <div className="pointer-events-none absolute top-2 left-2 z-10 mono text-[0.62rem] tracking-[0.08em] text-[var(--star-dim)] uppercase">
        Scroll zoom · drag pan
      </div>
      <button
        type="button"
        className="btn-quiet absolute top-2 right-2 z-10"
        onClick={() => setView(fit)}
      >
        Fit all
      </button>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="h-full w-full touch-none"
        style={{ cursor: dragRef.current.active ? "grabbing" : "grab" }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
          dragRef.current = {
            active: true,
            moved: false,
            lastX: e.clientX,
            lastY: e.clientY,
          };
        }}
        onPointerMove={(e) => {
          const drag = dragRef.current;
          if (!drag.active) return;
          const svg = svgRef.current;
          if (!svg) return;
          const prev = clientToSvg(svg, drag.lastX, drag.lastY);
          const next = clientToSvg(svg, e.clientX, e.clientY);
          const dx = next.x - prev.x;
          const dy = next.y - prev.y;
          if (Math.abs(e.clientX - drag.lastX) > 2 || Math.abs(e.clientY - drag.lastY) > 2) {
            drag.moved = true;
          }
          drag.lastX = e.clientX;
          drag.lastY = e.clientY;
          if (dx === 0 && dy === 0) return;
          setView((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
        }}
        onPointerUp={(e) => {
          const drag = dragRef.current;
          drag.active = false;
          try {
            (e.currentTarget as SVGSVGElement).releasePointerCapture(e.pointerId);
          } catch {
            /* already released */
          }
          // Empty-canvas click clears selection; node clicks set it before bubble.
          if (!drag.moved && (e.target as Element).tagName.toLowerCase() === "svg") {
            onSelect(null);
          }
        }}
        onPointerCancel={() => {
          dragRef.current.active = false;
        }}
      >
        {edges.map((e, i) => {
          const a = byId.get(e.source);
          const b = byId.get(e.target);
          if (!a || !b) return null;
          const hot =
            selectedId != null &&
            (e.source === selectedId || e.target === selectedId);
          return (
            <line
              key={`${e.source}-${e.target}-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={
                e.kind === "solid"
                  ? hot
                    ? "#f0c75e"
                    : "#3ee0b8"
                  : "rgba(124,108,255,0.35)"
              }
              strokeWidth={(e.kind === "solid" ? 0.006 : 0.003) * strokeScale}
              strokeDasharray={
                e.kind === "dashed"
                  ? `${0.02 * strokeScale} ${0.015 * strokeScale}`
                  : undefined
              }
              opacity={selectedId == null || hot ? 0.9 : 0.15}
              pointerEvents="none"
            />
          );
        })}
        {positioned.map((n) => (
          <circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r={(selectedId === n.id ? 0.018 : 0.012) * strokeScale}
            fill={selectedId === n.id ? "#f0c75e" : "#7ec8ff"}
            opacity={selectedId == null || selectedId === n.id ? 1 : 0.35}
            style={{ cursor: "pointer" }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(selectedId === n.id ? null : n.id);
            }}
          >
            <title>{n.line}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}
