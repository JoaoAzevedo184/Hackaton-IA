import type { MatchState, ChatMessage } from "@/types";
import { api } from "../lib/api";
import { MOCK_MATCH, getSmartResponse } from "@/data";
import {
  CHAT_RESPONSE_MIN_DELAY_MS,
  CHAT_RESPONSE_JITTER_MS,
} from "@/constants";

/**
 * Camada de serviço para dados de partida.
 *
 * Estratégia de busca:
 * 1. Tenta buscar do backend interno (PostgreSQL) via /matches/:id
 * 2. Se falhar e o ID parecer numérico (BetsAPI), tenta /betsapi/event/:id
 *    e converte para o formato MatchState
 * 3. Se tudo falhar, cai no mock
 */

// ─── Config ──────────────────────────────────────────────────────────

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// ─── Match Data ──────────────────────────────────────────────────────

export async function fetchMatchState(
  matchId?: string,
): Promise<MatchState> {
  if (USE_MOCK) return MOCK_MATCH;

  const id = matchId || "match-1";

  // 1. Tenta buscar do banco interno
  try {
    return await api.get<MatchState>(`/matches/${id}`);
  } catch {
    // continua para próxima tentativa
  }

  // 2. Se o ID é numérico, tenta buscar da BetsAPI e converter
  if (/^\d+$/.test(id)) {
    try {
      const betsData = await api.get<any>(`/betsapi/event/${id}`);
      const converted = convertBetsApiToMatchState(betsData);
      if (converted) return converted;
    } catch {
      // continua para fallback
    }
  }

  // 3. Fallback: mock
  console.warn("⚠️ API indisponível, usando dados mock");
  return MOCK_MATCH;
}

// ─── Conversão BetsAPI → MatchState ──────────────────────────────────

function convertBetsApiToMatchState(data: any): MatchState | null {
  try {
    const results = data?.results ?? [];
    const event = Array.isArray(results) ? results[0] : results;
    if (!event) return null;

    const scores = event.ss?.split("-") ?? ["0", "0"];
    const homeScore = parseInt(scores[0]) || 0;
    const awayScore = parseInt(scores[1]) || 0;

    const timer = event.timer;
    const minute = timer ? `${timer.tm}:${String(timer.ts ?? 0).padStart(2, "0")}` : "0";
    const half = timer?.tt === "0" ? "1º Tempo" : timer?.tt === "1" ? "2º Tempo" : "";
    const isLive = event.time_status === "1";

    const stats = event.stats ?? {};

    // Gerar insights básicos a partir das stats disponíveis
    const insights = generateInsightsFromStats(
      stats,
      event.home?.name ?? "Casa",
      event.away?.name ?? "Fora",
      homeScore,
      awayScore,
    );

    // Gerar probabilidades estimadas
    const probability = estimateProbability(homeScore, awayScore, stats);

    // Gerar timeline a partir de eventos conhecidos
    const timeline = generateTimeline(event, stats);

    // Gerar heat points baseados nas stats
    const heatPoints = generateHeatPoints(stats);

    return {
      info: {
        league: event.league?.name ?? "Liga desconhecida",
        season: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
        round: undefined,
        home: {
          name: event.home?.name ?? "Casa",
          shortName: (event.home?.name ?? "CAS").substring(0, 3).toUpperCase(),
          logo: "🏠",
          score: homeScore,
        },
        away: {
          name: event.away?.name ?? "Fora",
          shortName: (event.away?.name ?? "FOR").substring(0, 3).toUpperCase(),
          logo: "✈️",
          score: awayScore,
        },
        minute,
        half,
        isLive,
      },
      probability,
      heatPoints,
      timeline,
      insights,
      betRecommendation: {
        recommendation: generateRecommendation(probability, event.home?.name, event.away?.name),
        confidence: Math.round(Math.max(probability.homeWin, probability.awayWin, probability.draw)),
      },
    };
  } catch (err) {
    console.warn("Erro ao converter dados BetsAPI:", err);
    return null;
  }
}

