import type { MatchState, ChatMessage } from "@/types";
import { MOCK_MATCH, getSmartResponse } from "@/data";
import {
  CHAT_RESPONSE_MIN_DELAY_MS,
  CHAT_RESPONSE_JITTER_MS,
} from "@/constants";

/**
 * Camada de serviço para dados de partida.
 *
 * Atualmente retorna dados mock. Quando o backend (PostgreSQL + n8n)
 * estiver pronto, basta trocar a implementação aqui — os componentes
 * não precisam mudar.
 *
 * TODO: substituir por fetch/axios ao backend real
 * TODO: adicionar WebSocket para dados em tempo real
 */

// ─── Match Data ──────────────────────────────────────────────────────

export async function fetchMatchState(
  _matchId?: string,
): Promise<MatchState> {
  // Simula latência de rede
  await delay(300);
  return MOCK_MATCH;
}

// ─── Chat / IA ───────────────────────────────────────────────────────

export async function sendChatMessage(
  _history: ChatMessage[],
  userMessage: string,
): Promise<string> {
  // Simula latência variável da IA
  const jitter = Math.random() * CHAT_RESPONSE_JITTER_MS;
  await delay(CHAT_RESPONSE_MIN_DELAY_MS + jitter);

  // TODO: substituir por chamada à API de IA real
  return getSmartResponse(userMessage);
}

// ─── Helpers ─────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
