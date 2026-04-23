# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run dev        # Vite dev server (frontend). /api é proxyado para localhost:3001 (vite.config.ts)
npm run build      # tsc -b && vite build
npm run preview    # preview do build
```

Não há scripts de lint nem de testes. Type-check é executado como parte de `npm run build` (`tsc -b`). Para type-check isolado use `npx tsc -b`.

Deploy é automático via Vercel no push para `main` (veja `vercel.json` — região `gru1`, `maxDuration: 60s` para `api/tk.mjs`).

## Arquitetura

### Fluxo geral
Frontend React/TypeScript é uma camada de UI (dashboard + wizard de campanhas). **Toda lógica de negócio fica no backend serverless monolítico** `api/tk.mjs`. O frontend nunca chama `business-api.tiktok.com` diretamente.

```
Browser ──► /api/tk?a=<action> (Vercel fn) ──► TikTok Business API v1.3
                    │
                    └─► Supabase Edge Fn (get-tiktok-token) p/ token fallback
```

### Backend: `api/tk.mjs` (handler único, ~1400 linhas)
Roteamento é por query param `?a=<action>` dentro de um único `handler(req, res)` — não é um router Express. Actions atuais (buscar via `grep "if (action ===" api/tk.mjs`):

`token`, `test_proxy`, `bc_list`, `bc_advertisers`, `identity_get`, `pixel`, `videos`, `campaign_get`, `tt_proxy`, `regions`, `auth`, `upload_card_image`, `spark_authorize`, `spark_info`, `launch_smart`, `launch_manual`, `disable_campaigns`, `delete_campaigns`, `ad_list_review`, `ad_appeal`, `remove_bc_accounts`, `create_account`.

Para adicionar action nova: adicionar branch `if (action === 'xxx')` no handler **e** método correspondente em `src/lib/api.ts`.

### Autenticação TikTok
Token pode vir de dois lugares, nessa ordem de prioridade no backend (`api/tk.mjs:347`):
1. Header `Authorization: Bearer <token>` enviado pelo frontend (cada navegador tem o seu)
2. Fallback via Supabase Edge Function `get-tiktok-token` (requer env `HAWKLAUNCH_API_KEY`)

No frontend, o token é gravado em `localStorage.hawklaunch_token` e enviado por `src/lib/api.ts:request()`. OAuth callback: TikTok → Supabase Edge Function `tiktok-oauth-callback` → redirect para `/?oauth=success&token=...&advertisers=...` — `src/App.tsx` detecta e aplica.

### Camada anti-detecção (`api/tk.mjs`)
**Filosofia:** o Business API é server-to-server. Imitar browser (Origin/Referer/sec-ch-ua) é **anti-padrão** — cliente legítimo S2S não envia isso. O TikTok detecta via **padrão comportamental** (velocidade, repetição, sequência fixa), não via headers faltantes. Foco da defesa é comportamento.

Toda chamada para TikTok passa por `tt()` → `ttOnce()` que aplicam:
- **Headers mínimos:** `Access-Token`, `Content-Type: application/json`, `User-Agent: HawkLaunch/1.0 (+url)` fixo (linha ~156). **Não adicionar Origin/Referer/sec-ch-ua/Sec-Fetch-*/Accept-Language** — já foram removidos deliberadamente por serem sinais de "bot se passando por UI".
- **`makeRequestId()`** gera timestamp(13) + sufixo(5) = 18 dígitos, dentro do limite de 64-bit da spec TikTok. Docs `_campaign_create_.md:92` confirmam que `request_id` no payload serve para **idempotência de 10s**.
- **Idempotência em retries:** payloads geram `request_id` **uma vez** fora do loop de retry. Em timeout de rede, o mesmo `request_id` é reusado → TikTok dedup dentro de 10s. Só regera `request_id` no branch de erro `"does not exist"`/`"concurrent"` (resource não propagou ainda). **Não regenerar `request_id` dentro do `catch` de rede.**
- **`humanDelay(min, max)`** (linha ~39): distribuição log-normal-like, mediana em ~1/3 do range, com 8% de "pausas longas" (até 1.5× max). Usar entre operações **lógicas** (campanha→adgroup→ads). `rndDelay` legado só pra micro-pausas entre retries.
- **`exploreNoise(token, advId, proxy, log)`** (linha ~222): com 60% de probabilidade, faz 1-2 GETs aleatórios (`campaign/get`, `pixel/list`, `identity/get`, `ad/get`) antes de criar, simulando um humano olhando o dashboard. Ignora erros silenciosamente. Chamado no início do loop de contas em `launch_smart` e `launch_manual`.
- **`shuffleCopy(arr)`** e **`pickRandom(arr)`** para variação. `ad_text_list` é embaralhado por conta em `launch_smart`.
- **Retry automático** (até 3x) em rate-limit (codes 40100/50001/50002). Não retenta erros permanentes (`isPermanentError()`: 40001 token inválido, 40002 sem permissão, "account banned").
- **Proxy — sticky session obrigatório**: proxies residenciais rotativas (DataImpulse, Bright Data, IPRoyal em modo rotating) mudam o IP a cada request → **IP hopping** para o TikTok, assinatura óbvia de bot. Solução em duas partes:
  - `proxyForAccount(list, i)` = `list[i % list.length]` (mapeamento permanente conta↔slot).
  - `stickifyProxy(proxyRaw, advertiserId)` injeta sticky session id no username. **Sintaxe depende do provider** (detectado pelo host):
    - **DataImpulse** (`docs.dataimpulse.com/proxies/parameters/session-id`): formato `username__sessid.NUMERO`. Delimitadores: `__` separa login de params, `.` separa key=value, `;` separa params. Duração fixa ~30 min. Ex: `user:pass@gw.dataimpulse.com:823` → `user__sessid.9409211409:pass@gw.dataimpulse.com:823`. Se já tem `__cr.br` ou outros params, preserva e faz append com `;sessid.XXX`.
    - **IPRoyal** (`docs.iproyal.com/proxies/residential/proxy/rotation`): session vai no **password**, não no username. Formato: `password_session-XXXXXXXX_lifetime-30m`. Session ID = 8 chars alfanuméricos (pad com zeros à esquerda se adv_id for curto). `_lifetime-` é opcional (1s a 7d, unidade única). Ordem dos params underscored não importa. Stickify remove `_session-*` e `_lifetime-*` anteriores antes de anexar (idempotente).
    - **Bright Data / genérico**: formato `username-session-sXXX` (hífen no username).
  - Session id = últimos 10 dígitos numéricos de `advertiser_id` (DataImpulse/Bright Data). IPRoyal usa últimos 8 dígitos padded com zeros.
  - Aplicado em todos handlers com `advertiser_id`: `launch_smart`, `launch_manual`, `disable_campaigns`, `delete_campaigns`, `ad_list_review`, `ad_appeal`, `spark_authorize`, `spark_info`.
  - **Resultado:** mesma conta sempre do mesmo IP real (padrão humano); contas diferentes em IPs diferentes dentro do mesmo proxy_raw (pool distribuído).
  - **Ao adicionar suporte a novo provider**, replicar o pattern `if (hostLower.includes('X.com')) { ...formato Y... }` dentro de `stickifyProxy`. Sempre conferir a doc oficial do provider — cada um usa delimitador diferente.

**Não pular `tt()` para chamar TikTok diretamente.** Bypass anula idempotência, retry e a filosofia toda.

**Orçamento de tempo:** simulação de 20k execuções com os delays humanos atuais dá p50=28s, p99=42s, max=52s para 1 conta × 1 camp × 2 ads. Cabe nos 60s de `maxDuration` da Vercel. Se aumentar `ads_per_code` significativamente ou adicionar mais etapas, re-simular — não exceder p99~55s.

### Conversão de moeda
Usuário sempre digita budget em **BRL**. Backend converte para moeda da conta via `convertBudget(brlValue, accountCurrency)` usando taxas fixas em `BRL_TO_CURRENCY` (`api/tk.mjs:~58`). Arredonda para múltiplo de 5 na moeda destino.

### Estado (Zustand — `src/store/index.ts`)
Store único `useAppStore` com três áreas:
- **Connection**: `accessToken`, `bcId`, `connected`
- **Wizard**: `currentStep`, `campaignType`, `selectedAccounts`, `config` (ver `CampaignConfig` em `src/types/index.ts`)
- **Launch**: `isLaunching`, `launchLogs`, `launchProgress`

`defaultConfig` carrega defaults para smart-spark, BR/pt, Android+iOS, orçamento 50 BRL, CBO, `SHOP_NOW` — ver linha ~35.

### Pages & rotas
Rotas definidas em `src/App.tsx`:
- `/` e `/admin` → Dashboard (bulk disable/delete campaigns, remover contas do BC)
- `/launch` → wizard (arquivo grande: `src/pages/Launch.tsx` ~2.6k linhas)
- `/create-accounts` → criação em massa
- `/proxies` → gestão de proxies
- `/campaigns`, `/accounts`, `/creatives`, `/identities`, `/pixels`, `/settings`, `/logs` → todos em `src/pages/Pages.tsx`

### ⚠️ `src/lib/tiktok.ts` é código morto
Aponta para `/api/tiktok/*` (sub-rotas) que **não existem**. A API real está em `/api/tk?a=<action>` via `src/lib/api.ts`. Se for refatorar, preferir apagar `tiktok.ts` em vez de mantê-lo.

### Caches em localStorage
- `hawklaunch_token` — access token TikTok
- `hawklaunch_connected` — flag bool
- `hawklaunch_bc` — BC ID ativo
- `hawklaunch_advertisers` — lista de advertiser_ids
- `hawklaunch_accounts_cache` / `hawklaunch_selected_accounts` / `hawklaunch_campaign_status_cache` — `src/hooks/useAccounts.ts`

Ao investigar bug de estado "velho" verificar esses caches antes de suspeitar do backend.

## Variáveis de ambiente

Servidor (Vercel → Environment Variables):
- `TIKTOK_APP_ID`, `TIKTOK_APP_SECRET`, `TIKTOK_REDIRECT_URI`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HAWKLAUNCH_API_KEY` — x-api-key para a Edge Function `get-tiktok-token`

Frontend (prefixo `VITE_`, lido por Vite):
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Banco (Supabase)

Schema em `supabase/migration.sql` — rodar uma única vez no SQL Editor. Tabelas: `tiktok_tokens`, `ad_accounts`, `launch_history`, `presets`, `spark_profiles`. Todas com RLS e policy `auth.uid() = user_id`.

## Referências externas

- `tiktok-ads-docs-atualizada/` (untracked) — dump dos docs oficiais TikTok API v1.3 atualizados. **Consultar antes de inferir formato de payload/endpoint.**
- `tiktok-business-api-sdk/` e `tiktok-ads-api/` (untracked) — SDKs/specs de referência.

## Convenções pontuais

- **Não criar PR nem push sem autorização explícita.**
- `api/tk.mjs` usa `var` e callbacks-estilo-ES5 em vários trechos. Mantenha o estilo do arquivo se for editar — não "modernize" por conta própria.
- Identity types TikTok: `BC_AUTH_TT` (Spark via BC), `TT_USER` (conta linkada), `AUTH_CODE` (Spark via código do criador), `CUSTOMIZED_USER` (não-Spark).
- Upload de Display Card: TikTok inverte width/height — enviar **750×421** para que a API leia como 421×750 (`resizeCardImage` em `api/tk.mjs:~271`). Image IDs não podem ser reutilizados entre contas — sempre re-upload por conta.