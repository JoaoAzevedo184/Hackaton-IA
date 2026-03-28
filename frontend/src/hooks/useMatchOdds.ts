import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Tipos ───────────────────────────────────────────────────────

export interface OddValue {
  label: string;
  value: string;
  header?: string;
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
  isEstimated?: boolean;
  updatedAt?: string;
}

// ─── Market config ───────────────────────────────────────────────

const MARKET_CONFIG: Record<string, { name: string; category: string; type: "1x2" | "ou" | "ah" }> = {
  "1_1": { name: "Resultado Final", category: "Resultado", type: "1x2" },
  "1_2": { name: "Handicap Asiático", category: "Handicaps", type: "ah" },
  "1_3": { name: "Total de Gols", category: "Total de Gols", type: "ou" },
  "1_4": { name: "Escanteios Asiáticos", category: "Especiais", type: "ou" },
  "1_5": { name: "Handicap 1º Tempo", category: "Handicaps", type: "ah" },
  "1_6": { name: "Total de Gols 1º Tempo", category: "Total de Gols", type: "ou" },
  "1_7": { name: "Total de Escanteios", category: "Especiais", type: "ou" },
  "1_8": { name: "Qual Equipe Vence o Restante?", category: "Resultado", type: "1x2" },
};

const CATEGORY_ORDER = ["Resultado", "Partida", "Total de Gols", "Handicaps", "Especiais"];

// ─── Helpers ─────────────────────────────────────────────────────

function isValidOdd(v: any): boolean {
  return v && v !== "-" && v !== "0" && v !== "" && !isNaN(parseFloat(v));
}

function markHighlighted(odds: OddValue[]) {
  const valid = odds.filter((o) => parseFloat(o.value) > 0);
  if (valid.length === 0) return;
  const minOdd = Math.min(...valid.map((o) => parseFloat(o.value)));
  for (const o of odds) {
    if (parseFloat(o.value) === minOdd) o.isHighlighted = true;
  }
}

function toOdd(prob: number): string {
  return (1 / prob * 1.05).toFixed(2); // margem 5%
}

// ─── Parsers por tipo de mercado ─────────────────────────────────

function parse1x2(entries: any[], marketKey: string, config: typeof MARKET_CONFIG[string]): OddMarket | null {
  // Pega a entrada mais recente com odds válidas (array já vem desc)
  for (const entry of entries) {
    if (isValidOdd(entry.home_od) && isValidOdd(entry.draw_od) && isValidOdd(entry.away_od)) {
      const odds: OddValue[] = [
        { label: "Mandante", value: entry.home_od },
        { label: "Empate", value: entry.draw_od },
        { label: "Visitante", value: entry.away_od },
      ];
      markHighlighted(odds);
      return { id: marketKey, name: config.name, odds };
    }
  }
  return null;
}

function parseOU(entries: any[], marketKey: string, config: typeof MARKET_CONFIG[string]): OddMarket[] {
  // Agrupa por handicap, pega a mais recente de cada
  const byHandicap = new Map<string, any>();

  for (const entry of entries) {
    const h = String(entry.handicap ?? "");
    if (!h || h.includes(",")) continue; // Pula handicaps compostos
    if (!isValidOdd(entry.over_od) || !isValidOdd(entry.under_od)) continue;
    if (!byHandicap.has(h)) {
      byHandicap.set(h, entry);
    }
  }

  // Ordena e pega até 5 linhas relevantes
  const sorted = Array.from(byHandicap.entries())
    .map(([h, entry]) => ({ h, val: parseFloat(h), entry }))
    .filter((x) => !isNaN(x.val))
    .sort((a, b) => a.val - b.val)
    .slice(0, 5);

  return sorted.map(({ h, entry }) => {
    const odds: OddValue[] = [
      { label: `Mais de ${h}`, value: entry.over_od },
      { label: `Menos de ${h}`, value: entry.under_od },
    ];
    markHighlighted(odds);
    return { id: `${marketKey}_${h}`, name: config.name, odds };
  });
}

function parseAH(entries: any[], marketKey: string, config: typeof MARKET_CONFIG[string]): OddMarket | null {
  // Pega a linha mais recente com handicap simples
  for (const entry of entries) {
    const h = String(entry.handicap ?? "");
    if (!h || h.includes(",")) continue;
    if (!isValidOdd(entry.home_od) || !isValidOdd(entry.away_od)) continue;

    const odds: OddValue[] = [
      { label: `Mandante (${h})`, value: entry.home_od },
      { label: `Visitante (${h})`, value: entry.away_od },
    ];
    markHighlighted(odds);
    return { id: marketKey, name: `${config.name} (${h})`, odds };
  }
  return null;
}

// ─── Odds estimadas por IA (fallback) ────────────────────────────

