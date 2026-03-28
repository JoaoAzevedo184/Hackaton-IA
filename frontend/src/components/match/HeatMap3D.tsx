import { FC, useEffect, useRef, useMemo } from "react";
import type { EventHeatPoint } from "@/hooks/useTimelineHeatPoints";
import type { PlayerDot } from "@/hooks/usePlayerPositions";

interface HeatPoint { x: number; y: number; intensity: number; }

interface HeatMap3DProps {
  points: HeatPoint[];
  eventPoints?: EventHeatPoint[];
  playerDots?: PlayerDot[];
  title?: string;
  homeLabel?: string;
  awayLabel?: string;
  currentMinute?: string;
}

const FIELD_X = 100;
const FIELD_Y = 60;

const EVENT_MARKER_COLORS: Record<string, string> = {
  goal: "rgb(255,215,0)", shot: "rgb(255,100,50)", save: "rgb(0,200,255)",
  corner: "rgb(180,180,255)", yellow: "rgb(255,230,0)", red: "rgb(255,30,30)",
  substitution: "rgb(150,255,150)",
};
const EVENT_MARKER_SIZES: Record<string, number> = {
  goal: 22, shot: 14, save: 14, corner: 10, yellow: 12, red: 16, substitution: 8,
};
const EVENT_SYMBOLS: Record<string, string> = {
  goal: "diamond", shot: "circle", save: "square", corner: "cross",
  yellow: "square", red: "square", substitution: "circle",
};

const PLAYER_COLORS = {
  home: "rgb(34,197,94)", away: "rgb(56,189,248)",
  homeGK: "rgb(250,204,21)", awayGK: "rgb(251,146,60)",
  homeHighlight: "rgb(255,255,100)", awayHighlight: "rgb(200,230,255)",
};

function buildPressureGrid(points: HeatPoint[]) {
  const zPlane: number[][] = [], colorGrid: number[][] = [];
  for (let y = 0; y < FIELD_Y; y++) {
    const zR: number[] = [], cR: number[] = [];
    for (let x = 0; x < FIELD_X; x++) {
      zR.push(0);
      let p = 0;
      for (const pt of points) {
        const py = (pt.y / 100) * FIELD_Y;
        const d2 = (x - pt.x) ** 2 + (y - py) ** 2;
        p += pt.intensity * 20 * Math.exp(-d2 / (120 + pt.intensity * 80));
      }
      cR.push(p);
    }
    zPlane.push(zR); colorGrid.push(cR);
  }
  return { zPlane, colorGrid };
}

function makeLine(x: number[], y: number[]): Record<string, unknown> {
  return { x, y, z: Array(x.length).fill(0.2), type: "scatter3d", mode: "lines",
    line: { color: "rgba(255,255,255,0.7)", width: 3 }, hoverinfo: "none", showlegend: false };
}

function buildFieldLines(): Record<string, unknown>[] {
  const L: Record<string, unknown>[] = [];
  L.push(makeLine([0,100,100,0,0],[0,0,60,60,0])); L.push(makeLine([50,50],[0,60]));
  L.push(makeLine([0,16.5,16.5,0],[13.8,13.8,46.2,46.2]));
  L.push(makeLine([0,5.5,5.5,0],[24.8,24.8,35.2,35.2]));
  L.push(makeLine([100,83.5,83.5,100],[13.8,13.8,46.2,46.2]));
  L.push(makeLine([100,94.5,94.5,100],[24.8,24.8,35.2,35.2]));
  const cx: number[] = [], cy: number[] = [];
  for (let i = 0; i <= 360; i += 5) {
    cx.push(50 + 9.15 * Math.cos(i * Math.PI / 180));
    cy.push(30 + 9.15 * Math.sin(i * Math.PI / 180));
  }
  L.push(makeLine(cx, cy));
  for (const c of [{ox:0,oy:0,sx:1,sy:1},{ox:0,oy:60,sx:1,sy:-1},{ox:100,oy:0,sx:-1,sy:1},{ox:100,oy:60,sx:-1,sy:-1}]) {
    const ax: number[] = [], ay: number[] = [];
    for (let i = 0; i <= 90; i += 5) { const r = i * Math.PI / 180; ax.push(c.ox + c.sx * 2 * Math.cos(r)); ay.push(c.oy + c.sy * 2 * Math.sin(r)); }
    L.push(makeLine(ax, ay));
  }
  return L;
}

