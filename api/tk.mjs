import { HttpsProxyAgent } from 'https-proxy-agent'
import nodeFetch from 'node-fetch'

var TIKTOK_API = 'https://business-api.tiktok.com/open_api/v1.3'

// ─── Anti-detecção ────────────────────────────────────────────────────────────

var USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
]

// Plataformas coerentes com o User-Agent
var SEC_CH_PLATFORMS = ['"Windows"', '"Windows"', '"macOS"', '"macOS"', '"Linux"']

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

// request_id humano: timestamp com jitter variável + sufixo de comprimento variável
function makeRequestId() {
  // Jitter entre 50ms e 3200ms — simula latência de rede e processamento real
  var jitter = 50 + Math.floor(Math.random() * 3150)
  var ts = Date.now() - jitter
  // Sufixo com comprimento variável (3 a 6 dígitos) — evita padrão fixo de 4 dígitos
  var suffixLen = 3 + Math.floor(Math.random() * 4)
  var lo = Math.pow(10, suffixLen - 1)
  var hi = Math.pow(10, suffixLen) - 1
  var suffix = lo + Math.floor(Math.random() * (hi - lo + 1))
  return String(ts) + String(suffix)
}

// delay com distribuição triangular — mais próxima do comportamento humano que uniforme pura
// (média de 2 uniformes cria pico no centro, com caudas naturais nos extremos)
function rndDelay(min, max) {
  var val = min + ((Math.random() + Math.random()) / 2) * (max - min)
  return new Promise(r => setTimeout(r, Math.floor(val)))
}

function humanizeValue(base, pct) {
  var delta = base * (pct / 100)
  var raw = base + (Math.random() * delta * 2 - delta)
  return Math.round(raw / 5) * 5
}

function jitterSchedule(scheduleStr, minMinutes, maxMinutes) {
  try {
    var base = scheduleStr || new Date(Date.now() + 10*60000).toISOString().replace('T',' ').substring(0,19)
    var d = new Date(base.replace(' ', 'T') + 'Z')
    if (isNaN(d.getTime())) d = new Date(Date.now() + 10*60000)
    var jitter = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes
    d.setMinutes(d.getMinutes() + jitter)
    return d.toISOString().replace('T', ' ').substring(0, 19)
  } catch(e) {
    return new Date(Date.now() + 10*60000).toISOString().replace('T',' ').substring(0,19)
  }
}

function parseProxy(raw) {
  if (!raw || !raw.trim()) return null
  var s = raw.trim()
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (s.startsWith('socks5://') || s.startsWith('socks://')) return null
  if (s.includes('@')) return 'http://' + s
  var parts = s.split(':')
  if (parts.length === 4) return 'http://' + parts[2] + ':' + parts[3] + '@' + parts[0] + ':' + parts[1]
  if (parts.length === 2) return 'http://' + s
  return null
}

function makeAgent(proxyUrl) {
  if (!proxyUrl) return null
  try { return new HttpsProxyAgent(proxyUrl) } catch(e) { return null }
}

async function getToken() {
  try {
    var r = await nodeFetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
      headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
    })
    var d = await r.json()
    return d.data ? d.data.access_token : null
  } catch(e) { return null }
}

// Gera Accept-Language variado para parecer diferentes regiões/idiomas
function randomAcceptLang() {
  var langs = [
    'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'pt-BR,pt;q=0.9,en;q=0.8',
    'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
    'pt-BR,pt;q=0.8,es;q=0.5,en;q=0.3',
    'en-US,en;q=0.9',
  ]
  return langs[Math.floor(Math.random() * langs.length)]
}

async function ttOnce(endpoint, token, method, body, proxyRaw) {
  var proxyUrl = parseProxy(proxyRaw || null)
  var agent = proxyUrl ? makeAgent(proxyUrl) : null
  var ua = randomUA()
  var platform = SEC_CH_PLATFORMS[Math.floor(Math.random() * SEC_CH_PLATFORMS.length)]
  var isMac = platform.includes('macOS')
  var chromeVer = ['129', '130', '131'][Math.floor(Math.random() * 3)]
  var opts = {
    method: method || 'GET',
    headers: {
      'Access-Token': token,
      'Content-Type': 'application/json',
      'User-Agent': ua,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': randomAcceptLang(),
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Origin': 'https://ads.tiktok.com',
      'Referer': 'https://ads.tiktok.com/',
      'sec-ch-ua': '"Google Chrome";v="' + chromeVer + '", "Chromium";v="' + chromeVer + '", "Not_A Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': platform,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': isMac ? 'cross-site' : 'same-site',
    }
  }
  if (body) opts.body = typeof body === 'string' ? body : JSON.stringify(body)
  if (agent) opts.agent = agent
  var r = await nodeFetch(TIKTOK_API + endpoint, opts)
  return r.json()
}

// Erros que não adianta tentar de novo — falha permanente
function isPermanentError(result) {
  if (!result) return false
  var msg = (result.message || '').toLowerCase()
  // Sem permissão para a conta
  if (result.code === 40002) return true
  if (msg.includes('no permission')) return true
  if (msg.includes('permission denied')) return true
  // Conta suspensa / inativa
  if (msg.includes('advertiser status') && msg.includes('not')) return true
  if (msg.includes('account is banned')) return true
  // Token inválido
  if (result.code === 40001) return true
  return false
}

async function tt(endpoint, token, method, body, proxyRaw) {
  var lastErr = ''
  for (var attempt = 1; attempt <= 3; attempt++) {
    try {
      var result = await ttOnce(endpoint, token, method, body, proxyRaw)
      // Erro permanente — não tenta de novo
      if (isPermanentError(result)) return result
      // TikTok retorna code !== 0 em erros de rate limit — retry nesses casos
      if (result && (result.code === 40100 || result.code === 50001 || result.code === 50002)) {
        lastErr = 'TikTok ' + result.code + ': ' + (result.message || '')
        await rndDelay(3000 * attempt, 6000 * attempt)
        continue
      }
      return result
    } catch(e) {
      lastErr = e.message
      if (attempt < 3) await rndDelay(2000 * attempt, 4000 * attempt)
    }
  }
  throw new Error(lastErr + ' (3 tentativas)')
}

