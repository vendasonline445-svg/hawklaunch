# HawkLaunch — API Reference

> Este arquivo é a fonte de verdade da API do projeto. Consultar antes de criar qualquer endpoint ou função nova.

---

## Índice

- [Visão Geral](#visão-geral)
- [Endpoints](#endpoints)
- [Tipos / Schemas](#tipos--schemas)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Notas e Decisões de Design](#notas-e-decisões-de-design)

---

## Visão Geral

<!-- Descreva aqui o propósito geral da API, tecnologias usadas, autenticação, etc. -->

---

## Endpoints

<!-- Adicione cada endpoint no formato abaixo -->

<!--
### `GET /api/exemplo`

**Descrição:** ...

**Query Params:**
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `foo` | string | sim | ... |

**Response `200`:**
```json
{
  "exemplo": true
}
```

**Erros:**
| Código | Motivo |
|--------|--------|
| 400 | ... |
| 500 | ... |
-->

---

## Tipos / Schemas

<!-- Defina aqui os tipos, interfaces ou schemas de dados usados na API -->

---

## Variáveis de Ambiente

<!-- Liste as variáveis de ambiente necessárias para a API funcionar -->

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| | | |

---

## Notas e Decisões de Design

<!-- Registre aqui decisões importantes, limitações ou comportamentos não óbvios da API -->


# TikTok Business API V1.3

> Exportado via Postman API

---


## 📁 Files

### POST — File upload

**Endpoint:** `POST {{base_url}}/v1.3/file/start/upload/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id":{{advertiser_id}},
    "size": {{size}},
    "content_type": "video",
    "name": {{name}}
}
```

---

### POST — File transfer upload

**Endpoint:** `POST {{base_url}}/v1.3/file/transfer/upload/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: multipart/form-data
```

---

### POST — File finish upload

**Endpoint:** `POST {{base_url}}/v1.3/file/finish/upload/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "upload_id": {{upload_id}}
}
```

---

### POST — File temporarily upload

**Endpoint:** `POST {{base_url}}/v1.3/file/temporarily/upload/`

**Headers:**
```
Access-Token: {{access_token}}
```

---


## 📁 Spark Ads

### GET — TT Video List

**Endpoint:** `GET {{base_url}}/v1.3/tt_video/list/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---

### GET — TT Video Info

**Endpoint:** `GET {{base_url}}/v1.3/tt_video/info/?auth_code={{auth_code}}&advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `auth_code` | {{auth_code}} |  |
| `advertiser_id` | {{advertiser_id}} |  |

---

### POST — TT Video authorize

**Endpoint:** `POST {{base_url}}/v1.3/tt_video/authorize/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "auth_code": {{auth_code}}
}
```

---

### POST — TT Video unbind

**Endpoint:** `POST {{base_url}}/v1.3/tt_video/unbind/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "item_id": {{item_id}}
}
```

---


## 📁 Playable ads

### GET — Playable Get

**Endpoint:** `GET {{base_url}}/v1.3/playable/get/?advertiser_id={{advertiser_id}}&playable_id={{playable_id}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `playable_id` | {{playable_id}} |  |

---

### GET — Playable Validate

**Endpoint:** `GET {{base_url}}/v1.3/playable/validate?advertiser_id={{advertiser_id}}&playable_id={{playable_id}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `playable_id` | {{playable_id}} |  |

---

### POST — Playable Upload

**Endpoint:** `POST {{base_url}}/v1.3/playable/upload/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

---

### POST — Playable Save

**Endpoint:** `POST {{base_url}}/v1.3/playable/save/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "playable_id": {{playable_id}},
    "playable_name": {{playable_name}}
}
```

---

### POST — Playable Delete

**Endpoint:** `POST {{base_url}}/v1.3/playable/delete/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `` |  |  |

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "playable_id": {{playable_id}}
}
```

---


## 📁 Page

### GET — Page Get

**Endpoint:** `GET {{base_url}}/v1.3/page/get/?advertiser_id={{advertiser_id}}&update_time_range={"start":"2022-06-01 22:00:00","end":"2022-06-02 22:00:00"}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `business_type` | TIKTOK_INSTANT_PAGE |  |
| `update_time_range` | {"start":"2022-06-01 22:00:00","end":"2022-06-02 22:00:00"} |  |

---


## 📁 Terms & Tools

### GET — Tool Language

**Endpoint:** `GET {{base_url}}/v1.3/tool/language/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---

### GET — Action Category

**Endpoint:** `GET {{base_url}}/v1.3/tool/action_category/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `industry_types` | ["EMPLOYMENT"] |  |

---

### GET — Tool Device Model

**Endpoint:** `GET {{base_url}}/v1.3/tool/device_model/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---

### GET — Tool Language

**Endpoint:** `GET {{base_url}}/v1.3/tool/language/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `lang` | en |  |
| `industry_types` | ["fdsfds"] |  |
| `version` | 0 |  |
| `placement` | ["PLACEMENT_PANGLE"] |  |

---

### GET — Tool Interest Category

**Endpoint:** `GET {{base_url}}/tool/interest_category/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `lang` | en |  |
| `industry_types` | ["fdsfds"] |  |
| `version` | 0 |  |
| `placement` | ["PLACEMENT_PANGLE"] |  |

---

### GET — Regions

**Endpoint:** `GET {{base_url}}/v1.3/tool/region/?advertiser_id={{advertiser_id}}&objective_type=APP_INSTALL&placements=["PLACEMENT_TIKTOK"]`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `objective_type` | APP_INSTALL |  |
| `platform_type` |  |  |
| `placements` | ["PLACEMENT_TIKTOK"] |  |

---

### GET — Interest keyword recommend

**Endpoint:** `GET {{base_url}}/v1.3/tool/interest_keyword/recommend/?advertiser_id={{advertiser_id}}&keyword=golf`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `keyword` | golf |  |

---

### GET — Interest keyword get

**Endpoint:** `GET {{base_url}}/v1.3/tool/interest_keyword/get/?advertiser_id={{advertiser_id}}&keyword_query=[{"keyword_id": {{keyword}}}]`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `keyword_query` | [{"keyword_id": {{keyword}}}] |  |

---

### GET — Tool OS version

**Endpoint:** `GET {{base_url}}/v1.3/tool/os_version/?advertiser_id={{advertiser_id}}&os_type=IOS`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `os_type` | IOS |  |
| `lang` | 0 |  |

---

### GET — Tool Timezone

**Endpoint:** `GET {{base_url}}/v1.3/tool/timezone/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `lang` | 0 |  |

---

### GET — Tool open url

**Endpoint:** `GET {{base_url}}/v1.3/tool/open_url/?advertiser_id={{advertiser_id}}&url={{url}}&url_type=USER_PROFILE`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `url` | {{url}} |  |
| `url_type` | USER_PROFILE |  |

---

### GET — Tool brand safety partner

**Endpoint:** `GET {{base_url}}/v1.3/tool/brand_safety/partner/authorize/status/?advertiser_id={{advertiser_id}}&partner={{partner}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `partner` | {{partner}} |  |

---

### GET — Tool Carrier

**Endpoint:** `GET {{base_url}}/v1.3/tool/carrier/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `os_type` | IOS14_MINUS |  |
| `lang` | 0 |  |

---

### GET — Term get

**Endpoint:** `GET {{base_url}}/v1.3/term/get/?advertiser_id={{advertiser_id}}&term_type=LeadAds`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `term_type` | LeadAds |  |

---

### GET — Catalog Get

**Endpoint:** `GET {{base_url}}/v1.3/catalog/get/?bc_id={{bc_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |

---

### GET — Term check

**Endpoint:** `GET {{base_url}}v1.3/term/check/?advertiser_id={{advertiser_id}}&term_type=LeadAds`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `term_type` | LeadAds |  |

---

### POST — Term confirm

**Endpoint:** `POST {{base_url}}/v1.3/term/confirm/?advertiser_id={{advertiser_id}}&term_type=LeadAds`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `term_type` | LeadAds |  |

---

### GET — Tool hashtag get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/tool/hashtag/get/?advertiser_id={{advertiser_id}}&keyword_ids=[{{keyword_id}}]`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `keyword_ids` | [{{keyword_id}}] |  |

---

### POST — Tool Bid recommend

**Endpoint:** `POST {{base_url}}/open_api/v1.3/tool/bid/recommend/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "objective_type": "TRAFFIC",
    "location_ids": [
        {{location_id}}
    ],
    "campaign_id": "{{campaign_id}}"
}
```

---

### POST — Tool Target Tags recommend

**Endpoint:** `POST {{base_url}}/open_api/v1.3/tool/target_tags/recommend/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "region_codes": [
        "JP"
    ]
}
```

---

### GET — Tool Hashtag Recommend

**Endpoint:** `GET {{base_url}}/open_api/v1.3/tool/hashtag/recommend/?keywords=["game"]&advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `keywords` | ["game"] |  |
| `advertiser_id` | {{advertiser_id}} |  |

---

### POST — Tool Diagnosis adopt

**Endpoint:** `POST {{base_url}}/open_api/v1.3/tool/diagnosis/adopt/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "apply_items": [
        {
            "adgroup_id": "{{adgroup_id}}",
            "item_id": "{{item_id}}",
            "type": "SUGGEST_BUDGET",
            "initial_budget": 20.0,
            "adopted_budget": 125.0
        }
    ]
}
```

---

### GET — Tool Targeting Search

**Endpoint:** `GET {{base_url}}/v1.3/targeting/search/?advertiser_id={{advertiser_id}}&targeting_type=INTEREST_AND_BEHAVIOR`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `targeting_type` | INTEREST_AND_BEHAVIOR |  |

---


## 📁 Creative Tools

### GET — Get Images and assets first

**Endpoint:** `GET {{base_url}}/v1.3/file/image/ad/search/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---

### POST — Image Tailor

**Endpoint:** `POST {{base_url}}/v1.3/creative/image/tailor/?advertiser_id={{advertiser_id}}&image_id={{image_id}}&width=550&height=720&edit_method=fix_size`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `image_id` | {{image_id}} |  |
| `width` | 550 |  |
| `height` | 720 |  |
| `edit_method` | fix_size |  |

---

### GET — Creative Reports

**Endpoint:** `GET {{base_url}}/v1.3/creative/report/get/?advertiser_id={{advertiser_id}}&material_type=IMAGE&lifetime=true&filtering={"page": 1, "page_size": 100}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `material_type` | IMAGE |  |
| `lifetime` | true |  |
| `filtering` | {"page": 1, "page_size": 100} |  |

---

### GET — Tag Reports

**Endpoint:** `GET {{base_url}}/v1.3/creative/tag_reports/get/?advertiser_id={{advertiser_id}}&material_type=IMAGE&lifetime=true&bc_id={{bc_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `material_type` | IMAGE |  |
| `lifetime` | true |  |
| `filters` | {"ad_id":["123456"]} |  |
| `material_type` | IMAGE |  |
| `bc_id` | {{bc_id}} |  |

---

### POST — Smart text generate

**Endpoint:** `POST {{base_url}}/v1.3/creative/smart_text/generate/?advertiser_id={{advertiser_id}}&adgroup_id={{adgroup_id}}&industry_id={{industry_id}}&keywords=["Make MAPI"]&language=EN`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `material_type` | IMAGE |  |
| `lifetime` | true |  |
| `adgroup_id` | {{adgroup_id}} |  |
| `industry_id` | {{industry_id}} |  |
| `keywords` | ["Make MAPI"] |  |
| `language` | EN |  |

---

### POST — Smart text feedback

**Endpoint:** `POST {{base_url}}/v1.3/creative/smart_text/feedback/?advertiser_id={{advertiser_id}}&adgroup_id={{adgroup_id}}&generated_text_id={{generate_text_id}}&selected_titles=[{"generated_title":"Make MAPI! GET FREE ITEMS NOW","final_title":"Make MAPI! GET FREE ITEMS NOW"}]`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `adgroup_id` | {{adgroup_id}} |  |
| `generated_text_id` | {{generate_text_id}} |  |
| `selected_titles` | [{"generated_title":"Make MAPI! GET FREE ITEMS NOW","final_title":"Make MAPI! GET FREE ITEMS NOW"}] |  |

---

### POST — Video Soundtrack

**Endpoint:** `POST {{base_url}}/v1.3/creative/video_soundtrack/create/?advertiser_id={{advertiser_id}}&video_id={{video_id}}&music_ids={{music_ids}}&video_volume=0.5&music_volume=0.5&name_prefix=test_string&callback_info={{callback_info}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `video_id` | {{video_id}} |  |
| `music_ids` | {{music_ids}} |  |
| `video_volume` | 0.5 |  |
| `music_volume` | 0.5 |  |
| `name_prefix` | test_string |  |
| `callback_info` | {{callback_info}} |  |

---

### POST — Quick Optimization

**Endpoint:** `POST {{base_url}}/v1.3/creative/quick_optimization/create/?advertiser_id={{advertiser_id}}&video_id={{video_id}}&callback_info={{callback_info}}&title=test_title&description=test_description`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `video_id` | {{video_id}} |  |
| `callback_info` | {{callback_info}} |  |
| `title` | test_title |  |
| `description` | test_description |  |

---

### POST — Smart Video create

**Endpoint:** `POST {{base_url}}/v1.3/creative/smart_video/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
        "advertiser_id": {{advertiser_id}},
        "style": "PEACEFUL",
        "layout": "VERTICAL",
        "videos": [
            {
                "video_id": {{video_id}},
                "start_time": 1,
                "end_time": 6
            }
        ],
        "images": [
            {
                "image_id": {{image_id}}
            }
        ],
        "text_list": [
            {
                "value": "1100",
                "tag": "original_price"
            },
            {
                "value": "150",
                "tag":"price"
            },
            {
                "value": "产品卖点测试1",
                "tag": "selling_points"
            },
            {
                "value": "产品卖点测试2",
                "tag": "selling_points"
            },

            {
                "value": "营销信息测试",
                "tag": "description"
            }
        ],
        "music_type": "RECOMMEND",
        "frame": [
            {
                "frame_type": "FINAL_FRAME",
                "material_type": "VIDEO",
                "video_id": {{video_id}}
            }
        ],
        "callback_info": {
            "callback_url": {{callback_url}},
            "callback_extra_info": {
                "info": "auto-test",
                "subject": "dvg"
            }
        }
}

```

---

### POST — Portfolio Create

**Endpoint:** `POST {{base_url}}/v1.3/creative/portfolio/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "creative_portfolio_type": "CTA",
    "portfolio_content": [
        {
            "asset_ids": [
                "{{asset_id}}",
                "{{asset_id}}"
            ],
            "asset_content": "Learn More"
        }
    ]
}
```

---

### POST — Portfolio create premium badge

**Endpoint:** `POST {{base_url}}/v1.3/creative/portfolio/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
        "advertiser_id" : {{advertiser_id}},
        "creative_portfolio_type": "PREMIUM_BADGE",
        "portfolio_content" : [
            {
                "asset_ids": [
                    {{asset_ids}}
                ],
                "asset_content": "learn_more",
                "badge_show_time": 4,
                "call_to_action_text": "learn_more",
                "badge_position": {
                    "position_x": 0.4,
                    "position_y": 0.4
                },
                "badge_image_info": {
                    "image_id": {{image_id}}
                }
            }
        ]
    }


