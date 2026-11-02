"use client";

import { useMemo, useState } from "react";
import type { Hw5Data, Hw5Point } from "@/lib/types";
import { ZoomablePlot, fitBounds } from "@/components/charts/ZoomablePlot";

const CATALOG_COLORS: Record<string, string> = {
  "Adrianne Lenker": "#7ec8ff",
  "Big Thief": "#e8a87c",
};

const NEIGHBORHOOD_COLORS: Record<string, string> = {
  "Birds, beasts & night landscape": "#2a9d8f",
  "Touch, skin & hands": "#e8a87c",
  "Care, touch & protection": "#9b7ede",
  "Dreaming & uneasy sleep": "#3ee0b8",
};

type Proj = "pca" | "tsne";
type Mode = "catalog" | "neighborhoods";
type CatalogFilter = "all" | "Adrianne Lenker" | "Big Thief";

type Mapped = Hw5Point & { x: number; y: number };

export function Hw5EmbeddingMap({
  data,
  selectedId,
  onSelect,
}: {
  data: Hw5Data;
  selectedId: string | null;
  onSelect: (point: Hw5Point | null) => void;
}) {
  const [proj, setProj] = useState<Proj>("tsne");
  const [mode, setMode] = useState<Mode>("catalog");
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const [focusHood, setFocusHood] = useState<string | "all">("all");
  const [hover, setHover] = useState<Mapped | null>(null);

  const mapped = useMemo((): Mapped[] => {
    return data.points.map((p) => ({
      ...p,
      x: proj === "pca" ? (p.pca_x ?? 0) : (p.t_sne_x ?? 0),
      // Flip Y so the map matches the homework figure orientation.
      y: -(proj === "pca" ? (p.pca_y ?? 0) : (p.t_sne_y ?? 0)),
    }));
  }, [data.points, proj]);

  const visible = useMemo(() => {
    if (mode === "neighborhoods") return mapped;
    return mapped.filter((p) => filter === "all" || p.label === filter);
  }, [mapped, mode, filter]);

  const hoodPoints = useMemo(() => {
    if (mode !== "neighborhoods") return [] as Mapped[];
    return mapped.filter((p) => {
      if (!p.neighborhood) return false;
      if (focusHood === "all") return true;
      return p.neighborhood === focusHood;
    });
  }, [mapped, mode, focusHood]);

  const readingList = useMemo(() => {
    if (mode !== "neighborhoods") return [] as Mapped[];
    return [...hoodPoints].sort((a, b) => {
      const na = a.neighborhood ?? "";
      const nb = b.neighborhood ?? "";
      if (na !== nb) return na.localeCompare(nb);
      return a.id.localeCompare(b.id);
    });
  }, [mode, hoodPoints]);

  const fit = useMemo(() => {
    const pts =
      mode === "neighborhoods" && focusHood !== "all" && hoodPoints.length > 0
        ? hoodPoints
        : visible;
    return fitBounds(pts, { pad: 0.1, square: true });
  }, [visible, hoodPoints, mode, focusHood]);

  const selected = selectedId
    ? (mapped.find((p) => p.id === selectedId) ?? null)
    : null;
  const preview = hover ?? selected;

  return (
    <div className="glass p-4 md:p-5">
      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            ["catalog", "By catalog"],
            ["neighborhoods", "Neighborhoods"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className="btn-quiet"
            data-active={mode === k}
            onClick={() => {
              setMode(k);
              setHover(null);
              if (k === "neighborhoods") setProj("tsne");
            }}
          >
            {label}
          </button>
        ))}
        {(
          [
            ["pca", "PCA"],
            ["tsne", "t-SNE"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className="chip"
            data-active={proj === k}
            onClick={() => setProj(k)}
          >
            {label}
          </button>
        ))}
        {mode === "catalog" &&
          (
            [
              ["all", "Both"],
              ["Adrianne Lenker", "Adrianne"],
              ["Big Thief", "Big Thief"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className="chip"
              data-active={filter === k}
              onClick={() => setFilter(k)}
            >
              {label}
            </button>
          ))}
      </div>

      {mode === "neighborhoods" && (
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="chip"
            data-active={focusHood === "all"}
            onClick={() => setFocusHood("all")}
          >
            All four
          </button>
          {data.neighborhoods.map((n) => (
            <button
              key={n.name}
              type="button"
              className="chip"
              data-active={focusHood === n.name}
              onClick={() => setFocusHood(n.name)}
              style={{
                borderColor:
                  focusHood === n.name
                    ? NEIGHBORHOOD_COLORS[n.name]
                    : undefined,
              }}
            >
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full"
                style={{ background: NEIGHBORHOOD_COLORS[n.name] ?? "#e8eefc" }}
              />
              {n.name.split("&")[0]?.trim() ?? n.name}
            </button>
          ))}
        </div>
      )}

      {mode === "neighborhoods" && (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.72rem] text-[var(--star-dim)]">
          {data.neighborhoods.map((n) => (
            <li key={n.name} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: NEIGHBORHOOD_COLORS[n.name] ?? "#e8eefc" }}
              />
              {n.name}
              <span className="mono text-[0.62rem] opacity-70">
                · cos {n.mean_full_space_cosine.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] lg:items-start">
        <ZoomablePlot
          fit={fit}
          fitKey={`${proj}-${mode}-${filter}-${focusHood}`}
          aspectClassName="aspect-square"
          onBackgroundClick={() => onSelect(null)}
        >
          {({ strokeScale }) => {
            const rBg = 0.008 * strokeScale;
            const rHood = 0.014 * strokeScale;
            const rSel = 0.018 * strokeScale;

            if (mode === "catalog") {
              return (
                <>
                  {visible.map((p) => {
                    const hot = selected?.id === p.id || hover?.id === p.id;
                    return (
                      <circle
                        key={p.id}
                        cx={p.x}
                        cy={p.y}
                        r={hot ? rSel : rBg * 1.2}
                        fill={CATALOG_COLORS[p.label] ?? "#e8eefc"}
                        fillOpacity={
                          selected && selected.id !== p.id ? 0.22 : 0.8
                        }
                        stroke={hot ? "#f0c75e" : "transparent"}
                        strokeWidth={0.004 * strokeScale}
                        style={{ cursor: "pointer" }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerEnter={() => setHover(p)}
                        onPointerLeave={() =>
                          setHover((h) => (h?.id === p.id ? null : h))
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(selected?.id === p.id ? null : p);
                        }}
                      />
                    );
                  })}
                </>
              );
            }

            return (
              <>
                {mapped.map((p) => {
                  if (p.neighborhood) return null;
                  return (
                    <circle
                      key={p.id}
                      cx={p.x}
                      cy={p.y}
                      r={rBg}
                      fill="#c9d4f0"
                      fillOpacity={0.14}
                      pointerEvents="none"
                    />
                  );
                })}
                {hoodPoints.map((p) => {
                  const hot = selected?.id === p.id || hover?.id === p.id;
                  const color =
                    NEIGHBORHOOD_COLORS[p.neighborhood ?? ""] ?? "#e8eefc";
                  return (
                    <circle
                      key={p.id}
                      cx={p.x}
                      cy={p.y}
                      r={hot ? rSel : rHood}
                      fill={color}
                      fillOpacity={0.95}
                      stroke={hot ? "#f0c75e" : "rgba(5,8,20,0.55)"}
                      strokeWidth={0.004 * strokeScale}
                      style={{ cursor: "pointer" }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerEnter={() => setHover(p)}
                      onPointerLeave={() =>
                        setHover((h) => (h?.id === p.id ? null : h))
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(selected?.id === p.id ? null : p);
                      }}
                    />
                  );
                })}
              </>
            );
          }}
        </ZoomablePlot>

        <aside className="min-h-[12rem] rounded-xl border border-[var(--line)] bg-[rgba(5,8,20,0.55)] p-4">
          {preview ? (
            <div>
              <div className="mono mb-2 text-[0.65rem] tracking-[0.1em] text-[var(--star-dim)] uppercase">
                {preview.id}
                {preview.neighborhood ? ` · ${preview.neighborhood}` : ""}
              </div>
              <p className="display text-[1.05rem] leading-snug text-[var(--star)]">
                “{preview.text}”
              </p>
              <p className="mt-3 text-sm text-[var(--star-dim)]">
                {preview.label} · {preview.song}
                {preview.album ? ` · ${preview.album}` : ""}
              </p>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-[var(--star-dim)]">
              {mode === "neighborhoods"
                ? "Hover a colored point to read the line, or skim the pocket list below."
                : "Hover or click a point to read the lyric."}
            </p>
          )}
        </aside>
      </div>

      {mode === "neighborhoods" && readingList.length > 0 && (
        <div className="mt-4 max-h-[28rem] space-y-4 overflow-y-auto pr-1">
          {(focusHood === "all"
            ? data.neighborhoods
            : data.neighborhoods.filter((n) => n.name === focusHood)
          ).map((n) => {
            const rows = readingList.filter((p) => p.neighborhood === n.name);
            if (rows.length === 0) return null;
            return (
              <section key={n.name}>
                <h3 className="mono mb-2 flex items-center gap-2 text-[0.7rem] tracking-[0.1em] text-[var(--star-dim)] uppercase">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{
                      background: NEIGHBORHOOD_COLORS[n.name] ?? "#e8eefc",
                    }}
                  />
                  {n.name}
                  <span className="opacity-70">
                    · {rows.length} lines · mean cos{" "}
                    {n.mean_full_space_cosine.toFixed(3)}
                  </span>
                </h3>
                <ul className="space-y-2">
                  {rows.map((p) => {
                    const hot = selected?.id === p.id;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                            hot
                              ? "border-[rgba(240,199,94,0.55)] bg-[rgba(240,199,94,0.08)]"
                              : "border-[var(--line)] bg-[rgba(5,8,20,0.4)] hover:border-[rgba(232,238,252,0.28)]"
                          }`}
                          onClick={() => onSelect(hot ? null : p)}
                          onMouseEnter={() => setHover(p)}
                          onMouseLeave={() =>
                            setHover((h) => (h?.id === p.id ? null : h))
                          }
                        >
                          <div className="mono mb-1 text-[0.62rem] tracking-[0.08em] text-[var(--star-dim)] uppercase">
                            {p.id} · {p.label} · {p.song}
                          </div>
                          <p className="text-sm leading-snug text-[var(--star)]">
                            “{p.text}”
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-xs text-[var(--star-dim)]">
        {mode === "neighborhoods"
          ? `${data.nPoints} passages · colored points are map-first candidates for close reading · full-space cosine is what I trust`
          : `Color is catalog. ${proj === "pca" ? "PCA" : "t-SNE"} is a sketch of the ${data.dims}-d space.`}
      </p>
    </div>
  );
}
