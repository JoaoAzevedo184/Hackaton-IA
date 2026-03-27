import { FC, useRef, useEffect } from "react";
import type { HeatPoint } from "@/types";
import { drawPitch, drawHeatPoints } from "@/lib/pitchRenderer";


interface HeatMapProps {
  points: HeatPoint[];
  title?: string;
  teamLabel?: string;
}

const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 360;

const HeatMap: FC<HeatMapProps> = ({
  points,
  title = "Mapa de Calor",
  teamLabel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    drawPitch(ctx, canvas.width, canvas.height);
    drawHeatPoints(ctx, canvas.width, canvas.height, points);
  }, [points]);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <Header title={title} teamLabel={teamLabel} />
      <div className="p-3">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-auto rounded"
          style={{ imageRendering: "auto" }}
        />
      </div>
      <IntensityLegend />
    </div>
  );
};

// ─── Sub-componentes ─────────────────────────────────────────────────

const Header: FC<{ title: string; teamLabel?: string }> = ({
  title,
  teamLabel,
}) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {teamLabel && (
      <span className="text-xs font-medium text-primary px-2 py-0.5 rounded bg-primary/10">
        {teamLabel}
      </span>
    )}
  </div>
);

const INTENSITY_LEVELS = [
  { label: "Baixa", className: "bg-heat-low/60" },
  { label: "Média", className: "bg-heat-mid/60" },
  { label: "Alta", className: "bg-heat-high/60" },
] as const;

const IntensityLegend: FC = () => (
  <div className="flex items-center justify-center gap-6 px-4 py-2 border-t border-border">
    {INTENSITY_LEVELS.map((level) => (
      <div key={level.label} className="flex items-center gap-1.5">
        <span className={`w-3 h-3 rounded-sm ${level.className}`} />
        <span className="text-xs text-muted-foreground">{level.label}</span>
      </div>
    ))}
  </div>
);

export default HeatMap;