```

---

### GET — Portfolio get

**Endpoint:** `GET {{base_url}}/v1.3/creative/portfolio/get/?advertiser_id={{advertiser_id}}&creative_portfolio_id={{creative_portfolio_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `creative_portfolio_id` | {{creative_portfolio_id}} |  |

---

### GET — Portfolio get premium badge

**Endpoint:** `GET {{base_url}}/v1.3/creative/portfolio/get/?advertiser_id={{advertiser_id}}&creative_portfolio_id={{creative_portfolio_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `creative_portfolio_id` | {{creative_portfolio_id}} |  |

---

### GET — Creative status get

**Endpoint:** `GET {{base_url}}/v1.3/creative/status/get/?advertiser_id={{advertiser_id}}&task_id={{task_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `task_id` | {{task_id}} |  |

---

### POST — Asset share

**Endpoint:** `POST {{base_url}}/v1.3/creative/asset/share/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "asset_type": "MUSIC",
    "material_ids": [
        "{{material_id}}"
    ],
    "shared_advertiser_ids": [
        "{{shared_advertiser_id}}"
    ]
}
```

---

### GET — Creative fatigue detect

**Endpoint:** `GET {{base_url}}/v1.3/creative_fatigue/get/?advertiser_id={{advertiser_id}}&ad_id={{ad_id}}&filtering={"start_date": "2023-05-22", "end_date": "2023-05-24"}&page=1&page_size=100`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `ad_id` | {{ad_id}} |  |
| `filtering` | {"start_date": "2023-05-22", "end_date": "2023-05-24"} |  |
| `page` | 1 |  |
| `page_size` | 100 |  |

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "ad_id": "{{ad_id}}",
    "filtering": {
        "start_date": "2023-05-22",
        "end_date": "2023-05-24"
    },
    "page": 1,
    "page_size": 500
}
```

---

### GET — CTA recommend

**Endpoint:** `GET {{base_url}}/v1.3/creative/cta/recommend/?advertiser_id={{advertiser_id}}&asset_type=CTA_AUTO_OPTIMIZED&content_type=APP_DOWNLOAD`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `asset_type` | CTA_AUTO_OPTIMIZED |  |
| `content_type` | APP_DOWNLOAD |  |

---


## 📁 Insights Reports + Billing Group

### GET — Billing group get

**Endpoint:** `GET {{base_url}}/v1.3/bc/billing_group/get/?bc_id={{bc_id}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `bc_id` | {{bc_id}} |  |

---

### POST — Billing group update

**Endpoint:** `POST {{base_url}}/v1.3/bc/billing_group/update/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "bc_id": {{bc_id}},
    "billing_group_id": {{billing_group_id}},
    "new_billing_group_name": {{name}}
}
```

---

### GET — Ad benchmark get

**Endpoint:** `GET {{base_url}}/v1.3/report/ad_benchmark/get/?advertiser_id={{advertiser_id}}&dimensions=["LOCATION"]&filtering={{filtering}}&sort_field=AD_ID&sort_type=ASC&page=1&page_size=10&metrics_fields=["cost","impression", "click", "cpa"]`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `dimensions` | ["LOCATION"] |  |
| `filtering` | {{filtering}} |  |
| `sort_field` | AD_ID |  |
| `sort_type` | ASC |  |
| `page` | 1 |  |
| `page_size` | 10 |  |
| `metrics_fields` | ["cost","impression", "click", "cpa"] |  |

---

### GET — Video Performance

**Endpoint:** `GET {{base_url}}/v1.3/report/video_performance/get/?advertiser_id={{advertiser_id}}&dimensions=["LOCATION"]&filtering={{filtering}}&sort_field=CREATE_TIME&sort_type=ASC&page=1&page_size=10&metrics_fields=["view_count"]`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `dimensions` | ["LOCATION"] |  |
| `filtering` | {{filtering}} |  |
| `sort_field` | CREATE_TIME |  |
| `sort_type` | ASC |  |
| `page` | 1 |  |
| `page_size` | 10 |  |
| `metrics_fields` | ["view_count"] |  |

---

### GET — Get Ads

**Endpoint:** `GET {{base_url}}/v1.3/ad/get/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---

### POST — Billing group create

**Endpoint:** `POST {{base_url}}/v1.3/bc/billing_group/create/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "bc_id": {{bc_id}},
    "advertiser_ids": {{advertiser_ids}},
    "billing_group_name": {{name}}
}
```

---

### GET — Billing Group Advertiser list

**Endpoint:** `GET {{base_url}}/v1.3/bc/billing_group/advertiser/list/?bc_id={{bc_id}}&billing_group_id={{billing_group_id}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `billing_group_id` | {{billing_group_id}} |  |

---

### GET — Video Perf Get

**Endpoint:** `GET {{base_url}}/v1.3/report/video_performance/get/?advertiser_id={{advertiser_id}}&filtering={{filtering}}&order_field=CREATE_TIME&order_type=ASC&page=1&page_size=10`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `filtering` | {{filtering}} |  |
| `order_field` | CREATE_TIME |  |
| `order_type` | ASC |  |
| `page` | 1 |  |
| `page_size` | 10 |  |

---


## 📁 BC invoice

### GET — BC Invoice get

**Endpoint:** `GET {{base_url}}/v1.3/bc/invoice/get/?bc_id={{bc_id}}&invoice_types=["RECON", "CREDIT"]&start_time=2018-06-01 00:00:00&page_size=1&end_time=2022-03-02 00:00:00`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `invoice_types` | ["RECON", "CREDIT"] |  |
| `start_time` | 2018-06-01 00:00:00 |  |
| `page_size` | 1 |  |
| `end_time` | 2022-03-02 00:00:00 |  |

---

### GET — BC Invoice Unpaid get

**Endpoint:** `GET {{base_url}}/v1.3/bc/invoice/unpaid/get/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
	"bc_id": {{advertiser_id}},
    "invoice_type": "RECON"
}
```

---

### GET — BC Invoice download

**Endpoint:** `GET {{base_url}}/v1.3/bc/invoice/download/?bc_id={{bc_id}}&invoice_id={{invoice_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `invoice_id` | {{invoice_id}} |  |

---

### GET — BC invoice task list

**Endpoint:** `GET {{base_url}}/v1.3/bc/invoice/task/list/?bc_id={{bc_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `page_size` | 140 |  |

---

### POST — BC invoice task create

**Endpoint:** `POST {{base_url}}/v1.3/bc/invoice/task/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "bc_id": {{bc_id}},
    "download_type": "INVOICE_LIST",
    "filtering":{
        "billing_group_id": {{billing_group_id}},
        "pay_statuses": ["UNPAID", "NO_NEED"]
    }
}
```

---

### GET — BC Invoice task get

**Endpoint:** `GET {{base_url}}/v1.3/bc/invoice/task/get/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
	"bc_id": {{bc_id}},
    "task_id": {{task_id}}

}
```

---


## 📁 Leads

### POST — Create mock lead

**Endpoint:** `POST {{base_url}}/v1.3/page/lead/mock/create/?advertiser_id={{advertiser_id}}&page_id={{page_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `page_id` | {{page_id}} |  |

---

### GET — Get mock lead

**Endpoint:** `GET {{base_url}}/v1.3/page/lead/mock/get/?advertiser_id={{advertiser_id}}&page_id={{page_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `page_id` | {{page_id}} |  |

---

### POST — Delete mock lead

**Endpoint:** `POST {{base_url}}/v1.3/page/lead/mock/delete/?advertiser_id={{advertiser_id}}&lead_id={{lead_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `lead_id` | {{lead_id}} |  |

---

### POST — Create lead download task

**Endpoint:** `POST {{base_url}}/v1.3/page/lead/task/?advertiser_id={{advertiser_id}}&task_id={{task_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `task_id` | {{task_id}} |  |

---

### GET — Download leads

**Endpoint:** `GET {{base_url}}/v1.3/page/lead/task/download/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---

### POST — Transfer page library

**Endpoint:** `POST {{base_url}}/v1.3/page/library/transfer/?advertiser_id={{advertiser_id}}&bc_id={{bc_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `bc_id` | {{bc_id}} |  |

---

### GET — Get page library

**Endpoint:** `GET {{base_url}}/v1.3/page/library/get/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "bc_id": {{bc_id}}
}
```

---

### GET — Get instant page fields

**Endpoint:** `GET {{base_url}}/v1.3/page/field/get/?advertiser_id={{advertiser_id}}&page_id={{page_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `page_id` | {{page_id}} |  |

---


## 📁 Reporting


### 📁 Sync Report

#### GET — Run a synchronous report

**Endpoint:** `GET {{base_url}}/v1.3/report/integrated/get/?advertiser_id={{advertiser_id}}&page=1&data_level=AUCTION_AD&report_type=BASIC&dimensions=["ad_id","stat_time_hour"]&metrics=["clicks"]&page_size=1&start_date=2022-07-17&end_date=2022-07-17&filtering=[{"field_name":"create_time","filter_type":"BETWEEN","filter_value": "[\"2022-02-24 11:57:51\",\"2022-03-24 11:57:51\"]"}]`

**Headers:**
```
Access-Token: {{access-token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `page` | 1 |  |
| `data_level` | AUCTION_AD |  |
| `report_type` | BASIC |  |
| `dimensions` | ["ad_id","stat_time_hour"] |  |
| `metrics` | ["clicks"] |  |
| `page_size` | 1 |  |
| `start_date` | 2022-07-17 |  |
| `end_date` | 2022-07-17 |  |
| `filtering` | [{"field_name":"create_time","filter_type":"BETWEEN","filter_value": "[\"2022-02-24 11:57:51\",\"2022-03-24 11:57:51\"]"}] |  |

---


### 📁 Async Report

#### POST — Create an asynchronous report task

**Endpoint:** `POST {{base_url}}/v1.3/report/task/create/`

**Headers:**
```
Access-Token: {{access-token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "page":1,
    "data_level":"AUCTION_AD",
    "report_type":"BASIC",
    "dimensions": ["ad_id","stat_time_hour"],
    "metrics": ["clicks"],
    "page_size": 1,
    "start_date": "2022-07-17",
    "end_date": "2022-07-17",
    "output_format": "CSV_DOWNLOAD",
    "file_name": "test",
    "filtering": [
        {
        "field_name":"create_time",
        "filter_type":"BETWEEN",
        "filter_value": "[\"2022-02-24 11:57:51\",\"2022-03-24 11:57:51\"]"
        }
    ]
}
```

---

#### GET — Get asynchronous task status

**Endpoint:** `GET {{base_url}}/v1.3/report/task/check/?advertiser_id={{advertiser_id}}&task_id={{task_id}}`

**Headers:**
```
Access-Token: {{access-token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `task_id` | {{task_id}} |  |

---

#### GET — Download asynchronous report data

**Endpoint:** `GET {{base_url}}/v1.3/report/task/download/?advertiser_id={{advertiser_id}}&task_id={{task_id}}`

**Headers:**
```
Access-Token: {{access-token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `task_id` | {{task_id}} |  |

---


## 📁 Business Account

### GET — Business user get

**Endpoint:** `GET {{base_url}}/v1.3/business/get/?business_id={{business_id}}&fields=[ "audience_countries", "audience_genders", "followers_count", "display_name", "username", "likes"]`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `business_id` | {{business_id}} |  |
| `fields` | [ "audience_countries", "audience_genders", "followers_count", "display_name", "username", "likes"] |  |

---

### GET — Business video list

**Endpoint:** `GET {{base_url}}/v1.3/business/video/list/?business_id={{business_id}}&filters={{filters}}&fields=["item_id", "thumbnail_url", "caption", "likes", "comments", "shares", "video_views", "create_time", "total_time_watched", "average_time_watched", "reach", "full_video_watched_rate", "impression_sources", "audience_countries"]`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `business_id` | {{business_id}} |  |
| `filters` | {{filters}} |  |
| `fields` | ["item_id", "thumbnail_url", "caption", "likes", "comments", "shares", "video_views", "create_time", "total_time_watched", "average_time_watched", "reach", "full_video_watched_rate", "impression_sources", "audience_countries"] |  |

---

### GET — Business comment list

**Endpoint:** `GET {{base_url}}/v1.3/business/comment/list/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "business_id" : {{business_id}},
    "video_id": {{video_id}},
    "status": "PUBLIC"
}
```

---

### GET — Business comment reply

**Endpoint:** `GET {{base_url}}/v1.3/business/comment/reply/list/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "business_id" : {{business_id}},
    "video_id": {{video_id}},
    "comment_id": {{comment_id}},
    "status": "ALL"
}
```

---

### POST — Business comment create

**Endpoint:** `POST {{base_url}}/v1.3/business/comment/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "business_id" : {{business_id}},
    "video_id": {{video_id}},
    "text": {{text}}
}
```

---

### POST — Business comment reply create

**Endpoint:** `POST {{base_url}}/v1.3/business/comment/reply/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "business_id" : {{business_id}},
    "video_id": {{video_id}},
    "comment_id": {{comment_id}},
    "text": "text"
}
```

---

### POST — Business comment delete

**Endpoint:** `POST {{base_url}}/v1.3/business/comment/delete/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "business_id" : {{business_id}},
    "comment_id": {{comment_id}}
}
```

---

### POST — Business comment like

**Endpoint:** `POST {{base_url}}/v1.3/business/comment/like/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "business_id" : {{business_id}},
    "comment_id": {{comment_id}},
    "action": "UNLIKE"
}
```

---

### POST — Business comment hide

**Endpoint:** `POST {{base_url}}/v1.3/business/comment/hide/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "business_id" : {{business_id}},
    "video_id": {{video_id}},
    "comment_id": {{comment_id}},
    "action": "UNHIDE"
}
```

---

### POST — Business comment pin

**Endpoint:** `POST {{base_url}}/v1.3/business/comment/pin/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "business_id" : {{business_id}},
    "video_id": {{video_id}},
    "comment_id": {{comment_id}},
    "action": "PIN"
}
```

---

### POST — Business video publish

**Endpoint:** `POST {{base_url}}/v1.3/business/video/publish/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json

{
    "business_id": {{business_id}},
    "video_url":{{video_url}},"post_info":{"caption":"Test.","disable_comment":false,"disable_duet":false,"disable_stitch":false}}
```

---


## 📁 Ad Comments

### GET — Comment Task Export V1.3

**Endpoint:** `GET {{base_ur}}/v1.3/comment/task/download/?advertiser_id={{advertiser_id}}&task_id={{task_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `task_id` | {{task_id}} |  |

---

### GET — Comment Task Check V1.3

**Endpoint:** `GET {{base_url}}/v1.3/comment/task/check/?advertiser_id={{advertiser_id}}&task_id={{task_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `task_id` | {{task_id}} |  |

---

### POST — Comment Task Create V1.3

**Endpoint:** `POST {{base_ur}}/v1.3/comment/task/check/?advertiser_id={{advertiser_id}}&task_id={{task_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `task_id` | {{task_id}} |  |

---

### POST — Comment Delete V1.3

**Endpoint:** `POST {{base_url}}/v1.3/comment/delete/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "comment_id": {{comment_id}},
    "ad_id": {{ad_id}},
    "identity_id": {{identity_id}},
    "identity_type": {{identity_type}},
    "tiktok_item_id": {{tiktok_item_id}}
}
```

---

### GET — Comment Top V1.3

**Endpoint:** `GET {{base_url}}/v1.3/comment/pinned/get/?advertiser_id={{advertiser_id}}&ad_id={{ad_Id}}&identity_id={{identity_id}}&identity_type={{identity_type}}&tiktok_item_id={{tiktok_item_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `ad_id` | {{ad_Id}} |  |
| `identity_id` | {{identity_id}} |  |
| `identity_type` | {{identity_type}} |  |
| `tiktok_item_id` | {{tiktok_item_id}} |  |

---

### POST — Comment Pin V1.3

**Endpoint:** `POST {{base_url}}/v1.3/comment/pin/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "comment_id": {{comment_id}},
    "pin_type": "PIN",
    "ad_id": {{ad_id}},
    "identity_id": {{identity_id}},
    "identity_type": "TT_USER",
    "tiktok_item_id": {{tiktok_item_id}}
}
```

---

### POST — Comment Post V1.3

**Endpoint:** `POST {{base_url}}/v1.3/comment/post/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "comment_id": {{comment_id}},
    "comment_type": "REPLY",
    "ad_id": {{ad_id}},
    "identity_id": {{identity_id}},
    "identity_type": "TT_USER",
    "tiktok_item_id": {{tiktok_item_id}},
    "text": "Coco is an amazing kitten 6!"
}
```

---

### POST — Comment Status Update V1.3

**Endpoint:** `POST {{base_ur;l}}/v1.3/comment/status/update/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "comment_ids": {{comment_id}},
    "operation": "PUBLIC"
}
```

---

### GET — Comment Reference V1.3

**Endpoint:** `GET {{base_url}}/v1.3/comment/reference/?advertiser_id={{advertiser_id}}&comment_id={{comment_id}}&comment_type=COMMENT`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `comment_id` | {{comment_id}} |  |
| `comment_type` | COMMENT |  |

---

### GET — Comment List V1.3

**Endpoint:** `GET {{base_url}}/comment/list/?advertiser_id={{advertiser_id}}&search_field=ADGROUP_ID&search_value={{value}}&page=6&ad_type=BIDDING&start_time=2022-06-30&end_time=2022-07-04`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `search_field` | ADGROUP_ID |  |
| `search_value` | {{value}} |  |
| `page` | 6 |  |
| `ad_type` | BIDDING |  |
| `start_time` | 2022-06-30 |  |
| `end_time` | 2022-07-04 |  |

---


## 📁 Subscription

### POST — Subscribe V1.3

**Endpoint:** `POST {{base_url}}/v1.3/subscription/subscribe/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "app_id": {{app_id}},
    "secret": {{secret}},
    "subscription_detail": {
        "access_token": {{access_token}},
        "advertiser_id": {{advertiser_id}},
        "ad_id": {{ad_id}}
    },
    "subscribe_entity": "CREATIVE_FATIGUE",
    "callback_url": {{callback_url}}
}
```

---

### POST — Unsubscribe V1.3

**Endpoint:** `POST {{base_path}}/v1.3/subscription/unsubscribe/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "app_id": {{app_id}},
    "secret": {{secret}},
    "subscription_id": {{subscription_id}}
}
```

---

### GET — Get Subscriptions V1.3

**Endpoint:** `GET {{base_path}}/v1.3/subscription/get/?app_id={{app_id}}&secret={{secret}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `app_id` | {{app_id}} |  |
| `secret` | {{secret}} |  |

---


## 📁 ACO

### GET — ACO get

**Endpoint:** `GET {{base_url}}/v1.3/ad/aco/get/?advertiser_id={{advertiser_id}}&adgroup_ids={{adgroup_ids}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `adgroup_ids` | {{adgroup_ids}} |  |

---

### POST — ACO update

**Endpoint:** `POST {{base_url}}/v1.3/ad/aco/update/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "title_list": [
        {
            "title": "",
            "material_id": {{material_id}},
            "material_operation_status": "ENABLE"
        }
    ],
    "media_info_list": [
        {
            "media_info": {
                "identity_type": "TT_USER",
                "identity_id": {{identity_id}},
                "tiktok_item_id": {{tiktok_item_id}}
            },
            "material_id": {{material_id}},
            "material_operation_status": "ENABLE"
        }
    ],
    "advertiser_id": {{advertiser_id}},
    "common_material": {
        "creative_authorized": true,
        "playable_url": "",
        "ad_name": "test",
        "identity_type": "CUSTOMIZED_USER",
        "identity_id": {{identity_id}}
    },
    "adgroup_id": {{adgroup_id}}
}
```

---

### POST — ACO create

**Endpoint:** `POST {{base_url}}/v1.3/ad/aco/create/`

**Headers:**
```
Access-Token: {{acess_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "title_list": [
        {
            "title": "",
            "material_id": {{material_id}},
            "material_operation_status": "ENABLE"
        }
    ],
    "media_info_list": [
        {
            "media_info": {
                "identity_type": "TT_USER",
                "identity_id": {{identity_id}},
                "tiktok_item_id": {{tiktok_item_id}}
            },
            "material_id": {{material_id}},
            "material_operation_status": "ENABLE"
        }
    ],
    "advertiser_id": {{advertiser_id}},
    "common_material": {
        "creative_authorized": true,
        "playable_url": "",
        "ad_name": "test",
        "identity_type": "CUSTOMIZED_USER",
        "identity_id": {{identity_id}}
    },
    "adgroup_id": {{adgroup_id}}
}
```

---

### POST — ACO material update

**Endpoint:** `POST {{base_url}}/v1.3/ad/aco/material_status/update/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "ad_group_id":{{adgroup_id}},
    "material_ids": {{material_ids}},
    "material_status": "ENABLE"
}
```

---


## 📁 Reach and Frequency

### GET — RF inventory estimate

**Endpoint:** `GET {{base_url}}/v1.3/rf/inventory/estimate/`

**Headers:**
```
Access-Token: {{acess_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "audience_info": {
        "location_ids": [
            {{location_ids}}
        ],
        "network_types": ["5G"]
    },
    "schedule_start_time": "2022-09-12 05:00:00",
    "schedule_end_time": "2022-09-15 04:59:59",
    "frequency": 3,
    "frequency_schedule": 7,
    "objective_type": "RF_REACH",
    "rf_purchased_type": "FIXED_REACH",
    "budget": 508.0,
    "purchased_reach":141,
    "purchased_impression":175
}
```

---

### GET — RF delivery timezone

**Endpoint:** `GET {{base_url}}/v1.3/rf/delivery/timezone/?advertiser_id={{advertiser_Id}}&region_codes=["US","JP","IN"]`

**Headers:**
```
Content-Type: application/json
Access-Token: {{acess_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_Id}} |  |
| `region_codes` | ["US","JP","IN"] |  |

---

### POST — RF Order cancel

**Endpoint:** `POST {{base_url}}/v1.3/rf/order/cancel/?advertiser_id={{advertiser_id}}&adgroup_ids={{adgroup_ids}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `adgroup_ids` | {{adgroup_ids}} |  |

---

### POST — Adgroup RF Update

**Endpoint:** `POST {{base_url}}/v1.3/adgroup/rf/update/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "adgroup_id": {{adgroup_id}},
    "comment_disabled": true,
    "share_disabled": true,
    "optimization_goal": "REACH",
    "rf_purchased_type": "FIXED_BUDGET",
    "purchased_reach": 105,
    "purchased_impression": 141,
    "video_download_enabled": false,
    "pixel_id": 123,
    "age_groups": [
        "AGE_18_24"
    ],
    "operating_systems": [
        "IOS"
    ],
    "network_types": [
        "WIFI",
        "5G"
    ],
    "brand_safety_type": "NO_BRAND_SAFETY",
    "feed_type": "STANDARD_FEED",
    "delivery_mode": "STANDARD",
    "interest_category_ids": [
        "12",
        "15"
    ],
    "carrier_ids": [
        {{carrier_ids}}
    ],
    "excluded_audience_ids":{{excluded_audience_ids}},
    "device_price_ranges": [
        50,
        1000
    ],
    "interest_keyword_ids": [
        {{interest_keyword_ids}}
    ],
    "advertiser_id": {{advertiser_id}},
    "schedule_start_time": "2023-01-10 05:00:00",
    "schedule_end_time": "2023-02-12 04:59:59",
    "frequency": 3,
    "frequency_schedule": 7,
    "location_ids": [
        {{location_ids}}
    ],
    "request_id": {{request_id}},
    "campaign_id": {{campaign_id}},
    "budget": 677.34,
    "promotion_type": "WEBSITE_OR_DISPLAY"
}
```

---

### POST — Adgroup RF create

**Endpoint:** `POST {{base_url}}/v1.3/adgroup/rf/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "comment_disabled": false,
    "share_disabled": false,
    "optimization_goal": "REACH",
    "rf_purchased_type": "FIXED_BUDGET",
    "purchased_reach": 118,
    "purchased_impression": 141,
    "video_download_disabled": true,
    "age_groups": ["AGE_18_24"],
    "operating_systems": ["IOS"],
    "network_types": ["WIFI"],
    "brand_safety_type": "NO_BRAND_SAFETY",
    "external_action": "STANDARD_FEED",
    "advertiser_id":{{advertise_id}},
    "schedule_start_time":"2023-01-10 05:00:00",
    "schedule_end_time":"2023-02-12 04:59:59",
    "frequency":3,
    "frequency_schedule":7,
    "objective_type":"RF_REACH",
    "location_ids":[{{location_ids}}],
    "request_id":{{request_Id}},
    "campaign_id":{{campaign_id}},
    "rf_buy_type":"FIXED_SHOW",
    "optimize_goal":"REACH",
    "budget":677.34,
    "adgroup_name":{{adgroup_name}},
    "promotion_type":"APP_IOS",
    "display_mode":"STANDARD",
    "excluded_audience_ids": [
        {{excluded_audience_ids}}
    ]
}
```

---

### GET — RF Estimated info

**Endpoint:** `GET {{base_url}}/v1.3/adgroup/rf/estimated/info/?advertiser_id={{advertiser_id}}&adgroup_ids={{adgroup_ids}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `adgroup_ids` | {{adgroup_ids}} |  |

---

### GET — RF contract query

**Endpoint:** `GET {{base_url}}/v1.3/rf/contract/query/?advertiser_id={{advetiser_id}}&adgroup_ids={{adgroup_ids}}&included_date=2020-09-18`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advetiser_id}} |  |
| `adgroup_ids` | {{adgroup_ids}} |  |
| `included_date` | 2020-09-18 |  |

---


## 📁 Ads

### POST — Ad Status Update

**Endpoint:** `POST {{base_url}}/v1.3/ad/status/update/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_Id}},
    "ad_ids":[],
    "aco_ad_ids": {{aco_ad_ids}},
    "operation_status": "ENABLE"
}
```

---

### POST — Campaign Create

**Endpoint:** `POST {{base_url}}/v1.3/campaign/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "budget_mode": "BUDGET_MODE_TOTAL",
    "objective_type": "TRAFFIC",
    "campaign_name": "test_v1.3",
    "budget": 5000,
    "optimization_goal": "CLICK"
}
```

---

### GET — Campaign Get

**Endpoint:** `GET {{base_url}}/v1.3/campaign/get/?advertiser_id={{advertiser_id}}&filtering={"campaign_ids":["{{campaign_id}}"]}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `filtering` | {"campaign_ids":["{{campaign_id}}"]} |  |

---

### POST — Campaign Update

**Endpoint:** `POST {{base_url}}/v1.3/campaign/update/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
	"advertiser_id": "{{advertiser_id}}",
    "campaign_id": "{{campaign_id}}",
    "campaign_name": "name"
}
```

---

### POST — Ad Group Create

**Endpoint:** `POST {{base_url}}/v1.3/adgroup/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "campaign_id": "campaign_id",
    "adgroup_name": "name",
    "placement_type": "PLACEMENT_TYPE_NORMAL",
    "placement": [
        "PLACEMENT_TIKTOK"
    ],
    "promotion_type": "LIVE_SHOPPING",
    "identity_type": "BC_AUTH_TT",
    "identity_id": "{{identity_id}}",
    "identity_authorized_bc_id": "{{identity_authorized_bc_id}}",
    "location_ids": [
        {{location_ids}}
    ],
    "budget": 380,
    "budget_mode": "BUDGET_MODE_TOTAL",
    "schedule_type": "SCHEDULE_START_END",
    "schedule_start_time": "2037-12-12 23:23:23",
    "schedule_end_time": "2038-01-01 00:00:00",
    "optimization_goal": "CLICK",
    "pacing": "PACING_MODE_SMOOTH",
    "billing_event": "CPC",
    "bid_proce": 1,
    "comment_disabled": true,
    "secondary_optimization_event": "ACTIVE",
    "deep_cpa_bid": 2,
    "next_day_retention": 0.2,
    "skip_learning_phase": false,
    "conversion_bid_price": 1.3,
    "video_download_disabled": true,
    "search_result_enabled": true
}
```

---

### POST — Ad Group Update

**Endpoint:** `POST {{base_url}}/v1.3/adgroup/update/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
	"advertiser_id": "{{advertiser_id}}",
    "adgroup_id": "{{adgroup_id}}",
    "adgroup_name": "{{name}}"
}
```

---

### GET — Ad Group Get

**Endpoint:** `GET {{base_url}}/v1.3/adgroup/get/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---

### POST — Ad Create

**Endpoint:** `POST {{base_url}}/v1.3/ad/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "adgroup_id": "{{adgroup_id}}",
    "creatives": [
        {
            "call_to_action": "CONTACT_US",
            "ad_name": "{{name}}",
            "ad_text": "{{text}}",
            "ad_format": "SINGLE_VIDEO",
            "image_ids": [
                "{{image_id}}"
            ],
            "app_name": "{{app_name}}",
            "display_name": "{{display_name}}",
            "avatar_icon_web_uri": "{{url}}",
            "landing_page_url": "{{landing_page_url}}",
            "identity_id": "{{identity_id}}",
            "identity_type": "{{identity_type}}"
        }
    ]
}
```

---

### POST — Ad Update

**Endpoint:** `POST {{base_url}}/v1.3/ad/update/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "adgroup_id": "{{adgroup_id}}",
    "advertiser_id": "{{advertiser_id}}",
    "creatives": [
        {
            "ad_id": "{{ad_id}}",
            "ad_name": "{{ad_name}}",
            "identity_id": "{{identity_id}}",
            "identity_type": "CUSTOMIZED_USER",
            "ad_format": "SINGLE_VIDEO",
            "video_id": "{{video_id}}",
            "image_ids": [
                "{{image_id}}"
            ],
            "ad_text": "{{ad_text}}",
            "call_to_action": "{{call_to_action}}",
            "landing_page_url": "{{landing_page_url}}",
            "deeplink": "{{}}",
            "avatar_icon_web_uri": "{{avatar_icon_web_uri}}",
            "deeplink_type": "NORMAL",
            "app_name": "{{app_name}}",
            "display_name": "{{display_name}}"
        }
    ]
}
```

---

### GET — Ad Get

**Endpoint:** `GET {{base_url}}/v1.3/ad/get/?advertiser_id={{advertiser_id}}&filtering={"ad_ids":["{{ad_ids}}"]}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `filtering` | {"ad_ids":["{{ad_ids}}"]} |  |

---


## 📁 Changelog

### POST — Task Create

**Endpoint:** `POST {{base_url}}/v1.3/changelog/task/create/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
   "advertiser_id":{{advertiser_id}},
   "start_time":"2021-01-14 08:00:00",
   "end_time":"2021-02-13 08:00:00"
}
```

---

### GET — Task check

**Endpoint:** `GET {{base_url}}/v1.3/changelog/task/check/?advertiser_id={{advertiser_Id}}&task_id={{task_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_Id}} |  |
| `task_id` | {{task_id}} |  |

---

### GET — Task download

**Endpoint:** `GET {{base_url}}/v1.3/changelog/task/download/?advertiser_id={{advertiser_id}}&task_id={{task_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `task_id` | {{task_id}} |  |

---


## 📁 Identity

### POST — Identity create

**Endpoint:** `POST {{base_url}}/v1.3/identity/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "display_name": "testuser1",
    "image_uri": {{image_uri}}


}
```

---

### GET — Identity get

**Endpoint:** `GET {{base_url}}/v1.3/identity/get/?advertiser_id={{advertiser_id}}&identity_type={{identity_type}}&identity_authorized_bc_id={{identity_authorized_bc_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `identity_type` | {{identity_type}} |  |
| `identity_authorized_bc_id` | {{identity_authorized_bc_id}} |  |

---

### GET — Identity Video

**Endpoint:** `GET {{base_url}}/v1.3/identity/video/get/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "identity_id": {{identity_id}},
    "advertiser_id": {{advertiser_Id}},
    "identity_type": "TT_USER",
    "count": 1
}
```

---

### GET — Identity Music Authorization

**Endpoint:** `GET {{base_url}}/v1.3/identity/music/authorization/?identity_id={{identity_id}}&advertiser_id={{advertiser_id}}&identity_type=BC_AUTH_TT&video_id={{video_id}}&locations=["US"]&start_time=2021-03-01 00:00:00&end_time=2022-03-29 00:00:00&identity_authorized_bc_id={{identity_authorized_bc}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `identity_id` | {{identity_id}} |  |
| `advertiser_id` | {{advertiser_id}} |  |
| `identity_type` | BC_AUTH_TT |  |
| `video_id` | {{video_id}} |  |
| `locations` | ["US"] |  |
| `start_time` | 2021-03-01 00:00:00 |  |
| `end_time` | 2022-03-29 00:00:00 |  |
| `identity_authorized_bc_id` | {{identity_authorized_bc}} |  |

---

### GET — Identity Video Info

**Endpoint:** `GET {{base_url}}/v1.3/identity/video/info/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "identity_id": {{identity_id}},
    "advertiser_id": {{advertiser_id}},
    "identity_type": "BC_AUTH_TT",
    "video_id": {{video_id}},
    "identity_authorized_bc_id": {{identity_authorized_bc_id}}
}
```

---

### GET — Identity info

**Endpoint:** `GET {{base_url}}/v1.3/identity/info/?advertiser_id={{advertiser_Id}}&identity_id={{identity_id}}&identity_type={{identity_type}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_Id}} |  |
| `identity_id` | {{identity_id}} |  |
| `identity_type` | {{identity_type}} |  |

---

### POST — Identity delete

**Endpoint:** `POST {{base_url}}/v1.3/identity/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "display_name": "testuser1",
    "image_uri": {{image_uri}}


}
```

---


## 📁 Creator Marketplace

### POST — TCM campaign create

**Endpoint:** `POST {{base_path}}/v1.3/tcm/campaign/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

---

### GET — TCM similar creators

**Endpoint:** `GET {{base_url}}/v1.3/tcm/similar/creator/?tcm_account_id={{tcm_account_id}}&handle_name={{handle_name}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `tcm_account_id` | {{tcm_account_id}} |  |
| `handle_name` | {{handle_name}} |  |

---

### GET — TCM spark ad status get

**Endpoint:** `GET {{base_url}}/v1.3/tcm/spark_ad/status/get/?tcm_account_id={{tcm_account_id}}&order_id={{order_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `tcm_account_id` | {{tcm_account_id}} |  |
| `order_id` | {{order_id}} |  |

---

### POST — TCM spark ad apply

**Endpoint:** `POST {{business_api}}/v1.3/tcm/spark_ad/apply/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "tcm_account_id": {{tcm_account_id}},
    "order_id": {{order_id}},
    "authorization_days": 7
}
```

---

### POST — TCM video audit status update

**Endpoint:** `POST {{base_url}}/v1.3/tcm/video/audit_status/update/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "tcm_account_id": "{{tcm_account_id}}",
    "order_id":{{order_id}},
    "operation_type": "REJECT"
}
```

---

### GET — TCM video audit status

**Endpoint:** `GET {{base_url}}/v1.3/tcm/video/audit_status/get/?tcm_account_id={{tcm_account_id}}&order_id={{order_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `tcm_account_id` | {{tcm_account_id}} |  |
| `order_id` | {{order_id}} |  |
| `lang` | en |  |

---

### GET — TCM campaign get

**Endpoint:** `GET {{base_url}}/v1.3/tcm/campaign/get/?tcm_account_id={{tcm_account_id}}&filter={"campaign_ids": [{{campaign_id}}]]}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `tcm_account_id` | {{tcm_account_id}} |  |
| `filter` | {"campaign_ids": [{{campaign_id}}]]} |  |

---

### POST — TCM order create

**Endpoint:** `POST {{base_url}}/v1.3/tcm/order/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "tcm_account_id": {{tcm_account_id}},
    "campaign_id": {{campaign_id}},
    "invited_creator_ids": [{{creator_ids}}],
    "order_infos": [
        {
            "currency": "USD",
            "budget": 45,
            "order_source": 2
        }
    ]
}
```

---

### POST — TCM order update

**Endpoint:** `POST {{base_url}}/v1.3/tcm/order/update/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "tcm_account_id": {{tcm_account_id}},
    "campaign_id": {{campaign_id}},
    "order_id": {{order_id}},
    "status": "CANCEL",
    "cancel_type": "ADVERTISER_DENIED",
    "cancel_reason_enum": ["DENY_REASON_OTHER"],
    "cancel_reason": "Did not need it.",
    "order_source": 1
}
```

---

### POST — TCM campaign Creator Update

**Endpoint:** `POST {{base_url}}/v1.3/tcm/order/update/creator/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "tcm_account_id": {{tcm_account_id}},
    "campaign_id": {{campaign_id}},
    "creator_id": {{creator_id}},
    "order_id": {{order_id}},
    "status": "ACCEPT"

}

```

---

### GET — TCM order get

**Endpoint:** `GET {{base_url}}/v1.3/tcm/order/get/?tcm_account_id={{tcm_account_id}}&filtering={"tcm_order_ids": [{{tcm_order_id}}]}&page=1&page_size=1`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `tcm_account_id` | {{tcm_account_id}} |  |
| `filtering` | {"tcm_order_ids": [{{tcm_order_id}}]} |  |
| `page` | 1 |  |
| `page_size` | 1 |  |

---

### GET — TCM reports Get

**Endpoint:** `GET {{vase_url}}/v1.3/tcm/report/get/?tcm_account_id={{tcm_account_id}}&data_level=CAMPAIGN&filtering=[{"field_name": "campaign_ids","filter_type": "IN","filter_value": {{campaign_ids}}}}]`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `tcm_account_id` | {{tcm_account_id}} |  |
| `data_level` | CAMPAIGN |  |
| `filtering` | [{"field_name": "campaign_ids","filter_type": "IN","filter_value": {{campaign_ids}}}}] |  |
| `end_date` | 2022-08-24 |  |
| `metrics` | engagement_count |  |
| `start_date` | 2022-08-01 |  |
| `metrics` | item_id |  |
| `metrics` | likes |  |
| `metrics` | shares |  |
| `metrics` | video_views |  |
| `metrics` | total_creator_cnt |  |

---

### POST — TCM creator discover

**Endpoint:** `POST {{base_url}}/v1.3/tcm/creator/discover/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "tcm_account_id": {{tcm_account_id}},
    "country_code": "US",
    "fast_growing": true
}
```

---

### POST — TCM campaign code create

**Endpoint:** `POST {{base_url}}/v1.3/tcm/campaign/code/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "tcm_account_id": {{tcm_account_id}},
    "campaign_id": {{campaign_id}}

}
```

---

### POST — TCM campaign delete

**Endpoint:** `POST {{base_url}}/v1.3/tcm/campaign/delete/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "tcm_account_id": {{tcm_account_id}},
    "campaign_id": {{campaign_id}}
}
```

---

### GET — TCM Creator authorized

**Endpoint:** `GET {{base_url}}/open_api/v1.3/tcm/creator/authorized/?creator_id={{creator_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `creator_id` | {{creator_id}} |  |

---

### GET — TCM Creator invite

**Endpoint:** `GET {{base_url}}/open_api/v1.3/tcm/creator/invite/?handler_names={{["handle_name"]}}&tcm_account_id={{tcm_account_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `handler_names` | {{["handle_name"]}} |  |
| `tcm_account_id` | {{tcm_account_id}} |  |

---

### GET — TCM Creator status get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/tcm/creator/status/get/?handler_names={{["handle_name"]}}&tcm_account_id={{tcm_account_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `handler_names` | {{["handle_name"]}} |  |
| `tcm_account_id` | {{tcm_account_id}} |  |

---

### GET — TCM Creator public insights

**Endpoint:** `GET {{base_url}}/open_api/v1.3/tcm/creator/public/?handle_name={{handle_name}}&tcm_account_id={{tcm_account_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `handle_name` | {{handle_name}} |  |
| `tcm_account_id` | {{tcm_account_id}} |  |

---

### GET — TCM Creator public video insights

**Endpoint:** `GET {{base_url}}/open_api/v1.3/tcm/creator/public/video/list/?handle_name={{handle_name}}&tcm_account_id={{tcm_account_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `handle_name` | {{handle_name}} |  |
| `tcm_account_id` | {{tcm_account_id}} |  |

---

### GET — TCM Creator authorized video list

**Endpoint:** `GET {{base_url}}/open_api/v1.3/tcm/creator/authorized/video/list/?creator_id={{creator_id}}`

**Headers:**
```
Access-Token: {{Access-Token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `creator_id` | {{creator_id}} |  |

---


## 📁 BC payments

### GET — Advertiser Balance Get

**Endpoint:** `GET {{base_url}}/v1.3/advertiser/balance/get/?bc_id={{bc_id}}&page=1&page_size=5`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `page` | 1 |  |
| `page_size` | 5 |  |
| `filtering` | {"advertiser_status": ["SHOW_ACCOUNT_STATUS_APPROVED"]} |  |

---

### GET — Advertiser Transaction Get

**Endpoint:** `GET {{base_url}}/v1.3/advertiser/transaction/get/?bc_id={{bc_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |

---

### GET — BC Balance Get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/bc/balance/get/?bc_id={{bc_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |

---

### POST — Bc Transfer

**Endpoint:** `POST {{base_url}}/open_api/v1.3/bc/transfer/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "bc_id": "{{bc_id}}",
    "transfer_type": "RECHARGE"
}
```

---

### GET — BC Transaction Get

**Endpoint:** `GET {{base_url}}/v1.3/bc/transaction/get/?bc_id={{bc_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |

---


## 📁 Ad Review

### GET — Adgroup review

**Endpoint:** `GET {{base_info}}/v1.3/adgroup/review_info/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id":{{advertiser_id}},
    "adgroup_ids":[{{adgroup_ids}}]
}
```

---

### GET — Adgroup Review Info

**Endpoint:** `GET {{base_url}}/v1.3/ad/review_info/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id":{{advertiser_id}},
    "ad_ids":{{ad_ids}}
}
```

---

### POST — Adgroup Appeal

**Endpoint:** `POST {{base_url}}/v1.3/adgroup/appeal/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "adgroup_id": {{adgroup_id}},
    "advertiser_id": {{advertiser_id}}
}
```

---


## 📁 Ad Groups

### POST — Adgroup Update

**Endpoint:** `POST {{base_url}}/v1.3/adgroup/update/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "adgroup_name": "{{adgroup_name}}",
    "adgroup_id": "{{adgroup_id}}",
    "budget": 20,
    "conversion_bid_price": 0.3
}
```

---

### POST — Adgroup Update Status

**Endpoint:** `POST {{base_url}}/v1.3/adgroup/status/update/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "adgroup_ids": {{adgroup_ids}},
    "operation_status": "ENABLE"
}
```

---

### POST — Adgroup Update Budget

**Endpoint:** `POST {{base_url}}/open_api/v1.3/adgroup/budget/update/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "budget": [
        {
            "adgroup_id": {{adgroup_id}},
            "budget": 30
        }
    ],
    "scheduled_budget": [
        {
            "adgroup_id": {{adgroup_id}},
            "scheduled_budget": 40
        }
    ]
}
```

---

### POST — Ad Audience Size Estimate

**Endpoint:** `POST {{base_url}}/v1.3/ad/audience_size/estimate/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "placement_type": "PLACEMENT_TYPE_AUTOMATIC",
    "objective_type": "REACH",
    "optimization_goal": "CLICK",
    "location_ids": [
        {{location_ids}}
    ],
    "auto_targeting_enabled": true
}
```

---

### POST — Adgroup Create

**Endpoint:** `POST {{base_url}}/v1.3/adgroup/create/`

**Headers:**
```
Access-token: {{access_token}}
content-type: application/json
```

**Body:**
```json
 {
     "advertiser_id": "{{advertiser_id}}",
     "campaign_id": "{{campaign_id}}",
     "adgroup_name": "test_adgroup_name",
     "budget": 100,
     "budget_mode": "BUDGET_MODE_TOTAL",
     "schedule_type": "SCHEDULE_START_END",
     "schedule_start_time": "2024-05-14 13:09:20",
     "schedule_end_time": "2024-05-19 13:09:20",
     "pacing": "PACING_MODE_SMOOTH",
     "billing_event": "OCPM",
     "location_ids": [
         "{{location_id}}"
     ],
     "promotion_type": "WEBSITE",
     "optimization_goal": "CONVERT",
     "placement_type": "PLACEMENT_TYPE_AUTOMATIC",
     "promotion_website_type": "UNSET",
     "app_id": "{{app_id}}",
     "operating_systems": [
         "ANDROID"
     ],
     "pixel_id": "{{pixel_id}}",
     "optimization_event": "FORM",
     "click_attribution_window": "TWENTY_EIGHT_DAYS",
     "view_attribution_window": "ONE_DAY",
     "attribution_event_count": "EVERY"
 }
```

---

### GET — Adgroup Get

**Endpoint:** `GET https://business-api.tiktok.com/open_api/v1.3/adgroup/get/?advertiser_id={{advertiser_id}}&page_size=100&page=1&filtering={"adgroup_ids":["{{adgroup_id}}"]}`

**Headers:**
```
Access-Token: {{Access-Token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `page_size` | 100 |  |
| `page` | 1 |  |
| `filtering` | {"adgroup_ids":["{{adgroup_id}}"]} |  |

---

### GET — Adgroup Quota

**Endpoint:** `GET https://business-api.tiktok.com/open_api/v1.3/adgroup/get/?advertiser_id={{advertiser_id}}&page_size=100&page=1&filtering={"adgroup_ids":["{{adgroup_id}}"]}`

**Headers:**
```
Access-Token: {{Access-Token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `page_size` | 100 |  |
| `page` | 1 |  |
| `filtering` | {"adgroup_ids":["{{adgroup_id}}"]} |  |

---


## 📁 Campaign

### POST — Status update

**Endpoint:** `POST {{base_url}}/v1.3/campaign/status/update/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "campaign_ids": {{campaign_ids}},
    "operation_status": "ENABLE"
}
```

---

### GET — Quota Get

**Endpoint:** `GET {{base_url}}/v1.3/campaign/quota/get/?advertiser_id={{advertiser_id}}&app_id={{app_id}}&campaign_id={{campaign_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `app_id` | {{app_id}} |  |
| `campaign_id` | {{campaign_id}} |  |

---

### POST — Campaign update

**Endpoint:** `POST {{base_url}}/v1.3/campaign/update/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "campaign_id": {{campaign_id}},
    "campaign_name": "test_capaign_name",
    "budget": 50.5
}
```

---

### POST — Campaign create

**Endpoint:** `POST {{base_url}}/v1.3/campaign/create/`

**Headers:**
```
Access-token: {{access_token}}
content-type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "campaign_name": "test_capaign_name",
    "objective_type": "TRAFFIC",
    "budget_mode": "BUDGET_MODE_TOTAL",
    "budget": 50
}
```

---

### GET — Campaign get

**Endpoint:** `GET https://business-api.tiktok.com/open_api/v1.3/campaign/get/?advertiser_id={{advertiser_Id}}&exclude_field_types_in_response=["NULL_FIELD"]&filtering={"campaign_ids": ["{{campaign_id}}"]}&page=1&page_size=10`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_Id}} |  |
| `exclude_field_types_in_response` | ["NULL_FIELD"] |  |
| `filtering` | {"campaign_ids": ["{{campaign_id}}"]} |  |
| `page` | 1 |  |
| `page_size` | 10 |  |

---

### POST — Campaign status update

**Endpoint:** `POST {{base_url}}/v1.3/campaign/status/update/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "campaign_ids": [
        "{{campaign_id}}"
    ],
    "operation_status": "DISABLE",
    "postback_window_mode": "POSTBACK_WINDOW_MODE1"
}
```

---

### GET — Quota Info

**Endpoint:** `GET {{base_url}}/v1.3/campaign/quota/info/?advertiser_id={{advertiser_id}}&app_id={{app_id}}&has_advertiser_quota=True`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `app_id` | {{app_id}} |  |
| `has_advertiser_quota` | True |  |

---


## 📁 Events

### POST — Pixel Create

**Endpoint:** `POST {{base_url}}v1.3/pixel/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "pixel_category": "ONLINE_STORE",
    "pixel_name": {{pixel_name}},
    "partner_name": {{partner_name}}
}
```

---

### GET — Pixel Get

**Endpoint:** `GET {{base_url}}v1.3/pixel/list/?advertiser_id={{advertiser_id}}&page=1&order_by=LATEST_CREATE&name={{name}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `page` | 1 |  |
| `order_by` | LATEST_CREATE |  |
| `name` | {{name}} |  |

---

### POST — Pixel Update

**Endpoint:** `POST {{base_url}}/v1.3/pixel/update/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "pixel_name": {{pixel_name}},
    "pixel_id": {{pixel_id}},
    "advanced_matching_fields": {
        "EMAIL": true,
        "PHONE_NUMBER": true
    }
}
```

---

### POST — Pixel event create

**Endpoint:** `POST {{base_url}}/v1.3/pixel/event/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "pixel_id": {{pixel_id}},
    "pixel_events": [
        {
            "currency_value": "-1",
            "name": {{name}},
            "event_type": "ON_WEB_CART",
            "statistic_type": "ONCE",
            "rules": [
                {
                    "variable": "ELEMENT",
                    "operator": "OPERATORTYPE_EQUALS",
                    "trigger": "TRIGGERTYPE_CLICK",
                    "value": {{value}}
                }
            ]
        }
    ]
}
```

---

### POST — Pixel event delete

**Endpoint:** `POST {{base_url}}/v1.3/pixel/event/delete/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "event_id": {{event_id}}
}
```

---

### POST — Pixel event update

**Endpoint:** `POST {{base_url}}/v1.3/pixel/event/update/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "event_id": {{event_id}},
    "event_name": {{event_name}}
}
```

---

### GET — Pixel stats

**Endpoint:** `GET {{base_url}}/v1.3/pixel/event/stats/?advertiser_id={{advertiser_id}}&pixel_ids=[{{pixel_ids}}]&date_range={"start_date":"2021-02-24","end_date":"2021-03-01"}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `pixel_ids` | [{{pixel_ids}}] |  |
| `date_range` | {"start_date":"2021-02-24","end_date":"2021-03-01"} |  |

---

### GET — Pixel instant page event

**Endpoint:** `GET {{base_url}}/pixel/instant_page/event/?advertiser_id={{advertiser_id}}&objective_type=CONVERSIONS&optimization_goal=CONVERT&is_retargeting=true`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `objective_type` | CONVERSIONS |  |
| `optimization_goal` | CONVERT |  |
| `is_retargeting` | true |  |

---

### GET — List App

**Endpoint:** `GET {{base_url}}/v1.3/app/list/?advertiser_id={{advertiser_id}}&app_platform_ids=["com.zhiliaoapp.musically", {{app_platform_ids}}]`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `app_platform_ids` | ["com.zhiliaoapp.musically", {{app_platform_ids}}] |  |

---

### GET — App Info

**Endpoint:** `GET {{base_url}}/v1.3/app/info/?advertiser_id={{advertiser_id}}&app_id={{app_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `app_id` | {{app_id}} |  |

---

### POST — Create App

**Endpoint:** `POST {{base_url}}/v1.3/app/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "download_url": {{url}},
    "tracking_url": {
        "click_url": {{click_url}},
        "impression_url": ""
    },
    "partner": "Salesforce",
    "enable_retargeting": "NON_RETARGETING"
}
```

---

### POST — Update App

**Endpoint:** `POST {{base_url}}/v1.3/app/update/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "app_id": {{app_id}},
    "download_url": {{ur}},
    "tracking_url": {
        "click_url": {{click_url}},
        "impression_url": ""
    },
    "partner": "Salesforce",
    "enable_retargeting": "NON_RETARGETING",
    "platform": "IOS"
}
```

---

### GET — App external action

**Endpoint:** `GET {{base_url}}/v1.3/app/optimization_event/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "app_id": {{app_id}},
    "placement": [
        "PLACEMENT_TIKTOK",
        "PLACEMENT_TOPBUZZ",
        "PLACEMENT_HELO",
        "PLACEMENT_PANGLE"
    ],
    "objective": "APP_INSTALL",
    "available_only": false,
    "optimization_goal": "IN_APP_EVENT",
    "is_skan": false
}
```

---

### GET — App optimization event retargeting

**Endpoint:** `GET {{base_url}}/v1.3/app/optimization_event/retargeting/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "app_id": {{app}}
}
```

---

### POST — AppEvent Track

**Endpoint:** `POST {{open_api}}/v1.3/app/track/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "tiktok_app_id": {{tiktok_app_id}},
    "event": "ADD_TO_CART",
    "timestamp": "2020-09-17T19:49:27Z",
    "context": {
        "app": {
            "id": "123",
            "name": {{name}},
            "namespace": {{namespace}},
            "version": {{version}},
            "build": "122",
            "tiktok_app_ids": [
                "123",
                "456"
            ]
        },
        "device": {
            "att_status": "DENIED",
            "platform": "iOS",
            "idfa": {{idfa}},
            "idfv": "XXXXXXXX–XXXXXXXXXXXXXXXX",
            "gaid": {{gaid}}
        },
        "locale": "zh-CN",
        "ip": {{ip}},
        "user_agent": {{user_agent}},
        "user": {
            "anonymous_id": "12345678",
            "external_id": "12345678",
            "phone_number": {{phone_number}},
            "email": {{email}},
            "pgchid": "pgchid"
        },
        "library": {
            "name": {{name}},
            "version": "2"
        },
        "ori_attribution_partner": "FB",
        "origin_url": "ads.tiktok.com",
        "ad": {
            "callback": {{callback}},
            "isRetargeting": "false",
            "campaign_id": {{cmapaign_id}},
            "attributed": "true",
            "ad_id": {{ad_id}},
            "attributionType": "click_through",
            "creative_id": {{creative_id}},
            "attribution_provider": "mmp"
        },
        "location": {
            "country": "ID",
            "city": "Tanjung Riau"
        }
    },
    "properties": {
        "contents": [
            {
                "price": 8,
                "quantity": 2,
                "content_type": "socks",
                "content_id": {{content_id}}
            },
            {
                "price": 30,
                "quantity": 1,
                "content_type": "dress",
                "content_id": {{content_id}}
            }
        ],
        "currency": "USD",
        "value": 10,
        "quantity": 5,
        "price": 9.9
    },
    "event_source": "APP_EVENTS_API",
    "partner_name": "Segment",
    "test_event_code": "VIDMOB"
}
```

---

### POST — AppEvent Batch

**Endpoint:** `POST {{base_url}}i/v1.3/app/batch/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "tiktok_app_id": {{tiktok_app_id}},
    "batch": [
        {
            "type": "track",
            "event": "ADD_TO_CART",
            "timestamp": "2020-09-17T19:49:27Z",
            "context": {
                "app": {
                    "id": "123",
                    "name": {{name}},
                    "namespace": {{namespace}},
                    "version": {{version}},
                    "build": "122",
                    "tiktok_app_ids": [
                        "123",
                        "456"
                    ]
                },
                "device": {
                    "att_status": "DENIED",
                    "platform": "iOS",
                    "idfa": {{idfa}},
                    "idfv": "XXXXXXXX–XXXXXXXXXXXXXXXX",
                    "gaid": {{gaid}}
                },
                "locale": "zh-CN",
                "ip": {{ip}},
                "user_agent": {{user_agent}},
                "user": {
                    "anonymous_id": "12345678",
                    "external_id": {{external_id}},
                    "phone_number": {{phone_number}},
                    "email": {{email_id}},
                    "pgchid": "pgchid"
                },
                "library": {
                    "name": {{name}},
                    "version": "2"
                },
                "ori_attribution_partner": "FB",
                "origin_url": "ads.tiktok.com",
                "ad": {
                    "callback": {{callback}},
                    "isRetargeting": "false",
                    "campaign_id": {{campaign_id}},
                    "attributed": "true",
                    "ad_id": {{ad_id}},
                    "attributionType": "click_through",
                    "creative_id": {{creative_id}},
                    "attribution_provider": "mmp"
                },
                "location": {
                    "country": "ID",
                    "city": "Tanjung Riau"
                }
            },
            "properties": {
                "contents": [
                    {
                        "price": 8,
                        "quantity": 2,
                        "content_type": "socks",
                        "content_id": {{content_id}}
                    },
                    {
                        "price": 30,
                        "quantity": 1,
                        "content_type": "dress",
                        "content_id": {{content_id}}
                    }
                ],
                "currency": "USD",
                "value": 10,
                "quantity": 5,
                "price": 9.9
            }
        }
    ],
    "event_source": "APP_EVENTS_API",
    "partner_name": "Segment",
    "test_event_code": "VIDMOB"
}
```

---

### POST — Pixel Events Track prod

**Endpoint:** `POST {{base_url}}/v1.3/pixel/track/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "pixel_code": {{pixel_code}},
    "event": "Purchase",
    "event_id": "123asdios_1234",
    "limited_data_use": true,
    "opt_out": false,
    "data_processing_options": [
        "option1"
    ],
    "data_processing_options_country": 1,
    "data_processing_options_state": 0,
    "timestamp": "2020-09-17T19:49:27Z",
    "context": {
        "ad": {
            "callback": {{callback}}
        },
        "page": {
            "url": {{url}},
            "referrer": {{referral_url}}
        },
        "user": {
            "email": {{email}},
            "phone_number": {{phone_number}},
            "external_id": "fb123",
            "lead_id": "123",
            "subscription_id": "123",
            "lead_event_source": "web",
            "ttp": "123"
        },
        "user_agent": "Mozilla/5.0 (platform; rv:geckoversion) Gecko/geckotrail Firefox/firefoxversion",
        "ip": {{ip}}
    },
    "properties": {
        "contents": [
            {
                "price": 8,
                "quantity": 2,
                "content_type": "socks",
                "content_id": {{content_id}}
            },
            {
                "price": 30,
                "quantity": 1,
                "content_type": "dress",
                "content_id": {{content_id}},
                "status": "submitted",
                "product_url": "www.tiktok.com",
                "image_url": "image_1",
                "availability": "in stock",
                "brand": "Nike",
                "content_name": "name1",
                "content_category": "category"
            }
        ],
        "currency": "USD",
        "value": 46.00,
        "description": "test",
        "query": "test",
        "payment_breakdown": {},
        "affiliate_commission_total": {},
        "affiliate_commission_percent": 1.3,
        "checkin_date": "2022-01-01",
        "checkout_date": "2022-01-01",
        "num_people": 5,
        "num_children": 2,
        "hotel_city": "San Jose",
        "hotel_region": "CA",
        "hotel_country": "US",
        "departing_date": "2022-01-01",
        "returning_date": "2022-01-01",
        "flight_class": "UA8",
        "departing_airport": "SJC",
        "returning_airport": "SJC",
        "filght_city": "SJC",
        "flight_region": "CA",
        "flight_country": "US"
    },
    "event_source": "PHONE",
    "partner_name": "Segment",
    "test_event_code": "VIDMOB"
}
```

---

### POST — Pixel Events Batch prod

**Endpoint:** `POST {{base_url}}/v1.3/pixel/batch/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "pixel_code": {{pixel_code}},
    "batch": [
        {
            "type": "track",
            "event": "Purchase",
            "event_id": "123asdios_1234",
            "limited_data_use": true,
            "opt_out": false,
            "data_processing_options": [
                "option1"
            ],
            "data_processing_options_country": 1,
            "data_processing_options_state": 0,
            "timestamp": "2020-09-17T19:49:27Z",
            "context": {
                "ad": {
                    "callback": {{callback}}
                },
                "page": {
                    "url": {{url}},
                    "referrer": {{referral_url}}
                },
                "user": {
                    "email": {{email}},
                    "phone_number": {{phone_number}},
                    "external_id": "fb123",
                    "lead_id": "123",
                    "subscription_id": "123",
                    "lead_event_source": "web",
                    "ttp": "123"
                },
                "user_agent": {{user_agent}},
                "ip": {{ip}}
            },
            "properties": {
                "contents": [
                    {
                        "price": 8,
                        "quantity": 2,
                        "content_type": "socks",
                        "content_id": {{content_id}}
                    },
                    {
                        "price": 30,
                        "quantity": 1,
                        "content_type": "dress",
                        "content_id": {{content_id}},
                        "status": "submitted",
                        "product_url": "www.tiktok.com",
                        "image_url": "image_1",
                        "availability": "in stock",
                        "brand": "Nike",
                        "content_name": "name1",
                        "content_category": "category"
                    }
                ],
                "currency": "USD",
                "value": 46.00,
                "description": "test",
                "query": "test",
                "payment_breakdown": {},
                "affiliate_commission_total": {},
                "affiliate_commission_percent": 1.3,
                "checkin_date": "2022-01-01",
                "checkout_date": "2022-01-01",
                "num_people": 5,
                "num_children": 2,
                "hotel_city": "San Jose",
                "hotel_region": "CA",
                "hotel_country": "US",
                "departing_date": "2022-01-01",
                "returning_date": "2022-01-01",
                "flight_class": "UA8",
                "departing_airport": "SJC",
                "returning_airport": "SJC",
                "filght_city": "SJC",
                "flight_region": "CA",
                "flight_country": "US"
            }
        }
    ],
    "event_source": "PHONE",
    "partner_name": "Segment",
    "test_event_code": "VIDMOB",
    "data_tracking_options": "LDU"
}
```

---


## 📁 Creative Insight

### GET — Audit Machine audit

**Endpoint:** `GET {{base_url}}/open_api/v1.3/audit/machine_audit/?advertiser_id={{advertiser_id}}&video_ids= ["{{video_id}}"]&image_ids= ["{{image_id}}"]&display_names= ["{{display_names}}"]`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `video_ids` |  ["{{video_id}}"] |  |
| `image_ids` |  ["{{image_id}}"] |  |
| `display_names` |  ["{{display_names}}"] |  |

---


## 📁 Automated rules

### GET — Optimizer rule result get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/optimizer/rule/result/get/?advertiser_id={{advertiser_id}}&result_detail=[{"exec_id": "{{exec_id}}","rule_id": "{{rule_id}}" }]`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `result_detail` | [{"exec_id": "{{exec_id}}","rule_id": "{{rule_id}}" }] |  |

---

### GET — Optimizer rule result list

**Endpoint:** `GET {{base_url}}/open_api/v1.3/optimizer/rule/result/list/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---

### POST — Optimizer rule batch bind

**Endpoint:** `POST {{base_url}}/open_api/v1.3/optimizer/rule/batch_bind/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "bind_info": [
        {
            "rule_id": "{{rule_id}}",
            "dimension": "ADGROUP",
            "dimension_ids": [
                "{{dimension_ids}}"
            ],
            "bind_type": "BIND"
        }
    ]
}
```

---

### POST — Optimizer rule update status

**Endpoint:** `POST {{base_url}}/open_api/v1.3/optimizer/rule/update/status/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "rule_ids": [
        "{{rule_ids}}"
    ],
    "operate_type": "TURN_OFF"
}
```

---

### POST — Optimizer rule update

**Endpoint:** `POST {{base_url}}/open_api/v1.3/optimizer/rule/update/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "rules": [
        {
            "apply_objects": [
                {
                    "dimension": "ADGROUP",
                    "dimension_ids": [
                        "{{dimension_ids}}"
                    ],
                    "pre_condition_type": "SELECTED"
                }
            ],
            "conditions": [
                {
                    "subject_type": "NO_CONDITION"
                }
            ],
            "actions": [
                {
                    "subject_type": "MESSAGE"
                }
            ],
            "notification": {
                "notification_type": "TASK_FINISH"
            },
            "rule_exec_info": {
                "exec_time_type": "PER_HALF_HOUR"
            },
            "name": "{{name}}",
            "rule_id": "{{rule_id}}"
        }
    ]
}
```

---

### POST — Optimizer rule create

**Endpoint:** `POST {{base_url}}/open_api/v1.3/optimizer/rule/create/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "rules":[
        {
            "apply_objects": [
                {
                    "dimension": "ADGROUP",
                    "dimension_ids": [
                        "{{dimension_ids}}"
                    ],
                    "pre_condition_type": "SELECTED"
                }
            ],
            "conditions": [
                {
                    "subject_type": "NO_CONDITION"
                }
            ],
            "actions": [
                {
                    "subject_type": "MESSAGE"
                }
            ],
            "notification": {
                "notification_type": "TASK_FINISH"
            },
            "rule_exec_info": {
                "exec_time_type": "PER_HALF_HOUR"
            },
            "name": "{{name}}"
        }
    ]
}
```

---

### GET — Optimizer rule get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/optimizer/rule/get/?advertiser_id={{advertiser_id}}&rule_ids=["{{rule_ids}}"]`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `rule_ids` | ["{{rule_ids}}"] |  |

