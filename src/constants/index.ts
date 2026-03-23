import type { TimelineEventType, InsightCategory } from "@/types";

// ─── Mapeamento de ícones por tipo de evento ─────────────────────────

export const EVENT_ICONS: Record<TimelineEventType, string> = {
  goal: "⚽",
  yellow: "🟨",
  red: "🟥",
  substitution: "🔄",
  corner: "📐",
  shot: "🎯",
  save: "🧤",
};

// ─── Labels e cores por categoria de insight ─────────────────────────

export const INSIGHT_CONFIG: Record<
  InsightCategory,
  { label: string; className: string }
> = {
  probability: {
    label: "Probabilidade",
    className: "bg-primary/10 text-primary",
  },
  trend: {
    label: "Tendência",
    className: "bg-accent/10 text-accent",
  },
  value: {
    label: "Valor",
    className: "bg-heat-mid/10 text-heat-mid",
  },
  alert: {
    label: "Alerta",
    className: "bg-live-pulse/10 text-live-pulse",
  },
};

// ─── Chat ────────────────────────────────────────────────────────────

export const CHAT_QUICK_ACTIONS = [
  "O que é xG?",
  "Como funciona handicap?",
  "Dicas para apostar ao vivo",
] as const;

export const CHAT_INITIAL_MESSAGE =
  "Olá! 👋 Sou o assistente da **Esportes da Sorte**. Posso te ajudar com dúvidas sobre apostas, odds, mercados e estratégias. No que posso te ajudar?";

// ─── Animação ────────────────────────────────────────────────────────

export const INSIGHT_REVEAL_INTERVAL_MS = 350;
export const CHAT_RESPONSE_MIN_DELAY_MS = 800;
export const CHAT_RESPONSE_JITTER_MS = 700;
