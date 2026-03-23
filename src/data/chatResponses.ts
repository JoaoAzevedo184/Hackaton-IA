/**
 * Respostas mock do assistente de chat.
 *
 * Quando a IA real estiver integrada, substituir por chamada à API.
 * A interface permanece a mesma: (input: string) => string
 */

interface ResponseRule {
  keywords: string[];
  response: string;
}

const RULES: ResponseRule[] = [
  {
    keywords: ["xg", "expected goal"],
    response:
      "**xG (Expected Goals)** mede a qualidade das finalizações. Um xG de 0.3 significa 30% de chance de gol naquele chute. Quanto maior o xG acumulado de um time, mais chances reais de gol ele criou. É ótimo pra identificar times que criam mais do que convertem — oportunidade de aposta!",
  },
  {
    keywords: ["handicap"],
    response:
      "**Handicap Asiático** dá vantagem ou desvantagem fictícia a um time. Ex: City **-1.5** significa que o City precisa ganhar por 2+ gols pra sua aposta valer. Paga odds maiores mas exige domínio claro. A IA analisa padrões do jogo pra te dizer quando o handicap tem **valor real**.",
  },
  {
    keywords: ["ao vivo", "live"],
    response:
      "**Apostar ao vivo** é onde a análise brilha! Dicas:\n\n• Observe os primeiros 15 min antes de apostar\n• Fique de olho no **xG** — times com xG alto sem gols tendem a converter\n• Substituições podem mudar tudo\n• Nossa IA atualiza probabilidades em **tempo real** pra te dar a melhor leitura do jogo 🎯",
  },
  {
    keywords: ["odd", "odds"],
    response:
      "**Odds** representam a probabilidade implícita de um resultado. Odd 2.00 = 50% de chance. Quanto **maior** a odd, menos provável mas maior o retorno. A IA compara as odds do mercado com o modelo estatístico — quando a diferença é grande, temos uma **aposta de valor**! 💰",
  },
  {
    keywords: ["over", "under", "gol"],
    response:
      "**Over/Under** é sobre total de gols. Over 2.5 = 3+ gols na partida. Dica: olhe o histórico recente dos times. Se ambos têm média alta de gols, Over é forte. A IA calcula a probabilidade baseada em xG, posse e padrões ofensivos em **tempo real**.",
  },
];

const FALLBACK_RESPONSE =
  "Boa pergunta! Posso te ajudar com:\n\n• **Odds e mercados** — como funcionam e onde está o valor\n• **Estratégias ao vivo** — quando e como apostar durante o jogo\n• **Análise de dados** — xG, posse, padrões táticos\n• **Termos de apostas** — handicap, over/under, ambas marcam\n\nSobre o que quer saber mais? 😊";

export function getSmartResponse(input: string): string {
  const normalized = input.toLowerCase();

  const match = RULES.find((rule) =>
    rule.keywords.some((kw) => normalized.includes(kw)),
  );

  return match?.response ?? FALLBACK_RESPONSE;
}