---

### GET — Optimizer rule list

**Endpoint:** `GET {{base_url}}/open_api/v1.3/optimizer/rule/list/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---


## 📁 Catalog


### 📁 Video package

#### POST — Catalog video package create

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/video_package/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "bc_id": "{{bc_id}}",
    "catalog_id": "{{catalog_id}}",
    "video_package_type": "THIRD_PARTY",
    "video_package_name": "{{video_package_name}}"
 
}
```

---

#### GET — Catalog video package get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/catalog/video_package/get/?bc_id={{bc_id}}&catalog_id={{catalog_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `catalog_id` | {{catalog_id}} |  |

---

#### POST — Catalog video package audit

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/video_package/audit/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "bc_id": "{{bc_id}}",
    "catalog_id": "{{catalog_id}}",
    "shopping_ads_video_package_id": "{{shopping_ads_video_package_id}}",
    "template_video_url": "{{url}}"

}
```

---


### 📁 Catalog Feed

#### GET — Catalog feed get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/catalog/feed/get/?bc_id={{bc_id}}&catalog_id={{catalog_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `catalog_id` | {{catalog_id}} |  |

---

#### GET — Catalog location currency get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/catalog/location_currency/get/?catalog_id={{catalog_id}}&bc_id={{bc_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `catalog_id` | {{catalog_id}} |  |
| `bc_id` | {{bc_id}} |  |

---

#### GET — Catalog feed log

**Endpoint:** `GET {{base_url}}/open_api/v1.3/catalog/feed/log/?catalog_id={{catalog_id}}&bc_id={{bc_id}}&feed_id={{feed_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `catalog_id` | {{catalog_id}} |  |
| `bc_id` | {{bc_id}} |  |
| `feed_id` | {{feed_id}} |  |

---

#### POST — Catalog feed create

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/feed/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "catalog_id": "{{catalog_id}}",
    "bc_id": "{{bc_id}}",
    "feed_name": "feed_name",
    "update_mode": "OVERWRITE",
    "schedule_param": {
        "source":{
            "uri": "http://www.example.com",
            "username": "{{username}}",
            "password": "{{password}}"
        },
        "interval_type": "DAILY",
        "timezone": "Africa/Accra"
    }
   
}
```

---

#### POST — Catalog feed update

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/feed/update/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "catalog_id": "{{catalog_id}}",
    "bc_id": "{{bc_id}}",
    "feed_name": "feed_name",
    "update_mode": "OVERWRITE",
    "feed_id": "{{feed_id}}"

}
```

---

#### POST — Catalog feed delete

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/feed/delete/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "catalog_id": "{{catalog_id}}",
    "bc_id": "{{bc_id}}",
    "feed_id": "{{feed_id}}"
}
```

---

#### POST — Catalog feed switch

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/feed/switch/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "catalog_id": "{{catalog_id}}",
    "bc_id": "{{bc_id}}",
    "feed_id": "{{feed_id}}",
    "status": "OFF"
}
```

