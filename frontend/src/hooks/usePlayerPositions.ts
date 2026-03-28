import { useMemo } from "react";
import type { TimelineEvent, TimelineEventType, TeamSide } from "@/types";

export interface PlayerDot {
  x: number; // 0-100
  y: number; // 0-60 (field coords)
  team: "home" | "away";
  role: string;
  label: string;
  highlight?: boolean; // pulsing effect for involved players
}

// ─── Formação base 4-3-3 ─────────────────────────────────────────────

interface FormationSlot {
  role: string;
  baseX: number;
  baseY: number;
  mobility: number; // 0-1: quanto o jogador se movimenta
}

const FORMATION_433: FormationSlot[] = [
  { role: "GK",  baseX: 5,  baseY: 30, mobility: 0.1 },
  { role: "LD",  baseX: 22, baseY: 8,  mobility: 0.6 },
  { role: "ZAG", baseX: 18, baseY: 22, mobility: 0.3 },
  { role: "ZAG", baseX: 18, baseY: 38, mobility: 0.3 },
  { role: "LE",  baseX: 22, baseY: 52, mobility: 0.6 },
  { role: "VOL", baseX: 35, baseY: 18, mobility: 0.5 },
  { role: "MEI", baseX: 40, baseY: 30, mobility: 0.7 },
  { role: "VOL", baseX: 35, baseY: 42, mobility: 0.5 },
  { role: "PD",  baseX: 55, baseY: 10, mobility: 0.8 },
  { role: "CA",  baseX: 58, baseY: 30, mobility: 0.9 },
  { role: "PE",  baseX: 55, baseY: 50, mobility: 0.8 },
];

// ─── Cenários de jogo que afetam posicionamento ──────────────────────

type MatchMoment =
  | "neutral"           // Posse normal
  | "home_attacking"    // Casa atacando
  | "away_attacking"    // Visitante atacando
  | "home_corner"       // Escanteio da casa (todos no ataque)
  | "away_corner"       // Escanteio do visitante
  | "home_scored"       // Gol da casa (comemoração + reposição)
  | "away_scored"       // Gol do visitante
  | "home_defending"    // Casa recuada (levou pressão)
  | "away_defending"    // Visitante recuado
  | "home_card"         // Falta/cartão da casa (bola parada)
  | "away_card";

// Modifiers: [shiftX, compactY, spreadY]
// shiftX: quanto o bloco todo avança (+) ou recua (-)
// compactY: 1 = normal, <1 = compacto, >1 = espalhado
const MOMENT_MODIFIERS: Record<MatchMoment, { home: [number, number]; away: [number, number] }> = {
  neutral:        { home: [0, 1],      away: [0, 1] },
  home_attacking: { home: [12, 1.1],   away: [-5, 0.85] },
  away_attacking: { home: [-5, 0.85],  away: [12, 1.1] },
  home_corner:    { home: [25, 1.3],   away: [-8, 0.7] },
  away_corner:    { home: [-8, 0.7],   away: [25, 1.3] },
  home_scored:    { home: [8, 1.2],    away: [-3, 0.9] },
  away_scored:    { home: [-3, 0.9],   away: [8, 1.2] },
  home_defending: { home: [-10, 0.75], away: [8, 1.1] },
  away_defending: { home: [8, 1.1],    away: [-10, 0.75] },
  home_card:      { home: [-2, 0.9],   away: [2, 0.95] },
  away_card:      { home: [2, 0.95],   away: [-2, 0.9] },
};

// ─── Determina o momento do jogo baseado na timeline ─────────────────

