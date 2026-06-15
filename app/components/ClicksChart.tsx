"use client";

import { useMemo, useState } from "react";
import type { CompanyClickSeries } from "@/lib/types";

const PALETTE = [
  "#E4AD25", // gold
  "#2F77BE", // blue
  "#1F9D4D", // green
  "#A23B9E", // magenta
  "#1A1A17", // ink
  "#B4862A", // deep gold
  "#5E5E5A", // grey
  "#CE9A1B", // gold hover
];

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

// SVG coordinate system (scaled responsively via viewBox).
const W = 920;
const H = 300;
const PAD = { top: 16, right: 16, bottom: 34, left: 40 };

export default function ClicksChart({ series }: { series: CompanyClickSeries }) {
  const maxDays = series.dayKeys.length;
  const [range, setRange] = useState<Range>(maxDays >= 30 ? 30 : 7);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const span = Math.min(range, maxDays);

  const labels = useMemo(
    () => series.labels.slice(maxDays - span),
    [series.labels, maxDays, span]
  );

  const lines = useMemo(
    () =>
      series.links.map((l, i) => {
        const daily = l.daily.slice(maxDays - span);
        return {
          id: l.id,
          label: l.label,
          color: PALETTE[i % PALETTE.length],
          daily,
          total: daily.reduce((n, x) => n + x, 0),
        };
      }),
    [series.links, maxDays, span]
  );

  const visible = lines.filter((l) => !hidden.has(l.id));
  const yMax = Math.max(1, ...visible.flatMap((l) => l.daily));

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const xAt = (i: number) =>
    PAD.left + (span <= 1 ? plotW / 2 : (i / (span - 1)) * plotW);
  const yAt = (v: number) => PAD.top + plotH - (v / yMax) * plotH;

  // Up to 4 horizontal gridlines with rounded tick values.
  const ticks = useMemo(() => {
    const steps = Math.min(4, yMax);
    const out: number[] = [];
    for (let i = 0; i <= steps; i++) out.push(Math.round((yMax / steps) * i));
    return Array.from(new Set(out));
  }, [yMax]);

  // Show ~7 x-axis labels max.
  const labelStep = Math.max(1, Math.ceil(span / 7));

  function toggle(id: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const noLinks = lines.length === 0;
  const noClicks = visible.every((l) => l.total === 0);

  return (
    <div className="panel chart-panel">
      <div className="chart-head">
        <div>
          <h3 className="h3" style={{ marginBottom: 4 }}>
            Clicks over time
          </h3>
          <p className="meta mb-0">Daily clicks per link</p>
        </div>
        <div className="range-group" role="group" aria-label="Date range">
          {RANGES.filter((r) => r <= maxDays || r === RANGES[0]).map((r) => (
            <button
              key={r}
              type="button"
              className={`range-btn${range === r ? " active" : ""}`}
              onClick={() => setRange(r)}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {noLinks ? (
        <div className="chart-empty">No links yet — create one to see click trends.</div>
      ) : (
        <>
          <div className="chart-canvas">
            <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label="Clicks over time">
              {ticks.map((t) => (
                <g key={t}>
                  <line
                    x1={PAD.left}
                    x2={W - PAD.right}
                    y1={yAt(t)}
                    y2={yAt(t)}
                    stroke="var(--border)"
                    strokeWidth={1}
                  />
                  <text
                    x={PAD.left - 8}
                    y={yAt(t) + 4}
                    textAnchor="end"
                    className="chart-axis"
                  >
                    {t}
                  </text>
                </g>
              ))}

              {labels.map((lab, i) =>
                i % labelStep === 0 || i === span - 1 ? (
                  <text
                    key={i}
                    x={xAt(i)}
                    y={H - PAD.bottom + 18}
                    textAnchor="middle"
                    className="chart-axis"
                  >
                    {lab}
                  </text>
                ) : null
              )}

              {visible.map((l) => {
                const d = l.daily
                  .map((v, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(v)}`)
                  .join(" ");
                return (
                  <g key={l.id}>
                    <path d={d} fill="none" stroke={l.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                    {span <= 31 &&
                      l.daily.map((v, i) => (
                        <circle key={i} cx={xAt(i)} cy={yAt(v)} r={2.8} fill={l.color}>
                          <title>{`${l.label} — ${labels[i]}: ${v} click${v === 1 ? "" : "s"}`}</title>
                        </circle>
                      ))}
                  </g>
                );
              })}
            </svg>
            {noClicks ? (
              <div className="chart-overlay">No clicks in this period</div>
            ) : null}
          </div>

          <div className="legend">
            {lines.map((l) => {
              const off = hidden.has(l.id);
              return (
                <button
                  key={l.id}
                  type="button"
                  className={`legend-item${off ? " off" : ""}`}
                  onClick={() => toggle(l.id)}
                  aria-pressed={!off}
                >
                  <span className="legend-swatch" style={{ background: l.color }} />
                  <span className="legend-label">{l.label}</span>
                  <span className="legend-total">{l.total}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
