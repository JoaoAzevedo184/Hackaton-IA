import type { HeatPoint } from "@/types";

// ─── Configuração do campo ───────────────────────────────────────────

const PITCH = {
  bg: "hsl(142, 55%, 18%)",
  lineColor: "hsla(142, 30%, 55%, 0.35)",
  lineWidth: 1.5,
  padding: 12,
  penaltyWidth: 80,
  penaltyHeight: 140,
  goalWidth: 30,
  goalHeight: 70,
  centerCircleRadius: 40,
} as const;

// ─── Cores do heatmap por faixa de intensidade ───────────────────────

interface HeatColorStop {
  offset: number;
  h: number;
  s: number;
  l: number;
  alphaMultiplier: number;
}

const HEAT_BANDS: { min: number; stops: HeatColorStop[] }[] = [
  {
    min: 0.7,
    stops: [
      { offset: 0, h: 0, s: 85, l: 55, alphaMultiplier: 0.6 },
      { offset: 0.5, h: 30, s: 90, l: 50, alphaMultiplier: 0.3 },
      { offset: 1, h: 0, s: 85, l: 55, alphaMultiplier: 0 },
    ],
  },
  {
    min: 0.4,
    stops: [
      { offset: 0, h: 45, s: 90, l: 55, alphaMultiplier: 0.55 },
      { offset: 0.5, h: 60, s: 80, l: 50, alphaMultiplier: 0.25 },
      { offset: 1, h: 45, s: 90, l: 55, alphaMultiplier: 0 },
    ],
  },
  {
    min: 0,
    stops: [
      { offset: 0, h: 200, s: 80, l: 55, alphaMultiplier: 0.5 },
      { offset: 0.5, h: 180, s: 60, l: 50, alphaMultiplier: 0.2 },
      { offset: 1, h: 200, s: 80, l: 55, alphaMultiplier: 0 },
    ],
  },
];

// ─── API pública ─────────────────────────────────────────────────────

export function drawPitch(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const { bg, lineColor, lineWidth, padding: p } = PITCH;

  ctx.clearRect(0, 0, w, h);

  // Fundo
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Linhas
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;

  // Borda
  ctx.strokeRect(p, p, w - p * 2, h - p * 2);

  // Linha central
  ctx.beginPath();
  ctx.moveTo(w / 2, p);
  ctx.lineTo(w / 2, h - p);
  ctx.stroke();

  // Círculo central
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, PITCH.centerCircleRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Áreas de penalti
  const { penaltyWidth: pw, penaltyHeight: ph } = PITCH;
  ctx.strokeRect(p, h / 2 - ph / 2, pw, ph);
  ctx.strokeRect(w - p - pw, h / 2 - ph / 2, pw, ph);

  // Áreas de gol
  const { goalWidth: gw, goalHeight: gh } = PITCH;
  ctx.strokeRect(p, h / 2 - gh / 2, gw, gh);
  ctx.strokeRect(w - p - gw, h / 2 - gh / 2, gw, gh);
}

export function drawHeatPoints(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  points: HeatPoint[],
) {
  const p = PITCH.padding;

  for (const point of points) {
    const px = (point.x / 100) * (w - p * 2) + p;
    const py = (point.y / 100) * (h - p * 2) + p;
    const radius = 25 + point.intensity * 20;

    const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
    const band = HEAT_BANDS.find((b) => point.intensity >= b.min)!;

    for (const stop of band.stops) {
      const alpha = point.intensity * stop.alphaMultiplier;
      gradient.addColorStop(
        stop.offset,
        `hsla(${stop.h}, ${stop.s}%, ${stop.l}%, ${alpha})`,
      );
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
  }
}
