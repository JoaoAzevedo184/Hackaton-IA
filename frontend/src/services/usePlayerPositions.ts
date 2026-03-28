import { useMemo } from "react";

export interface PlayerDot {
  x: number; // 0-100
  y: number; // 0-60 (field coords)
  team: "home" | "away";
  role: string; // GK, DEF, MID, ATK
  label: string;
}

// ─── Formação base 4-3-3 (posições em % do campo) ───────────────────
// HOME ataca pra direita (x cresce), AWAY ataca pra esquerda

interface FormationPos {
  role: string;
  baseX: number; // 0-100 (home perspective)
  baseY: number; // 0-60
}

const FORMATION_433: FormationPos[] = [
  // Goleiro
  { role: "GK", baseX: 4, baseY: 30 },
  // Defesa
  { role: "LD", baseX: 22, baseY: 8 },
  { role: "ZAG", baseX: 18, baseY: 22 },
  { role: "ZAG", baseX: 18, baseY: 38 },
  { role: "LE", baseX: 22, baseY: 52 },
  // Meio
  { role: "VOL", baseX: 36, baseY: 20 },
  { role: "MEI", baseX: 40, baseY: 30 },
  { role: "VOL", baseX: 36, baseY: 40 },
  // Ataque
  { role: "PD", baseX: 55, baseY: 12 },
  { role: "CA", baseX: 58, baseY: 30 },
  { role: "PE", baseX: 55, baseY: 48 },
];

// ─── Parâmetros de deslocamento baseado em stats ─────────────────────

interface StatsInput {
  homePossession?: number; // 0-100
  awayPossession?: number;
  homeAttacks?: number;
  awayAttacks?: number;
  homeDangerousAttacks?: number;
  awayDangerousAttacks?: number;
}

function parseStats(stats: Record<string, unknown>): StatsInput {
  const get = (key: string, idx: number): number => {
    const val = stats[key];
    if (Array.isArray(val) && val[idx] !== undefined) {
      return parseFloat(String(val[idx])) || 0;
    }
    return 0;
  };

  return {
    homePossession: get("possession_rt", 0) || 50,
    awayPossession: get("possession_rt", 1) || 50,
    homeAttacks: get("attacks", 0),
    awayAttacks: get("attacks", 1),
    homeDangerousAttacks: get("dangerous_attacks", 0),
    awayDangerousAttacks: get("dangerous_attacks", 1),
  };
}

// ─── Gera posições dos jogadores ─────────────────────────────────────

function generateTeamPositions(
  team: "home" | "away",
  pressureShift: number, // -15 to +15 — quanto o time avança/recua
  spreadFactor: number, // 0.8 to 1.2 — quão compacto/espalhado
  jitterSeed: number,
): PlayerDot[] {
  return FORMATION_433.map((pos, i) => {
    // Pequena variação pseudo-aleatória pra não ficar estático
    const jx = Math.sin(jitterSeed * 7.3 + i * 3.7) * 2;
    const jy = Math.sin(jitterSeed * 5.1 + i * 2.3) * 1.5;

    let x: number;
    let y: number;

    if (team === "home") {
      // Home: posições normais + deslocamento de pressão
      x = pos.baseX + pressureShift + jx;
      y = pos.baseY + jy;
    } else {
      // Away: espelha no eixo X (100 - x)
      x = 100 - pos.baseX - pressureShift + jx;
      y = pos.baseY + jy;
    }

    // Aplica fator de espalhamento (compacta ou espalha a formação)
    const centerX = team === "home" ? 35 : 65;
    x = centerX + (x - centerX) * spreadFactor;

    // Clamp dentro do campo
    x = Math.max(1, Math.min(99, x));
    y = Math.max(1, Math.min(59, y));

    return {
      x,
      y,
      team,
      role: pos.role,
      label: pos.role,
    };
  });
}

// ─── Hook principal ──────────────────────────────────────────────────

export function usePlayerPositions(
  stats: Record<string, unknown>,
  currentMinuteStr: string,
): PlayerDot[] {
  // Usa o minuto como seed pra micro-movimentação
  const minuteNum = parseFloat(currentMinuteStr.split(":")[0]) || 0;

  return useMemo(() => {
    const parsed = parseStats(stats);
    const homePoss = parsed.homePossession ?? 50;
    const awayPoss = parsed.awayPossession ?? 50;

    // Calcula quanto cada time avança baseado na posse e ataques
    // Posse alta = time mais avançado
    const homePressure = ((homePoss - 50) / 50) * 12; // -12 a +12
    const awayPressure = ((awayPoss - 50) / 50) * 12;

    // Ataques perigosos = time mais espalhado na frente
    const homeSpread = 1 + ((parsed.homeDangerousAttacks ?? 0) / 100) * 0.15;
    const awaySpread = 1 + ((parsed.awayDangerousAttacks ?? 0) / 100) * 0.15;

    const homePlayers = generateTeamPositions(
      "home",
      homePressure,
      homeSpread,
      minuteNum,
    );
    const awayPlayers = generateTeamPositions(
      "away",
      awayPressure,
      awaySpread,
      minuteNum + 50, // seed diferente pro away
    );

    return [...homePlayers, ...awayPlayers];
  }, [stats, minuteNum]);
}