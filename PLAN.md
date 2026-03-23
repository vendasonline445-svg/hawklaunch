# Plano: Smart+ V2 — Manter V1 + Adicionar V2 melhorado

## Contexto

O V1 atual **já usa** os endpoints Upgraded Smart+ (`/smart_plus/*`).
A diferença do V2 é incorporar a **spec completa** da API, corrigindo gaps do V1
e adicionando features novas que a docs suporta.

---

## Comparação V1 atual vs V2 proposto

### Campaign (`/smart_plus/campaign/create/`)

| Campo | V1 (atual) | V2 (proposto) | Docs |
|-------|-----------|---------------|------|
| `objective_type` | `WEB_CONVERSIONS` | `WEB_CONVERSIONS` | OK ✅ |
| `sales_destination` | `WEBSITE` | `WEBSITE` | OK ✅ |
| `budget_mode` | `BUDGET_MODE_DAY` ❌ | `BUDGET_MODE_DYNAMIC_DAILY_BUDGET` | Docs usa `BUDGET_MODE_DYNAMIC_DAILY_BUDGET` |
| `budget_optimize_on` | Não enviado | `true` (CBO default) | Permite CBO (auto) ou ABO (custom por adgroup) |
| `operation_status` | `DISABLE`/`ENABLE` | `DISABLE`/`ENABLE` | OK ✅ |
| `catalog_enabled` | Não enviado | `false` ou não especificar | OK (não-catálogo) |

### AdGroup (`/smart_plus/adgroup/create/`)

| Campo | V1 (atual) | V2 (proposto) | Docs |
|-------|-----------|---------------|------|
| `promotion_type` | `WEBSITE` | `WEBSITE` | OK ✅ |
| `optimization_goal` | `CONVERT` | `CONVERT` (+ opção `VALUE`) | Docs suporta: CLICK, CONVERT, TRAFFIC_LANDING_PAGE_VIEW, VALUE |
| `optimization_event` | `SHOPPING` | Configurável | Docs: SHOPPING (para VALUE), ou standard events para CONVERT |
| `pixel_id` | ✅ | ✅ | OK |
| `billing_event` | `OCPM` | `OCPM` | OK para CONVERT/VALUE |
| `bid_type` | `BID_TYPE_CUSTOM` (fixo) | `BID_TYPE_CUSTOM` ou `BID_TYPE_NO_BID` | **V2 adiciona opção Maximum Delivery** |
| `conversion_bid_price` | ✅ (humanizado) | ✅ | OK |
| `landing_page_url` | ✅ | **Remover** — URL vai no ad level | V2: URL só no `landing_page_url_list` do ad |
| `targeting_optimization_mode` | **Não enviado** ❌ | `AUTOMATIC` ou `MANUAL` | **NOVO**: controla auto vs custom targeting |
| `targeting_spec` | `{ location_ids }` apenas | `{ location_ids, age_groups, gender }` completo | V2: targeting spec completo |
| `schedule_type` | `SCHEDULE_FROM_NOW` | `SCHEDULE_FROM_NOW` | OK ✅ |
| `placement_type` | **Não enviado** | Não especificar (auto placement) | Automático por default |
| `dark_post_status` | **Não gerenciado** | Default `ON` desde Jan 2026 | Ads-only mode agora é default |

### Ad (`/smart_plus/ad/create/`)

| Campo | V1 (atual) | V2 (proposto) | Docs |
|-------|-----------|---------------|------|
| `creative_list` | 1 creative por ad | **1-50 creatives por ad** | V2: multiple creatives por ad |
| `creative_info.ad_format` | `SINGLE_VIDEO` (fixo) | `SINGLE_VIDEO` / `CAROUSEL_ADS` | V2: suporta mais formatos |
| `creative_info.tiktok_item_id` | ✅ via AUTH_CODE | ✅ (AUTH_CODE, TT_USER, BC_AUTH_TT) | V2: todos identity types |
| `creative_info.identity_type` | `AUTH_CODE` (fixo) | Configurável | V2: suporta todos os tipos |
| `creative_info.identity_authorized_bc_id` | **Não enviado** | Enviado quando BC_AUTH_TT | **NOVO para BC identity** |
| `landing_page_url_list` | ✅ | ✅ | OK |
| `ad_text_list` | ✅ | ✅ | OK |
| `call_to_action_id` | Dinâmico via portfolio | Dinâmico via portfolio | OK ✅ |
| `call_to_action_list` | Standard CTAs ✅ | Standard CTAs ✅ | OK ✅ |
| `ad_configuration.utm_params` | **Não enviado** | **Opcional** — UTM params | NOVO: tracking UTM |
| Response field | `smart_plus_ad_id` | `smart_plus_ad_id` | Mesmo endpoint |

