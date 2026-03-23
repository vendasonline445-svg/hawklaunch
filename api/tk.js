import { ProxyAgent, fetch as undiFetch } from 'undici'

var TIKTOK_API = 'https://business-api.tiktok.com/open_api/v1.3'

// ─── Anti-detecção ────────────────────────────────────────────────────────────

var USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
]

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

// request_id humano: timestamp com jitter + sufixo alfanumérico
function makeRequestId() {
  // TikTok exige int64 como string — usa timestamp + sufixo numérico aleatório
  var jitter = Math.floor(Math.random() * 999) + 1
  var suffix = Math.floor(Math.random() * 9000) + 1000
  return String(Date.now() - jitter) + String(suffix)
}

// delay aleatório entre min e max ms
function rndDelay(min, max) {
  return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min))
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
  try { return new ProxyAgent(proxyUrl) } catch(e) { return null }
}

// fetch com suporte a proxy via undici dispatcher
async function smartFetch(url, opts, proxyAgent) {
  if (proxyAgent) {
    return undiFetch(url, { ...opts, dispatcher: proxyAgent })
  }
  return fetch(url, opts)
}

async function getToken() {
  try {
    var r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
      headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
    })
    var d = await r.json()
    return d.data ? d.data.access_token : null
  } catch(e) { return null }
}

async function ttOnce(endpoint, token, method, body, proxyRaw) {
  var proxyUrl = parseProxy(proxyRaw || null)
  var agent = proxyUrl ? makeAgent(proxyUrl) : null
  var opts = {
    method: method || 'GET',
    headers: {
      'Access-Token': token,
      'Content-Type': 'application/json',
      'User-Agent': randomUA(),
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Origin': 'https://ads.tiktok.com',
      'Referer': 'https://ads.tiktok.com/',
      'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
    }
  }
  if (body) opts.body = typeof body === 'string' ? body : JSON.stringify(body)
  var r = await smartFetch(TIKTOK_API + endpoint, opts, agent)
  return r.json()
}

