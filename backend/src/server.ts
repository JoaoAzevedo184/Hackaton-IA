import "dotenv/config";
import express from "express";
import cors from "cors";
import { matchRoutes } from "./routes/match.routes";
import { webhookRoutes } from "./routes/webhook.routes";
import { betsapiRoutes } from "./routes/betsapi.routes";

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

// ─── Middleware ───────────────────────────────────────────────────────
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// ─── Health check ────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Rotas ───────────────────────────────────────────────────────────
app.use("/api/matches", matchRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/betsapi", betsapiRoutes);

// ─── Start ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🟢 API rodando em http://localhost:${PORT}`);
  console.log(`   Health:    http://localhost:${PORT}/api/health`);
  console.log(`   Matches:   http://localhost:${PORT}/api/matches`);
  console.log(`   BetsAPI:   http://localhost:${PORT}/api/betsapi/inplay`);
  console.log(`   Webhooks:  http://localhost:${PORT}/api/webhooks\n`);
});