---

## Visão Geral da UI

### Seletor de tipo (4 cards)
```
[ 🔥 Smart+ V1 (legacy) ] [ ⚡ Smart+ V2 (novo) ] [ 📦 Smart+ Catálogo ] [ 🎯 Manual ]
```

- **Smart+ V1**: Exatamente como hoje, zero mudanças. Badge `legacy` amarela
- **Smart+ V2**: Badge `novo` verde. Mesmo flow, mas payloads corrigidos/completos

### Diferenças de UI no V2

O wizard (Steps 1-7) permanece quase idêntico. Pequenas adições:

1. **Step 4 (Estrutura)** — Novo toggle:
   - "Bid Strategy": `Cost Cap` (BID_TYPE_CUSTOM) vs `Maximum Delivery` (BID_TYPE_NO_BID)
   - Quando Maximum Delivery, esconde campo Target CPA

2. **Step 5 (Targeting)** — Novo toggle:
   - `targeting_optimization_mode`: AUTOMATIC vs MANUAL
   - Quando MANUAL, exibe campos de age_groups, gender, location_ids completos
   - Quando AUTOMATIC, IA do TikTok cuida (já funciona assim no V1 por default)

3. **Step 2 (Identity)** — Suporte a todos os identity types:
   - AUTH_CODE (spark codes) — já funciona
   - BC_AUTH_TT (TikTok account no BC) — **NOVO**: precisa de `identity_authorized_bc_id`
   - TT_USER (linked business account) — **NOVO**: pull videos da conta

---

## Arquivos que precisam ser alterados

### 1. `src/types/index.ts`
```diff
- export type CampaignType = 'smart-spark' | 'smart-catalog' | 'manual'
+ export type CampaignType = 'smart-spark' | 'smart-v2' | 'smart-catalog' | 'manual'
```

### 2. `src/pages/Launch.tsx` — Seletor de tipo
- Grid: `grid-cols-3` → `grid-cols-4`
- Adicionar card V2
- Renomear V1 para "Smart+ V1" com badge "legacy"

### 3. `src/lib/api.ts` — Novo endpoint
```typescript
launchSmartV2: (payload: any) => request('a=launch_smart_v2', {
  method: 'POST',
  body: JSON.stringify(payload),
}),
```

### 4. `src/pages/Launch.tsx` — StepStructure
- Toggle de bid strategy (Cost Cap vs Max Delivery) — condicional ao V2
- Esconder Target CPA quando Maximum Delivery selecionado

### 5. `src/pages/Launch.tsx` — StepLaunch
- Condicional: `campaignType === 'smart-v2' ? api.launchSmartV2 : api.launchSmart`
- Enviar `bid_type` no payload quando V2

### 6. `api/tk.js` — NOVO handler `launch_smart_v2` (PRINCIPAL)

Copiar lógica do `launch_smart`, aplicar estas mudanças nos payloads:

**Campaign payload V2:**
```javascript
var campPayload = {
  advertiser_id: advId,
  request_id: makeRequestId(),
  campaign_name: (body.campaign_name || 'HL') + ' ' + seqNum,
  objective_type: 'WEB_CONVERSIONS',
  sales_destination: 'WEBSITE',
  // ⬇️ FIX: usar BUDGET_MODE_DYNAMIC_DAILY_BUDGET (CBO daily correto)
  budget_mode: 'BUDGET_MODE_DYNAMIC_DAILY_BUDGET',
  budget_optimize_on: true,
  budget: humanBudget,
  operation_status: body.start_paused ? 'DISABLE' : 'ENABLE',
}
```

