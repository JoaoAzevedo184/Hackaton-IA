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
 * Tenta buscar do backend (PostgreSQL). Se falhar, cai no mock.
 * Isso permite desenvolver o front sem depender do banco estar rodando.
 */

// ─── Config ──────────────────────────────────────────────────────────

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// ─── Match Data ──────────────────────────────────────────────────────

export async function fetchMatchState(
  matchId?: string,
): Promise<MatchState> {
  // Se forçou mock via env, retorna direto
  if (USE_MOCK) {
    return MOCK_MATCH;
  }

  try {
    const endpoint = matchId ? `/matches/${matchId}` : "/matches/match-1";
    return await api.get<MatchState>(endpoint);
  } catch (error) {
    console.warn(
      "⚠️ API indisponível, usando dados mock:",
      error instanceof Error ? error.message : error,
    );
    return MOCK_MATCH;
  }
}

// ─── Lista de partidas (para o Dashboard) ────────────────────────────

interface MatchSummary {
  id: string;
  league: string;
  status: string;
  minute: string;
  home: { name: string; shortName: string; logo: string; score: number };
  away: { name: string; shortName: string; logo: string; score: number };
  probability: { homeWin: number; draw: number; awayWin: number } | null;
}

export async function fetchMatches(
  status?: string,
): Promise<MatchSummary[]> {
  if (USE_MOCK) {
    return [];
  }

  try {
    const query = status ? `?status=${status}` : "";
    return await api.get<MatchSummary[]>(`/matches${query}`);
  } catch (error) {
    console.warn("⚠️ API indisponível para listagem:", error);
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

  // TODO: substituir por chamada à API de IA real
  // try {
  //   const res = await api.post<{ response: string }>("/chat", {
  //     history: _history,
  //     message: userMessage,
  //   });
  //   return res.response;
  // } catch {
  //   return getSmartResponse(userMessage);
  // }

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
