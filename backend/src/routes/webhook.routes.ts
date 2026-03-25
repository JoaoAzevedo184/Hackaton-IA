import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export const webhookRoutes = Router();

/**
 * Endpoints que o n8n chama para alimentar o banco.
 *
 * Fluxo: Fonte de dados → n8n workflow → POST /api/webhooks/xxx → PostgreSQL
 *
 * O n8n transforma os dados da fonte no shape esperado
 * por cada endpoint antes de chamar.
 */

// ─── POST /api/webhooks/match-update ─────────────────────────────────
// Atualiza placar, minuto e status de uma partida

const matchUpdateSchema = z.object({
  matchId: z.string(),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  minute: z.string(),
  half: z.string(),
  isLive: z.boolean(),
  status: z.enum(["UPCOMING", "LIVE", "FINISHED", "CANCELLED"]).optional(),
});

webhookRoutes.post("/match-update", async (req: Request, res: Response) => {
  try {
    const data = matchUpdateSchema.parse(req.body);

    const match = await prisma.match.update({
      where: { id: data.matchId },
      data: {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        minute: data.minute,
        half: data.half,
        isLive: data.isLive,
        status: data.status,
      },
    });

    res.json({ ok: true, matchId: match.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados inválidos", details: error.errors });
    }
    console.error("Erro no webhook match-update:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ─── POST /api/webhooks/match-events ─────────────────────────────────
// Adiciona evento na timeline (gol, cartão, etc.)

const eventSchema = z.object({
  matchId: z.string(),
  minute: z.number().int().min(0),
  type: z.enum(["GOAL", "YELLOW", "RED", "SUBSTITUTION", "CORNER", "SHOT", "SAVE"]),
  team: z.enum(["HOME", "AWAY"]),
  player: z.string().optional(),
  description: z.string(),
});

webhookRoutes.post("/match-events", async (req: Request, res: Response) => {
  try {
    const data = eventSchema.parse(req.body);

    const event = await prisma.matchEvent.create({
      data: {
        matchId: data.matchId,
        minute: data.minute,
        type: data.type,
        team: data.team,
        player: data.player,
        description: data.description,
      },
    });

    res.json({ ok: true, eventId: event.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados inválidos", details: error.errors });
    }
    console.error("Erro no webhook match-events:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ─── POST /api/webhooks/odds-update ──────────────────────────────────
// Atualiza probabilidades de resultado

const oddsSchema = z.object({
  matchId: z.string(),
  homeWin: z.number().min(0).max(100),
  draw: z.number().min(0).max(100),
  awayWin: z.number().min(0).max(100),
});

webhookRoutes.post("/odds-update", async (req: Request, res: Response) => {
  try {
    const data = oddsSchema.parse(req.body);

    const prob = await prisma.matchProbability.upsert({
      where: { matchId: data.matchId },
      update: {
        homeWin: data.homeWin,
        draw: data.draw,
        awayWin: data.awayWin,
      },
      create: {
        matchId: data.matchId,
        homeWin: data.homeWin,
        draw: data.draw,
        awayWin: data.awayWin,
      },
    });

    res.json({ ok: true, probabilityId: prob.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados inválidos", details: error.errors });
    }
    console.error("Erro no webhook odds-update:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ─── POST /api/webhooks/ai-insights ──────────────────────────────────
// Adiciona insight gerado pela pipeline de IA

const insightSchema = z.object({
  matchId: z.string(),
  title: z.string(),
  text: z.string(),
  confidence: z.number().min(0).max(1),
  type: z.enum(["PROBABILITY", "TREND", "VALUE", "ALERT"]),
});

webhookRoutes.post("/ai-insights", async (req: Request, res: Response) => {
  try {
    const data = insightSchema.parse(req.body);

    const insight = await prisma.insight.create({
      data: {
        matchId: data.matchId,
        title: data.title,
        text: data.text,
        confidence: data.confidence,
        type: data.type,
      },
    });

    res.json({ ok: true, insightId: insight.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados inválidos", details: error.errors });
    }
    console.error("Erro no webhook ai-insights:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});