async function authorizeSpark(token, advertiserId, authCode, proxyRaw) {
  var lastError = ''
  for (var attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) await new Promise(r => setTimeout(r, 2000 * attempt))
    try {
      var authRes = await tt('/tt_video/authorize/', token, 'POST', { advertiser_id: advertiserId, auth_code: authCode }, proxyRaw)
      // Erro permanente — não tenta de novo
      if (isPermanentError(authRes)) return { ok: false, error: authRes.message || 'permission denied', permanent: true }
      var identityId = (authRes.data && authRes.data.identity_id) ? authRes.data.identity_id : null
      if (authRes.code !== 0 || !identityId) {
        lastError = authRes.message || 'authorize failed'
        continue
      }
      var infoEp = '/tt_video/info/?advertiser_id=' + advertiserId + '&auth_code=' + encodeURIComponent(authCode)
      var infoRes = await tt(infoEp, token, 'GET', null, proxyRaw)
      var itemId = (infoRes.data && infoRes.data.item_info) ? infoRes.data.item_info.item_id : null
      if (infoRes.code !== 0 || !itemId) {
        lastError = 'info failed: ' + (infoRes.message || '')
        continue
      }
      return { ok: true, identity_id: identityId, item_id: itemId, attempt: attempt }
    } catch(e) {
      lastError = e.message
    }
  }
  return { ok: false, error: lastError + ' (3 tentativas)' }
}

async function getOrCreateCTA(token, advertiserId, proxyRaw) {
  var rec = await tt('/creative/cta/recommend/?advertiser_id=' + advertiserId + '&objective_type=WEB_CONVERSIONS&promotion_type=WEBSITE&identity_type=AUTH_CODE&asset_type=CTA_AUTO_OPTIMIZED&content_type=LANDING_PAGE', token, 'GET', null, proxyRaw)
  if (rec.code !== 0 || !rec.data || !rec.data.recommend_assets || rec.data.recommend_assets.length === 0) return { ok: false, error: 'CTA recommend failed' }
  var assets = rec.data.recommend_assets
  var content = []
  for (var i = 0; i < assets.length; i++) {
    content.push({ asset_content: assets[i].asset_content, asset_ids: assets[i].asset_ids })
  }
  var createRes = await tt('/creative/portfolio/create/', token, 'POST', {
    advertiser_id: advertiserId,
    creative_portfolio_type: 'CTA',
    portfolio_content: content
  }, proxyRaw)
  if (createRes.code !== 0 || !createRes.data) return { ok: false, error: 'CTA create failed: ' + (createRes.message || '') }
  return { ok: true, call_to_action_id: createRes.data.creative_portfolio_id }
}

function appendUtm(url) {
  if (!url) return url
  var sep = url.includes('?') ? '&' : '?'
  return url + sep + 'utm_source=tiktok&utm_id=__CAMPAIGN_ID__&utm_campaign=__CAMPAIGN_NAME__'
}

function parseProxyList(rawList) {
  if (!Array.isArray(rawList)) return []
  return rawList.map(parseProxy).filter(Boolean)
}

function proxyForAccount(proxyList, accountIndex) {
  if (!proxyList || proxyList.length === 0) return null
  return proxyList[accountIndex % proxyList.length]
}

