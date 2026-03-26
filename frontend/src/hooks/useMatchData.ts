import { useQuery } from "@tanstack/react-query";
import { fetchMatchState } from "@/services";
import type { MatchState } from "@/types";

const LIVE_REFETCH_MS = 30_000; // Atualiza a cada 30s para jogos ao vivo

/**
 * Hook que carrega os dados da partida via React Query.
 *
 * - Busca primeiro do backend interno (PostgreSQL)
 * - Se o ID for numérico (BetsAPI), tenta converter dados da BetsAPI
 * - Fallback para dados mock
 * - Polling automático para jogos ao vivo
 */
export function useMatchData(matchId?: string) {
  return useQuery<MatchState>({
    queryKey: ["match", matchId],
    queryFn: () => fetchMatchState(matchId),
    refetchInterval: (query) => {
      // Habilita polling se o jogo estiver ao vivo
      const data = query.state.data;
      if (data?.info?.isLive) return LIVE_REFETCH_MS;
      return false;
    },
    staleTime: 15_000, // Dados ficam "frescos" por 15s
  });
}