**AdGroup payload V2:**
```javascript
var agPayload = {
  request_id: makeRequestId(),
  advertiser_id: advId,
  campaign_id: campaignId,
  adgroup_name: body.adgroup_name || ('AG ' + campPayload.campaign_name),
  promotion_type: 'WEBSITE',
  optimization_goal: 'CONVERT',
  optimization_event: body.optimization_event || 'SHOPPING',
  pixel_id: pixelId,
  billing_event: 'OCPM',
  // ⬇️ FIX: bid_type configurável
  bid_type: body.bid_type || 'BID_TYPE_CUSTOM',
  conversion_bid_price: body.bid_type === 'BID_TYPE_NO_BID' ? undefined : humanCpa,
  // ⬇️ NOVO: targeting optimization mode
  targeting_optimization_mode: 'AUTOMATIC',
  targeting_spec: {
    location_ids: body.location_ids || ['3469034'],
    // age_groups e gender são preenchidos automaticamente quando AUTOMATIC
  },
  // ⬇️ FIX: remover landing_page_url do adgroup (vai no ad level)
  schedule_type: 'SCHEDULE_FROM_NOW',
  schedule_start_time: jitteredSchedule,
}
```

**Ad payload V2:**
```javascript
var adPayload = {
  request_id: makeRequestId(),
  advertiser_id: advId,
  adgroup_id: adgroupId,
  ad_name: (body.ad_name || campPayload.campaign_name) + ' ' + adSuffix,
  creative_list: [{
    creative_info: {
      ad_format: 'SINGLE_VIDEO',
      tiktok_item_id: sd.item_id,
      identity_type: 'AUTH_CODE',
      identity_id: sd.identity_id,
      // ⬇️ NOVO: identity_authorized_bc_id se BC_AUTH_TT
      // identity_authorized_bc_id: bcId  (quando identity_type === 'BC_AUTH_TT')
    }
  }],
  ad_text_list: (body.ad_texts || ['Shop now']).map(function(t) { return { ad_text: t } }),
  landing_page_url_list: [{ landing_page_url: accountDomain }],
  // ⬇️ MESMO: CTA handling
  // call_to_action_list ou ad_configuration.call_to_action_id
}
```

**Endpoints usados (IGUAIS ao V1 — mesmo /smart_plus/):**
```
POST /smart_plus/campaign/create/
POST /smart_plus/adgroup/create/
POST /smart_plus/ad/create/
```

---

## All-in-One Spark Ad (`/business/spark_ad/create/`)

A docs também mostra um endpoint All-in-One que cria Campaign + AdGroup + Ad em 1 request:
`POST /business/spark_ad/create/`

**Limitação**: Só suporta objectives REACH, TRAFFIC, VIDEO_VIEWS, ENGAGEMENT.
**NÃO suporta WEB_CONVERSIONS** (nosso caso de uso principal).

→ **Decisão**: Não usar para V2 principal. Pode ser útil futuramente para campanhas de branding.

---

## Etapas de implementação

### Fase 1: Frontend - Preparação (sem risco)
1. [ ] Adicionar `'smart-v2'` ao type `CampaignType`
2. [ ] Adicionar card V2 no seletor de tipos, renomear V1 para "legacy"
3. [ ] Mudar grid de 3 para 4 colunas
4. [ ] Adicionar `launchSmartV2` no api.ts
5. [ ] Adicionar badge CSS `.badge-warning` para V1 legacy

### Fase 2: Frontend - Novos controles (V2 only)
6. [ ] Toggle "Bid Strategy" no StepStructure (Cost Cap vs Maximum Delivery)
7. [ ] Esconder CPA quando Maximum Delivery
8. [ ] Atualizar StepLaunch para chamar endpoint V2

### Fase 3: Backend (api/tk.js)
9. [ ] Criar handler `launch_smart_v2` copiando `launch_smart`
10. [ ] Fix campaign: `BUDGET_MODE_DYNAMIC_DAILY_BUDGET` + `budget_optimize_on: true`
11. [ ] Fix adgroup: `targeting_optimization_mode: 'AUTOMATIC'` + `bid_type` configurável
12. [ ] Fix adgroup: remover `landing_page_url` (já vai no ad)
13. [ ] Ajustar ad: suporte a `identity_authorized_bc_id` para BC_AUTH_TT

### Fase 4: Testes
14. [ ] Testar V1 continua funcionando normalmente (zero mudanças)
15. [ ] Testar V2 com 1 conta + 1 campanha pausada
16. [ ] Validar que os responses estão sendo parseados corretamente

---

## Resumo de risco

- **V1 não é tocado** → zero risco de quebrar o que funciona
- **V2 é novo handler separado** → se der erro, só V2 falha
- **Endpoints são os mesmos** (`/smart_plus/*`) → sem risco de migração de API
- **Principais fixes**: budget_mode correto, targeting_optimization_mode, bid_type flexível
