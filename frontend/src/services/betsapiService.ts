import { api } from "@/lib/api";

// ─── Tipos da BetsAPI ────────────────────────────────────────────────

export interface BetsApiTeam {
  id: string;
  name: string;
  image_id?: string | null;
  cc?: string | null;
}

export interface BetsApiScore {
  home: string;
  away: string;
}

export interface BetsApiTimer {
  tm: number;
  ts: number;
  tt: string; // "0" = 1st half, "1" = 2nd half
  ta: number; // added time
  md: number;
}

export interface BetsApiStats {
  possession_rt?: [string, string];
  on_target?: [string, string];
  off_target?: [string, string];
  corners?: [string, string];
  corner_h?: [string, string];
  attacks?: [string, string];
  dangerous_attacks?: [string, string];
  goals?: [string, string];
  yellowcards?: [string, string];
  redcards?: [string, string];
  substitutions?: [string, string];
  penalties?: [string, string];
  injuries?: [string, string];
  ball_safe?: [string, string];
  xg?: [string, string];
  fouls?: [string, string];
  offsides?: [string, string];
  saves?: [string, string];
  crosses?: [string, string];
  crossing_accuracy?: [string, string];
  passing_accuracy?: [string, string];
  key_passes?: [string, string];
  shots_blocked?: [string, string];
  action_areas?: [string, string];
  goalattempts?: [string, string];
  yellowred_cards?: [string, string];
}

export interface BetsApiEvent {
  id: string;
  sport_id: string;
  time: string;
  time_status: string;
  league: {
    id: string;
    name: string;
    cc?: string | null;
  };
  home: BetsApiTeam;
  away: BetsApiTeam;
  ss?: string;
  scores?: Record<string, BetsApiScore>;
  stats?: BetsApiStats;
  timer?: BetsApiTimer;
  bet365_id?: string;
  o_home?: BetsApiTeam;
  o_away?: BetsApiTeam;
  has_lineup?: string;
  extra?: Record<string, unknown>;
}

interface BetsApiResponse {
  success: number;
  pager?: { page: number; per_page: number; total: number };
  results: BetsApiEvent[];
}

// ─── API Calls ───────────────────────────────────────────────────────

export async function fetchInplayEvents(): Promise<BetsApiEvent[]> {
  try {
    const data = await api.get<BetsApiResponse>("/betsapi/inplay");
    return data.results || [];
  } catch (error) {
    console.warn("⚠️ Falha ao buscar jogos ao vivo:", error);
    return [];
  }
}

export async function fetchUpcomingEvents(
  day?: string,
  page = 1,
  cc?: string,
): Promise<{ events: BetsApiEvent[]; total: number }> {
  try {
    const params = new URLSearchParams({ page: String(page) });
    if (day) params.set("day", day);
    if (cc) params.set("cc", cc);
    const data = await api.get<BetsApiResponse>(`/betsapi/upcoming?${params.toString()}`);
    return { events: data.results || [], total: data.pager?.total ?? 0 };
  } catch (error) {
    console.warn("⚠️ Falha ao buscar próximos jogos:", error);
    return { events: [], total: 0 };
  }
}

export async function fetchEndedEvents(
  day: string,
  page = 1,
  cc?: string,
): Promise<{ events: BetsApiEvent[]; total: number }> {
  try {
    let query = `/betsapi/ended?day=${day}&page=${page}`;
    if (cc) query += `&cc=${cc}`;
    const data = await api.get<BetsApiResponse>(query);
    return { events: data.results || [], total: data.pager?.total ?? 0 };
  } catch (error) {
    console.warn(`⚠️ Falha ao buscar jogos do dia ${day}:`, error);
    return { events: [], total: 0 };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Verifica se é jogo de esports/virtual */
export function isEsports(event: BetsApiEvent): boolean {
  const name = event.league.name.toLowerCase();
  return (
    name.includes("esoccer") ||
    name.includes("efootball") ||
    name.includes("cyber") ||
    event.league.cc === null
  );
}

/** Extrai países únicos de uma lista de eventos */
export function extractCountries(
  events: BetsApiEvent[],
): { code: string; name: string }[] {
  const map = new Map<string, string>();
  for (const e of events) {
    const cc = e.league.cc;
    if (cc && !isEsports(e)) {
      map.set(cc, cc.toUpperCase());
    }
  }
  return Array.from(map.entries())
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

/** Conta eventos por país */
export function countByCountry(
  events: BetsApiEvent[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of events) {
    if (!isEsports(e)) {
      const cc = e.league.cc ?? "other";
      counts[cc] = (counts[cc] || 0) + 1;
    }
  }
  return counts;
}

/** Nomes de países por código */
export const COUNTRY_NAMES: Record<string, string> = {
  br: "Brasil",
  ar: "Argentina",
  mx: "México",
  us: "EUA",
  co: "Colômbia",
  cl: "Chile",
  uy: "Uruguai",
  py: "Paraguai",
  pe: "Peru",
  ec: "Equador",
  ve: "Venezuela",
  bo: "Bolívia",
  gb: "Inglaterra",
  es: "Espanha",
  de: "Alemanha",
  it: "Itália",
  fr: "França",
  pt: "Portugal",
  nl: "Holanda",
  be: "Bélgica",
  tr: "Turquia",
  jp: "Japão",
  kr: "Coreia do Sul",
  au: "Austrália",
  cn: "China",
  gt: "Guatemala",
  sv: "El Salvador",
  hn: "Honduras",
  pa: "Panamá",
  cr: "Costa Rica",
};

export function getCountryName(cc: string): string {
  return COUNTRY_NAMES[cc] || cc.toUpperCase();
}

export function formatDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function getLastNDays(n: number): { label: string; day: string }[] {
  const days: { label: string; day: string }[] = [];
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  for (let i = 0; i < n; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const label =
      i === 0 ? "Hoje" : i === 1 ? "Ontem" : `${weekdays[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
    days.push({ label, day: formatDay(date) });
  }
  return days;
}

export function getNextNDays(n: number): { label: string; day: string }[] {
  const days: { label: string; day: string }[] = [];
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  for (let i = 0; i < n; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const label =
      i === 0 ? "Hoje" : i === 1 ? "Amanhã" : `${weekdays[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
    days.push({ label, day: formatDay(date) });
  }
  return days;
}

export function formatTime(unixTimestamp: string): string {
  const date = new Date(Number(unixTimestamp) * 1000);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Recife",
  });
}

export function formatDateTime(unixTimestamp: string): string {
  const date = new Date(Number(unixTimestamp) * 1000);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Recife",
  });
}

export function formatTimeUntil(unixTimestamp: string): string {
  const now = Date.now();
  const target = Number(unixTimestamp) * 1000;
  const diff = target - now;

  if (diff <= 0) return "Em breve";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `em ${days}d`;
  }
  if (hours > 0) return `em ${hours}h${minutes > 0 ? `${minutes}min` : ""}`;
  return `em ${minutes}min`;
}

export function teamLogoUrl(imageId?: string | null): string {
  if (!imageId) return "";
  return `https://assets.b365api.com/images/team/m/${imageId}.png`;
}

export function flagUrl(cc?: string | null): string {
  if (!cc) return "";
  return `https://assets.b365api.com/images/flags/cc/${cc}.png`;
}

export function getHalfLabel(timer?: BetsApiTimer): string {
  if (!timer) return "";
  return timer.tt === "0" ? "1T" : "2T";
}