function detectMoment(
  timeline: TimelineEvent[],
  currentMinute: number,
  homePossession: number,
): MatchMoment {
  // Pega o evento mais recente (nos últimos 2 minutos)
  const recentEvents = timeline
    .filter((e) => currentMinute - e.minute >= 0 && currentMinute - e.minute <= 2)
    .sort((a, b) => b.minute - a.minute);

  const latest = recentEvents[0];

  if (latest) {
    const age = currentMinute - latest.minute;

    // Eventos muito recentes (< 0.5 min) têm efeito forte
    if (age < 0.5) {
      switch (latest.type) {
        case "goal":
          return latest.team === "home" ? "home_scored" : "away_scored";
        case "corner":
          return latest.team === "home" ? "home_corner" : "away_corner";
        case "yellow":
        case "red":
          return latest.team === "home" ? "home_card" : "away_card";
        case "shot":
          return latest.team === "home" ? "home_attacking" : "away_attacking";
        case "save":
          // Goleiro defendeu = time adversário estava atacando
          return latest.team === "home" ? "away_attacking" : "home_attacking";
      }
    }

    // Eventos entre 0.5 - 1.5 min: efeito mais leve
    if (age < 1.5) {
      if (latest.type === "goal") {
        return latest.team === "home" ? "home_scored" : "away_scored";
      }
      if (latest.type === "corner") {
        return latest.team === "home" ? "home_attacking" : "away_attacking";
      }
    }
  }

  // Sem evento recente: usa posse pra definir quem ataca
  if (homePossession > 58) return "home_attacking";
  if (homePossession < 42) return "away_attacking";

  return "neutral";
}

// ─── Gera posição pseudo-aleatória determinística ────────────────────

function seeded(seed: number): number {
  return (Math.sin(seed * 127.1 + seed * 311.7) * 0.5 + 0.5);
}

function smoothWave(minute: number, freq: number, phase: number): number {
  return Math.sin(minute * freq + phase);
}

// ─── Gera posições de um time ────────────────────────────────────────

function generateTeam(
  team: "home" | "away",
  shiftX: number,
  spreadY: number,
  minute: number,
  recentEvent: TimelineEvent | null,
): PlayerDot[] {
  const isHome = team === "home";
  const timeSeed = Math.floor(minute * 2); // Muda posição a cada 0.5 min

  return FORMATION_433.map((slot, i) => {
    // Base position
    let x = isHome ? slot.baseX : 100 - slot.baseX;
    let y = slot.baseY;

    // Apply team shift (attacking/defending)
    if (isHome) {
      x += shiftX;
    } else {
      x -= shiftX;
    }

    // Apply vertical spread (compact/spread)
    const centerY = 30;
    y = centerY + (y - centerY) * spreadY;

    // ─── Movimento orgânico baseado no minuto ────────────────
    const mobility = slot.mobility;

    // Onda horizontal (avança/recua suavemente)
    const waveX = smoothWave(minute, 0.3 + i * 0.05, i * 1.7) * 3 * mobility;
    x += waveX;

    // Onda vertical (movimentação lateral)
    const waveY = smoothWave(minute, 0.2 + i * 0.07, i * 2.3) * 2.5 * mobility;
    y += waveY;

    // Micro-jitter pra não ficar mecânico (muda a cada 0.5 min)
    const jx = (seeded(timeSeed * 13 + i * 7) - 0.5) * 2 * mobility;
    const jy = (seeded(timeSeed * 17 + i * 11) - 0.5) * 1.5 * mobility;
    x += jx;
    y += jy;

    // ─── Reações específicas a eventos recentes ──────────────
    let highlight = false;

    if (recentEvent) {
      const eventAge = minute - recentEvent.minute;
      const eventOnThisTeam = recentEvent.team === team;
      const fadeout = Math.max(0, 1 - eventAge / 1.5); // 0-1, fades over 1.5 min

      if (recentEvent.type === "corner" && eventOnThisTeam && eventAge < 1) {
        // Escanteio: atacantes e meias vão pra área adversária
        if (slot.role !== "GK" && slot.role !== "LD" && slot.role !== "LE") {
          const targetX = isHome ? 88 : 12;
          const targetY = recentEvent.minute % 2 === 0 ? 20 : 40; // alterna lado
          x += (targetX - x) * 0.5 * fadeout;
          y += (targetY - y) * 0.3 * fadeout;
        }
        // Defensores: ficam na intermediária
        if (slot.role === "ZAG") {
          const safeX = isHome ? 55 : 45;
          x += (safeX - x) * 0.3 * fadeout;
        }
      }

      if (recentEvent.type === "goal" && eventAge < 1) {
        if (eventOnThisTeam) {
          // Comemoração: todos se juntam perto de quem marcou
          const celebX = isHome ? 80 + seeded(i * 31) * 10 : 10 + seeded(i * 31) * 10;
          const celebY = 25 + seeded(i * 47) * 10;
          x += (celebX - x) * 0.6 * fadeout;
          y += (celebY - y) * 0.6 * fadeout;
          highlight = true;
        } else {
          // Time que levou gol: volta pro meio pra reposição
          const resetX = isHome ? 35 : 65;
          x += (resetX - x) * 0.4 * fadeout;
        }
      }

      if (recentEvent.type === "shot" && eventOnThisTeam && eventAge < 0.5) {
        // Chute: atacantes concentrados na área
        if (["PD", "CA", "PE"].includes(slot.role)) {
          const shotX = isHome ? 85 : 15;
          x += (shotX - x) * 0.4 * fadeout;
          highlight = true;
        }
      }

      if (recentEvent.type === "save" && !eventOnThisTeam && eventAge < 0.5) {
        // Defesa do goleiro adversário: atacantes recuam um pouco
        if (["PD", "CA", "PE"].includes(slot.role)) {
          const pullbackX = isHome ? 65 : 35;
          x += (pullbackX - x) * 0.2 * fadeout;
        }
      }

      if ((recentEvent.type === "yellow" || recentEvent.type === "red") && eventAge < 0.8) {
        // Cartão: todo mundo para, pequena dispersão
        x += smoothWave(minute, 2, i) * 1.5 * fadeout;
        y += smoothWave(minute, 2.5, i + 3) * 1 * fadeout;
        if (eventOnThisTeam) {
          // Time que levou cartão recua um pouco
          x += (isHome ? -3 : 3) * fadeout;
        }
      }

      if (recentEvent.type === "substitution" && eventOnThisTeam && eventAge < 0.5) {
        // Substituição: jogadores se reorganizam
        const reshuffleX = isHome ? slot.baseX + 3 : 100 - slot.baseX - 3;
        x += (reshuffleX - x) * 0.3 * fadeout;
      }
    }

    // ─── Goleiro: sempre perto do gol ────────────────────────
    if (slot.role === "GK") {
      const gkX = isHome ? 4 : 96;
      const gkY = 30 + smoothWave(minute, 0.5, 0) * 4;
      x = gkX + (x - gkX) * 0.15; // só 15% do movimento geral
      y = gkY;
    }

    // Clamp
    x = Math.max(1, Math.min(99, x));
    y = Math.max(1, Math.min(59, y));

    return {
      x,
      y,
      team,
      role: slot.role,
      label: slot.role,
      highlight,
    };
  });
}