---

### POST — Catalog capitalize

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/capitalize/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "bc_id":"{{bc_id}}",
    "catalog_id": "{{catalog_id}}"
}
```

---

### POST — Catalog create

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "bc_id": "{{business_center_id}}",
    "name": "{{name}}",
    "catalog_type": "ECOM",
    "catalog_conf": {
        "currency": "USD",
        "region_code": "US",
        "channel": "CLIENT"
    }
}
```

---

### POST — Catalog update

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/update/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "catalog_id": "{{catalog_id}}",
    "name": "{{name}}"

}
```

---

### POST — Catalog delete

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/delete/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "catalog_id": "{{catalog_id}}"

}
```

---

### GET — Catalog get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/catalog/get/?bc_id={{bc_id}}&catalog_id={{catalog_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `catalog_id` | {{catalog_id}} |  |

---

### GET — Catalog product get

**Endpoint:** `GET {{base_url}}/v1.3/catalog/product/get/?bc_id={{bc_id}}&product_ids=["{{products_ids}}"]&catalog_id={{catalog_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `product_ids` | ["{{products_ids}}"] |  |
| `catalog_id` | {{catalog_id}} |  |

---

### GET — Catalog product log

**Endpoint:** `GET {{base_url}}/open_api/v1.3/catalog/product/log/?advertiser_id={{advertiser_id}}&feed_log_id={{feed_log_id}}&catalog_id={{catalog_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `feed_log_id` | {{feed_log_id}} |  |
| `catalog_id` | {{catalog_id}} |  |

---

### GET — Catalog lexicon get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/catalog/lexicon/get/?advertiser_id={{advertiser_id}}&catalog_id={{catalog_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `catalog_id` | {{catalog_id}} |  |

---

### GET — Catalog available country get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/catalog/available_country/get/?bc_id={{bc_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |

---

### POST — Catalog product upload

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/product/upload/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "catalog_id": "{{catalog_id}}",
    "products": [
        {
            "sku_id": "{{sku_id}}",
            "brand": "{{brand_name}}",
            "price_info": {
                "price": 1783.0,
                "sale_price_effective_date": "2022-01-01 00:00",
                "sale_price": 1783.0
            },
            "title": "{{Title}}",
            "product_detail": {
                "material": "cotton",
                "age_group": "NEW_BORN",
                "size": "small",
                "condition": "NEW",
                "gender": "UNISEX",
                "color": "LightPink",
                "pattern": "stripes6",
                "product_category": "Women > Shoes > Sandals >"
            },
            "availability": "IN_STOCK",
            "description": "Green Neon     Plain Other    Shoes",
            "image_url": "{{image_url}}",
            "additional_image_urls": [
                "{{additional_image_urls}}"
            ],
            "landing_page": {
                "android_app_name": "SHEIN-Fashion Shopping Online",
                "ios_url": "{{ios_url}}",
                "ipad_app_store_id": "",
                "iphone_app_store_id": "",
                "android_url": "{{android_url}}",
                "ios_app_store_id": "{{ios_app_store_id}}",
                "ios_app_name": "{{ios_app_name}}",
                "iphone_app_name": "",
                "ipad_app_name": "",
                "android_package": "{{android_package}}",
                "landing_page_url": "{{landing_page_url}}"
            }
        }
    ]
}
```

---

### POST — Catalog product update

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/product/update/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "catalog_id": "{{catalog_id}}",
    "products": [
        {
            "sku_id": "{{sku_id}}",
            "brand": "{{brand_name}}",
            "title": "{{title}}",
            "availability": "IN_STOCK",
            "description": "Green Neon     Plain Other    Shoes"
        }
    ]
}
```

---

### POST — Catalog product delete

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/product/delete/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "feed_id": "{{feed_id}}",
    "catalog_id": "{{catalog_id}}"
}
```

---

### GET — Catalog set get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/catalog/set/get/?advertiser_id={{advertiser_id}}&catalog_id={{catalog_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `catalog_id` | {{catalog_id}} |  |

---

### GET — Catalog set product get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/catalog/set/product/get/?advertiser_id={{advertiser_id}}&catalog_id={{catalog_id}}&product_set_id={{product_set_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `catalog_id` | {{catalog_id}} |  |
| `product_set_id` | {{product_set_id}} |  |

---

### POST — Catalog set create

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/set/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "catalog_id": "{{catalog_id}}",
    "product_set_name": "{{product_set_name}}",
    "conditions": {
        "and": [
            {
                "field": "age_group",
                "value": [
                    "NEW_BORN"
                ],
                "operation": "EQUAL"
            }
        ]
    }
}
```