function buildEventMarkers(events: EventHeatPoint[]): Record<string, unknown>[] {
  if (!events.length) return [];
  const T: Record<string, unknown>[] = [];
  for (const ev of events) {
    const py = (ev.y / 100) * FIELD_Y;
    const op = Math.max(0.3, 1 - ev.age * 0.7);
    const sz = (EVENT_MARKER_SIZES[ev.eventType] ?? 12) * (1 - ev.age * 0.3);
    const col = EVENT_MARKER_COLORS[ev.eventType] ?? "rgb(255,255,255)";
    T.push({ x:[ev.x], y:[py], z:[0.8], type:"scatter3d", mode:"markers+text",
      marker:{size:sz,color:col,opacity:op,symbol:EVENT_SYMBOLS[ev.eventType]??"circle",line:{color:"white",width:1}},
      text:[ev.label], textposition:"top center", textfont:{size:9,color:`rgba(255,255,255,${op})`,family:"JetBrains Mono, monospace"},
      hoverinfo:"text", hovertext:[ev.label], showlegend:false });
    if (ev.age < 0.3) {
      T.push({ x:[ev.x], y:[py], z:[0.5], type:"scatter3d", mode:"markers",
        marker:{size:sz*2.5,color:"rgba(0,0,0,0)",opacity:0.4*(1-ev.age/0.3),line:{color:col,width:2}},
        hoverinfo:"none", showlegend:false });
    }
  }
  return T;
}

function buildPlayerDots(players: PlayerDot[]): Record<string, unknown>[] {
  if (!players.length) return [];
  const T: Record<string, unknown>[] = [];

  for (const [team, baseColor, gkColor, hlColor] of [
    ["home", PLAYER_COLORS.home, PLAYER_COLORS.homeGK, PLAYER_COLORS.homeHighlight],
    ["away", PLAYER_COLORS.away, PLAYER_COLORS.awayGK, PLAYER_COLORS.awayHighlight],
  ] as [string, string, string, string][]) {
    const group = players.filter((p) => p.team === team);
    if (!group.length) continue;

    const xs = group.map((p) => p.x);
    const ys = group.map((p) => p.y);
    const colors = group.map((p) => p.highlight ? hlColor : p.role === "GK" ? gkColor : baseColor);
    const sizes = group.map((p) => p.highlight ? 12 : p.role === "GK" ? 10 : 8);

    // Player dots
    T.push({
      x: xs, y: ys, z: group.map(() => 0.4),
      type: "scatter3d", mode: "markers+text",
      marker: { size: sizes, color: colors, opacity: 0.9, symbol: "circle", line: { color: "rgba(0,0,0,0.6)", width: 1.5 } },
      text: group.map((p) => p.role),
      textposition: "top center",
      textfont: { size: 7, color: "rgba(255,255,255,0.7)", family: "JetBrains Mono, monospace" },
      hoverinfo: "text", hovertext: group.map((p) => p.label), showlegend: false,
    });

    // Shadow
    T.push({
      x: xs, y: ys, z: group.map(() => 0.15),
      type: "scatter3d", mode: "markers",
      marker: { size: group.map(() => 14), color: colors, opacity: 0.12, symbol: "circle" },
      hoverinfo: "none", showlegend: false,
    });

    // Highlight rings for involved players
    const highlighted = group.filter((p) => p.highlight);
    if (highlighted.length) {
      T.push({
        x: highlighted.map((p) => p.x),
        y: highlighted.map((p) => p.y),
        z: highlighted.map(() => 0.35),
        type: "scatter3d", mode: "markers",
        marker: {
          size: highlighted.map(() => 20),
          color: "rgba(0,0,0,0)",
          opacity: 0.5,
          line: { color: hlColor, width: 2 },
        },
        hoverinfo: "none", showlegend: false,
      });
    }
  }

  return T;
}

