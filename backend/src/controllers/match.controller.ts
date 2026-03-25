import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/**
 * Controller de partidas.
 *
 * Cada método mapeia 1:1 com o que o frontend precisa.
 * O shape de retorno é compatível com o tipo MatchState do front.
 */

// ─── GET /api/matches — Lista de partidas ────────────────────────────

export async function listMatches(req: Request, res: Response) {
  try {
    const { status } = req.query;

    const matches = await prisma.match.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        homeTeam: true,
        awayTeam: true,
        probability: true,
      },
      orderBy: [{ isLive: "desc" }, { updatedAt: "desc" }],
    });

    // Formata para o shape que o frontend espera
    const formatted = matches.map((m) => ({
      id: m.id,
      league: m.league,
      status: m.status.toLowerCase(),
      minute: m.minute,
      home: {
        name: m.homeTeam.name,
        shortName: m.homeTeam.shortName,
        logo: m.homeTeam.logo,
        score: m.homeScore,
      },
      away: {
        name: m.awayTeam.name,
        shortName: m.awayTeam.shortName,
        logo: m.awayTeam.logo,
        score: m.awayScore,
      },
      probability: m.probability
        ? {
            homeWin: m.probability.homeWin,
            draw: m.probability.draw,
            awayWin: m.probability.awayWin,
          }
        : null,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Erro ao listar partidas:", error);
    res.status(500).json({ error: "Erro interno ao listar partidas" });
  }
}

// ─── GET /api/matches/:id — Detalhe completo (MatchState) ───────────

export async function getMatchDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        probability: true,
        heatPoints: true,
        events: { orderBy: { minute: "asc" } },
        insights: { orderBy: { createdAt: "desc" } },
        recommendation: true,
      },
    });

    if (!match) {
      return res.status(404).json({ error: "Partida não encontrada" });
    }

    // Formata para MatchState (mesmo shape que o mock usava)
    const matchState = {
      info: {
        league: match.league,
        season: match.season,
        round: match.round,
        home: {
          name: match.homeTeam.name,
          shortName: match.homeTeam.shortName,
          logo: match.homeTeam.logo,
          score: match.homeScore,
        },
        away: {
          name: match.awayTeam.name,
          shortName: match.awayTeam.shortName,
          logo: match.awayTeam.logo,
          score: match.awayScore,
        },
        minute: match.minute,
        half: match.half,
        isLive: match.isLive,
      },
      probability: match.probability
        ? {
            homeWin: match.probability.homeWin,
            draw: match.probability.draw,
            awayWin: match.probability.awayWin,
          }
        : { homeWin: 33.3, draw: 33.4, awayWin: 33.3 },
      heatPoints: match.heatPoints.map((p) => ({
        x: p.x,
        y: p.y,
        intensity: p.intensity,
      })),
      timeline: match.events.map((e) => ({
        minute: e.minute,
        type: e.type.toLowerCase(),
        team: e.team.toLowerCase(),
        player: e.player,
        description: e.description,
      })),
      insights: match.insights.map((i) => ({
        title: i.title,
        text: i.text,
        confidence: i.confidence,
        type: i.type.toLowerCase(),
      })),
      betRecommendation: match.recommendation
        ? {
            recommendation: match.recommendation.recommendation,
            confidence: match.recommendation.confidence,
          }
        : { recommendation: "Aguardando análise...", confidence: 0 },
    };

    res.json(matchState);
  } catch (error) {
    console.error("Erro ao buscar partida:", error);
    res.status(500).json({ error: "Erro interno ao buscar partida" });
  }
}