---

### POST — Catalog set update

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/set/update/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "catalog_id": "{{catalog_id}}",
    "product_set_name": "{{product_set_name}}",
    "product_set_id": "{{product_set_id}}",
    "conditions": {
        "and": [
            {
                "field": "age_group",
                "value": [
                    "NEW_BORN"
                ],
                "operation": "EQUAL"
            }
        ]
    }
}
```

---

### POST — Catalog set delete

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/set/delete/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "catalog_id": "{{catalog_id}}",
    "product_set_ids": [
        "{{product_set_id}}"
    ]
}
```

---

### GET — Catalog video package get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/catalog/video_package/get/?bc_id={{bc_id}}&catalog_id={{catalog_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `catalog_id` | {{catalog_id}} |  |

---

### GET — Catalog eventsource bind get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/catalog/eventsource_bind/get/?bc_id={{bc_id}}&catalog_id={{catalog_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `catalog_id` | {{catalog_id}} |  |

---

### POST — Catalog eventsource unbind

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/eventsource/unbind/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "bc_id": "{{bc_id}}",
    "catalog_id": "{{catalog_id}}",
    "advertiser_id": "{{advertiser_id}}",
    "pixel_code": "{{pixel_code}}"
}
```

---

### POST — Catalog template preview create

**Endpoint:** `POST {{base_url}}/open_api/v1.3/catalog/template_preview/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "bc_id": "{{bc_id}}",
    "catalog_ids": [
        "{{catalog_id}}"
    ]
}
```

---

### GET — Catalogoverview

**Endpoint:** `GET {{base_url}}/open_api/v1.3/catalog/overview/?bc_id={{bc_id}}&catalog_id={{catalog_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `catalog_id` | {{catalog_id}} |  |

---


## 📁 Authentication

### POST — /oauth2/access_token/

**Endpoint:** `POST {{base_url}}/open_api/v1.3/oauth2/access_token/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
	"app_id": "{{app_id}}",
	"secret": "{{secret}}",
	"auth_code": "{{auth_code}}"
}
```

---

### POST — /oauth2/revoke_token/

**Endpoint:** `POST {{base_url}}/open_api/v1.3/oauth2/access_token/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
	"app_id": "{{app_id}}",
	"secret": "{{secret}}",
	"auth_code": "{{auth_code}}"
}
```

---

### POST — /tt_user/oauth2/token/

**Endpoint:** `POST {{base_url}}/open_api/v1.3/oauth2/access_token/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
	"app_id": "{{app_id}}",
	"secret": "{{secret}}",
	"auth_code": "{{auth_code}}"
}
```

---

### POST — /tt_user/oauth2/refresh_token/

**Endpoint:** `POST {{base_url}}/open_api/v1.3/oauth2/access_token/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
	"app_id": "{{app_id}}",
	"secret": "{{secret}}",
	"auth_code": "{{auth_code}}"
}
```

---

### POST — /oauth/token/

**Endpoint:** `POST {{base_url}}/open_api/v1.3/oauth2/access_token/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
	"app_id": "{{app_id}}",
	"secret": "{{secret}}",
	"auth_code": "{{auth_code}}"
}
```

---

### POST — /oauth2/creator_token/

**Endpoint:** `POST {{base_url}}/open_api/v1.3/oauth2/creator_token/?business=tt_user`

**Headers:**
```
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `business` | tt_user |  |

**Body:**
```json
{
	"app_id": "{{app_id}}",
	"secret": "{{secret}}",
	"auth_code": "{{auth_code}}"
}
```

---

### GET — /user/info

**Endpoint:** `GET {{base_url}}/open_api/v1.3/user/info/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

---

### GET — /oauth2/advertiser/get/

**Endpoint:** `GET {{base_url}}/v1.3/oauth2/advertiser/get/?app_id={{app_id}}&secret={{secret}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `app_id` | {{app_id}} |  |
| `secret` | {{secret}} |  |

---

### GET — /oauth2/creator/get/

**Endpoint:** `GET {{base_url}}/open_api/v1.3/oauth2/creator/get/?access_token={{access_token}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `access_token` | {{access_token}} |  |

---

### POST — /oauth2/revoke_token/

**Endpoint:** `POST {{base_url}}/open_api/v1.3/oauth2/revoke_token/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
	"app_id": "{{app_id}}",
	"secret": "{{secret}}",
	"access_token": "{{access_token}}"
}
```

---


## 📁 Dynamic Scene

### POST — /dynamic_scene/material/submit/

**Endpoint:** `POST {{base_url}}/open_api/v1.3/dynamic_scene/material/submit/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "slots": [{
        "order": 0,
        "tag": "asd",
        "video_ids": ["{{video_id}}"]
        
    }],
    "advertiser_id": "{{advertiser_id}}"
}
```

---

### POST — Dynamic scene task create

**Endpoint:** `POST {{base_url}}/open_api/v1.3/dynamic_scene/task/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "material_package_id": "{{material_package_id}}"
}
```

---

### GET — Dynamic scene task get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/dynamic_scene/task/get/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "task_id": "{{task_id}}"
}
```

---

### GET — Dynamic scene get

**Endpoint:** `GET {{base_url}}/open_api/v1.2/dynamic_scene/get/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "material_package_id": "{{material_package_id}}"
}
```

---

### GET — Dynamic scene report get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/dynamic_scene/report/get/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "data_level": "ADGROUP",
    "input_ids": ["{{input_id}}"],
    "dimensions": ["advertiser_id", "adgroup_id", "story_arc", "order", "video_id"],
    "order_field": "complete_plays",
    "start_time": "2022-06-09",
    "end_time": "2022-06-15",
    "filters": [
        {"field_name": "story_arc", "filter_type": "IN", "filter_value": "[\"wing display\", \"wing display\", \"wing display\", \"wing display\", \"Ending CTA\"]"},
        {"field_name": "order", "filter_type": "IN", "filter_value": "[\"-1\"]"}
    ]
}
```

---

### POST — Video fix task create

**Endpoint:** `POST {{base_url}}/open_api/v1.3/video/fix/task/create/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "tasks": [
        {"video_id": "{{video_id}}"},
        {"video_id": "{{video_id}}"}
    ]
}
```

---

### GET — Video fix task get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/video/fix/task/get/`

**Headers:**
```
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "task_id": "{{task_id}}"
}
```

---


## 📁 TikTok Store

### POST — Create Store

**Endpoint:** `POST {{base_url}}/open_api/v1.3/commerce/store/create/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
  "business_center_id": "{{business_center_id}}",
  "store_name": "{{store_name}}",
  "store_url": "{{store_url}}",
  "creation_source": "{{creation_source}}"
}
```

---

### POST — Get Product in Store

**Endpoint:** `POST {{base_url}}/open_api/v1.3/commerce/store/product/get/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
  "store_id": "{{store_id}}",
  "spu_id": "{{spu_id}}",
  "title": "{{title}}",
  "brand": "{{brand}}",
  "storefront_status": {{storefront_status}},
  "review_status": ["{{review_status}}"],
  "page_offset": {{page_offset}}
}
```

---

### POST — Get Stores

**Endpoint:** `POST {{base_url}}/open_api/v1.3/commerce/store/get/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
  "business_center_id": "{{bc_id}}"
}
```

---

### POST — Create Store for Trusted Partner

**Endpoint:** `POST {{base_url}}/open_api/v1.3/commerce/store/trusted_create/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
  "business_center_id": "{{business_center_id}}",
  "store_name": "{{store_name}}",
  "store_url": "{{store_url}}",
  "creation_source": {{creation_source}},
  "business_platform": "{{business_platform}}"
}
```

---

### POST — Bind Store to Catalog

**Endpoint:** `POST {{base_url}}/open_api/v1.3/commerce/store/bind_to_catalog/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
  "business_center_id": "{{business_center_id}}",
  "store_id": "{{store_id}}",
  "catalog_id": "{{catalog_id}}"
}
```

---

### POST — Manage Storefront

**Endpoint:** `POST {{base_url}}/open_api/v1.3/commerce/window/update/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
  "business_center_id": "{{business_center_id}}",
  "store_id": "{{store_id}}",
  "storefront_id": "{{storefront_id}}",
  "spu_product_ids": ["{{spu_product_id}}"],
  "action": "{{action}}"
}
```

---


## 📁 Segment API

### POST — Segment Audience

**Endpoint:** `POST {{base_url}}/open_api/v1.3/segment/audience/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "custom_audience_name": "{{audience_name}}",
    "advertiser_id": "{{adv_id}}",
    "id_type": "{{id_type}}",
    "action": "{{action}}"
}
```

---

### POST — Segment Mapping

**Endpoint:** `POST {{base_url}}/open_api/v1.3/segment/mapping/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
  "advertiser_ids": ["{{adv_id}}"],
  "data": [
    {
      "id": "{{user_id}}",
      "id_type": "{{id_type}}",
      "audience_ids": ["{{audience_id}}"]
     }
  ]
}
```

---


## 📁 Audience

### POST — Dmp rule based audience create

**Endpoint:** `POST https://business-api.tiktok.com/open_api/v1.3/dmp/custom_audience/rule/create/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "custom_audience_name": "test_name",
    "audience_type": "OFFLINE",
    "rule_spec": {
        "inclusion_rule_set": {
            "operator": "OR",
            "rules": [
                {
                    "event_source_ids": [
                        "{{event_source_id}}"
                    ],
                    "retention_days": 7,
                    "filter_set": {
                        "operator": "AND",
                        "filters": [
                            {
                                "field": "EVENT",
                                "operator": "EQ",
                                "value": "OFFLINE COMPLETE PAYMENT"
                            }
                        ]
                    }
                }
            ]
        }
    }
}
```

---

### POST — Dmp audience create

**Endpoint:** `POST {{base_url}}/v1.3/dmp/custom_audience/create/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "custom_audience_name": "test_new",
    "file_paths": ["{{file_paths}}"],
    "calculate_type": "{{calculate_type}}"
}
```

---

### POST — Dmp audience delete

**Endpoint:** `POST {{base_url}}/v1.3/dmp/custom_audience/delete/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "custom_audience_ids": ["{{custom_audience_ids}}"]
}
```

---

### POST — Dmp file upload

**Endpoint:** `POST {{base_url}}/open_api/v1.2/dmp/custom_audience/file/upload/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: multipart/form-data
```

---

### GET — Dmp get

**Endpoint:** `GET {{base_url}}/v1.3/dmp/custom_audience/get/?advertiser_id={{advertiser_id}}&custom_audience_ids= [{{custom_audience_ids}}]`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `custom_audience_ids` |  [{{custom_audience_ids}}] |  |

---

### GET — Dmp list

**Endpoint:** `GET {{base_url}}/v1.3/dmp/custom_audience/list/?advertiser_id={{advertiser_id}}&page=2&page_size=10`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `page` | 2 |  |
| `page_size` | 10 |  |

---

### POST — Dmp lookalike create

**Endpoint:** `POST {{base_url}}/open_api/v1.3/dmp/custom_audience/lookalike/create/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}", 
    "calculate_type": "CALCULATE_TYPE", 
    "custom_audience_name": "CUSTOM_AUDIENCE_NAME", 
    "lookalike_spec": {
        "source_audience_id": "{{source_audience_id}}",
        "include_source": true,
        "mobile_os": "ALL",
        "placement": "TikTok",
        "placements": ["TikTok"],
        "location_ids": ["JP", "US"],
        "audience_size": "NARROW"
    }
}
```

---

### POST — Dmp audience update

**Endpoint:** `POST {{base_url}}/v1.3/dmp/custom_audience/update/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{

    "advertiser_id": "{{advertiser_id}}",
    "custom_audience_id": "{{customer_audiece_id}}",
    "custom_audience_name": "name_2"
}
```

---

### GET — Dmp share

**Endpoint:** `GET {{base_url}}/open_api/v1.3/dmp/custom_audience/share/log/?custom_audience_id={{customer_audience_id}}&advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `custom_audience_id` | {{customer_audience_id}} |  |
| `advertiser_id` | {{advertiser_id}} |  |

---

### GET — Dmp share log

**Endpoint:** `GET {{base_url}}/open_api/v1.3/dmp/custom_audience/share/log/?advertiser_id={{advertiser_id}}&custom_audience_id={{customer_audience_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `custom_audience_id` | {{customer_audience_id}} |  |

---

### POST — Dmp share cancel

**Endpoint:** `POST {{base_url}}/open_api/v1.3/dmp/custom_audience/share/cancel/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
        "advertiser_id": "{{advertiser_id}}",
        "custom_audience_id": "{{custom_audience_id}}",
        "shared_advertiser_id": "{{shared_advertiser_id}}"
    }
```

---


## 📁 Pangle

### GET — Pangle get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/pangle_block_list/get/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---

### GET — Pangle campaign get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/pangle_block_list/campaign/get/?advertiser_id={{advertiser_id}}&campaign_id={{campaign_id}}&adgroup_id={{adgroup_id}}&block_id={{block_id}}&page=1&page_size=10`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `campaign_id` | {{campaign_id}} |  |
| `adgroup_id` | {{adgroup_id}} |  |
| `block_id` | {{block_id}} |  |
| `page` | 1 |  |
| `page_size` | 10 |  |

---

### POST — Pangle Update

**Endpoint:** `POST {{base_url}}/open_api/v1.3/pangle_block_list/update/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "advertiser_id": "{{advertiser_id}}",
  "add_app_list": [
    "auto-test"
  ]
}
```

---

### POST — Pangle Campaign Update

**Endpoint:** `POST {{base_url}}/open_api/v1.3/pangle_block_list/campaign/update/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "campaign_id": "{{campaign_id}}",
    "adgroup_id": "{{adgroup_id}}",
    "clear_old_app": false,
    "add_block_id_list": [
        "test_block_id_01"
    ],
    "delete_block_id_list": [
        "test_block_id_02"
    ]
}
```

---

### GET — Pangle flow get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/pangle_audience_package/get/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---


## 📁 File Image

### GET — File image info

**Endpoint:** `GET {{base_url}}/open_api/v1.3/file/image/ad/info/?advertiser_id={{advertiser_id}}}&image_ids=["{{image_ids}}"]`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}}} |  |
| `image_ids` | ["{{image_ids}}"] |  |

