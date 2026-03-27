import { FC, useEffect, useRef, useMemo } from "react";
import type { EventHeatPoint } from "@/hooks/useTimelineHeatPoints";

interface HeatPoint {
  x: number;
  y: number;
  intensity: number;
}

interface HeatMap3DProps {
  points: HeatPoint[];
  eventPoints?: EventHeatPoint[];
  title?: string;
  homeLabel?: string;
  awayLabel?: string;
  currentMinute?: string;
}

const FIELD_X = 100;
const FIELD_Y = 60;

// ─── Event type → marker config ──────────────────────────────────────

const EVENT_MARKER_COLORS: Record<string, string> = {
  goal: "rgb(255, 215, 0)",
  shot: "rgb(255, 100, 50)",
  save: "rgb(0, 200, 255)",
  corner: "rgb(180, 180, 255)",
  yellow: "rgb(255, 230, 0)",
  red: "rgb(255, 30, 30)",
  substitution: "rgb(150, 255, 150)",
};

const EVENT_MARKER_SIZES: Record<string, number> = {
  goal: 22,
  shot: 14,
  save: 14,
  corner: 10,
  yellow: 12,
  red: 16,
  substitution: 8,
};

const EVENT_SYMBOLS: Record<string, string> = {
  goal: "diamond",
  shot: "circle",
  save: "square",
  corner: "cross",
  yellow: "square",
  red: "square",
  substitution: "circle",
};

// ─── Build pressure grid ─────────────────────────────────────────────

function buildPressureGrid(points: HeatPoint[]) {
  const zPlane: number[][] = [];
  const colorGrid: number[][] = [];

  for (let y = 0; y < FIELD_Y; y++) {
    const zRow: number[] = [];
    const cRow: number[] = [];
    for (let x = 0; x < FIELD_X; x++) {
      zRow.push(0);
      let pressure = 0;
      for (const p of points) {
        const py = (p.y / 100) * FIELD_Y;
        const px = p.x;
        const dist2 = (x - px) ** 2 + (y - py) ** 2;
        const sigma = 120 + p.intensity * 80;
        pressure += p.intensity * 20 * Math.exp(-dist2 / sigma);
      }
      cRow.push(pressure);
    }
    zPlane.push(zRow);
    colorGrid.push(cRow);
  }

  return { zPlane, colorGrid };
}

// ─── Build field lines ───────────────────────────────────────────────

function makeLine(x: number[], y: number[]): Record<string, unknown> {
  return {
    x, y,
    z: Array(x.length).fill(0.2),
    type: "scatter3d",
    mode: "lines",
    line: { color: "rgba(255,255,255,0.7)", width: 3 },
    hoverinfo: "none",
    showlegend: false,
  };
}

function buildFieldLines(): Record<string, unknown>[] {
  const lines: Record<string, unknown>[] = [];

  lines.push(makeLine([0, 100, 100, 0, 0], [0, 0, 60, 60, 0]));
  lines.push(makeLine([50, 50], [0, 60]));
  lines.push(makeLine([0, 16.5, 16.5, 0], [13.8, 13.8, 46.2, 46.2]));
  lines.push(makeLine([0, 5.5, 5.5, 0], [24.8, 24.8, 35.2, 35.2]));
  lines.push(makeLine([100, 83.5, 83.5, 100], [13.8, 13.8, 46.2, 46.2]));
  lines.push(makeLine([100, 94.5, 94.5, 100], [24.8, 24.8, 35.2, 35.2]));

  const cx: number[] = [];
  const cy: number[] = [];
  for (let i = 0; i <= 360; i += 5) {
    cx.push(50 + 9.15 * Math.cos((i * Math.PI) / 180));
    cy.push(30 + 9.15 * Math.sin((i * Math.PI) / 180));
  }
  lines.push(makeLine(cx, cy));

  const r = 2;
  for (const c of [
    { ox: 0, oy: 0, sx: 1, sy: 1 },
    { ox: 0, oy: 60, sx: 1, sy: -1 },
    { ox: 100, oy: 0, sx: -1, sy: 1 },
    { ox: 100, oy: 60, sx: -1, sy: -1 },
  ]) {
    const ax: number[] = [];
    const ay: number[] = [];
    for (let i = 0; i <= 90; i += 5) {
      const rad = (i * Math.PI) / 180;
      ax.push(c.ox + c.sx * r * Math.cos(rad));
      ay.push(c.oy + c.sy * r * Math.sin(rad));
    }
    lines.push(makeLine(ax, ay));
  }

  return lines;
}

// ─── Build event markers ─────────────────────────────────────────────

