import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Tipos da BetsAPI Lineup ─────────────────────────────────────────

export interface LineupPlayer {
  id: string;
  name: string;
  number?: string;
  pos?: string;
  substitute?: boolean;
}

export interface LineupCoach {
  id: string;
  name: string;
}

export interface TeamLineup {
  coach?: LineupCoach;
  starters: LineupPlayer[];
  substitutes: LineupPlayer[];
  formation?: string;
}

export interface MatchLineup {
  home: TeamLineup;
  away: TeamLineup;
  available: boolean;
}

// ─── Fetch ───────────────────────────────────────────────────────────

async function fetchLineup(eventId: string): Promise<MatchLineup> {
  try {
    const data = await api.get<any>(`/betsapi/lineup/${eventId}`);
    const results = data?.results ?? {};

    const home = parseTeamLineup(results.home);
    const away = parseTeamLineup(results.away);

    const available = home.starters.length > 0 || away.starters.length > 0;

    return { home, away, available };
  } catch (error) {
    console.warn("⚠️ Lineup não disponível:", error);
    return {
      home: { starters: [], substitutes: [] },
      away: { starters: [], substitutes: [] },
      available: false,
    };
  }
}

function parseTeamLineup(data: any): TeamLineup {
  if (!data) return { starters: [], substitutes: [] };

  const coach: LineupCoach | undefined = data.coach
    ? { id: data.coach.id ?? "", name: data.coach.name ?? "Desconhecido" }
    : undefined;

  const formation: string | undefined = data.formation ?? undefined;

  const allPlayers: any[] = data.players ?? data.lineup ?? [];

  const starters: LineupPlayer[] = [];
  const substitutes: LineupPlayer[] = [];

  for (const p of allPlayers) {
    const player: LineupPlayer = {
      id: String(p.id ?? ""),
      name: p.name ?? "Jogador",
      number: p.shirt_number ?? p.number ?? undefined,
      pos: normalizePosition(p.pos ?? p.position ?? ""),
      substitute: p.substitute === true || p.substitute === "1" || p.lineup === "2",
    };

    if (player.substitute) {
      substitutes.push(player);
    } else {
      starters.push(player);
    }
  }

  return { coach, starters, substitutes, formation };
}

function normalizePosition(pos: string): string {
  const p = pos.toUpperCase().trim();
  if (p === "G" || p === "GK" || p === "GOALKEEPER") return "GOL";
  if (p === "D" || p === "DF" || p === "DEFENDER") return "DEF";
  if (p === "M" || p === "MF" || p === "MIDFIELDER") return "MEI";
  if (p === "F" || p === "FW" || p === "FORWARD" || p === "A") return "ATA";
  return p || "—";
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useLineup(matchId?: string) {
  return useQuery<MatchLineup>({
    queryKey: ["lineup", matchId],
    queryFn: () => fetchLineup(matchId!),
    enabled: !!matchId && /^\d+$/.test(matchId),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}