---

### GET — File image ad search

**Endpoint:** `GET {{base_url}}/open_api/v1.3/file/image/ad/search/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---

### POST — File image ad upload

**Endpoint:** `POST {{base_url}}/open_api/v1.3/file/image/ad/upload/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
        "advertiser_id": "{{advertiser_id}}",
        "file_name": "test_file_upload",
        "upload_type": "UPLOAD_BY_URL",
        "image_url": "{{image_url}}"
    }
```

---

### POST — File image ad update

**Endpoint:** `POST {{base_url}}/open_api/v1.3/file/image/ad/update/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "file_name": "test update",
    "image_id": "{{image_id}}"

}
```

---


## 📁 File Music

### GET — File music get

**Endpoint:** `GET {{base_url}}/v1.3/file/music/get/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---

### POST — File music upload

**Endpoint:** `POST {{base_url}}/v1.3/file/music/upload/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: multipart/form-data
```

---


## 📁 File Video

### POST — File Video upload

**Endpoint:** `POST {{base_url}}/v1.3/file/video/ad/upload/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: multipart/form-data
```

---

### GET — File video ad search

**Endpoint:** `GET {{base_url}}/open_api/v1.3/file/video/ad/search/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---

### POST — File video update

**Endpoint:** `POST {{base_url}}/open_api/v1.3/file/video/ad/update/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "file_name": "test_update",
    "video_id": "{{video_id}}"
}
```

---

### GET — File video suggestcover

**Endpoint:** `GET {{base_url}}/open_api/v1.3/file/video/suggestcover/?advertiser_id={{advertiser_id}}&video_id={{video_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `video_id` | {{video_id}} |  |

---


## 📁 Ad Comments Blocked words

### POST — Blockedword Create

**Endpoint:** `POST {{base_url}}/open_api/v1.3/blockedword/create/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "blocked_words": ["name"]
}
```

---

### POST — Blockedword Delete

**Endpoint:** `POST {{base_url}}/open_api/v1.3/blockedword/create/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "blocked_words": ["name"]
}
```

---

### GET — Blockedword Check

**Endpoint:** `GET {{base_url}}/open_api/v1.3/blockedword/check/?advertiser_id={{advertiser}}&blocked_words=["{{name}}"]`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser}} |  |
| `blocked_words` | ["{{name}}"] |  |

