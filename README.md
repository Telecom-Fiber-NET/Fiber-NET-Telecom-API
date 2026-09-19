# IXC REST API Gateway

## O que este repo contém

- API Express em TypeScript
- Rota `/api/dashboard` que agrega dados do IXC e retorna um `DashboardData`
- Cache usando Supabase (tabela `cache`)
- Módulo de IA (Gemini 2.5 Flash) como stub - substitua pela integração real quando tiver a chave
- Scripts: `npm run dev`, `npm run build`, `npm run test`
- Chatbot WhatsApp/OpenWA para atendimento, financeiro e reativacao

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```
SUPABASE_URL=
SUPABASE_KEY=
JWT_SECRET=
IXC_BASE_URL=
IXC_AUTH_BASIC=
GEMINI_API_KEY=
OPENWA_URL=
OPENWA_API_KEY=
OPENWA_SESSION=
OPENWA_WEBHOOK_SECRET=
CHATBOT_ENABLED=true
CHATBOT_MAX_HISTORY=12
CHATBOT_TIMEOUT=30000
PORT=3333
API_BASE_URL=
```

## Tabela `cache` (SQL)

```sql
create table cache (
  key text primary key,
  value text not null,
  expires_at timestamp
);
```

## Rodando localmente

```bash
npm install
# preencha .env
npm run dev
# abrir http://localhost:3333/api
```

## Endpoints principais

`POST /api/auth/login` — rota de login (DEV stub: `dev@fibernet.com` / `dev`)

`GET /api/dashboard` — retorna `DashboardData`. Requer `Authorization: Bearer <token>` (token DEV retornado pelo `/auth/login`).

`POST /api/chatbot/message` — processa uma mensagem do chatbot.

`POST /api/whatsapp/webhook` — recebe mensagens do OpenWA.

`GET /api/whatsapp/status` — consulta a sessao OpenWA configurada em `OPENWA_SESSION`.

`GET /api/reativacao/bloqueados` — lista contratos bloqueados consultando o IXC.

Documentacao complementar:

- `docs/chatbot.md`
- `docs/whatsapp-openwa.md`
- `docs/reativacao.md`

## Exemplo (curl)

```bash
# login dev
curl -X POST http://localhost:3333/api/auth/login -H "Content-Type: application/json" -d '{"email":"dev@fibernet.com","password":"dev"}'

# pegar dashboard (token retornado)
curl -H "Authorization: Bearer <token>" http://localhost:3333/api/dashboard
```