// ─── Parsers ─────────────────────────────────────────────────────────

function parseMinuteStr(raw: string): number {
  if (!raw) return 0;
  const colon = raw.match(/^(\d+):(\d+)$/);
  if (colon) return parseInt(colon[1]) + parseInt(colon[2]) / 60;
  const added = raw.match(/^(\d+)\+(\d+)$/);
  if (added) return parseInt(added[1]) + parseInt(added[2]);
  const plain = parseFloat(raw);
  return isNaN(plain) ? 0 : plain;
}

function parseStats(stats: Record<string, unknown>) {
  const get = (key: string, idx: number): number => {
    const val = stats[key];
    if (Array.isArray(val)) return parseFloat(String(val[idx])) || 0;
    return 0;
  };
  return {
    homePossession: get("possession_rt", 0) || 50,
    awayPossession: get("possession_rt", 1) || 50,
  };
}

// ─── Hook principal ──────────────────────────────────────────────────

export function usePlayerPositions(
  stats: Record<string, unknown>,
  currentMinuteStr: string,
  timeline: TimelineEvent[] = [],
): PlayerDot[] {
  const currentMinute = parseMinuteStr(currentMinuteStr);

  return useMemo(() => {
    const { homePossession } = parseStats(stats);

    // Detecta o momento do jogo
    const moment = detectMoment(timeline, currentMinute, homePossession);
    const modifiers = MOMENT_MODIFIERS[moment];

    // Evento mais recente (< 2 min)
    const recentEvent = timeline
      .filter((e) => currentMinute - e.minute >= 0 && currentMinute - e.minute <= 2)
      .sort((a, b) => b.minute - a.minute)[0] ?? null;

    const homePlayers = generateTeam(
      "home",
      modifiers.home[0],
      modifiers.home[1],
      currentMinute,
      recentEvent,
    );

    const awayPlayers = generateTeam(
      "away",
      modifiers.away[0],
      modifiers.away[1],
      currentMinute,
      recentEvent,
    );

    return [...homePlayers, ...awayPlayers];
  }, [stats, currentMinute, timeline]);
}