---

### GET — Blockedword List

**Endpoint:** `GET {{base_url}}/open_api/v1.3/blockedword/list/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---

### GET — Blockedword Task Check

**Endpoint:** `GET {{base_url}}/open_api/v1.3/blockedword/task/check/?advertiser_id={{advertiser_id}}&task_id={{task_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `task_id` | {{task_id}} |  |

---

### POST — Blockedword Task Create

**Endpoint:** `POST {{base_url}}/open_api/v1.3/blockedword/task/create/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "blocked_words": ["name"],
    "language": "EN"
}
```

---

### POST — Blockedword Update

**Endpoint:** `POST {{base_url}}/open_api/v1.3/blockedword/update/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": "{{advertiser_id}}",
    "new_word": "name",
    "old_word": "hate"

}
```

---

### GET — Blockedword Download

**Endpoint:** `GET {{base_url}}open_api/v1.3/blockedword/task/download/?advertiser_id={{advertiser_id}}&task_id={{task_id}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `task_id` | {{task_id}} |  |

---


## 📁 BC admininstration

### GET — BC Get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/bc/get/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

---

### POST — Bc image upload

**Endpoint:** `POST {{base_url}}/v1.3/bc/image/upload/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: multipart/form-data
```

---

### GET — BC get

**Endpoint:** `GET {{base_url}}/v1.3/bc/get/?advertiser_id={{advertiser_id}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |

---

### POST — Advertiser Update

**Endpoint:** `POST {{base_url}}/v1.3/advertiser/update/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
        "advertiser_id" : {{advertiser_id}},
        "company": "test_company",
        "contact_name": "test_name"
}
```

---


## 📁 BC assets

### POST — BC Pixel link update

**Endpoint:** `POST {{base_url}}/v1.3/bc/pixel/link/update/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "bc_id": "{{bc_id}}",
    "pixel_code": "{{pixel_code}}",
    "advertiser_ids": ["{{advertiser_ids}}"],
    "relation_status": "LINK"
}
```

---

### GET — BC Pixel Link Get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/bc/pixel/link/get/?bc_id={{bc_id}}&pixel_code={{pixel_code}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `pixel_code` | {{pixel_code}} |  |

---

### POST — BC Pixel Transfer

**Endpoint:** `POST {{base_url}}/open_api/v1.3/bc/pixel/transfer/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "bc_id":{{bc_id}},
    "pixel_code":{{pixel_code}}
}
```

---

### GET — BC pixel get

**Endpoint:** `GET {{base_url}}/v1.3/bc/pixel/link/get/?bc_id={{bc_id}}&pixel_code={{pixel_code}}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `pixel_code` | {{pixel_code}} |  |

---

### GET — BC asset admin get

**Endpoint:** `GET {{base_url}}/v1.3/bc/asset/admin/get/?bc_id={{bc_id}}&asset_type=ADVERTISER`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `asset_type` | ADVERTISER |  |

---

### GET — BC Asset partner get

**Endpoint:** `GET {{base_url}}/v1.3/bc/asset/partner/get/?bc_id={{bc_id}}&asset_type=ADVERTISER&asset_id={{asset_id}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `asset_type` | ADVERTISER |  |
| `asset_id` | {{asset_id}} |  |

---

### GET — BC asset get

**Endpoint:** `GET {{base_url}}/v1.3/bc/asset/get/?bc_id={{bc_id}}&asset_type=ADVERTISER`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `asset_type` | ADVERTISER |  |

---

### POST — BC Admin asset deletion

**Endpoint:** `POST {{base_url}}/open_api/v1.3/bc/asset/admin/delete/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
        "bc_id" : {{bc_id}},
        "asset_type": "LEAD",
        "asset_ids": {{asset_ids}}
}
```

---

### GET — Asset Bind Quota

**Endpoint:** `GET {{base_url}}/v1.3/asset/bind/quota/?advertiser_id={{advertiser_id}}&asset_id={{asset_id}}&asset_type=IDENTITY`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `asset_id` | {{asset_id}} |  |
| `asset_type` | IDENTITY |  |

---


## 📁 BC members

### GET — BC Member Get

**Endpoint:** `GET {{base_url}}/v1.3/bc/member/get/?bc_id={{bc_id}}`

**Headers:**
```
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |

---

### POST — BC Create

**Endpoint:** `POST {{base_url}}/v1.3/bc/create/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "bc_name": "{{bc_name}}",
    "timezone": "America/Tijuana"
}
```

---

### GET — BC Asset Member Get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/bc/member/get/?bc_id={{bc_id}}&filtering={"relation_status":"BOUND"}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `filtering` | {"relation_status":"BOUND"} |  |

---

### POST — BC Member invite

**Endpoint:** `POST {{base_url}}/v1.3/bc/member/invite/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "bc_id": "{{bc_id}}",
    "emails": [
        "{{email}}"
    ],
    "user_role": "STANDARD",
    "asset_ids": [
        "{{asset_ids}}"
    ],
    "advertiser_role": "OPERATOR"
}
```

---

### GET — BC member get

**Endpoint:** `GET {{base_url}}/v1.3/bc/member/get/?bc_id={{bc_id}}&page=1`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `page` | 1 |  |

---

### POST — BC member update

**Endpoint:** `POST {{base_url}}/v1.3/bc/member/update/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
        "bc_id" : {{bc_id}},
        "user_id": {{user_id}},
        "user_role": "ADMIN",
        "ext_user_role": {"finance_role":"ANALYST"}
}
```

---


## 📁 Ad Account

### GET — Advertiser info

**Endpoint:** `GET {{base_url}}/v1.3/advertiser/info/?advertiser_ids=["{{advertiser_id}}"]`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_ids` | ["{{advertiser_id}}"] |  |

---


## 📁 BC Partner

### GET — BC partner get

**Endpoint:** `GET {{base_url}}/v1.3/bc/partner/get/?bc_id={{bc_id}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |

---

### POST — Partner asset delete

**Endpoint:** `POST {{base_url}}/v1.3/bc/partner/asset/delete/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "bc_id": {{bc_id}},
    "partner_id": {{partner_id}},
    "asset_type": "ADVERTISER",
    "asset_ids": {{asset_ids}}
}
```

---

### POST — BC partner add

**Endpoint:** `POST {{base_url}}/v1.3/bc/partner/add/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
        "bc_id" : {{bc_id}},
        "partner_id": {{partner_id}},
        "asset_type": "ADVERTISER"
}
```

---

### POST — BC partner delete

**Endpoint:** `POST {{base_url}}/v1.3/bc/partner/delete/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
        "bc_id" : {{bc_id}},
        "partner_id": {{partner_id}}
}
```

---

### POST — BC asset assign

**Endpoint:** `POST {{base_url}}/v1.3/bc/asset/assign/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
x-cluster: default
```

**Body:**
```json
{
        "bc_id" : {{bc_id}},
        "user_id": {{user_id}},
        "asset_type": "ADVERTISER",
        "asset_id": {{asset_id}},
        "advertiser_role": "OPERATOR"
}
```

---

### POST — Asset unassign

**Endpoint:** `POST {{base_url}}/v1.3/bc/asset/unassign/`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Body:**
```json
{
    "bc_id" : {{bc_id}},
    "user_id": {{user_id}},
    "asset_type": "ADVERTISER",
    "asset_id": {{asset_id}}
}
```

---

### GET — BC partner asset

**Endpoint:** `GET {{base_url}}/v1.3/bc/partner/asset/get/?bc_id={{bc_id}}&asset_type=ADVERTISER&share_type=SHARING&partner_id={{partner_id}}`

**Headers:**
```
Content-Type: application/json
Access-Token: {{access_token}}
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `bc_id` | {{bc_id}} |  |
| `asset_type` | ADVERTISER |  |
| `share_type` | SHARING |  |
| `partner_id` | {{partner_id}} |  |

