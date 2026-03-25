// ─── Entidades principais ────────────────────────────────────────────

export interface Team {
  name: string;
  shortName: string;
  logo: string;
  score: number;
}

export interface MatchInfo {
  league: string;
  season: string;
  round?: string;
  home: Team;
  away: Team;
  minute: string;
  half: string;
  isLive: boolean;
}

// ─── Heat Map ────────────────────────────────────────────────────────

export interface HeatPoint {
  x: number; // 0-100 (percentual do campo)
  y: number; // 0-100
  intensity: number; // 0-1
}

// ─── Timeline ────────────────────────────────────────────────────────

export type TimelineEventType =
  | "goal"
  | "yellow"
  | "red"
  | "substitution"
  | "corner"
  | "shot"
  | "save";

export type TeamSide = "home" | "away";

export interface TimelineEvent {
  minute: number;
  type: TimelineEventType;
  team: TeamSide;
  description: string;
  player?: string;
}

// ─── Probabilidade ───────────────────────────────────────────────────

export interface MatchProbability {
  homeWin: number;
  draw: number;
  awayWin: number;
}

// ─── Insights IA ─────────────────────────────────────────────────────

export type InsightCategory = "probability" | "trend" | "value" | "alert";

export interface Insight {
  title: string;
  text: string;
  confidence: number; // 0-1
  type: InsightCategory;
}

// ─── Recomendação de aposta ──────────────────────────────────────────

export interface BetRecommendation {
  recommendation: string;
  confidence: number; // 0-100
}

// ─── Chat ────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

// ─── Estado completo de uma partida ──────────────────────────────────

export interface MatchState {
  info: MatchInfo;
  probability: MatchProbability;
  heatPoints: HeatPoint[];
  timeline: TimelineEvent[];
  insights: Insight[];
  betRecommendation: BetRecommendation;
}
