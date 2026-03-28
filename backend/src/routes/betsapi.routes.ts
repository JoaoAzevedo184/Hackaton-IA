import { Router, Request, Response } from "express";

export const betsapiRoutes = Router();

const BETSAPI_BASE_V3 = "https://api.b365api.com/v3";
const BETSAPI_BASE_V1 = "https://api.b365api.com/v1";
const BETSAPI_TOKEN = process.env.BETSAPI_TOKEN || "";
const SPORT_SOCCER = "1";

// ─── GET /api/betsapi/inplay ─────────────────────────────────────────

betsapiRoutes.get("/inplay", async (_req: Request, res: Response) => {
  try {
    const url = `${BETSAPI_BASE_V3}/events/inplay?sport_id=${SPORT_SOCCER}&token=${BETSAPI_TOKEN}`;
    res.json(await fetchBetsApi(url));
  } catch (error) {
    console.error("Erro ao buscar jogos ao vivo:", error);
    res.status(502).json({ error: "Falha ao buscar jogos ao vivo" });
  }
});

// ─── GET /api/betsapi/upcoming ───────────────────────────────────────

betsapiRoutes.get("/upcoming", async (req: Request, res: Response) => {
  try {
    const { page, day, cc, league_id } = req.query;
    const params = new URLSearchParams({ sport_id: SPORT_SOCCER, token: BETSAPI_TOKEN });
    if (page) params.set("page", String(page));
    if (day) params.set("day", String(day));
    if (cc) params.set("cc", String(cc));
    if (league_id) params.set("league_id", String(league_id));
    res.json(await fetchBetsApi(`${BETSAPI_BASE_V3}/events/upcoming?${params}`));
  } catch (error) {
    console.error("Erro ao buscar próximos jogos:", error);
    res.status(502).json({ error: "Falha ao buscar próximos jogos" });
  }
});

// ─── GET /api/betsapi/ended ──────────────────────────────────────────

betsapiRoutes.get("/ended", async (req: Request, res: Response) => {
  try {
    const { day, page, cc, league_id } = req.query;
    const params = new URLSearchParams({ sport_id: SPORT_SOCCER, token: BETSAPI_TOKEN });
    if (day) params.set("day", String(day));
    if (page) params.set("page", String(page));
    if (cc) params.set("cc", String(cc));
    if (league_id) params.set("league_id", String(league_id));
    res.json(await fetchBetsApi(`${BETSAPI_BASE_V3}/events/ended?${params}`));
  } catch (error) {
    console.error("Erro ao buscar jogos encerrados:", error);
    res.status(502).json({ error: "Falha ao buscar jogos encerrados" });
  }
});

// ─── GET /api/betsapi/event/:id ──────────────────────────────────────

betsapiRoutes.get("/event/:id", async (req: Request, res: Response) => {
  try {
    res.json(await fetchBetsApi(`${BETSAPI_BASE_V3}/event/view?event_id=${req.params.id}&token=${BETSAPI_TOKEN}`));
  } catch (error) {
    console.error("Erro ao buscar evento:", error);
    res.status(502).json({ error: "Falha ao buscar detalhes do evento" });
  }
});

// ─── GET /api/betsapi/lineup/:id ─────────────────────────────────────

betsapiRoutes.get("/lineup/:id", async (req: Request, res: Response) => {
  try {
    res.json(await fetchBetsApi(`${BETSAPI_BASE_V1}/event/lineup?event_id=${req.params.id}&token=${BETSAPI_TOKEN}`));
  } catch (error) {
    console.error("Erro ao buscar escalação:", error);
    res.status(502).json({ error: "Falha ao buscar escalação" });
  }
});

// ─── GET /api/betsapi/odds/:id — Odds do jogo ───────────────────────

betsapiRoutes.get("/odds/:id", async (req: Request, res: Response) => {
  try {
    const url = `${BETSAPI_BASE_V1}/event/odds?event_id=${req.params.id}&token=${BETSAPI_TOKEN}`;
    res.json(await fetchBetsApi(url));
  } catch (error) {
    console.error("Erro ao buscar odds:", error);
    res.status(502).json({ error: "Falha ao buscar odds" });
  }
});

// ─── Helper ──────────────────────────────────────────────────────────

async function fetchBetsApi(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`BetsAPI retornou ${response.status}: ${response.statusText}`);
  const data = await response.json();
  if (data.success === 0) throw new Error(`BetsAPI erro: ${data.error || "unknown"}`);
  return data;
}