function buildEventMarkers(events: EventHeatPoint[]): Record<string, unknown>[] {
  if (events.length === 0) return [];

  const traces: Record<string, unknown>[] = [];

  for (const ev of events) {
    const py = (ev.y / 100) * FIELD_Y;
    const opacity = Math.max(0.3, 1 - ev.age * 0.7);
    const size = (EVENT_MARKER_SIZES[ev.eventType] ?? 12) * (1 - ev.age * 0.3);
    const color = EVENT_MARKER_COLORS[ev.eventType] ?? "rgb(255,255,255)";
    const symbol = EVENT_SYMBOLS[ev.eventType] ?? "circle";

    // Main marker floating above the field
    traces.push({
      x: [ev.x],
      y: [py],
      z: [0.5],
      type: "scatter3d",
      mode: "markers+text",
      marker: {
        size,
        color,
        opacity,
        symbol,
        line: { color: "white", width: 1 },
      },
      text: [ev.label],
      textposition: "top center",
      textfont: {
        size: 9,
        color: `rgba(255,255,255,${opacity})`,
        family: "JetBrains Mono, monospace",
      },
      hoverinfo: "text",
      hovertext: [ev.label],
      showlegend: false,
    });

    // Pulse ring for fresh events
    if (ev.age < 0.3) {
      traces.push({
        x: [ev.x],
        y: [py],
        z: [0.3],
        type: "scatter3d",
        mode: "markers",
        marker: {
          size: size * 2.5 * (1 + ev.age * 2),
          color: "rgba(0,0,0,0)",
          opacity: 0.4 * (1 - ev.age / 0.3),
          line: { color, width: 2 },
        },
        hoverinfo: "none",
        showlegend: false,
      });
    }
  }

  return traces;
}

// ─── Component ───────────────────────────────────────────────────────

const HeatMap3D: FC<HeatMap3DProps> = ({
  points,
  eventPoints = [],
  title = "Mapa de Calor 3D",
  homeLabel,
  awayLabel,
  currentMinute,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { zPlane, colorGrid } = useMemo(() => buildPressureGrid(points), [points]);
  const fieldLines = useMemo(() => buildFieldLines(), []);
  const eventMarkers = useMemo(() => buildEventMarkers(eventPoints), [eventPoints]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const plotlyUrl = "https://cdn.plot.ly/plotly-2.27.0.min.js";
    const existing = document.querySelector(`script[src="${plotlyUrl}"]`);

    function render() {
      const Plotly = (window as any).Plotly;
      if (!Plotly || !el) return;

      const surface = {
        z: zPlane,
        surfacecolor: colorGrid,
        type: "surface",
        opacity: 0.92,
        colorscale: [
          [0, "rgb(34,139,34)"],
          [0.3, "rgb(50,180,50)"],
          [0.5, "rgb(173,255,47)"],
          [0.7, "rgb(255,165,0)"],
          [1, "rgb(255,0,0)"],
        ],
        showscale: false,
        hoverinfo: "none",
      };

      const data = [surface, ...fieldLines, ...eventMarkers];

      const layout = {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        margin: { l: 0, r: 0, b: 0, t: 0 },
        scene: {
          xaxis: {
            title: "",
            showgrid: false,
            zeroline: false,
            showticklabels: false,
            range: [-5, 105],
          },
          yaxis: {
            title: "",
            showgrid: false,
            zeroline: false,
            showticklabels: false,
            range: [-5, 65],
          },
          zaxis: {
            title: "",
            showgrid: false,
            showticklabels: false,
            zeroline: false,
            range: [-1, 3],
          },
          aspectmode: "manual",
          aspectratio: { x: 2, y: 1.2, z: 0.08 },
          camera: { eye: { x: -0.4, y: -1.0, z: 1.6 } },
          bgcolor: "rgba(0,0,0,0)",
        },
      };

      const config = {
        responsive: true,
        displayModeBar: false,
        scrollZoom: true,
      };

      if ((el as any)._plotlyInit) {
        Plotly.react(el, data, layout, config);
      } else {
        Plotly.newPlot(el, data, layout, config);
        (el as any)._plotlyInit = true;
      }
    }

    if (existing && (window as any).Plotly) {
      render();
    } else if (!existing) {
      const script = document.createElement("script");
      script.src = plotlyUrl;
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    } else {
      existing.addEventListener("load", render);
    }
  }, [zPlane, colorGrid, fieldLines, eventMarkers]);

  // Cleanup on unmount only
  useEffect(() => {
    const el = containerRef.current;
    return () => {
      const Plotly = (window as any).Plotly;
      if (Plotly && el) {
        try { Plotly.purge(el); (el as any)._plotlyInit = false; } catch {}
      }
    };
  }, []);

  const activeCount = eventPoints.length;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {activeCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-live-pulse bg-live-pulse/10 px-2 py-0.5 rounded-full animate-live-dot">
              {activeCount} {activeCount === 1 ? "evento" : "eventos"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {currentMinute && (
            <span className="text-[10px] font-mono-data text-muted-foreground">{currentMinute}</span>
          )}
          {homeLabel && (
            <span className="text-xs font-medium text-primary px-2 py-0.5 rounded bg-primary/10">
              ← {homeLabel}
            </span>
          )}
          {awayLabel && (
            <span className="text-xs font-medium text-accent px-2 py-0.5 rounded bg-accent/10">
              {awayLabel} →
            </span>
          )}
        </div>
      </div>

      {/* 3D Field */}
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: "420px", background: "hsl(228, 50%, 7%)" }}
      />

      {/* Legend */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border">
        <div className="flex items-center gap-4 flex-wrap">
          {[
            { label: "Gol", color: "bg-yellow-400" },
            { label: "Chute", color: "bg-orange-500" },
            { label: "Defesa", color: "bg-cyan-400" },
            { label: "Cartão", color: "bg-red-500" },
            { label: "Escanteio", color: "bg-purple-300" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              <span className="text-[10px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground italic">Arraste para girar</span>
      </div>
    </div>
  );
};

export default HeatMap3D;