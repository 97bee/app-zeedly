"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal SVG sparkline. Renders a single smoothed line through `points`
 * filling the parent container. `tone` controls the stroke colour:
 *
 *   - "positive" / "negative": green or red trend
 *   - "auto" (default): infer from first vs last point
 *   - "neutral": muted grey
 *
 * The component scales to its container — set width/height on the wrapper.
 */
export function Sparkline({
  points,
  tone = "auto",
  className,
  showFill = false,
  strokeWidth = 1.6,
}: {
  points: number[];
  tone?: "auto" | "positive" | "negative" | "neutral";
  className?: string;
  showFill?: boolean;
  strokeWidth?: number;
}) {
  const id = useId();
  if (points.length < 2) {
    return (
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className={cn("h-full w-full", className)}
      >
        <line
          x1="0"
          y1="20"
          x2="100"
          y2="20"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 4"
          className="text-current opacity-30"
        />
      </svg>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 40;
  const pad = 2;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = pad + (1 - (p - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });

  const path = coords
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(" ");

  const inferred = points[points.length - 1] >= points[0] ? "positive" : "negative";
  const actualTone = tone === "auto" ? inferred : tone;
  const stroke =
    actualTone === "positive"
      ? "#34d399"
      : actualTone === "negative"
        ? "#f87171"
        : "currentColor";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("h-full w-full overflow-visible", className)}
    >
      {showFill ? (
        <>
          <defs>
            <linearGradient id={`fill-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${path} L ${w} ${h} L 0 ${h} Z`}
            fill={`url(#fill-${id})`}
          />
        </>
      ) : null}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className={
          actualTone === "neutral"
            ? "text-current opacity-40"
            : undefined
        }
      />
    </svg>
  );
}
