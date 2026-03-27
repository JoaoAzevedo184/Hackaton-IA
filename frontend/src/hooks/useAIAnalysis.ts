import { useQuery } from "@tanstack/react-query";
import { fetchAIAnalysis } from "@/services/aiAnalysis";
import type { MatchState } from "@/types";

/**
 * Quando a partida carrega, manda as stats pro n8n
 * e o Edson devolve probabilidades + insights via IA.
 *
 * Se o n8n não responder, retorna null e o MatchDetail
 * usa as estimativas locais como fallback.
 */
export function useAIAnalysis(match: MatchState | undefined) {
  return useQuery({
    queryKey: ["ai-analysis", match?.info.home.name, match?.info.away.name, match?.info.home.score, match?.info.away.score],
    queryFn: () => {
      if (!match) return null;

      return fetchAIAnalysis({
        homeName: match.info.home.name,
        awayName: match.info.away.name,
        homeScore: match.info.home.score,
        awayScore: match.info.away.score,
        minute: match.info.minute,
        half: match.info.half,
        league: match.info.league,
        stats: {
          probability: match.probability,
          heatPoints: match.heatPoints.length,
          timeline: match.timeline.map((e) => `${e.minute}' ${e.type} ${e.team}`),
        },
      });
    },
    enabled: !!match, // Só roda quando tem dados da partida
    staleTime: 60_000, // Não refaz a cada re-render, só a cada 1 min
    retry: 1,
  });
}