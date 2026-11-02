"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ViewBox = { x: number; y: number; w: number; h: number };

export function fitBounds(
  points: { x: number; y: number }[],
  opts?: { pad?: number; square?: boolean; fallback?: ViewBox },
): ViewBox {
  const fallback = opts?.fallback ?? { x: 0, y: 0, w: 1, h: 1 };
  if (points.length === 0) return fallback;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1e-6);
  const spanY = Math.max(maxY - minY, 1e-6);
  const pad = (opts?.pad ?? 0.08) * Math.max(spanX, spanY);
  minX -= pad;
  maxX += pad;
  minY -= pad;
  maxY += pad;
  if (opts?.square !== false) {
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const side = Math.max(maxX - minX, maxY - minY);
    return { x: midX - side / 2, y: midY - side / 2, w: side, h: side };
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

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

type Props = {
  fit: ViewBox;
  /** Re-fit when this key changes (projection, mode, …). */
  fitKey?: string | number;
  className?: string;
  aspectClassName?: string;
  hint?: string;
  children: (ctx: { view: ViewBox; strokeScale: number }) => ReactNode;
  onBackgroundClick?: () => void;
};

export function ZoomablePlot({
  fit,
  fitKey,
  className,
  aspectClassName = "aspect-square",
  hint = "Scroll zoom · drag pan",
  children,
  onBackgroundClick,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef({
    active: false,
    moved: false,
    lastX: 0,
    lastY: 0,
  });
  const [view, setView] = useState<ViewBox>(fit);

  useEffect(() => {
    setView(fit);
  }, [fit, fitKey]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const focus = clientToSvg(svg, e.clientX, e.clientY);
      const factor = e.deltaY > 0 ? 1.12 : 1 / 1.12;
      setView((prev) => {
        const nextW = Math.min(fit.w * 5, Math.max(fit.w * 0.15, prev.w * factor));
        const scale = nextW / prev.w;
        return {
          x: focus.x - (focus.x - prev.x) * scale,
          y: focus.y - (focus.y - prev.y) * scale,
          w: nextW,
          h: (nextW / prev.w) * prev.h,
        };
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [fit.w]);

  const reset = useCallback(() => setView(fit), [fit]);
  const strokeScale = Math.max(view.w, 0.35);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-[var(--line)] bg-[rgba(5,8,20,0.55)] ${aspectClassName} ${className ?? ""}`}
    >
      <div className="pointer-events-none absolute top-2 left-2 z-10 mono text-[0.62rem] tracking-[0.08em] text-[var(--star-dim)] uppercase">
        {hint}
      </div>
      <button
        type="button"
        className="btn-quiet absolute top-2 right-2 z-10"
        onClick={reset}
      >
        Fit all
      </button>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="h-full w-full touch-none"
        style={{ cursor: "grab" }}
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
          if (
            Math.abs(e.clientX - drag.lastX) > 2 ||
            Math.abs(e.clientY - drag.lastY) > 2
          ) {
            drag.moved = true;
          }
          drag.lastX = e.clientX;
          drag.lastY = e.clientY;
          const dx = next.x - prev.x;
          const dy = next.y - prev.y;
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
          if (
            !drag.moved &&
            (e.target as Element).tagName.toLowerCase() === "svg"
          ) {
            onBackgroundClick?.();
          }
        }}
        onPointerCancel={() => {
          dragRef.current.active = false;
        }}
      >
        {children({ view, strokeScale })}
      </svg>
    </div>
  );
}
