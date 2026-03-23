import { useQuery } from "@tanstack/react-query";
import { fetchMatchState } from "@/services";
import type { MatchState } from "@/types";

/**
 * Hook que carrega os dados da partida via React Query.
 *
 * Quando o backend estiver pronto, basta ajustar `refetchInterval`
 * ou migrar para WebSocket sem mudar os componentes consumidores.
 */
export function useMatchData(matchId?: string) {
  return useQuery<MatchState>({
    queryKey: ["match", matchId],
    queryFn: () => fetchMatchState(matchId),
    // TODO: habilitar polling quando tiver dados reais
    // refetchInterval: 5_000,
    staleTime: Infinity, // mock não muda
  });
}