async function tt(endpoint, token, method, body, proxyRaw) {
  var lastErr = ''
  for (var attempt = 1; attempt <= 3; attempt++) {
    try {
      var result = await ttOnce(endpoint, token, method, body, proxyRaw)
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
      if (!proxyUrl) return res.json({ ok: false, error: 'Proxy inválida ou não informada', parsed: null, raw: rawProxy })
      var agent = makeAgent(proxyUrl)
      if (!agent) return res.json({ ok: false, error: 'Falha ao criar ProxyAgent: ' + proxyUrl })
      try {
        var start = Date.now()
        var ac = new AbortController()
        var timeout = setTimeout(function() { ac.abort() }, 15000)
        var r = await smartFetch('https://api.ipify.org?format=json', { signal: ac.signal }, agent)
        clearTimeout(timeout)
        var data = await r.json()
        var masked = proxyUrl.replace(/\/\/([^:]+):([^@]+)@/, '//**:**@')
        return res.json({ ok: true, ip: data.ip, latency_ms: Date.now() - start, proxy_used: masked })
      } catch(e) {
        return res.json({ ok: false, error: e.message, proxy_url: proxyUrl.replace(/\/\/([^:]+):([^@]+)@/, '//**:**@') })
      }
    }

    if (action === 'token') {
      var r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
        headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
      })
      return res.json(await r.json())
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
      var ctaCache = {}
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

      // Delay inicial humano antes de começar (simula abertura do painel)
      await rndDelay(2000, 4000)

      for (var i = 0; i < body.accounts.length; i++) {
        var advId = body.accounts[i].advertiser_id
        sparkAuthCache[advId] = {}
        // Usa accountIndex (índice global da conta) para rodízio correto entre requests
        var codesForAccount = body.rotation ? [sparkCodes[accountIndex % sparkCodes.length]] : sparkCodes

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
            }
          } catch(e) {
            L(advId, '❌ ' + e.message)
            results.errors.push({ account: advId, step: 'spark', error: e.message })
          }
        }

        // Usa CTA cached do frontend se disponível — evita recriar a cada request
        var existingCtaId = (body.cta_cache && body.cta_cache[advId]) ? body.cta_cache[advId] : null
        if (existingCtaId) {
          ctaCache[advId] = existingCtaId
          L(advId, '✅ CTA reutilizado: ' + existingCtaId)
        } else {
          await rndDelay(1500, 3000)
          L(advId, 'Creating CTA portfolio...')
          try {
            var cta = await getOrCreateCTA(token, advId, accountProxy)
            if (cta.ok) {
              ctaCache[advId] = cta.call_to_action_id
              L(advId, '✅ CTA criado: ' + cta.call_to_action_id)
              results.cta_created++
              results.cta_cache = results.cta_cache || {}
              results.cta_cache[advId] = cta.call_to_action_id
              await rndDelay(2000, 4000)
            } else {
              L(advId, '⚠️ CTA: ' + cta.error)
              results.errors.push({ account: advId, step: 'cta', error: cta.error })
            }
          } catch(e) {
            L(advId, '❌ CTA error: ' + e.message)
          }
        }
      }

      var campaignsPerAccount = body.campaigns_per_account || 1

      for (var i = 0; i < body.accounts.length; i++) {
        var advId = body.accounts[i].advertiser_id
        var accountSparks = sparkAuthCache[advId] || {}
        var ctaId = ctaCache[advId] || null
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
            await rndDelay(1500, 3000)
            continue
          }
          var campaignId = campRes.data.campaign_id
          L(advId, '✅ Campaign: ' + campaignId)
          results.campaigns++
          await rndDelay(1500, 3000)

          // schedule_start_time: usa o do body se passou, senão +10min
          var scheduleStart = body.schedule_start
            ? body.schedule_start
            : new Date(Date.now() + 10*60000).toISOString().replace('T',' ').substring(0,19)
          var baseCpa = parseFloat(body.target_cpa) || 55
          var humanCpa = humanizeValue(baseCpa, 10)
          var jitteredSchedule = jitterSchedule(scheduleStart, 0, 8)
          var agPayload = {
            request_id: makeRequestId(),
            advertiser_id: advId,
            campaign_id: campaignId,
            adgroup_name: body.adgroup_name || ('AG ' + campPayload.campaign_name),
            optimization_event: body.optimization_event || 'SHOPPING',
            optimization_goal: 'CONVERT',
            billing_event: 'OCPM',
            pixel_id: pixelId,
            bid_type: 'BID_TYPE_CUSTOM',
            conversion_bid_price: humanCpa,
            promotion_type: 'WEBSITE',
            landing_page_url: accountDomain,
            targeting_spec: { location_ids: body.location_ids || ['3469034'] },
            schedule_type: 'SCHEDULE_FROM_NOW',
            schedule_start_time: jitteredSchedule,
          }
          var agRes = await tt('/smart_plus/adgroup/create/', token, 'POST', agPayload, accountProxy)
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
                landing_page_url_list: [{ landing_page_url: accountDomain }],
              }
              // Usa call_to_action_list do frontend se disponível, senão usa CTA portfolio ID
              if (body.call_to_action_list && body.call_to_action_list.length > 0) {
                adPayload.call_to_action_list = body.call_to_action_list.map(function(cta) { return typeof cta === 'string' ? { call_to_action: cta } : cta })
              } else if (ctaId) {
                adPayload.ad_configuration = { call_to_action_id: ctaId }
              }
              if (c > 0 || a > 0) await rndDelay(3000, 5000)
              L(advId, 'Ad ' + (c+1) + '-' + (a+1) + '...')
              var adRes = await tt('/smart_plus/ad/create/', token, 'POST', adPayload, accountProxy)
              // Retry específico para concurrent requests
              if (adRes.code !== 0 && adRes.message && adRes.message.includes('concurrent')) {
                L(advId, '⏳ Concurrent limit, aguardando 8s...')
                await rndDelay(8000, 12000)
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

    if (action === 'auth' && req.method === 'POST') {
      var body = req.body || {}
      if (!body.auth_code) return res.status(400).json({ error: 'auth_code required' })
      var r = await fetch(TIKTOK_API + '/oauth2/access_token/', {
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