const HeatMap3D: FC<HeatMap3DProps> = ({
  points, eventPoints = [], playerDots = [],
  title = "Mapa de Calor 3D", homeLabel, awayLabel, currentMinute,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { zPlane, colorGrid } = useMemo(() => buildPressureGrid(points), [points]);
  const fieldLines = useMemo(() => buildFieldLines(), []);
  const eventMarkers = useMemo(() => buildEventMarkers(eventPoints), [eventPoints]);
  const playerTraces = useMemo(() => buildPlayerDots(playerDots), [playerDots]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const plotlyUrl = "https://cdn.plot.ly/plotly-2.27.0.min.js";
    const existing = document.querySelector(`script[src="${plotlyUrl}"]`);

    function render() {
      const Plotly = (window as any).Plotly;
      if (!Plotly || !el) return;
      const surface = {
        z: zPlane, surfacecolor: colorGrid, type: "surface", opacity: 0.88,
        colorscale: [[0,"rgb(34,139,34)"],[0.3,"rgb(50,180,50)"],[0.5,"rgb(173,255,47)"],[0.7,"rgb(255,165,0)"],[1,"rgb(255,0,0)"]],
        showscale: false, hoverinfo: "none",
      };
      const data = [surface, ...fieldLines, ...playerTraces, ...eventMarkers];
      const layout = {
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
        margin: { l:0,r:0,b:0,t:0 },
        scene: {
          xaxis:{title:"",showgrid:false,zeroline:false,showticklabels:false,range:[-5,105]},
          yaxis:{title:"",showgrid:false,zeroline:false,showticklabels:false,range:[-5,65]},
          zaxis:{title:"",showgrid:false,showticklabels:false,zeroline:false,range:[-1,3]},
          aspectmode:"manual", aspectratio:{x:2,y:1.2,z:0.08},
          camera:{eye:{x:-0.4,y:-1.0,z:1.6}},
          bgcolor:"rgba(0,0,0,0)",
        },
      };
      if ((el as any)._plotlyInit) Plotly.react(el, data, layout, {responsive:true,displayModeBar:false,scrollZoom:true});
      else { Plotly.newPlot(el, data, layout, {responsive:true,displayModeBar:false,scrollZoom:true}); (el as any)._plotlyInit = true; }
    }

    if (existing && (window as any).Plotly) render();
    else if (!existing) { const s = document.createElement("script"); s.src = plotlyUrl; s.async = true; s.onload = render; document.head.appendChild(s); }
    else existing.addEventListener("load", render);
  }, [zPlane, colorGrid, fieldLines, eventMarkers, playerTraces]);

  useEffect(() => {
    const el = containerRef.current;
    return () => { const P = (window as any).Plotly; if (P && el) { try { P.purge(el); (el as any)._plotlyInit = false; } catch {} } };
  }, []);

  const activeEvents = eventPoints.length;
  const showPlayers = playerDots.length > 0;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {activeEvents > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-live-pulse bg-live-pulse/10 px-2 py-0.5 rounded-full animate-live-dot">
              {activeEvents} {activeEvents === 1 ? "evento" : "eventos"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {currentMinute && <span className="text-[10px] font-mono-data text-muted-foreground">{currentMinute}</span>}
          {homeLabel && <span className="text-xs font-medium text-primary px-2 py-0.5 rounded bg-primary/10">← {homeLabel}</span>}
          {awayLabel && <span className="text-xs font-medium text-accent px-2 py-0.5 rounded bg-accent/10">{awayLabel} →</span>}
        </div>
      </div>

      <div ref={containerRef} className="w-full" style={{ height: "420px", background: "hsl(228, 50%, 7%)" }} />

      <div className="flex items-center justify-between px-4 py-2 border-t border-border">
        <div className="flex items-center gap-4 flex-wrap">
          {showPlayers && (
            <>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /><span className="text-[10px] text-muted-foreground">{homeLabel || "Casa"}</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /><span className="text-[10px] text-muted-foreground">{awayLabel || "Fora"}</span></div>
              <span className="text-border text-[10px]">|</span>
            </>
          )}
          {[{ label:"Gol",color:"bg-yellow-400" },{ label:"Chute",color:"bg-orange-500" },{ label:"Defesa",color:"bg-cyan-400" },{ label:"Cartão",color:"bg-red-500" }].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${l.color}`} /><span className="text-[10px] text-muted-foreground">{l.label}</span></div>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground italic">Arraste para girar</span>
      </div>
    </div>
  );
};

export default HeatMap3D;