function generateEstimatedOdds(): MatchOddsData {
  const homeProb = 0.3 + Math.random() * 0.2;
  const drawProb = 0.2 + Math.random() * 0.1;
  const awayProb = 1 - homeProb - drawProb;

  const categories: OddCategory[] = [
    {
      name: "Resultado",
      markets: [
        {
          id: "est_1x2",
          name: "Resultado Final",
          odds: (() => {
            const odds: OddValue[] = [
              { label: "Mandante", value: toOdd(homeProb) },
              { label: "Empate", value: toOdd(drawProb) },
              { label: "Visitante", value: toOdd(awayProb) },
            ];
            markHighlighted(odds);
            return odds;
          })(),
        },
        {
          id: "est_rest",
          name: "Qual Equipe Vence o Restante?",
          odds: (() => {
            const hp = homeProb * (0.9 + Math.random() * 0.2);
            const dp = drawProb * (0.9 + Math.random() * 0.3);
            const ap = 1 - hp - dp > 0.1 ? 1 - hp - dp : 0.2;
            const odds: OddValue[] = [
              { label: "Mandante", value: toOdd(hp / (hp + dp + ap)) },
              { label: "Empate", value: toOdd(dp / (hp + dp + ap)) },
              { label: "Visitante", value: toOdd(ap / (hp + dp + ap)) },
            ];
            markHighlighted(odds);
            return odds;
          })(),
        },
      ],
    },
    {
      name: "Partida",
      markets: [
        {
          id: "est_btts",
          name: "Ambas Equipes Marcam",
          odds: (() => {
            const yesProb = 0.42 + Math.random() * 0.16;
            const odds: OddValue[] = [
              { label: "Sim", value: toOdd(yesProb) },
              { label: "Não", value: toOdd(1 - yesProb) },
            ];
            markHighlighted(odds);
            return odds;
          })(),
        },
      ],
    },
    {
      name: "Total de Gols",
      markets: [1.5, 2, 2.25, 2.5, 3.5].map((line) => {
        const overProb =
          line <= 1.5 ? 0.62 + Math.random() * 0.1 :
          line <= 2 ? 0.52 + Math.random() * 0.1 :
          line <= 2.25 ? 0.48 + Math.random() * 0.1 :
          line <= 2.5 ? 0.42 + Math.random() * 0.1 :
          0.28 + Math.random() * 0.1;
        const odds: OddValue[] = [
          { label: `Mais de ${line}`, value: toOdd(overProb) },
          { label: `Menos de ${line}`, value: toOdd(1 - overProb) },
        ];
        markHighlighted(odds);
        return { id: `est_ou_${line}`, name: "Total de Gols", odds };
      }),
    },
  ];

  return {
    categories,
    available: true,
    isEstimated: true,
    updatedAt: new Date().toISOString(),
  };
}

// ─── Fetch e parse principal ─────────────────────────────────────

async function fetchOdds(eventId: string): Promise<MatchOddsData> {
  try {
    const data = await api.get<any>(`/betsapi/odds/${eventId}`);
    const results = data?.results ?? {};

    const hasData = Object.keys(results).length > 0 &&
      Object.values(results).some((v: any) => Array.isArray(v) && v.length > 0);

    if (!hasData) {
      console.log("🤖 BetsAPI sem odds, gerando estimativas IA...");
      return generateEstimatedOdds();
    }

    const categoriesMap = new Map<string, OddMarket[]>();

    for (const [marketKey, marketData] of Object.entries(results)) {
      if (!Array.isArray(marketData) || marketData.length === 0) continue;

      const config = MARKET_CONFIG[marketKey];
      if (!config) continue;

      let markets: OddMarket[] = [];

      if (config.type === "1x2") {
        const m = parse1x2(marketData, marketKey, config);
        if (m) markets = [m];
      } else if (config.type === "ou") {
        markets = parseOU(marketData, marketKey, config);
      } else if (config.type === "ah") {
        const m = parseAH(marketData, marketKey, config);
        if (m) markets = [m];
      }

      if (markets.length > 0) {
        const cat = config.category;
        if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
        categoriesMap.get(cat)!.push(...markets);
      }
    }

    // Adiciona BTTS estimado se a categoria Partida não existe
    if (!categoriesMap.has("Partida")) {
      const yesProb = 0.42 + Math.random() * 0.16;
      const bttsOdds: OddValue[] = [
        { label: "Sim", value: toOdd(yesProb) },
        { label: "Não", value: toOdd(1 - yesProb) },
      ];
      markHighlighted(bttsOdds);
      categoriesMap.set("Partida", [
        { id: "est_btts", name: "Ambas Equipes Marcam", odds: bttsOdds },
      ]);
    }

    const categories: OddCategory[] = CATEGORY_ORDER
      .filter((name) => categoriesMap.has(name))
      .map((name) => ({ name, markets: categoriesMap.get(name)! }));

    if (categories.length === 0) {
      return generateEstimatedOdds();
    }

    return {
      categories,
      available: true,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("⚠️ Erro ao buscar odds, gerando estimativas:", error);
    return generateEstimatedOdds();
  }
}

// ─── Hook ────────────────────────────────────────────────────────

export function useMatchOdds(matchId?: string) {
  return useQuery<MatchOddsData>({
    queryKey: ["odds", matchId],
    queryFn: () => fetchOdds(matchId!),
    enabled: !!matchId && /^\d+$/.test(matchId),
    staleTime: 30_000,
    retry: 1,
  });
}