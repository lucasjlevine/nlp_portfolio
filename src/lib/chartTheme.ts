/** Shared Recharts styling for the dark portfolio theme. */

export const chartTick = { fill: "#c9d4f0", fontSize: 11 } as const;

/** Room for outside axis titles (rotated Y + bottom X). */
export const chartMargin = { top: 8, right: 16, left: 52, bottom: 48 } as const;

/** Vertical bar charts: category ticks on Y need less left, more for X title. */
export const chartMarginVertical = {
  top: 8,
  right: 20,
  left: 12,
  bottom: 48,
} as const;

export const chartTooltipStyle = {
  background: "#0f1528",
  border: "1px solid rgba(232,238,252,0.18)",
  borderRadius: 10,
  color: "#e8eefc",
  boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
} as const;

export const chartTooltipLabelStyle = {
  color: "#e8eefc",
  fontWeight: 600,
  marginBottom: 4,
} as const;

export const chartTooltipItemStyle = {
  color: "#c9d4f0",
} as const;

export const chartCursorFill = { fill: "rgba(124,108,255,0.1)" } as const;

const labelStyle = {
  fill: "#9aa8c7",
  fontSize: 11,
  fontFamily: "var(--font-mono), monospace",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
};

type AxisLabelOpts = {
  value: string;
  /** Horizontal axes default to bottom; vertical to left. */
  orient?: "x" | "y";
};

/**
 * Axis titles sit outside the tick band so they don't cover values.
 * Pair with chartMargin / chartMarginVertical.
 */
export function axisLabel({ value, orient = "x" }: AxisLabelOpts) {
  if (orient === "y") {
    return {
      value,
      angle: -90,
      position: "left" as const,
      dx: -8,
      style: { ...labelStyle, textAnchor: "middle" as const },
    };
  }
  return {
    value,
    position: "bottom" as const,
    dy: 14,
    offset: 0,
    style: { ...labelStyle, textAnchor: "middle" as const },
  };
}

/** Common Tooltip props: light text on dark panel. */
export const darkTooltipProps = {
  contentStyle: chartTooltipStyle,
  labelStyle: chartTooltipLabelStyle,
  itemStyle: chartTooltipItemStyle,
} as const;
