import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Tipos ───────────────────────────────────────────────────────────

export interface OddValue {
  label: string;
  value: string; // odd decimal como string
  header?: string; // ex: "Mais de 2.5", "Novorizontino"
  isHighlighted?: boolean;
}

export interface OddMarket {
  id: string;
  name: string;
  odds: OddValue[];
}

export interface OddCategory {
  name: string;
  markets: OddMarket[];
}

export interface MatchOddsData {
  categories: OddCategory[];
  available: boolean;
  updatedAt?: string;
}

// ─── Nomes dos mercados em PT-BR ─────────────────────────────────────

const MARKET_NAMES: Record<string, string> = {
  "1_1": "Resultado Final",
  "1_2": "Handicap Asiático",
  "1_3": "Total de Gols",
  "1_4": "Ambas Equipes Marcam",
  "1_5": "Dupla Chance",
  "1_6": "Resultado Exato",
  "1_7": "Intervalo/Final",
  "1_8": "Primeira Equipe a Marcar",
  "1_9": "Último a Marcar",
  "1_10": "Total de Gols Mandante",
  "1_11": "Total de Gols Visitante",
  "1_12": "Handicap Europeu",
  "1_13": "Resultado do 1º Tempo",
  "1_14": "Total de Gols 1º Tempo",
  "1_15": "Qual Equipe Vence o 1º Tempo",
  "1_16": "Nº Exato de Gols",
  "1_17": "Total de Escanteios",
  "1_18": "Total de Cartões",
};

const OUTCOME_NAMES: Record<string, Record<string, string>> = {
  "1_1": { "1": "Mandante", "X": "Empate", "2": "Visitante" },
  "1_4": { "yes": "Sim", "no": "Não" },
  "1_5": { "1X": "1X", "12": "12", "X2": "X2" },
};

const CATEGORY_MAP: Record<string, string> = {
  "1_1": "Resultado",
  "1_5": "Resultado",
  "1_6": "Resultado",
  "1_13": "Resultado",
  "1_15": "Resultado",
  "1_8": "Resultado",
  "1_3": "Total de Gols",
  "1_10": "Total de Gols",
  "1_11": "Total de Gols",
  "1_14": "Total de Gols",
  "1_16": "Total de Gols",
  "1_4": "Partida",
  "1_7": "Partida",
  "1_2": "Handicaps",
  "1_12": "Handicaps",
  "1_17": "Especiais",
  "1_18": "Especiais",
};

// ─── Fetch e parse ───────────────────────────────────────────────────

async function fetchOdds(eventId: string): Promise<MatchOddsData> {
  try {
    const data = await api.get<any>(`/betsapi/odds/${eventId}`);
    const results = data?.results ?? {};

    const categoriesMap = new Map<string, OddMarket[]>();

    // A BetsAPI retorna odds agrupadas por bookmaker e market
    // Vamos pegar as odds do primeiro bookmaker disponível pra cada mercado
    for (const [marketKey, marketData] of Object.entries(results)) {
      if (!marketData || typeof marketData !== "object") continue;

      const marketName = MARKET_NAMES[marketKey] || `Mercado ${marketKey}`;
      const categoryName = CATEGORY_MAP[marketKey] || "Outros";

      // marketData pode ser um array de bookmakers ou objeto
      const bookmakers = Array.isArray(marketData) ? marketData : [marketData];

      for (const bookie of bookmakers) {
        if (!bookie?.odds) continue;

        const odds: OddValue[] = [];
        const rawOdds = Array.isArray(bookie.odds) ? bookie.odds : [bookie.odds];

        for (const odd of rawOdds) {
          if (!odd) continue;

          // Formato varia: pode ter {home, draw, away} ou {over, under} ou array
          if (odd.home_od || odd.draw_od || odd.away_od) {
            if (odd.home_od) odds.push({ label: getOutcomeName(marketKey, "1", "Mandante"), value: odd.home_od, header: odd.home_od });
            if (odd.draw_od) odds.push({ label: getOutcomeName(marketKey, "X", "Empate"), value: odd.draw_od, header: odd.draw_od });
            if (odd.away_od) odds.push({ label: getOutcomeName(marketKey, "2", "Visitante"), value: odd.away_od, header: odd.away_od });
          } else if (odd.over_od || odd.under_od) {
            const handicap = odd.handicap ?? "";
            if (odd.over_od) odds.push({ label: `Mais de ${handicap}`, value: odd.over_od, header: `Mais de ${handicap}` });
            if (odd.under_od) odds.push({ label: `Menos de ${handicap}`, value: odd.under_od, header: `Menos de ${handicap}` });
          } else if (odd.yes_od || odd.no_od) {
            if (odd.yes_od) odds.push({ label: "Sim", value: odd.yes_od });
            if (odd.no_od) odds.push({ label: "Não", value: odd.no_od });
          } else {
            // Formato genérico
            for (const [key, val] of Object.entries(odd)) {
              if (key.endsWith("_od") && typeof val === "string") {
                const name = key.replace("_od", "").replace(/_/g, " ");
                odds.push({ label: name, value: val });
              }
            }
          }
        }

        if (odds.length > 0) {
          // Marca a odd mais baixa como highlighted (favorita)
          const minOdd = Math.min(...odds.map((o) => parseFloat(o.value) || 99));
          odds.forEach((o) => {
            if (parseFloat(o.value) === minOdd) o.isHighlighted = true;
          });

          if (!categoriesMap.has(categoryName)) categoriesMap.set(categoryName, []);
          categoriesMap.get(categoryName)!.push({
            id: `${marketKey}_${bookie.bookmaker_id || "0"}`,
            name: marketName,
            odds,
          });
          break; // Pega só o primeiro bookmaker por mercado
        }
      }
    }

    // Ordena categorias
    const categoryOrder = ["Resultado", "Partida", "Total de Gols", "Handicaps", "Especiais", "Outros"];
    const categories: OddCategory[] = categoryOrder
      .filter((name) => categoriesMap.has(name))
      .map((name) => ({ name, markets: categoriesMap.get(name)! }));

    return {
      categories,
      available: categories.length > 0,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("⚠️ Odds não disponíveis:", error);
    return { categories: [], available: false };
  }
}

function getOutcomeName(marketKey: string, outcomeKey: string, fallback: string): string {
  return OUTCOME_NAMES[marketKey]?.[outcomeKey] ?? fallback;
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useMatchOdds(matchId?: string) {
  return useQuery<MatchOddsData>({
    queryKey: ["odds", matchId],
    queryFn: () => fetchOdds(matchId!),
    enabled: !!matchId && /^\d+$/.test(matchId),
    staleTime: 30_000,
    retry: 1,
  });
}