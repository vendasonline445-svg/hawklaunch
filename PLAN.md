# Plano: Smart+ V2 (Upgraded API) — Manter V1 + Adicionar V2

## Contexto
- A API legacy `/smart_plus/*` morre em **31/03/2026** (8 dias)
- A nova API unificada usa os endpoints standard (`/campaign/create/`, `/adgroup/create/`, `/ad/create/`) com flag `smart_performance_type`
- Vamos **manter V1 funcionando** e **adicionar V2 ao lado** como nova opção de campaign type

---

## Visão Geral da UI

Atualmente o seletor de tipo tem 3 cards:
```
[ 🔥 Smart+ Spark Ads (novo) ] [ 📦 Smart+ Catálogo ] [ 🎯 Manual ]
```

Ficará com 4 cards:
```
[ 🔥 Smart+ V1 (legacy) ] [ ⚡ Smart+ V2 (novo) ] [ 📦 Smart+ Catálogo ] [ 🎯 Manual ]
```

- **Smart+ V1**: Exatamente como está hoje, sem mudanças. Badge `legacy` com cor amarela de warning
- **Smart+ V2**: Card novo, badge `novo` cor verde. Usa endpoints unified da API

---

## Arquivos que precisam ser alterados

### 1. `src/types/index.ts` — Adicionar novo CampaignType
```diff
- export type CampaignType = 'smart-spark' | 'smart-catalog' | 'manual'
+ export type CampaignType = 'smart-spark' | 'smart-v2' | 'smart-catalog' | 'manual'
```

### 2. `src/pages/Launch.tsx` — Seletor de tipo (grid de cards)
**Linha ~12-16**: Mudar grid de 3 para 4 colunas e adicionar card V2:
```typescript
const CAMPAIGN_TYPES = [
  { type: 'smart-spark', icon: '🔥', title: 'Smart+ V1', badge: 'legacy', cls: 'badge-warning' },
  { type: 'smart-v2',    icon: '⚡', title: 'Smart+ V2', badge: 'novo',   cls: 'badge-new' },
  { type: 'smart-catalog', icon: '📦', title: 'Smart+ Catálogo', badge: 'catálogo', cls: 'badge-catalog' },
  { type: 'manual',      icon: '🎯', title: 'Manual', badge: 'clássico', cls: 'badge-popular' },
]
```
- Mudar `grid-cols-3` → `grid-cols-4`

### 3. `src/store/index.ts` — Default pode continuar `smart-spark` ou mudar pra `smart-v2`
- Nenhuma mudança obrigatória, mas pode trocar default para `smart-v2`

### 4. `src/lib/api.ts` — Adicionar novo endpoint de launch
**Adicionar:**
```typescript
launchSmartV2: (payload: any) => request('a=launch_smart_v2', {
  method: 'POST',
  body: JSON.stringify(payload),
}),
```

### 5. `src/pages/Launch.tsx` — StepLaunch (função `launch()`)
**Linha ~604**: Adicionar lógica condicional:
```typescript
// Se V2, chama endpoint diferente
const launchFn = campaignType === 'smart-v2' ? api.launchSmartV2 : api.launchSmart
const r = await launchFn(singlePayload)
```
- O payload do V2 pode ter campos adicionais (ex: `smart_performance_type`, `automation_level`)
- O restante do flow (Spark auth, CTA, Pixel, proxy, delays) é **idêntico**

### 6. `api/tk.js` — Novo handler `launch_smart_v2` (PRINCIPAL)

**Adicionar handler** após o `launch_smart` existente (~linha 497):

```javascript
if (action === 'launch_smart_v2' && req.method === 'POST') {
  // ... (copia toda a lógica do launch_smart, mas troca 3 endpoints)
}
```

**Diferenças do V2 em relação ao V1:**

| Etapa | V1 (legacy) | V2 (unified) |
|-------|-------------|--------------|
| Campaign | `POST /smart_plus/campaign/create/` | `POST /campaign/create/` |
| AdGroup | `POST /smart_plus/adgroup/create/` | `POST /adgroup/create/` |
| Ad | `POST /smart_plus/ad/create/` | `POST /ad/create/` |

