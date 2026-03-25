# Frontend — Esportes da Sorte IA

Painel interativo de análise de partidas em tempo real com React, conectado ao PostgreSQL via API Express.

## Stack

| Tecnologia | Função |
|---|---|
| React 18 | UI |
| TypeScript | Tipagem |
| Vite | Build + dev server |
| Tailwind CSS | Estilização |
| shadcn/ui + Radix | Componentes base |
| TanStack React Query | Estado assíncrono |
| React Router DOM | Rotas (lazy loading) |
| Vitest | Testes |

## Estrutura

```
frontend/
├── public/
│   ├── favicon.ico               # Logo Esportes da Sorte
│   ├── logo-32x32.png
│   ├── logo-192x192.png
│   ├── logo-512x512.png
│   └── apple-touch-icon.png
│
├── src/
│   ├── App.tsx                   # Providers, Suspense, rotas
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Tema dark + tokens + animações
│   │
│   ├── types/
│   │   └── match.ts              # Team, Insight, TimelineEvent, MatchState...
│   │
│   ├── constants/
│   │   └── index.ts              # EVENT_ICONS, INSIGHT_CONFIG, CHAT_*
│   │
│   ├── data/
│   │   ├── mockMatch.ts          # MOCK_MATCH (fallback quando API offline)
│   │   └── chatResponses.ts      # Respostas mock do chat
│   │
│   ├── services/
│   │   └── matchService.ts       # fetchMatchState() — API real + fallback
│   │
│   ├── lib/
│   │   ├── api.ts                # Cliente HTTP tipado (GET/POST)
│   │   ├── pitchRenderer.ts      # Canvas: desenho do campo + heatmap
│   │   └── utils.ts              # cn() — merge de classes Tailwind
│   │
│   ├── hooks/
│   │   ├── useMatchData.ts       # React Query → matchService
│   │   ├── useChat.ts            # Estado completo do chat
│   │   ├── use-mobile.tsx        # Detecção mobile via matchMedia
│   │   └── use-toast.ts          # Notificações toast
│   │
│   ├── routes/
│   │   ├── paths.ts              # ROUTES constantes + helpers
│   │   └── routes.tsx            # Config com lazy loading
│   │
│   ├── components/
│   │   ├── match/
│   │   │   ├── MatchHeader.tsx   # Liga, logo, temporada
│   │   │   ├── Scoreboard.tsx    # Placar ao vivo
│   │   │   ├── ProbabilityBar.tsx # Probabilidade home/empate/away
│   │   │   ├── HeatMap.tsx       # Mapa de calor (Canvas)
│   │   │   ├── MatchTimeline.tsx # Eventos por minuto
│   │   │   ├── AIInsightPanel.tsx # Cards de insight com confiança
│   │   │   ├── BetCTA.tsx        # Recomendação de aposta
│   │   │   └── ChatAssistant.tsx # Chat flutuante com IA
│   │   └── ui/                   # shadcn/Radix (gerados)
│   │
│   └── pages/
│       ├── Dashboard.tsx         # Home — partidas ao vivo e próximas
│       ├── MatchDetail.tsx       # Painel completo de análise
│       ├── History.tsx           # Histórico de partidas
│       ├── Settings.tsx          # Status das integrações
│       └── NotFound.tsx          # 404
│
├── .env                          # Variáveis de ambiente
├── index.html                    # HTML com favicon
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

## Setup

```bash
npm install
npm run dev
```

Acesse `http://localhost:8080`.

> Funciona sem o backend — o `matchService` cai automaticamente em dados mock quando a API está offline.

## Variáveis de Ambiente

Criar `.env` na raiz:

```bash
VITE_API_URL=http://localhost:3001/api
VITE_USE_MOCK=false
```

| Variável | Descrição | Default |
|---|---|---|
| `VITE_API_URL` | URL base da API backend | `http://localhost:3001/api` |
| `VITE_USE_MOCK` | `true` = ignora API, usa mock sempre | `false` |

## Rotas

| Rota | Página | Descrição |
|---|---|---|
| `/` | Dashboard | Grid de partidas ao vivo e próximas |
| `/match/:matchId` | MatchDetail | Painel completo de análise |
| `/history` | History | Histórico de partidas analisadas |
| `/settings` | Settings | Status das integrações + endpoints n8n |
| `*` | NotFound | 404 |

Todas as rotas usam `React.lazy()` + `Suspense` para code splitting.

## Camadas

```
Componente (UI pura)
    ↓ consome
Hook (useMatchData / useChat)
    ↓ chama
Service (matchService.ts)
    ↓ usa
API Client (lib/api.ts)
    ↓ fetch
Backend Express (:3001)
    ↓ query
PostgreSQL (:5432)
```

Se qualquer camada falha, o service retorna mock. Os componentes nunca sabem de onde os dados vêm.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Dev server (:8080) |
| `npm run build` | Build de produção |
| `npm run build:dev` | Build de desenvolvimento |
| `npm run preview` | Preview local do build |
| `npm run lint` | Lint com ESLint |
| `npm test` | Testes com Vitest |
| `npm run test:watch` | Testes em modo watch |

## Componentes do Painel

| Componente | O que faz |
|---|---|
| `MatchHeader` | Logo, liga, temporada, rodada + link ao dashboard |
| `Scoreboard` | Placar, minuto, badge "AO VIVO" |
| `ProbabilityBar` | Barra visual + odds implícitas |
| `HeatMap` | Canvas com campo + pontos de calor por intensidade |
| `MatchTimeline` | Eventos cronológicos com ícones por tipo |
| `AIInsightPanel` | Cards revelados progressivamente com nível de confiança |
| `BetCTA` | Recomendação da IA + barra de confiança + botão de ação |
| `ChatAssistant` | Chat flutuante com quick actions e markdown bold |