function estimateProbability(
  homeScore: number,
  awayScore: number,
  stats: any,
): { homeWin: number; draw: number; awayWin: number } {
  const possession = stats.possession_rt;
  const homePoss = possession ? parseFloat(possession[0]) || 50 : 50;
  const awayPoss = possession ? parseFloat(possession[1]) || 50 : 50;

  let homeBase = 33.3;
  let drawBase = 33.4;
  let awayBase = 33.3;

  // Ajustar baseado no placar
  if (homeScore > awayScore) {
    const diff = homeScore - awayScore;
    homeBase = Math.min(90, 50 + diff * 15);
    drawBase = Math.max(3, 25 - diff * 8);
    awayBase = 100 - homeBase - drawBase;
  } else if (awayScore > homeScore) {
    const diff = awayScore - homeScore;
    awayBase = Math.min(90, 50 + diff * 15);
    drawBase = Math.max(3, 25 - diff * 8);
    homeBase = 100 - awayBase - drawBase;
  } else {
    // Empate — ajustar pela posse
    drawBase = 40;
    homeBase = 30 + (homePoss - 50) * 0.3;
    awayBase = 100 - homeBase - drawBase;
  }

  // Normalizar
  const total = homeBase + drawBase + awayBase;
  return {
    homeWin: Math.round((homeBase / total) * 1000) / 10,
    draw: Math.round((drawBase / total) * 1000) / 10,
    awayWin: Math.round((awayBase / total) * 1000) / 10,
  };
}

function generateInsightsFromStats(
  stats: any,
  homeName: string,
  awayName: string,
  homeScore: number,
  awayScore: number,
): MatchState["insights"] {
  const insights: MatchState["insights"] = [];

  const possession = stats.possession_rt;
  if (possession) {
    const homePoss = parseFloat(possession[0]) || 0;
    const awayPoss = parseFloat(possession[1]) || 0;
    const dominant = homePoss > awayPoss ? homeName : awayName;
    const dominantPoss = Math.max(homePoss, awayPoss);

    insights.push({
      title: `${dominant} domina a posse`,
      text: `Com ${dominantPoss}% de posse de bola, ${dominant} controla o ritmo do jogo.`,
      confidence: 0.85,
      type: "trend",
    });
  }

  const onTarget = stats.on_target;
  if (onTarget) {
    const homeShots = parseInt(onTarget[0]) || 0;
    const awayShots = parseInt(onTarget[1]) || 0;
    const moreShots = homeShots > awayShots ? homeName : awayName;
    const shotCount = Math.max(homeShots, awayShots);

    insights.push({
      title: `${moreShots} mais perigoso`,
      text: `${shotCount} finalizações no alvo indicam pressão ofensiva de ${moreShots}.`,
      confidence: 0.78,
      type: "probability",
    });
  }

  const xg = stats.xg;
  if (xg) {
    const homeXg = parseFloat(xg[0]) || 0;
    const awayXg = parseFloat(xg[1]) || 0;

    insights.push({
      title: `xG: ${homeName} ${homeXg.toFixed(2)} vs ${awayName} ${awayXg.toFixed(2)}`,
      text: `Os gols esperados indicam ${homeXg > awayXg ? homeName : awayName} com melhor qualidade de finalizações.`,
      confidence: 0.9,
      type: "value",
    });
  }

  if (homeScore !== awayScore) {
    const leader = homeScore > awayScore ? homeName : awayName;
    const diff = Math.abs(homeScore - awayScore);

    insights.push({
      title: `${leader} lidera por ${diff} gol${diff > 1 ? "s" : ""}`,
      text: `Com o placar de ${homeScore}x${awayScore}, ${leader} está em vantagem.`,
      confidence: 0.95,
      type: "alert",
    });
  }

  // Garantir pelo menos um insight
  if (insights.length === 0) {
    insights.push({
      title: "Jogo equilibrado",
      text: "As estatísticas indicam um jogo disputado entre as duas equipes.",
      confidence: 0.7,
      type: "probability",
    });
  }

  return insights;
}