export default async function handler(req, res) {
  try {
    var action = req.query.a
    var token = await getToken()
    if (!token && action !== 'token' && action !== 'test_proxy') return res.status(401).json({ error: 'No token' })

    if (action === 'test_proxy') {
      var rawProxy = (req.body && req.body.proxy) || req.query.proxy || ''
      var proxyUrl = parseProxy(rawProxy)
      if (!proxyUrl) return res.json({ ok: false, error: 'Proxy inválida ou não informada' })
      var agent = makeAgent(proxyUrl)
      if (!agent) return res.json({ ok: false, error: 'Falha ao criar agente: ' + proxyUrl })
      try {
        var start = Date.now()
        var r = await nodeFetch('https://api.ipify.org?format=json', { agent, signal: AbortSignal.timeout(10000) })
        var data = await r.json()
        var masked = proxyUrl.replace(/\/\/([^:]+):([^@]+)@/, '//**:**@')
        return res.json({ ok: true, ip: data.ip, latency_ms: Date.now() - start, proxy_used: masked })
      } catch(e) {
        return res.json({ ok: false, error: e.message })
      }
    }

    if (action === 'token') {
      var r = await nodeFetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
        headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
      })
      return res.json(await r.json())
    }

    if (action === 'disable_campaigns' && req.method === 'POST') {
      var body = req.body
      var advId = body && body.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      var proxyRaw = (body && body.proxy) || null

      var campRes = await tt('/campaign/get/?advertiser_id=' + advId + '&page_size=100', token, 'GET', null, proxyRaw)
      if (campRes.code !== 0) return res.json({ code: campRes.code, message: campRes.message, disabled: 0 })
      var camps = (campRes.data && campRes.data.list) ? campRes.data.list : []
      if (camps.length === 0) return res.json({ code: 0, data: { disabled: 0, total: 0 } })

      // Desativa todas de uma vez — operação DISABLE é segura em bulk
      var activeIds = camps
        .filter(function(c) { return c.operation_status !== 'DISABLE' && c.operation_status !== 'DELETE' })
        .map(function(c) { return c.campaign_id })

      if (activeIds.length === 0) return res.json({ code: 0, data: { disabled: 0, total: camps.length, already_off: camps.length } })

      var disRes = await tt('/campaign/status/update/', token, 'POST', {
        advertiser_id: advId,
        campaign_ids: activeIds,
        operation_status: 'DISABLE'
      }, proxyRaw)

      if (disRes.code === 0) return res.json({ code: 0, data: { disabled: activeIds.length, total: camps.length } })
      return res.json({ code: disRes.code, message: disRes.message, data: { disabled: 0, total: camps.length } })
    }

    if (action === 'delete_campaigns' && req.method === 'POST') {
      var body = req.body
      var advId = body && body.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })

      // Usa proxy específico desta conta para não correlacionar com outras
      var proxyRaw = (body && body.proxy) || null

      // Busca campanhas — uma página, 100 por vez
      var campRes = await tt('/campaign/get/?advertiser_id=' + advId + '&page_size=100', token, 'GET', null, proxyRaw)
      if (campRes.code !== 0) return res.json({ code: campRes.code, message: campRes.message, deleted: 0 })
      var camps = (campRes.data && campRes.data.list) ? campRes.data.list : []
      if (camps.length === 0) return res.json({ code: 0, data: { deleted: 0, total: 0 } })

      var deleted = 0; var errors = []

      // Deleta UMA campanha por vez com delay humano — nunca em bulk
      for (var i = 0; i < camps.length; i++) {
        var campId = camps[i].campaign_id
        // Delay humano entre cada delete: 3-8 segundos
        if (i > 0) await rndDelay(3000, 8000)
        try {
          var delRes = await tt('/campaign/status/update/', token, 'POST', {
            advertiser_id: advId,
            campaign_ids: [campId],
            operation_status: 'DELETE'
          }, proxyRaw)
          if (delRes.code === 0) deleted++
          else errors.push(campId + ': ' + (delRes.message || 'unknown'))
        } catch(e) {
          errors.push(campId + ': ' + e.message)
        }
      }

      return res.json({ code: 0, data: { deleted, total: camps.length, errors } })
    }

    if (action === 'ad_list_review') {
      var advId = req.query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      var proxyRaw = req.query.proxy || null

      // Passo 1: buscar todos os Smart Plus ads via /smart_plus/ad/get/
      // (os ads "Upgraded Smart+" NÃO aparecem no /ad/get/ normal)
      var allAds = []
      var page = 1
      var debugGetResult = null
      try {
        while (true) {
          var ep = '/smart_plus/ad/get/?advertiser_id=' + advId
            + '&page_size=100&page=' + page
          var listResult = await tt(ep, token, 'GET', null, proxyRaw)
          if (page === 1) debugGetResult = { code: listResult.code, msg: listResult.message, keys: listResult.data ? Object.keys(listResult.data) : [] }
          if (listResult.code !== 0) break  // não retorna erro — pode ter ads normais também
          var pageAds = (listResult.data && listResult.data.list) ? listResult.data.list : []
          allAds = allAds.concat(pageAds)
          var pageInfo = listResult.data && listResult.data.page_info
          if (!pageInfo || page >= (pageInfo.total_page || 1) || pageAds.length === 0) break
          page++
          if (page > 10) break
        }
      } catch(e) { debugGetResult = { error: e.message } }

      // Passo 2: se smart_plus/ad/get retornou ads, consultar review_info deles
      // Senão, tenta /ad/get/ normal como fallback
      if (allAds.length === 0) {
        var page2 = 1
        try {
          while (true) {
            var ep2 = '/ad/get/?advertiser_id=' + advId
              + '&fields=' + encodeURIComponent(JSON.stringify(['ad_id', 'ad_name', 'adgroup_id', 'secondary_status']))
              + '&page_size=100&page=' + page2
            var r2 = await tt(ep2, token, 'GET', null, proxyRaw)
            if (r2.code !== 0) break
            var pg2 = (r2.data && r2.data.list) ? r2.data.list : []
            allAds = allAds.concat(pg2)
            var pi2 = r2.data && r2.data.page_info
            if (!pi2 || page2 >= (pi2.total_page || 1) || pg2.length === 0) break
            page2++
            if (page2 > 10) break
          }
        } catch(e) {}
      }

      if (allAds.length === 0) {
        return res.json({ code: 0, data: { list: [], total: 0, scanned: 0, debug_get: debugGetResult } })
      }

      // Extrai o ID correto (smart_plus_ad_id ou ad_id)
      function getAdId(ad) { return ad.smart_plus_ad_id || ad.ad_id || '' }
      var adMap = {}
      allAds.forEach(function(ad) { adMap[getAdId(ad)] = ad })

      // Passo 3: /smart_plus/ad/review_info/ em lotes de 100
      // extra_info_setting com include_reject_info=true
      // review_status === 'UNAVAILABLE' → rejeitado
      var rejected = []
      var debugReview = null
      var BATCH_SIZE = 100
      var extraSetting = encodeURIComponent(JSON.stringify({ include_reject_info: true }))

      for (var bi = 0; bi < allAds.length; bi += BATCH_SIZE) {
        var batch = allAds.slice(bi, bi + BATCH_SIZE)
        var batchIds = batch.map(getAdId)
        var idsParam = encodeURIComponent(JSON.stringify(batchIds))
        try {
          var rv = await tt(
            '/smart_plus/ad/review_info/?advertiser_id=' + advId
              + '&smart_plus_ad_ids=' + idsParam
              + '&extra_info_setting=' + extraSetting,
            token, 'GET', null, proxyRaw
          )
          if (bi === 0) debugReview = rv  // salva primeira resposta completa para debug

          if (rv.code === 0 && rv.data) {
            // Resposta: data.smart_plus_ad_review_infos (array)
            var reviewList = rv.data.smart_plus_ad_review_infos || rv.data.list || []
            reviewList.forEach(function(item) {
              var st = (item.review_status || '').toUpperCase()
              // UNAVAILABLE = rejeitado; ALL_AVAILABLE/PART_AVAILABLE = aprovado
              if (st === 'UNAVAILABLE') {
                var id = item.smart_plus_ad_id || item.ad_id || ''
                var base = adMap[id] || {}
                rejected.push({
                  ad_id: id,
                  ad_name: base.ad_name || item.ad_name || '',
                  adgroup_id: base.adgroup_id || '',
                  review_status: st,
                  appeal_status: item.appeal_status || '',
                })
              }
            })
          }
        } catch(e) { if (bi === 0) debugReview = { error: e.message } }

        if (bi + BATCH_SIZE < allAds.length) await rndDelay(300, 600)
      }

      return res.json({ code: 0, data: {
        list: rejected, total: rejected.length, scanned: allAds.length,
        debug_get: debugGetResult,
        debug_review: debugReview,
      }})
    }

    if (action === 'ad_appeal' && req.method === 'POST') {
      var body = req.body
      var advId = body && body.advertiser_id
      var adId = body && body.ad_id
      if (!advId || !adId) return res.status(400).json({ error: 'advertiser_id and ad_id required' })
      var proxyRaw = (body && body.proxy) || null
      // Appeal para Upgraded Smart Plus ads: POST /smart_plus/ad/appeal/
      var result = await tt('/smart_plus/ad/appeal/', token, 'POST', {
        advertiser_id: advId,
        smart_plus_ad_id: adId,
        appeal_reason: "I don't think there's a violation",
        appeal_description: "I don't think there's a violation",
      }, proxyRaw)
      return res.json(result)
    }

    if (action === 'remove_bc_accounts' && req.method === 'POST') {
      var body = req.body
      var bcId = body && body.bc_id
      var advIds = body && body.advertiser_ids
      if (!bcId || !Array.isArray(advIds) || advIds.length === 0) return res.status(400).json({ error: 'bc_id and advertiser_ids required' })
      var removed = []; var errors = []
      // Envia em lotes de 20 para não exceder limites da API
      var BATCH = 20
      for (var i = 0; i < advIds.length; i += BATCH) {
        var batch = advIds.slice(i, i + BATCH)
        try {
          var r = await tt('/bc/asset/admin/delete/', token, 'POST', { bc_id: bcId, asset_type: 'ADVERTISER', asset_ids: batch })
          if (r.code === 0) removed.push(...batch)
          else batch.forEach(function(id) { errors.push({ id: id, error: r.message || 'unknown' }) })
        } catch(e) { batch.forEach(function(id) { errors.push({ id: id, error: e.message }) }) }
      }
      return res.json({ code: 0, data: { removed, errors } })
    }

    if (action === 'bc_list') return res.json(await tt('/bc/get/?page_size=50', token))

    if (action === 'bc_advertisers') {
      var bcId = req.query.bc_id
      if (!bcId) return res.status(400).json({ error: 'bc_id required' })
      var first = await tt('/bc/asset/get/?bc_id=' + bcId + '&asset_type=ADVERTISER&page=1&page_size=50', token)
      if (first.code !== 0) return res.json(first)
      var all = (first.data && first.data.list) ? first.data.list.slice() : []
      var total = (first.data && first.data.page_info) ? first.data.page_info.total_number : 0
      var totalPages = Math.ceil(total / 50)
      for (var p = 2; p <= totalPages && p <= 20; p++) {
        var d = await tt('/bc/asset/get/?bc_id=' + bcId + '&asset_type=ADVERTISER&page=' + p + '&page_size=50', token)
        if (d.data && d.data.list) all = all.concat(d.data.list)
      }
      var advIds = all.map(function(a) { return a.asset_id || a.advertiser_id })
      var infoMap = {}
      for (var i = 0; i < advIds.length; i += 50) {
        var batch = advIds.slice(i, i + 50)
        try {
          var info = await tt('/advertiser/info/?advertiser_ids=' + encodeURIComponent(JSON.stringify(batch)), token)
          if (info.data && info.data.list) info.data.list.forEach(function(a) { infoMap[a.advertiser_id] = a })
        } catch(e) {}
      }
      var mapped = all.map(function(a) {
        var id = a.asset_id || a.advertiser_id
        var info = infoMap[id] || {}
        return { advertiser_id: id, advertiser_name: info.name || a.asset_name || '', status: info.status || 'UNKNOWN', currency: info.currency || 'BRL', role: a.advertiser_role || '', balance: info.balance || 0 }
      })
      return res.json({ code: 0, data: { list: mapped, total: mapped.length } })
    }

    if (action === 'identity_get') {
      var advId = req.query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      var ep = '/identity/get/?advertiser_id=' + advId
      if (req.query.identity_type) ep += '&identity_type=' + req.query.identity_type
      return res.json(await tt(ep, token))
    }

    if (action === 'pixel') {
      var advId = req.query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt('/pixel/list/?advertiser_id=' + advId, token))
    }

    if (action === 'videos') {
      var advId = req.query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt('/file/video/ad/get/?advertiser_id=' + advId + '&page_size=50', token))
    }

    if (action === 'campaign_get') {
      var advId = req.query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt('/campaign/get/?advertiser_id=' + advId + '&page_size=50', token))
    }

    if (action === 'tt_proxy') {
      var ep = req.query.ep
      if (!ep) return res.status(400).json({ error: 'ep required' })
      if (req.method === 'POST') return res.json(await tt(ep, token, 'POST', req.body))
      return res.json(await tt(ep, token))
    }

    if (action === 'spark_authorize' && req.method === 'POST') {
      var body = req.body || {}
      if (!body.advertiser_id || !body.auth_code) return res.status(400).json({ error: 'advertiser_id and auth_code required' })
      return res.json(await authorizeSpark(token, body.advertiser_id, body.auth_code, body.proxy || null))
    }

    if (action === 'spark_info' && req.method === 'POST') {
      var body = req.body || {}
      if (!body.advertiser_id || !body.auth_code) return res.status(400).json({ error: 'need advertiser_id + auth_code' })
      return res.json(await tt('/tt_video/info/?advertiser_id=' + body.advertiser_id + '&auth_code=' + encodeURIComponent(body.auth_code), token))
    }

    if (action === 'launch_smart' && req.method === 'POST') {
      var body = req.body
      var results = { campaigns: 0, adgroups: 0, ads: 0, spark_authorized: 0, cta_created: 0, errors: [], logs: [] }
      var sparkCodes = body.spark_codes || []
      var sparkAuthCache = {}
      var L = function(advId, msg) { results.logs.push({ account: advId, message: msg, time: new Date().toISOString() }) }

      var proxyList = parseProxyList(body.proxy_list || [])
      var accountIndex = body.account_index != null ? body.account_index : 0
      var accountProxy = proxyForAccount(proxyList, accountIndex)

      if (accountProxy) {
        L('system', '🛡️ Proxy: ' + accountProxy.replace(/\/\/([^:]+):([^@]+)@/, '//**:**@'))
      } else {
        L('system', '⚠️ Sem proxy — IP direto da Vercel')
      }

      // Parse domain list — rodízio por conta
      var domainList = Array.isArray(body.domain_list) ? body.domain_list.filter(Boolean) : []
      var accountDomain = domainList.length > 0
        ? domainList[accountIndex % domainList.length]
        : (body.landing_page_url || '')

      if (domainList.length > 0) {
        L('system', '🌐 Domínio desta conta: ' + accountDomain)
      }

      for (var i = 0; i < body.accounts.length; i++) {
        var advId = body.accounts[i].advertiser_id
        sparkAuthCache[advId] = {}
        var codesForAccount = body.rotation ? [sparkCodes[accountIndex % sparkCodes.length]] : sparkCodes

        var noPermission = false
        for (var s = 0; s < codesForAccount.length; s++) {
          var code = codesForAccount[s]
          L(advId, 'Spark ' + (s+1) + '/' + codesForAccount.length + ': authorize...')
          try {
            var sr = await authorizeSpark(token, advId, code, accountProxy)
            if (sr.ok) {
              sparkAuthCache[advId][code] = sr
              L(advId, '✅ identity=' + sr.identity_id + ' item=' + sr.item_id)
              results.spark_authorized++
            } else {
              L(advId, '⚠️ ' + sr.error)
              results.errors.push({ account: advId, step: 'spark', error: sr.error })
              if (sr.permanent) { noPermission = true; break }
            }
          } catch(e) {
            L(advId, '❌ ' + e.message)
            results.errors.push({ account: advId, step: 'spark', error: e.message })
          }
        }

        // Sem permissão para esta conta — pula imediatamente
        if (noPermission) {
          L(advId, '⛔ Sem permissão — conta ignorada')
          continue
        }

      }

      var campaignsPerAccount = body.campaigns_per_account || 1

      for (var i = 0; i < body.accounts.length; i++) {
        var advId = body.accounts[i].advertiser_id
        // Pula conta sem permissão
        if (noPermission) { noPermission = false; continue }
        var accountSparks = sparkAuthCache[advId] || {}
        var pixelId = body.pixel_id || null

        if (!pixelId) {
          try {
            var pr = await tt('/pixel/list/?advertiser_id=' + advId, token, 'GET', null, accountProxy)
            if (pr.data && pr.data.pixels && pr.data.pixels.length > 0) pixelId = pr.data.pixels[0].pixel_id
          } catch(e) {}
          if (!pixelId) { L(advId, '⚠️ No pixel'); results.errors.push({ account: advId, step: 'pixel', error: 'No pixel' }); continue }
        }

        for (var cp = 0; cp < campaignsPerAccount; cp++) {
          var seqNum = String((body.start_seq || 1) + cp).padStart(2, '0')
          var baseBudget = body.budget || 111
          var humanBudget = humanizeValue(baseBudget, 10)
          var campPayload = {
            advertiser_id: advId,
            request_id: makeRequestId(),
            campaign_name: (body.campaign_name || 'HL') + ' ' + seqNum,
            objective_type: 'WEB_CONVERSIONS',
            sales_destination: 'WEBSITE',
            budget_mode: 'BUDGET_MODE_DAY',
            budget: humanBudget,
            operation_status: body.start_paused ? 'DISABLE' : 'ENABLE',
          }
          L(advId, 'Campaign: ' + campPayload.campaign_name)
          var campRes = await tt('/smart_plus/campaign/create/', token, 'POST', campPayload, accountProxy)
          if (campRes.code !== 0) {
            L(advId, '❌ Campaign: ' + campRes.message)
            results.errors.push({ account: advId, step: 'campaign', error: campRes.message })
            continue
          }
          var campaignId = campRes.data.campaign_id
          L(advId, '✅ Campaign: ' + campaignId)
          results.campaigns++
          await rndDelay(400, 700)

          var scheduleStart = body.schedule_start
            ? body.schedule_start
            : new Date(Date.now() + 10*60000).toISOString().replace('T',' ').substring(0,19)
          var jitteredSchedule = jitterSchedule(scheduleStart, 0, 8)
          var baseCpa = parseFloat(body.target_cpa) || 0
          var agPayload = {
            request_id: makeRequestId(),
            advertiser_id: advId,
            campaign_id: campaignId,
            adgroup_name: body.adgroup_name || ('AG ' + campPayload.campaign_name),
            optimization_event: body.optimization_event || 'SHOPPING',
            optimization_goal: 'CONVERT',
            billing_event: 'OCPM',
            pixel_id: pixelId,
            promotion_type: 'WEBSITE',
            landing_page_url: appendUtm(accountDomain),
            targeting_spec: { location_ids: body.location_ids || ['3469034'] },
            schedule_type: 'SCHEDULE_FROM_NOW',
            schedule_start_time: jitteredSchedule,
          }
          if (baseCpa > 0) {
            agPayload.bid_type = 'BID_TYPE_CUSTOM'
            agPayload.conversion_bid_price = baseCpa
          } else {
            agPayload.bid_type = 'BID_TYPE_NO_BID'
          }
          var agRes = await tt('/smart_plus/adgroup/create/', token, 'POST', agPayload, accountProxy)
          if (agRes.code !== 0) {
            L(advId, '❌ AdGroup: ' + agRes.message)
            results.errors.push({ account: advId, step: 'adgroup', error: agRes.message })
            continue
          }
          var adgroupId = agRes.data.adgroup_id
          L(advId, '✅ AdGroup: ' + adgroupId)
          results.adgroups++
          await rndDelay(400, 700)

          var codesForAccount = body.rotation ? [sparkCodes[accountIndex % sparkCodes.length]] : sparkCodes
          var adsPerCode = body.ads_per_code || 2
          for (var c = 0; c < codesForAccount.length; c++) {
            var sd = accountSparks[codesForAccount[c]]
            if (!sd || !sd.ok) { L(advId, '⚠️ Spark ' + (c+1) + ' not authorized'); continue }
            for (var a = 0; a < adsPerCode; a++) {
              var adSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
              var adPayload = {
                request_id: makeRequestId(),
                advertiser_id: advId,
                adgroup_id: adgroupId,
                ad_name: (body.ad_name || campPayload.campaign_name) + ' ' + adSuffix,
                creative_list: [{ creative_info: { ad_format: 'SINGLE_VIDEO', tiktok_item_id: sd.item_id, identity_type: 'AUTH_CODE', identity_id: sd.identity_id } }],
                ad_text_list: (body.ad_texts || ['Shop now']).map(function(t) { return { ad_text: t } }),
                landing_page_url_list: [{ landing_page_url: appendUtm(accountDomain) }],
              }
              if (c > 0 || a > 0) await rndDelay(500, 1000)
              L(advId, 'Ad ' + (c+1) + '-' + (a+1) + '...')
              var adRes = await tt('/smart_plus/ad/create/', token, 'POST', adPayload, accountProxy)
              // Retry específico para concurrent requests
              if (adRes.code !== 0 && adRes.message && adRes.message.includes('concurrent')) {
                L(advId, '⏳ Concurrent limit, retry...')
                await rndDelay(1500, 2500)
                adRes = await tt('/smart_plus/ad/create/', token, 'POST', adPayload, accountProxy)
              }
              if (adRes.code !== 0) {
                L(advId, '❌ Ad: ' + adRes.message)
                results.errors.push({ account: advId, step: 'ad', error: adRes.message })
              } else {
                var adId = adRes.data.smart_plus_ad_id || '?'
                L(advId, '✅ Ad ' + (c+1) + '-' + (a+1) + ' | camp=' + campaignId + ' ag=' + adgroupId + ' ad=' + adId)
                results.ads++
                if (!results.created) results.created = []
                results.created.push({ account: advId, campaign_id: campaignId, adgroup_id: adgroupId, ad_id: adId, campaign_name: campPayload.campaign_name })
              }
            }
          }
        }
      }

      return res.json({ code: 0, data: results })
    }

    if (action === 'launch_manual' && req.method === 'POST') {
      var body = req.body
      var results = { campaigns: 0, adgroups: 0, ads: 0, errors: [], logs: [], created: [] }
      var L = function(advId, msg) { results.logs.push({ account: advId, message: msg, time: new Date().toISOString() }) }

      var proxyList = parseProxyList(body.proxy_list || [])
      var accountIndex = body.account_index != null ? body.account_index : 0
      var accountProxy = proxyForAccount(proxyList, accountIndex)

      if (accountProxy) {
        L('system', '🛡️ Proxy: ' + accountProxy.replace(/\/\/([^:]+):([^@]+)@/, '//**:**@'))
      } else {
        L('system', '⚠️ Sem proxy — IP direto da Vercel')
      }

      var domainList = Array.isArray(body.domain_list) ? body.domain_list.filter(Boolean) : []
      var accountDomain = domainList.length > 0
        ? domainList[accountIndex % domainList.length]
        : (body.landing_page_url || '')

      if (domainList.length > 0) L('system', '🌐 Domínio: ' + accountDomain)

      await rndDelay(2000, 4000)

      for (var i = 0; i < body.accounts.length; i++) {
        var advId = body.accounts[i].advertiser_id
        var sparkAuthCache = {}

        // Spark authorization (AUTH_CODE identity only)
        var noPermissionM = false
        if (body.identity_type === 'AUTH_CODE' && body.spark_codes && body.spark_codes.length > 0) {
          var codesForAccount = body.rotation ? [body.spark_codes[accountIndex % body.spark_codes.length]] : body.spark_codes
          for (var s = 0; s < codesForAccount.length; s++) {
            var code = codesForAccount[s]
            L(advId, 'Spark ' + (s+1) + '/' + codesForAccount.length + ': authorize...')
            try {
              var sr = await authorizeSpark(token, advId, code, accountProxy)
              if (sr.ok) {
                sparkAuthCache[code] = sr
                L(advId, '✅ identity=' + sr.identity_id + ' item=' + sr.item_id)
              } else {
                L(advId, '⚠️ ' + sr.error)
                results.errors.push({ account: advId, step: 'spark', error: sr.error })
                if (sr.permanent) { noPermissionM = true; break }
              }
            } catch(e) {
              L(advId, '❌ ' + e.message)
              results.errors.push({ account: advId, step: 'spark', error: e.message })
            }
          }
        }
        if (noPermissionM) { L(advId, '⛔ Sem permissão — conta ignorada'); continue }

        // Pixel (only needed for CONVERSIONS objective)
        var pixelId = body.pixel_id || null
        if (!pixelId && body.objective_type === 'CONVERSIONS') {
          try {
            var pr = await tt('/pixel/list/?advertiser_id=' + advId, token, 'GET', null, accountProxy)
            if (pr.data && pr.data.pixels && pr.data.pixels.length > 0) pixelId = pr.data.pixels[0].pixel_id
          } catch(e) {}
          if (!pixelId) {
            L(advId, '⚠️ Nenhum pixel encontrado — pulando conta')
            results.errors.push({ account: advId, step: 'pixel', error: 'No pixel found' })
            continue
          }
        }

        var campaignsPerAccount = body.campaigns_per_account || 1

        for (var cp = 0; cp < campaignsPerAccount; cp++) {
          var seqNum = String((body.start_seq || 1) + cp).padStart(2, '0')
          var isCBO = body.budget_mode !== 'abo'
          var humanBudget = humanizeValue(body.budget || 50, 10)

          // Campaign
          var campPayload = {
            advertiser_id: advId,
            request_id: makeRequestId(),
            campaign_name: (body.campaign_name || 'HL') + ' ' + seqNum,
            objective_type: body.objective_type || 'CONVERSIONS',
            budget_mode: isCBO ? 'BUDGET_MODE_DAY' : 'BUDGET_MODE_INFINITE',
            operation_status: body.start_paused ? 'DISABLE' : 'ENABLE',
          }
          if (isCBO) campPayload.budget = humanBudget

          L(advId, 'Campaign: ' + campPayload.campaign_name)
          var campRes = await tt('/campaign/create/', token, 'POST', campPayload, accountProxy)
          if (campRes.code !== 0) {
            L(advId, '❌ Campaign: ' + campRes.message)
            results.errors.push({ account: advId, step: 'campaign', error: campRes.message })
            await rndDelay(1500, 3000)
            continue
          }
          var campaignId = campRes.data.campaign_id
          L(advId, '✅ Campaign: ' + campaignId)
          results.campaigns++
          await rndDelay(1500, 3000)

          // Ad Group
          var scheduleStart = body.schedule_start
            ? body.schedule_start
            : new Date(Date.now() + 10*60000).toISOString().replace('T',' ').substring(0,19)
          var jitteredSchedule = jitterSchedule(scheduleStart, 0, 8)

          var targetingSpec = { location_ids: body.location_ids || ['3469034'] }
          if (body.age_groups && body.age_groups.length > 0) targetingSpec.age = body.age_groups
          if (body.gender && body.gender !== 'GENDER_UNLIMITED') targetingSpec.gender = [body.gender]
          if (body.os && body.os.length > 0) targetingSpec.operating_systems = body.os

          var agPayload = {
            request_id: makeRequestId(),
            advertiser_id: advId,
            campaign_id: campaignId,
            adgroup_name: body.adgroup_name || ('AG ' + campPayload.campaign_name),
            placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
            billing_event: body.billing_event || 'OCPM',
            optimization_goal: body.optimization_goal || 'CONVERT',
            promotion_type: 'WEBSITE',
            landing_page_url: appendUtm(accountDomain),
            schedule_type: 'SCHEDULE_FROM_NOW',
            schedule_start_time: jitteredSchedule,
            targeting_spec: targetingSpec,
            pacing: 'PACING_MODE_SMOOTH',
            operation_status: body.start_paused ? 'DISABLE' : 'ENABLE',
          }

          if (!isCBO) {
            agPayload.budget_mode = 'BUDGET_MODE_DAY'
            agPayload.budget = humanBudget
          }

          if (pixelId) {
            agPayload.pixel_id = pixelId
            agPayload.optimization_event = body.optimization_event || 'SHOPPING'
            agPayload.click_attribution_window = 'SEVEN_DAYS'
            agPayload.view_attribution_window = 'ONE_DAY'
          }

          if (body.bid_price && parseFloat(body.bid_price) > 0) {
            agPayload.bid_type = 'BID_TYPE_CUSTOM'
            agPayload.conversion_bid_price = parseFloat(body.bid_price)
          } else {
            agPayload.bid_type = 'BID_TYPE_NO_BID'
          }

          var agRes = await tt('/adgroup/create/', token, 'POST', agPayload, accountProxy)
          if (agRes.code !== 0) {
            L(advId, '❌ AdGroup: ' + agRes.message)
            results.errors.push({ account: advId, step: 'adgroup', error: agRes.message })
            await rndDelay(1500, 3000)
            continue
          }
          var adgroupId = agRes.data.adgroup_id
          L(advId, '✅ AdGroup: ' + adgroupId)
          results.adgroups++
          await rndDelay(1500, 3000)

          // Ads — Spark (AUTH_CODE) mode
          if (body.identity_type === 'AUTH_CODE') {
            var sparkCodes2 = body.spark_codes || []
            var codesForAds = body.rotation ? [sparkCodes2[accountIndex % sparkCodes2.length]] : sparkCodes2
            var adsPerCode = body.ads_per_code || 1
            for (var c = 0; c < codesForAds.length; c++) {
              var sd = sparkAuthCache[codesForAds[c]]
              if (!sd || !sd.ok) { L(advId, '⚠️ Spark ' + (c+1) + ' não autorizado'); continue }
              for (var a = 0; a < adsPerCode; a++) {
                if (c > 0 || a > 0) await rndDelay(3000, 5000)
                var adSuffixM = Math.random().toString(36).substring(2, 6).toUpperCase()
                var creativeM = {
                  ad_name: (body.ad_name || campPayload.campaign_name) + ' ' + adSuffixM,
                  ad_format: 'SINGLE_VIDEO',
                  tiktok_item_id: sd.item_id,
                  identity_id: sd.identity_id,
                  identity_type: 'AUTH_CODE',
                  call_to_action: body.call_to_action || 'SHOP_NOW',
                  landing_page_url: appendUtm(accountDomain),
                }
                if (body.ad_texts && body.ad_texts.length > 0) creativeM.ad_text = body.ad_texts[(c * adsPerCode + a) % body.ad_texts.length]
                var adPayloadM = { request_id: makeRequestId(), advertiser_id: advId, adgroup_id: adgroupId, creatives: [creativeM] }
                L(advId, 'Ad Spark ' + (c+1) + '-' + (a+1) + '...')
                var adResM = await tt('/ad/create/', token, 'POST', adPayloadM, accountProxy)
                if (adResM.code !== 0 && adResM.message && adResM.message.includes('concurrent')) {
                  await rndDelay(8000, 12000)
                  adResM = await tt('/ad/create/', token, 'POST', adPayloadM, accountProxy)
                }
                if (adResM.code !== 0) {
                  L(advId, '❌ Ad: ' + adResM.message)
                  results.errors.push({ account: advId, step: 'ad', error: adResM.message })
                } else {
                  var adIdM = (adResM.data && adResM.data.ad_ids) ? adResM.data.ad_ids[0] : '?'
                  L(advId, '✅ Ad ' + (c+1) + '-' + (a+1) + ' | camp=' + campaignId + ' ag=' + adgroupId + ' ad=' + adIdM)
                  results.ads++
                  results.created.push({ account: advId, campaign_id: campaignId, adgroup_id: adgroupId, ad_id: adIdM, campaign_name: campPayload.campaign_name })
                }
              }
            }
          } else {
            // Library video mode (CUSTOMIZED_USER / TT_USER)
            var videoIds = body.video_ids || []
            if (videoIds.length === 0) { L(advId, '⚠️ Nenhum vídeo selecionado'); results.errors.push({ account: advId, step: 'ad', error: 'No videos' }); continue }
            for (var v = 0; v < videoIds.length; v++) {
              if (v > 0) await rndDelay(3000, 5000)
              var adSuffixV = Math.random().toString(36).substring(2, 6).toUpperCase()
              var creativeV = {
                ad_name: (body.ad_name || campPayload.campaign_name) + ' ' + adSuffixV,
                ad_format: 'SINGLE_VIDEO',
                video_id: videoIds[v],
                identity_id: body.identity_id || '',
                identity_type: body.identity_type || 'CUSTOMIZED_USER',
                call_to_action: body.call_to_action || 'SHOP_NOW',
                landing_page_url: appendUtm(accountDomain),
                display_name: body.display_name || '',
              }
              if (body.ad_texts && body.ad_texts.length > 0) creativeV.ad_text = body.ad_texts[v % body.ad_texts.length]
              var adPayloadV = { request_id: makeRequestId(), advertiser_id: advId, adgroup_id: adgroupId, creatives: [creativeV] }
              L(advId, 'Ad vídeo ' + (v+1) + '/' + videoIds.length + '...')
              var adResV = await tt('/ad/create/', token, 'POST', adPayloadV, accountProxy)
              if (adResV.code !== 0 && adResV.message && adResV.message.includes('concurrent')) {
                await rndDelay(8000, 12000)
                adResV = await tt('/ad/create/', token, 'POST', adPayloadV, accountProxy)
              }
              if (adResV.code !== 0) {
                L(advId, '❌ Ad: ' + adResV.message)
                results.errors.push({ account: advId, step: 'ad', error: adResV.message })
              } else {
                var adIdV = (adResV.data && adResV.data.ad_ids) ? adResV.data.ad_ids[0] : '?'
                L(advId, '✅ Ad (vídeo ' + (v+1) + ') | camp=' + campaignId + ' ag=' + adgroupId + ' ad=' + adIdV)
                results.ads++
                results.created.push({ account: advId, campaign_id: campaignId, adgroup_id: adgroupId, ad_id: adIdV, campaign_name: campPayload.campaign_name })
              }
            }
          }
        }
      }

      return res.json({ code: 0, data: results })
    }

    if (action === 'delete_campaigns' && req.method === 'POST') {
      var body = req.body || {}
      var advId = body.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })

      // Paginate and collect all campaign IDs
      var allIds = []
      for (var page = 1; page <= 10; page++) {
        var cr = await tt('/campaign/get/?advertiser_id=' + advId + '&page=' + page + '&page_size=100', token, 'GET', null, null)
        if (cr.code !== 0) return res.json({ ok: false, error: cr.message })
        var list = (cr.data && cr.data.list) ? cr.data.list : []
        list.forEach(function(c) { allIds.push(c.campaign_id) })
        if (list.length < 100) break
      }

      if (allIds.length === 0) return res.json({ ok: true, deleted: 0 })

      // Delete in batches of 20
      var deleted = 0
      var errors = []
      for (var b = 0; b < allIds.length; b += 20) {
        var batch = allIds.slice(b, b + 20)
        var dr = await tt('/campaign/status/update/', token, 'POST', {
          advertiser_id: advId,
          campaign_ids: batch,
          operation_status: 'DELETE'
        }, null)
        if (dr.code === 0) {
          deleted += batch.length
        } else {
          errors.push(dr.message || 'batch error')
        }
      }

      return res.json({ ok: true, deleted: deleted, total: allIds.length, errors: errors })
    }

    if (action === 'create_account' && req.method === 'POST') {
      var body = req.body || {}
      var bcId = body.bc_id
      var acc = body.account || {}
      if (!bcId) return res.status(400).json({ error: 'bc_id required' })
      if (!acc.name) return res.status(400).json({ error: 'account.name required' })

      var proxy = parseProxy(body.proxy || null)

      var company = acc.company || acc.name
      var website = acc.website || body.default_website || ''
      var currency = body.currency || 'BRL'
      var country = body.country || 'BR'

      var payload = {
        bc_id: bcId,
        advertiser_info: {
          name: acc.name,
          currency: currency,
          timezone: body.timezone || 'America/Sao_Paulo',
          industry: body.industry || 290001,
          country: country,
          company: company,
          promotional_url: website,
        },
        customer_info: {
          company: company,
          website: website,
          industry: body.industry || 290001,
          registered_area: country,
        },
        billing_info: {
          bill_to: company,
          country: country,
          currency: currency,
        }
      }

      var result = await tt('/bc/advertiser/create/', token, 'POST', payload, proxy)
      return res.json(result)
    }

    if (action === 'auth' && req.method === 'POST') {
      var body = req.body || {}
      if (!body.auth_code) return res.status(400).json({ error: 'auth_code required' })
      var r = await nodeFetch(TIKTOK_API + '/oauth2/access_token/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: process.env.TIKTOK_APP_ID, secret: process.env.TIKTOK_APP_SECRET, auth_code: body.auth_code }),
      })
      return res.json(await r.json())
    }

    if (action === 'regions') {
      var advId = req.query.advertiser_id
      return res.json(await tt('/tool/region/?advertiser_id=' + advId + '&placements=["PLACEMENT_TIKTOK"]&objective_type=CONVERSIONS', token))
    }

    res.status(400).json({ error: 'Unknown action', action: action })
  } catch(err) {
    res.status(500).json({ error: err.message, stack: err.stack, type: err.constructor.name })
  }
}
