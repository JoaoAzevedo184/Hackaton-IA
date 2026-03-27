import { FC, useEffect, useRef, useMemo } from "react";

// Types matching the existing HeatPoint interface
interface HeatPoint {
  x: number; // 0-100
  y: number; // 0-100
  intensity: number; // 0-1
}

interface HeatMap3DProps {
  points: HeatPoint[];
  title?: string;
  homeLabel?: string;
  awayLabel?: string;
}

// ─── Field dimensions ────────────────────────────────────────────────
const FIELD_X = 100;
const FIELD_Y = 60;

// ─── Build pressure grid from heat points ────────────────────────────

function buildPressureGrid(points: HeatPoint[]) {
  const zPlane: number[][] = [];
  const colorGrid: number[][] = [];

  for (let y = 0; y < FIELD_Y; y++) {
    const zRow: number[] = [];
    const cRow: number[] = [];
    for (let x = 0; x < FIELD_X; x++) {
      zRow.push(0); // flat surface

      // Sum gaussian influence from each heat point
      let pressure = 0;
      for (const p of points) {
        // Map point.y (0-100) → field Y (0-60)
        const py = (p.y / 100) * FIELD_Y;
        const px = p.x; // already 0-100
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

// ─── Build field line traces ─────────────────────────────────────────

function makeLine(
  x: number[],
  y: number[],
  z?: number[],
): Record<string, unknown> {
  return {
    x,
    y,
    z: z ?? Array(x.length).fill(0.2),
    type: "scatter3d",
    mode: "lines",
    line: { color: "rgba(255,255,255,0.7)", width: 3 },
    hoverinfo: "none",
    showlegend: false,
  };
}

function buildFieldLines(): Record<string, unknown>[] {
  const lines: Record<string, unknown>[] = [];

  // Border + center line
  lines.push(makeLine([0, 100, 100, 0, 0], [0, 0, 60, 60, 0]));
  lines.push(makeLine([50, 50], [0, 60]));

  // Penalty areas (defense)
  lines.push(makeLine([0, 16.5, 16.5, 0], [13.8, 13.8, 46.2, 46.2]));
  lines.push(makeLine([0, 5.5, 5.5, 0], [24.8, 24.8, 35.2, 35.2]));

  // Penalty areas (attack)
  lines.push(makeLine([100, 83.5, 83.5, 100], [13.8, 13.8, 46.2, 46.2]));
  lines.push(makeLine([100, 94.5, 94.5, 100], [24.8, 24.8, 35.2, 35.2]));

  // Center circle
  const cx: number[] = [];
  const cy: number[] = [];
  for (let i = 0; i <= 360; i += 5) {
    cx.push(50 + 9.15 * Math.cos((i * Math.PI) / 180));
    cy.push(30 + 9.15 * Math.sin((i * Math.PI) / 180));
  }
  lines.push(makeLine(cx, cy));

  // Corner arcs
  const r = 2;
  const corners = [
    { ox: 0, oy: 0, sx: 1, sy: 1 },
    { ox: 0, oy: 60, sx: 1, sy: -1 },
    { ox: 100, oy: 0, sx: -1, sy: 1 },
    { ox: 100, oy: 60, sx: -1, sy: -1 },
  ];
  for (const c of corners) {
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

// ─── Component ───────────────────────────────────────────────────────

const HeatMap3D: FC<HeatMap3DProps> = ({
  points,
  title = "Mapa de Calor 3D",
  homeLabel,
  awayLabel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { zPlane, colorGrid } = useMemo(() => buildPressureGrid(points), [points]);
  const fieldLines = useMemo(() => buildFieldLines(), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Dynamically load Plotly from CDN
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

      const data = [surface, ...fieldLines];

      const layout = {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        margin: { l: 0, r: 0, b: 0, t: 0 },
        scene: {
          xaxis: {
            title: "",
            color: "rgba(255,255,255,0.5)",
            showgrid: false,
            zeroline: false,
            showticklabels: false,
            range: [-5, 105],
          },
          yaxis: {
            title: "",
            color: "rgba(255,255,255,0.5)",
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
            range: [-1, 2],
          },
          aspectmode: "manual",
          aspectratio: { x: 2, y: 1.2, z: 0.08 },
          camera: {
            eye: { x: -0.4, y: -1.0, z: 1.6 },
          },
          bgcolor: "rgba(0,0,0,0)",
        },
      };

      const config = {
        responsive: true,
        displayModeBar: false,
        scrollZoom: true,
      };

      Plotly.newPlot(el, data, layout, config);
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

    return () => {
      const Plotly = (window as any).Plotly;
      if (Plotly && el) {
        try {
          Plotly.purge(el);
        } catch {}
      }
    };
  }, [zPlane, colorGrid, fieldLines]);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-3">
          {homeLabel && (
            <span className="text-xs font-medium text-primary px-2 py-0.5 rounded bg-primary/10">
              {homeLabel}
            </span>
          )}
          {awayLabel && (
            <span className="text-xs font-medium text-accent px-2 py-0.5 rounded bg-accent/10">
              {awayLabel}
            </span>
          )}
        </div>
      </div>

      {/* 3D Canvas */}
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: "420px", background: "hsl(228, 50%, 7%)" }}
      />

      {/* Legend + hint */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border">
        <div className="flex items-center gap-5">
          {[
            { label: "Baixa", color: "bg-green-600" },
            { label: "Média", color: "bg-yellow-400" },
            { label: "Alta", color: "bg-orange-500" },
            { label: "Máxima", color: "bg-red-600" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${l.color}`} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground italic">
          Arraste para girar o campo
        </span>
      </div>
    </div>
  );
};

export default HeatMap3D;