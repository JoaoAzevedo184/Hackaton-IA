import { Router } from "express";
import { listMatches, getMatchDetail } from "../controllers/match.controller";

export const matchRoutes = Router();

// GET  /api/matches          → lista partidas (filtro: ?status=LIVE)
// GET  /api/matches/:id      → detalhe completo (MatchState)
matchRoutes.get("/", listMatches);
matchRoutes.get("/:id", getMatchDetail);