function generateTimeline(event: any, stats: any): MatchState["timeline"] {
  const timeline: MatchState["timeline"] = [];

  // Gerar eventos baseados nas stats
  const corners = stats.corners;
  if (corners) {
    const homeCorners = parseInt(corners[0]) || 0;
    const awayCorners = parseInt(corners[1]) || 0;
    if (homeCorners > 0) {
      timeline.push({ minute: 15, type: "corner", team: "home", description: `${homeCorners} escanteios para ${event.home?.name}` });
    }
    if (awayCorners > 0) {
      timeline.push({ minute: 30, type: "corner", team: "away", description: `${awayCorners} escanteios para ${event.away?.name}` });
    }
  }

  const yellows = stats.yellowcards;
  if (yellows) {
    if (parseInt(yellows[0]) > 0) {
      timeline.push({ minute: 25, type: "yellow", team: "home", description: `Cartão amarelo para ${event.home?.name}` });
    }
    if (parseInt(yellows[1]) > 0) {
      timeline.push({ minute: 40, type: "yellow", team: "away", description: `Cartão amarelo para ${event.away?.name}` });
    }
  }

  // Gols baseados no placar
  const scores = event.ss?.split("-") ?? ["0", "0"];
  const homeGoals = parseInt(scores[0]) || 0;
  const awayGoals = parseInt(scores[1]) || 0;

  for (let i = 0; i < homeGoals; i++) {
    timeline.push({
      minute: 20 + i * 20,
      type: "goal",
      team: "home",
      description: `Gol de ${event.home?.name}!`,
    });
  }
  for (let i = 0; i < awayGoals; i++) {
    timeline.push({
      minute: 35 + i * 20,
      type: "goal",
      team: "away",
      description: `Gol de ${event.away?.name}!`,
    });
  }

  return timeline.sort((a, b) => a.minute - b.minute);
}

function generateHeatPoints(stats: any): MatchState["heatPoints"] {
  const points: MatchState["heatPoints"] = [];
  const possession = stats.possession_rt;
  const homePoss = possession ? parseFloat(possession[0]) / 100 : 0.5;

  // Gerar pontos de calor baseados na posse
  const basePoints = [
    { x: 25, y: 50, intensity: homePoss },
    { x: 35, y: 35, intensity: homePoss * 0.8 },
    { x: 35, y: 65, intensity: homePoss * 0.7 },
    { x: 45, y: 50, intensity: 0.5 },
    { x: 50, y: 40, intensity: 0.4 },
    { x: 50, y: 60, intensity: 0.4 },
    { x: 65, y: 35, intensity: (1 - homePoss) * 0.7 },
    { x: 65, y: 65, intensity: (1 - homePoss) * 0.8 },
    { x: 75, y: 50, intensity: 1 - homePoss },
  ];

  return basePoints.map((p) => ({
    ...p,
    intensity: Math.max(0.1, Math.min(1, p.intensity)),
  }));
}

function generateRecommendation(
  probability: { homeWin: number; draw: number; awayWin: number },
  homeName?: string,
  awayName?: string,
): string {
  const home = homeName ?? "Casa";
  const away = awayName ?? "Fora";

  if (probability.homeWin > 60) {
    return `${home} está em vantagem clara. Considere aposta na vitória da casa.`;
  }
  if (probability.awayWin > 60) {
    return `${away} domina. Considere aposta na vitória do visitante.`;
  }
  if (probability.draw > 30) {
    return `Jogo equilibrado. O empate pode ter valor neste momento.`;
  }
  return `Análise em andamento. Aguarde mais dados para uma recomendação mais precisa.`;
}

// ─── Lista de partidas ───────────────────────────────────────────────

interface MatchSummary {
  id: string;
  league: string;
  status: string;
  minute: string;
  home: { name: string; shortName: string; logo: string; score: number };
  away: { name: string; shortName: string; logo: string; score: number };
  probability: { homeWin: number; draw: number; awayWin: number } | null;
}

export async function fetchMatches(status?: string): Promise<MatchSummary[]> {
  if (USE_MOCK) return [];
  try {
    const query = status ? `?status=${status}` : "";
    return await api.get<MatchSummary[]>(`/matches${query}`);
  } catch {
    return [];
  }
}

// ─── Chat / IA ───────────────────────────────────────────────────────

export async function sendChatMessage(
  _history: ChatMessage[],
  userMessage: string,
): Promise<string> {
  const jitter = Math.random() * CHAT_RESPONSE_JITTER_MS;
  await delay(CHAT_RESPONSE_MIN_DELAY_MS + jitter);
  return getSmartResponse(userMessage);
}

// ─── Health Check ────────────────────────────────────────────────────

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await api.healthCheck();
    return res.status === "ok";
  } catch {
    return false;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}