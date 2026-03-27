import { Router, Request, Response } from "express";

export const betsapiRoutes = Router();

const BETSAPI_BASE = "https://api.b365api.com/v3";
const BETSAPI_TOKEN = process.env.BETSAPI_TOKEN || "";
const SPORT_SOCCER = "1";

/**
 * Proxy para a BetsAPI.
 *
 * O frontend chama /api/betsapi/xxx e o backend
 * repassa para a BetsAPI com o token escondido.
 *
 * Endpoints BetsAPI utilizados:
 *   GET /v3/events/inplay    → jogos ao vivo
 *   GET /v3/events/upcoming  → jogos que vão acontecer
 *   GET /v3/events/ended     → jogos encerrados (param day=YYYYMMDD)
 */

// ─── GET /api/betsapi/inplay — Jogos ao vivo ─────────────────────────

betsapiRoutes.get("/inplay", async (_req: Request, res: Response) => {
  try {
    const url = `${BETSAPI_BASE}/events/inplay?sport_id=${SPORT_SOCCER}&token=${BETSAPI_TOKEN}`;
    const data = await fetchBetsApi(url);
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar jogos ao vivo:", error);
    res.status(502).json({ error: "Falha ao buscar jogos ao vivo da BetsAPI" });
  }
});

// ─── GET /api/betsapi/upcoming — Jogos que vão acontecer ─────────────

betsapiRoutes.get("/upcoming", async (req: Request, res: Response) => {
  try {
    const { page, day, cc, league_id } = req.query;

    const params = new URLSearchParams({
      sport_id: SPORT_SOCCER,
      token: BETSAPI_TOKEN,
    });

    if (page) params.set("page", String(page));
    if (day) params.set("day", String(day));
    if (cc) params.set("cc", String(cc));
    if (league_id) params.set("league_id", String(league_id));

    const url = `${BETSAPI_BASE}/events/upcoming?${params.toString()}`;
    const data = await fetchBetsApi(url);
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar próximos jogos:", error);
    res.status(502).json({ error: "Falha ao buscar próximos jogos da BetsAPI" });
  }
});

// ─── GET /api/betsapi/ended?day=YYYYMMDD — Jogos encerrados ──────────

betsapiRoutes.get("/ended", async (req: Request, res: Response) => {
  try {
    const { day, page, cc, league_id } = req.query;

    const params = new URLSearchParams({
      sport_id: SPORT_SOCCER,
      token: BETSAPI_TOKEN,
    });

    if (day) params.set("day", String(day));
    if (page) params.set("page", String(page));
    if (cc) params.set("cc", String(cc));
    if (league_id) params.set("league_id", String(league_id));

    const url = `${BETSAPI_BASE}/events/ended?${params.toString()}`;
    const data = await fetchBetsApi(url);
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar jogos encerrados:", error);
    res.status(502).json({ error: "Falha ao buscar jogos encerrados da BetsAPI" });
  }
});

// ─── GET /api/betsapi/event/:id — Detalhe de um evento ───────────────

betsapiRoutes.get("/event/:id", async (req: Request, res: Response) => {
  try {
    const url = `${BETSAPI_BASE}/event/view?event_id=${req.params.id}&token=${BETSAPI_TOKEN}`;
    const data = await fetchBetsApi(url);
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar evento:", error);
    res.status(502).json({ error: "Falha ao buscar detalhes do evento" });
  }
});

// ─── Helper ──────────────────────────────────────────────────────────

async function fetchBetsApi(url: string): Promise<unknown> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`BetsAPI retornou ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.success === 0) {
    throw new Error(`BetsAPI erro: ${data.error || "unknown"}`);
  }

  return data;
}