**Campaign payload V2** — campos novos/diferentes:
```javascript
var campPayload = {
  advertiser_id: advId,
  request_id: makeRequestId(),
  campaign_name: (body.campaign_name || 'HL') + ' ' + seqNum,
  objective_type: 'WEB_CONVERSIONS',
  // ⬇️ NOVO: ativa Smart+ no endpoint unified
  smart_performance_type: 'SMART_PERFORMANCE_MODE',  // <-- CHAVE DA MIGRAÇÃO
  budget_mode: 'BUDGET_MODE_DAY',
  budget: humanBudget,
  operation_status: body.start_paused ? 'DISABLE' : 'ENABLE',
}
```

**AdGroup payload V2** — campos novos/diferentes:
```javascript
var agPayload = {
  advertiser_id: advId,
  request_id: makeRequestId(),
  campaign_id: campaignId,
  adgroup_name: body.adgroup_name || ('AG ' + campPayload.campaign_name),
  optimization_event: body.optimization_event || 'SHOPPING',
  optimization_goal: 'CONVERT',
  billing_event: 'OCPM',
  pixel_id: pixelId,
  bid_type: 'BID_TYPE_CUSTOM',
  conversion_bid_price: humanCpa,
  promotion_type: 'WEBSITE',
  // ⬇️ NOVO: pode ter automation flags
  // smart_targeting: 'ENABLED',  // (confirmar na docs)
  landing_page_url: accountDomain,
  location_ids: body.location_ids || ['3469034'],
  schedule_type: 'SCHEDULE_FROM_NOW',
  schedule_start_time: jitteredSchedule,
}
```

**Ad payload V2** — response field muda:
```javascript
// V1: adRes.data.smart_plus_ad_id
// V2: adRes.data.ad_id  (campo standard)
var adId = adRes.data.ad_id || adRes.data.smart_plus_ad_id || '?'
```

---

## ⚠️ DOCS NECESSÁRIAS (pedir ao usuário)

Para completar a implementação do V2, preciso confirmar na documentação oficial:

1. **`POST /campaign/create/`** — Confirmar que `smart_performance_type: "SMART_PERFORMANCE_MODE"` é o valor correto para ativar Smart+ no endpoint unified
2. **`POST /adgroup/create/`** — Verificar se precisa de campos extras como:
   - `smart_targeting` (auto targeting)
   - `smart_creative` (auto creative optimization)
   - `smart_bid` (auto bidding)
   - Ou se a automação é herdada do nível campaign
3. **`POST /ad/create/`** — Confirmar o campo de response (provavelmente `ad_id` ao invés de `smart_plus_ad_id`)
4. **Novos campos opcionais** — A upgraded experience permite controlar granularmente o nível de automação (full auto / partial / manual). Quais são os parâmetros?

**URLs para buscar:**
- https://business-api.tiktok.com/portal/docs?id=1739381752981505 (Campaign Create)
- https://business-api.tiktok.com/portal/docs?id=1739499616346114 (AdGroup Create)
- https://business-api.tiktok.com/portal/docs?id=1739953377448962 (Ad Create)

---

## Etapas de implementação

### Fase 1: Preparação (sem risco)
1. [ ] Adicionar `'smart-v2'` ao type `CampaignType`
2. [ ] Adicionar card V2 no seletor de tipos (Launch.tsx)
3. [ ] Adicionar `launchSmartV2` no api.ts
4. [ ] Adicionar badge CSS `.badge-warning` para o V1 legacy

### Fase 2: Backend (api/tk.js)
5. [ ] Criar handler `launch_smart_v2` copiando lógica do `launch_smart`
6. [ ] Trocar os 3 endpoints para os unified
7. [ ] Adicionar `smart_performance_type` no campaign payload
8. [ ] Ajustar parsing do response (ad_id vs smart_plus_ad_id)

### Fase 3: Frontend (Launch.tsx)
9. [ ] No `StepLaunch.launch()`, usar `launchSmartV2` quando type === 'smart-v2'
10. [ ] Atualizar texto de log "Iniciando lançamento Smart+ V2..."
11. [ ] Atualizar checklist text

### Fase 4: Testes
12. [ ] Testar V1 continua funcionando normalmente
13. [ ] Testar V2 com uma conta + 1 campanha pausada

---

## Resumo de risco

- **V1 não é tocado** → zero risco de quebrar o que funciona
- **V2 é novo handler** → se der erro, só V2 falha
- **Depois de 31/03**: V1 vai parar de funcionar sozinho (TikTok desliga endpoint). Aí removemos V1 e V2 vira o padrão
