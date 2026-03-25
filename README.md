# Esportes da Sorte — IA Analytics

Plataforma de visualização e análise probabilística de partidas de futebol em tempo real, com insights gerados por IA e recomendações de apostas.

## Arquitetura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    React     │────▶│  Express API │────▶│  PostgreSQL   │
│   Frontend   │     │   (Prisma)   │     │              │
│    :8080     │     │    :3001     │     │    :5432     │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            ▲
                    ┌───────┴───────┐
                    │      n8n      │
                    │  (Webhooks)   │
                    └───────────────┘
```

| Camada | Stack | Porta |
|---|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind | `:8080` |
| Backend | Express · Prisma · Zod | `:3001` |
| Banco | PostgreSQL 16 | `:5432` |
| Automação | n8n (webhooks) | — |

## Estrutura do Monorepo

```
HACKATON-IA/
├── frontend/          → App React (UI + consumo da API)
├── backend/           → API Express + Prisma (PostgreSQL)
└── README.md          → Este arquivo
```

Cada pasta tem seu próprio `README.md` com instruções detalhadas.

## Quick Start

### 1. PostgreSQL

```bash
docker run -d --name esportes-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=esportes_da_sorte \
  -p 5432:5432 postgres:16-alpine
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # editar DATABASE_URL se necessário
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev               # → http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev               # → http://localhost:8080
```

> O frontend funciona sem o backend — cai automaticamente em dados mock.

## Fluxo de Dados

1. **Fontes externas** fornecem dados de partidas, odds e estatísticas
2. **n8n** orquestra a ingestão via webhooks → transforma → persiste
3. **PostgreSQL** armazena partidas, eventos, probabilidades e insights
4. **API Express** expõe os dados via REST
5. **Frontend React** consome via React Query com fallback mock

## Modelo do Banco

```
teams ──────────── matches ──┬── match_events
                      │       ├── match_probabilities
                      │       ├── heat_points
                      │       ├── insights
                      │       └── bet_recommendations
```

## Roadmap

- [x] Wireframe do painel com componentes mock
- [x] Refatoração — tipos, constants, services, hooks
- [x] Logo + favicon Esportes da Sorte
- [x] Rotas com lazy loading
- [x] Modelagem do banco PostgreSQL (7 tabelas)
- [x] API Express + Prisma com endpoints REST
- [x] Webhooks para ingestão via n8n
- [x] Seed com dados de teste
- [x] Frontend conectado à API com fallback mock
- [ ] Workflows n8n para ingestão automática
- [ ] WebSocket para atualização em tempo real
- [ ] Integração com IA real no ChatAssistant
- [ ] Autenticação de usuários
- [ ] Deploy

## Contribuição

1. Fork do repositório
2. Crie uma branch: `feature/descricao`
3. Commit com mensagem descritiva
4. Abra um Pull Request para `main`
