"use client";

import { animate, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- */
/*  CountUp — animated number                                        */
/* ---------------------------------------------------------------- */

export function CountUp({ to, className }: { to: number; className?: string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const controls = animate(0, to, {
      duration: 1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [to]);
  return <span className={cn("tabular-nums", className)}>{value}</span>;
}

/* ---------------------------------------------------------------- */
/*  AreaChart — smooth, animated                                     */
/* ---------------------------------------------------------------- */

type Point = { label: string; value: number };

function catmullRom(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  const p = points;
  let d = `M ${p[0].x},${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(p.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function AreaChart({
  points,
  height = 180,
  accent = "#FF5A24",
}: {
  points: Point[];
  height?: number;
  accent?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const padX = 4;
  const padTop = 14;
  const padBottom = 24;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const max = Math.max(2, ...points.map((p) => p.value));

  const coords = points.map((p, i) => ({
    x: padX + (i / Math.max(1, points.length - 1)) * innerW,
    y: padTop + innerH - (p.value / max) * innerH,
  }));

  const line = catmullRom(coords);
  const area = `${line} L ${coords[coords.length - 1]?.x ?? 0},${
    height - padBottom
  } L ${coords[0]?.x ?? 0},${height - padBottom} Z`;

  const hovered = hover !== null ? points[hover] : null;
  const hoverCoord = hover !== null ? coords[hover] : null;

  return (
    <div ref={ref} className="relative w-full">
      {points.every((p) => p.value === 0) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-xs text-ink-500">
          No completions in this window yet
        </div>
      )}
      <svg
        width="100%"
        height={height}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const i = Math.round(
            ((x - padX) / innerW) * (points.length - 1),
          );
          setHover(Math.max(0, Math.min(points.length - 1, i)));
        }}
        onMouseLeave={() => setHover(null)}
        className="block"
      >
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={width - padX}
            y1={padTop + innerH * f}
            y2={padTop + innerH * f}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="3 6"
          />
        ))}

        <motion.path
          d={area}
          fill="url(#area-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke={accent}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />

        {hoverCoord && (
          <g>
            <line
              x1={hoverCoord.x}
              x2={hoverCoord.x}
              y1={padTop}
              y2={height - padBottom}
              stroke="rgba(255,255,255,0.15)"
            />
            <circle
              cx={hoverCoord.x}
              cy={hoverCoord.y}
              r="4"
              fill={accent}
              stroke="#0c0c0f"
              strokeWidth="2"
            />
          </g>
        )}

        {points.map((p, i) =>
          i % Math.ceil(points.length / 7) === 0 ? (
            <text
              key={i}
              x={coords[i].x}
              y={height - 6}
              textAnchor="middle"
              className="fill-ink-500"
              fontSize="9.5"
            >
              {p.label}
            </text>
          ) : null,
        )}
      </svg>

      {hovered && hoverCoord && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-lg border border-white/10 bg-ink-800 px-2.5 py-1.5 text-center shadow-xl"
          style={{
            left: hoverCoord.x,
            top: Math.max(0, hoverCoord.y - 46),
          }}
        >
          <div className="text-[13px] font-semibold text-ink-50 tabular-nums">
            {hovered.value}
          </div>
          <div className="text-[10px] whitespace-nowrap text-ink-400">
            completed · {hovered.label}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Donut — status breakdown                                         */
/* ---------------------------------------------------------------- */

export function Donut({
  segments,
  size = 168,
  thickness = 15,
  centerLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;

  // Precompute cumulative fractions immutably (render must stay pure)
  const fracs = segments.map((s) => (total ? s.value / total : 0));
  const starts = fracs.map((_, i) => fracs.slice(0, i).reduce((a, b) => a + b, 0));

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={thickness}
        />
        {segments.map((seg, i) => {
          const dash = fracs[i] * c;
          const offset = -starts[i] * c;
          return (
            <motion.circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-ink-50 tabular-nums">
          <CountUp to={total} />
        </span>
        <span className="text-[11px] text-ink-400">{centerLabel}</span>
      </div>
    </div>
  );
}