---


## 📁 Smart Performance Campaign

### GET — Campaign Spc Get

**Endpoint:** `GET {{base_url}}/v1.3/campaign/spc/get/?advertiser_id={{advertiser_id}}&campaign_ids=["{{campaign_id}}"]`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `campaign_ids` | ["{{campaign_id}}"] |  |

---

### POST — Campaign Spc create

**Endpoint:** `POST {{base_url}}/v1.3/campaign/spc/create/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
        "operation_status": "DISABLE",
        "advertiser_id": {{advertiser_id}},
        "objective_type": "APP_PROMOTION",
        "app_promotion_type": "APP_INSTALL",
        "campaign_type": "REGULAR_CAMPAIGN",
        "campaign_name": {{campaign_name}},
        "promotion_type": "APP_ANDROID",
        "app_id": {{app_id}},
        "placement_type": "PLACEMENT_TYPE_NORMAL",
        "placements": ["PLACEMENT_TIKTOK"],
        "location_ids": [{{location_ids}}],
        "budget_mode": "BUDGET_MODE_DAY",
        "budget": 20,
        "schedule_type": "SCHEDULE_START_END",
        "schedule_start_time": {{schedule_start_time}},
        "schedule_end_time": {{schedule_end_time}},
        "dayparting": {{dayparting}},
        "optimization_goal": "IN_APP_EVENT",
        "deep_bid_type": "AEO",
        "optimization_event": "ACTIVE_REGISTER",
        "bid_type": "BID_TYPE_NO_BID",
        "billing_event": "OCPM",
        "identity_id": {{identity_id}},
        "identity_type": "CUSTOMIZED_USER",
        "media_info_list": [
            {
                "media_info": {
                    "image_info": [{"web_uri": {{web_uri}}}],
                    "video_info": {"video_id": {{video_id}}},
                    "aigc_disclosure_type": "SELF_DISCLOSURE"
                }
            }
        ],
        "title_list": [{"title": {{title}}}],
        "call_to_action_id": {{call_to_action_id}},
        "call_to_action_list": [{"call_to_action": "DOWNLOAD_NOW"}],
        "impression_tracking_url": {{impression_tracking_url}}
    }
```

---

### POST — Campaign Spc update

**Endpoint:** `POST {{base_url}}/v1.3/campaign/spc/update/`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
    "advertiser_id": {{advertiser_id}},
    "campaign_id": {{campaign_id}},
    "campaign_name": "test_capaign_name"
}
```

---


## 📁 Ad Diagnosis

### GET — Tool Diagnosis get

**Endpoint:** `GET {{base_url}}/open_api/v1.3/tool/diagnosis/get/?advertiser_id={{advertiser_id}}&filters={"adgroup_ids": ["{{adgroup_id}}"]}`

**Headers:**
```
Access-Token: {{access_token}}
Content-Type: application/json
```

**Query Params:**

| Param | Value | Descrição |
|---|---|---|
| `advertiser_id` | {{advertiser_id}} |  |
| `filters` | {"adgroup_ids": ["{{adgroup_id}}"]} |  |

---

