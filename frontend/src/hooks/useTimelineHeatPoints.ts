import { useMemo } from "react";
import type { TimelineEvent, TeamSide, TimelineEventType } from "@/types";

export interface EventHeatPoint {
  x: number;
  y: number;
  intensity: number;
  age: number; // 0-1 (0 = just happened, 1 = about to fade)
  eventType: TimelineEventType;
  team: TeamSide;
  label: string;
}

// ─── Duração que o ponto fica visível (em minutos de jogo) ───────────
const EVENT_DURATION_MIN = 1;

// ─── Posições realistas por tipo de evento e lado do campo ───────────
//     HOME ataca pra direita (x→100), AWAY ataca pra esquerda (x→0)

interface FieldZone {
  x: [number, number]; // [home_x, away_x] — percentual do campo (0-100)
  y: [number, number]; // range [min, max] — aleatoriedade vertical
}

const EVENT_ZONES: Record<TimelineEventType, FieldZone> = {
  goal: {
    x: [92, 8],     // perto do gol adversário
    y: [25, 35],    // centro do gol
  },
  shot: {
    x: [82, 18],    // entrada da área
    y: [20, 40],
  },
  save: {
    x: [8, 92],     // perto do próprio gol (goleiro defende)
    y: [25, 35],
  },
  corner: {
    x: [97, 3],     // escanteio no campo adversário
    y: [2, 58],     // alterna entre os dois lados — vai ser randomizado
  },
  yellow: {
    x: [55, 45],    // meio de campo tendendo pro ataque
    y: [15, 45],
  },
  red: {
    x: [50, 50],    // meio de campo
    y: [15, 45],
  },
  substitution: {
    x: [50, 50],    // linha lateral / meio
    y: [0, 2],      // beira do campo
  },
};

const EVENT_INTENSITIES: Record<TimelineEventType, number> = {
  goal: 1.0,
  shot: 0.75,
  save: 0.8,
  corner: 0.5,
  yellow: 0.6,
  red: 0.85,
  substitution: 0.3,
};

const EVENT_LABELS: Record<TimelineEventType, string> = {
  goal: "⚽ GOL",
  shot: "🎯 Chute",
  save: "🧤 Defesa",
  corner: "📐 Escanteio",
  yellow: "🟨 Amarelo",
  red: "🟥 Vermelho",
  substitution: "🔄 Substituição",
};

// ─── Gera uma posição determinística mas variada por evento ──────────
function seededPosition(minute: number, index: number, range: [number, number]): number {
  // Pseudo-random baseado no minuto e índice (determinístico = sem flicker)
  const seed = Math.sin(minute * 13.37 + index * 7.91) * 0.5 + 0.5;
  return range[0] + seed * (range[1] - range[0]);
}

// ─── Hook principal ──────────────────────────────────────────────────

export function useTimelineHeatPoints(
  timeline: TimelineEvent[],
  currentMinuteStr: string,
): EventHeatPoint[] {
  const currentMinute = parseCurrentMinute(currentMinuteStr);

  return useMemo(() => {
    const points: EventHeatPoint[] = [];

    for (let i = 0; i < timeline.length; i++) {
      const event = timeline[i];
      const eventMinute = event.minute;
      const elapsed = currentMinute - eventMinute;

      // Só mostra eventos que aconteceram nos últimos EVENT_DURATION_MIN minutos
      if (elapsed < 0 || elapsed > EVENT_DURATION_MIN) continue;

      const zone = EVENT_ZONES[event.type];
      if (!zone) continue;

      const isHome = event.team === "home";
      const baseX = isHome ? zone.x[0] : zone.x[1];
      const yPos = seededPosition(eventMinute, i, zone.y);

      // Pequena variação no X pra não sobrepor eventos do mesmo tipo
      const xJitter = seededPosition(eventMinute, i + 100, [-3, 3]);

      const age = elapsed / EVENT_DURATION_MIN; // 0 = novo, 1 = sumindo

      points.push({
        x: Math.max(2, Math.min(98, baseX + xJitter)),
        y: yPos,
        intensity: EVENT_INTENSITIES[event.type] * (1 - age * 0.5), // fade parcial
        age,
        eventType: event.type,
        team: event.team,
        label: `${eventMinute}' ${EVENT_LABELS[event.type]}${event.player ? ` — ${event.player}` : ""}`,
      });
    }

    return points;
  }, [timeline, currentMinute]);
}

// ─── Parser do minuto atual ──────────────────────────────────────────

function parseCurrentMinute(raw: string): number {
  if (!raw) return 0;

  // "45+2" → 47
  const added = raw.match(/^(\d+)\+(\d+)$/);
  if (added) return parseInt(added[1]) + parseInt(added[2]);

  // "79:39" → 79.65
  const colon = raw.match(/^(\d+):(\d+)$/);
  if (colon) return parseInt(colon[1]) + parseInt(colon[2]) / 60;

  const plain = parseInt(raw);
  return isNaN(plain) ? 0 : plain;
}