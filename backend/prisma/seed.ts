import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed — popula o banco com os mesmos dados do mock
 * para testar a integração front ↔ API ↔ PostgreSQL.
 *
 * Rodar: npm run db:seed
 */
async function main() {
  console.log("🌱 Iniciando seed...\n");

  // ─── Times ───────────────────────────────────────────────────────
  const arsenal = await prisma.team.upsert({
    where: { id: "team-arsenal" },
    update: {},
    create: {
      id: "team-arsenal",
      name: "Arsenal",
      shortName: "ARS",
      logo: "🔴",
    },
  });

  const city = await prisma.team.upsert({
    where: { id: "team-mancity" },
    update: {},
    create: {
      id: "team-mancity",
      name: "Manchester City",
      shortName: "MNC",
      logo: "🔵",
    },
  });

  console.log(`  ✓ Times: ${arsenal.name}, ${city.name}`);

  // ─── Partida ─────────────────────────────────────────────────────
  const match = await prisma.match.upsert({
    where: { id: "match-1" },
    update: {},
    create: {
      id: "match-1",
      league: "Premier League",
      season: "2025/26",
      round: "Rodada 28",
      status: "LIVE",
      minute: "90:01",
      half: "2º Tempo",
      isLive: true,
      homeTeamId: arsenal.id,
      awayTeamId: city.id,
      homeScore: 0,
      awayScore: 2,
    },
  });

  console.log(`  ✓ Partida: ${arsenal.shortName} ${match.homeScore} x ${match.awayScore} ${city.shortName}`);

  // ─── Probabilidade ───────────────────────────────────────────────
  await prisma.matchProbability.upsert({
    where: { matchId: match.id },
    update: {},
    create: {
      matchId: match.id,
      homeWin: 8.3,
      draw: 9.2,
      awayWin: 82.5,
    },
  });

  console.log("  ✓ Probabilidades");

  // ─── Eventos ─────────────────────────────────────────────────────
  const events = [
    { minute: 12, type: "SHOT" as const, team: "HOME" as const, player: "Saka", description: "Finalização de fora da área, defesa do goleiro." },
    { minute: 23, type: "CORNER" as const, team: "AWAY" as const, player: "De Bruyne", description: "Escanteio pela direita, afastado pela defesa." },
    { minute: 34, type: "YELLOW" as const, team: "HOME" as const, player: "Rice", description: "Cartão amarelo por falta tática no meio-campo." },
    { minute: 41, type: "SAVE" as const, team: "HOME" as const, player: "Raya", description: "Grande defesa em cabeceio de Haaland." },
    { minute: 52, type: "GOAL" as const, team: "AWAY" as const, player: "Haaland", description: "Gol! Finalização de primeira dentro da área após cruzamento de Doku." },
    { minute: 64, type: "SUBSTITUTION" as const, team: "HOME" as const, player: "Havertz → Trossard", description: "Substituição tática, Arsenal busca mais velocidade." },
    { minute: 71, type: "GOAL" as const, team: "AWAY" as const, player: "O'Reilly", description: "Gol! Chute de fora da área no canto direito." },
    { minute: 78, type: "SHOT" as const, team: "HOME" as const, player: "Saka", description: "Finalização perigosa, bola passa perto da trave." },
    { minute: 85, type: "CORNER" as const, team: "HOME" as const, player: "Ødegaard", description: "Escanteio pela esquerda, cabeceio por cima." },
    { minute: 90, type: "YELLOW" as const, team: "AWAY" as const, player: "Gvardiol", description: "Cartão amarelo por falta na entrada da área." },
  ];

  // Limpa eventos antigos e insere novos
  await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
  await prisma.matchEvent.createMany({
    data: events.map((e) => ({ ...e, matchId: match.id })),
  });

  console.log(`  ✓ ${events.length} eventos na timeline`);

  // ─── Heat Points ─────────────────────────────────────────────────
  const heatPoints = [
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
  ];

  await prisma.heatPoint.deleteMany({ where: { matchId: match.id } });
  await prisma.heatPoint.createMany({
    data: heatPoints.map((p) => ({ ...p, matchId: match.id })),
  });

  console.log(`  ✓ ${heatPoints.length} heat points`);

  // ─── Insights ────────────────────────────────────────────────────
  const insights = [
    { title: "Man City com 83% de chance de vitória", text: "Com 2x0 no placar e controle de 58% da posse, o modelo projeta vitória do City com alta confiança.", confidence: 0.93, type: "PROBABILITY" as const },
    { title: "Mais gols são prováveis", text: "Padrão ofensivo do City sugere 72% de chance de pelo menos mais 1 gol na partida.", confidence: 0.88, type: "TREND" as const },
    { title: "Haaland marca novamente?", text: "Com 3 finalizações na área e xG individual de 0.74, Haaland tem 61% de probabilidade de marcar mais um.", confidence: 0.82, type: "VALUE" as const },
    { title: "Arsenal sem reação", text: "Apenas 12% de sucesso no pressing. Modelo indica 4% de chance de virada.", confidence: 0.91, type: "ALERT" as const },
    { title: "Handicap City -1.5 com valor", text: "A odd atual para City -1.5 oferece valor: modelo projeta 67% contra 55% implícitos da odd.", confidence: 0.79, type: "VALUE" as const },
  ];

  await prisma.insight.deleteMany({ where: { matchId: match.id } });
  await prisma.insight.createMany({
    data: insights.map((i) => ({ ...i, matchId: match.id })),
  });

  console.log(`  ✓ ${insights.length} insights`);

  // ─── Recomendação ────────────────────────────────────────────────
  await prisma.betRecommendation.upsert({
    where: { matchId: match.id },
    update: {},
    create: {
      matchId: match.id,
      recommendation: "Man City vence com pelo menos 2 gols de diferença. Handicap -1.5 oferece valor acima da média.",
      confidence: 87,
    },
  });

  console.log("  ✓ Recomendação de aposta");
  console.log("\n✅ Seed concluído!\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
