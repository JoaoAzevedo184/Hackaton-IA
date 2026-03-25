# Backend — Esportes da Sorte API

API REST que conecta o frontend ao PostgreSQL via Prisma, com webhooks para ingestão de dados pelo n8n.

## Stack

| Tecnologia | Função |
|---|---|
| Express | Servidor HTTP |
| Prisma | ORM + migrações |
| PostgreSQL | Banco de dados |
| Zod | Validação de payloads |
| TypeScript | Tipagem |
| tsx | Dev server com hot reload |

## Estrutura

```
backend/
├── .env.example
├── package.json
├── tsconfig.json
├── prisma/
│   ├── schema.prisma         # 7 tabelas — modelagem completa
│   └── seed.ts               # Popula banco com dados de teste
└── src/
    ├── server.ts             # Entry point Express
    ├── lib/
    │   └── prisma.ts         # Prisma Client singleton
    ├── controllers/
    │   └── match.controller.ts   # listMatches, getMatchDetail
    └── routes/
        ├── match.routes.ts       # GET /api/matches, /api/matches/:id
        └── webhook.routes.ts     # POST endpoints para o n8n
```

## Setup

### 1. PostgreSQL

Se não tem rodando, suba via Docker:

```bash
docker run -d --name esportes-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=esportes_da_sorte \
  -p 5432:5432 postgres:16-alpine
```

### 2. Configurar

```bash
cp .env.example .env
```

Editar `.env`:
```bash
DATABASE_URL="postgresql://postgres:senha@localhost:5432/esportes_da_sorte"
PORT=3001
FRONTEND_URL="http://localhost:8080"
```

> Caracteres especiais na senha devem ser URL-encoded (ex: `#` → `%23`).

### 3. Instalar e rodar

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Saída esperada:
```
🟢 API rodando em http://localhost:3001
   Health:   http://localhost:3001/api/health
   Matches:  http://localhost:3001/api/matches
   Webhooks: http://localhost:3001/api/webhooks
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor com hot reload |
| `npm run build` | Compila TypeScript |
| `npm start` | Roda build de produção |
| `npm run db:generate` | Gera Prisma Client |
| `npm run db:push` | Sincroniza schema → banco |
| `npm run db:migrate` | Cria migration |
| `npm run db:seed` | Popula com dados de teste |
| `npm run db:studio` | Interface visual do banco |

## Endpoints

### Frontend consome

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/matches` | Lista todas as partidas |
| GET | `/api/matches?status=LIVE` | Filtra por status |
| GET | `/api/matches/:id` | Retorna `MatchState` completo |

### n8n alimenta

| Método | Endpoint | Body |
|---|---|---|
| POST | `/api/webhooks/match-update` | `{ matchId, homeScore, awayScore, minute, half, isLive }` |
| POST | `/api/webhooks/match-events` | `{ matchId, minute, type, team, player, description }` |
| POST | `/api/webhooks/odds-update` | `{ matchId, homeWin, draw, awayWin }` |
| POST | `/api/webhooks/ai-insights` | `{ matchId, title, text, confidence, type }` |

Todos os payloads são validados com Zod. Tipos válidos:

- **type** (eventos): `GOAL`, `YELLOW`, `RED`, `SUBSTITUTION`, `CORNER`, `SHOT`, `SAVE`
- **team**: `HOME`, `AWAY`
- **type** (insights): `PROBABILITY`, `TREND`, `VALUE`, `ALERT`
- **status**: `UPCOMING`, `LIVE`, `FINISHED`, `CANCELLED`

## Modelo do Banco

```
teams
├── id            (cuid)
├── name          (string)
├── shortName     (string)
└── logo          (string)

matches
├── id            (cuid)
├── league, season, round
├── status        (UPCOMING | LIVE | FINISHED | CANCELLED)
├── minute, half, isLive
├── homeTeamId → teams.id
├── awayTeamId → teams.id
└── homeScore, awayScore

match_events
├── id, matchId → matches.id
├── minute, type, team
├── player, description

match_probabilities
├── id, matchId → matches.id (unique)
└── homeWin, draw, awayWin

heat_points
├── id, matchId → matches.id
└── x, y, intensity

insights
├── id, matchId → matches.id
├── title, text, confidence
└── type (PROBABILITY | TREND | VALUE | ALERT)

bet_recommendations
├── id, matchId → matches.id (unique)
└── recommendation, confidence
```

## Prisma Studio

Interface visual para inspecionar e editar dados:

```bash
npx prisma studio    # → http://localhost:5555
```
