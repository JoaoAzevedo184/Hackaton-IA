# Hackaton-IA

Aplicação web de visualização e análise probabilística de partidas de futebol em tempo real, com insights gerados por IA e recomendações de apostas.

> **Status atual:** Wireframe / Protótipo com dados mock — arquitetura de dados (PostgreSQL + n8n) em definição.

## Visão Geral

O projeto entrega um painel interativo para acompanhamento ao vivo de partidas de futebol, combinando visualizações de dados (heatmap, timeline, barras de probabilidade) com análises de IA e um assistente via chat.

### Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 · TypeScript · Vite |
| UI | shadcn/ui · Radix · Tailwind CSS |
| Estado | TanStack React Query |
| Roteamento | React Router DOM |
| Testes | Vitest |
| Dados (planejado) | PostgreSQL |
| Automação (planejado) | n8n |

## Arquitetura

```
┌─────────────┐       ┌──────────┐      ┌────────────────┐
│  Fontes de  │────▶ │    n8n   │─────▶│  PostgreSQL    │
│  Dados      │       │ Workflows│      │  (dados live + │
│  (APIs/WS)  │       └──────────┘      │   histórico)   │
└─────────────┘                         └───────┬────────┘
                                                │
                                        ┌───────▼────────┐
                                        │  API Backend   │
                                        │  (a definir)   │
                                        └───────┬────────┘
                                                │
                                        ┌───────▼────────┐
                                        │  React Frontend│
                                        │  (este repo)   │
                                        └────────────────┘
```

### Fluxo de dados planejado

1. **Fontes externas** fornecem dados de partidas, odds e estatísticas.
2. **n8n** orquestra a ingestão — transforma, enriquece e persiste no banco.
3. **PostgreSQL** armazena dados de partidas, eventos, probabilidades e insights.
4. **API Backend** (stack a definir) expõe os dados via REST ou WebSocket.
5. **Frontend React** consome e renderiza em tempo real.

> Atualmente o frontend opera com dados mock definidos em `src/pages/Index.tsx`. A integração com PostgreSQL + n8n substituirá esses mocks.

## Estrutura do Projeto

```
src/
├── App.tsx                  # Providers (QueryClient, Tooltip, Toaster) e rotas
├── pages/
│   ├── Index.tsx            # Página principal — layout do painel + dados mock
│   └── NotFound.tsx         # 404
├── components/
│   ├── match/               # Componentes do painel de partida
│   │   ├── MatchHeader.tsx
│   │   ├── Scoreboard.tsx
│   │   ├── ProbabilityBar.tsx
│   │   ├── HeatMap.tsx
│   │   ├── MatchTimeline.tsx
│   │   ├── AIInsightPanel.tsx
│   │   ├── BetCTA.tsx
│   │   └── ChatAssistant.tsx
│   └── ui/                  # Componentes genéricos (shadcn/Radix)
├── hooks/
│   ├── use-mobile.tsx       # Detecção de dispositivo mobile
│   └── use-toast.ts         # Abstração de notificações toast
├── lib/
│   └── utils.ts             # Utilitários (cn, formatação, parsers)
└── test/
    ├── setup.ts
    └── example.test.ts
```

## Componentes do Painel

| Componente | Responsabilidade |
|---|---|
| `MatchHeader` | Liga, temporada e rodada |
| `Scoreboard` | Placar ao vivo, minuto, condições de jogo |
| `ProbabilityBar` | Barra de probabilidade home / empate / away |
| `HeatMap` | Mapa de calor de movimentação (pontos x/y/intensidade) |
| `MatchTimeline` | Eventos por minuto — gol, escanteio, cartão, etc. |
| `AIInsightPanel` | Cards de insight com categoria e nível de confiança |
| `BetCTA` | Recomendação de aposta com botão de ação |
| `ChatAssistant` | Assistente IA conversacional em tempo real |

## Instalação

Requer Node.js 18+ e npm/yarn/pnpm.

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run build:dev` | Build de desenvolvimento |
| `npm run preview` | Preview local do build |
| `npm run lint` | Lint com ESLint |
| `npm test` | Testes com Vitest |
| `npm run test:watch` | Testes em modo watch |

## Roadmap

- [x] Wireframe do painel com componentes mock
- [ ] Modelagem do banco PostgreSQL (partidas, eventos, odds, insights)
- [ ] Workflows n8n para ingestão e transformação de dados
- [ ] API Backend para servir dados ao frontend
- [ ] Substituir mocks por dados reais via React Query
- [ ] WebSocket para atualização em tempo real
- [ ] Autenticação de usuários
- [ ] Deploy

## Contribuição

1. Fork do repositório
2. Crie uma branch: `feature/descricao`
3. Commit com mensagem descritiva
4. Abra um Pull Request para `main`