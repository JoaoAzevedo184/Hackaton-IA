import type { MatchState } from "@/types";

/**
 * Dados mock para desenvolvimento e demo.
 *
 * Quando a integração com PostgreSQL + n8n estiver pronta,
 * este arquivo será substituído por chamadas ao `matchService`.
 */
export const MOCK_MATCH: MatchState = {
  info: {
    league: "Premier League",
    season: "2025/26",
    round: "Rodada 28",
    home: { name: "Arsenal", shortName: "ARS", logo: "🔴", score: 0 },
    away: { name: "Manchester City", shortName: "MNC", logo: "🔵", score: 2 },
    minute: "90:01",
    half: "2º Tempo",
    isLive: true,
  },

  probability: {
    homeWin: 8.3,
    draw: 9.2,
    awayWin: 82.5,
  },

  heatPoints: [
    { x: 15, y: 30, intensity: 0.5 },
    { x: 20, y: 50, intensity: 0.7 },
    { x: 25, y: 65, intensity: 0.6 },
    { x: 35, y: 40, intensity: 0.8 },
    { x: 35, y: 55, intensity: 0.9 },
    { x: 40, y: 50, intensity: 0.75 },
    { x: 45, y: 35, intensity: 0.6 },
    { x: 45, y: 60, intensity: 0.55 },
    { x: 50, y: 50, intensity: 0.4 },
    { x: 55, y: 45, intensity: 0.35 },
    { x: 60, y: 30, intensity: 0.4 },
    { x: 60, y: 65, intensity: 0.3 },
    { x: 70, y: 50, intensity: 0.5 },
    { x: 75, y: 40, intensity: 0.6 },
    { x: 80, y: 50, intensity: 0.45 },
    { x: 85, y: 55, intensity: 0.3 },
  ],

  timeline: [
    { minute: 12, type: "shot", team: "home", player: "Saka", description: "Finalização de fora da área, defesa do goleiro." },
    { minute: 23, type: "corner", team: "away", player: "De Bruyne", description: "Escanteio pela direita, afastado pela defesa." },
    { minute: 34, type: "yellow", team: "home", player: "Rice", description: "Cartão amarelo por falta tática no meio-campo." },
    { minute: 41, type: "save", team: "home", player: "Raya", description: "Grande defesa em cabeceio de Haaland." },
    { minute: 52, type: "goal", team: "away", player: "Haaland", description: "Gol! Finalização de primeira dentro da área após cruzamento de Doku." },
    { minute: 64, type: "substitution", team: "home", player: "Havertz → Trossard", description: "Substituição tática, Arsenal busca mais velocidade." },
    { minute: 71, type: "goal", team: "away", player: "O'Reilly", description: "Gol! Chute de fora da área no canto direito." },
    { minute: 78, type: "shot", team: "home", player: "Saka", description: "Finalização perigosa, bola passa perto da trave." },
    { minute: 85, type: "corner", team: "home", player: "Ødegaard", description: "Escanteio pela esquerda, cabeceio por cima." },
    { minute: 90, type: "yellow", team: "away", player: "Gvardiol", description: "Cartão amarelo por falta na entrada da área." },
  ],

  insights: [
    {
      title: "Man City com 83% de chance de vitória",
      text: "Com 2x0 no placar e controle de 58% da posse, o modelo projeta vitória do City com alta confiança. Arsenal não conseguiu criar perigo suficiente — apenas 0.8 xG acumulado.",
      confidence: 0.93,
      type: "probability",
    },
    {
      title: "Mais gols são prováveis",
      text: "Padrão ofensivo do City sugere 72% de chance de pelo menos mais 1 gol na partida. Arsenal aberto atrás após as substituições. Over 2.5 gols é quase certo.",
      confidence: 0.88,
      type: "trend",
    },
    {
      title: "Haaland marca novamente?",
      text: "Com 3 finalizações na área e xG individual de 0.74, Haaland tem 61% de probabilidade de marcar mais um gol nos minutos finais. Arsenal não consegue marcá-lo.",
      confidence: 0.82,
      type: "value",
    },
    {
      title: "Arsenal sem reação",
      text: "Apenas 12% de sucesso no pressing. Sem finalizações no alvo nos últimos 25 minutos. Modelo indica 4% de chance de virada — resultado praticamente definido.",
      confidence: 0.91,
      type: "alert",
    },
    {
      title: "Handicap City -1.5 com valor",
      text: "A odd atual para City -1.5 oferece valor: o modelo projeta 67% de probabilidade contra os 55% implícitos da odd. Aposta de valor identificada.",
      confidence: 0.79,
      type: "value",
    },
  ],

  betRecommendation: {
    recommendation:
      "Man City vence com pelo menos 2 gols de diferença. Handicap -1.5 oferece valor acima da média.",
    confidence: 87,
  },
};
