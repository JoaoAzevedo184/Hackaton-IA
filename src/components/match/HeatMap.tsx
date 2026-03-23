import { FC, useRef, useEffect } from "react";

interface HeatPoint {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  intensity: number; // 0-1
}

interface HeatMapProps {
  points: HeatPoint[];
  title?: string;
  teamLabel?: string;
}

const HeatMap: FC<HeatMapProps> = ({ points, title = "Mapa de Calor", teamLabel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Draw pitch
    ctx.fillStyle = "hsl(142, 55%, 18%)";
    ctx.fillRect(0, 0, W, H);

    // Pitch lines
    ctx.strokeStyle = "hsla(142, 30%, 55%, 0.35)";
    ctx.lineWidth = 1.5;

    // Border
    const pad = 12;
    ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);

    // Center line
    ctx.beginPath();
    ctx.moveTo(W / 2, pad);
    ctx.lineTo(W / 2, H - pad);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2);
    ctx.stroke();

    // Penalty areas
    const penW = 80;
    const penH = 140;
    ctx.strokeRect(pad, H / 2 - penH / 2, penW, penH);
    ctx.strokeRect(W - pad - penW, H / 2 - penH / 2, penW, penH);

    // Goal areas
    const goalW = 30;
    const goalH = 70;
    ctx.strokeRect(pad, H / 2 - goalH / 2, goalW, goalH);
    ctx.strokeRect(W - pad - goalW, H / 2 - goalH / 2, goalW, goalH);

    // Draw heat map
    points.forEach((p) => {
      const px = (p.x / 100) * (W - pad * 2) + pad;
      const py = (p.y / 100) * (H - pad * 2) + pad;
      const radius = 25 + p.intensity * 20;

      const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);

      if (p.intensity > 0.7) {
        gradient.addColorStop(0, `hsla(0, 85%, 55%, ${p.intensity * 0.6})`);
        gradient.addColorStop(0.5, `hsla(30, 90%, 50%, ${p.intensity * 0.3})`);
        gradient.addColorStop(1, "hsla(0, 85%, 55%, 0)");
      } else if (p.intensity > 0.4) {
        gradient.addColorStop(0, `hsla(45, 90%, 55%, ${p.intensity * 0.55})`);
        gradient.addColorStop(0.5, `hsla(60, 80%, 50%, ${p.intensity * 0.25})`);
        gradient.addColorStop(1, "hsla(45, 90%, 55%, 0)");
      } else {
        gradient.addColorStop(0, `hsla(200, 80%, 55%, ${p.intensity * 0.5})`);
        gradient.addColorStop(0.5, `hsla(180, 60%, 50%, ${p.intensity * 0.2})`);
        gradient.addColorStop(1, "hsla(200, 80%, 55%, 0)");
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
    });
  }, [points]);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {teamLabel && (
          <span className="text-xs font-medium text-primary px-2 py-0.5 rounded bg-primary/10">
            {teamLabel}
          </span>
        )}
      </div>
      <div className="p-3">
        <canvas
          ref={canvasRef}
          width={560}
          height={360}
          className="w-full h-auto rounded"
          style={{ imageRendering: "auto" }}
        />
      </div>
      <div className="flex items-center justify-center gap-6 px-4 py-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-heat-low/60" />
          <span className="text-xs text-muted-foreground">Baixa</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-heat-mid/60" />
          <span className="text-xs text-muted-foreground">Média</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-heat-high/60" />
          <span className="text-xs text-muted-foreground">Alta</span>
        </div>
      </div>
    </div>
  );
};

export default HeatMap;
