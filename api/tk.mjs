import { HttpsProxyAgent } from 'https-proxy-agent'
import nodeFetch from 'node-fetch'
import { createHash } from 'crypto'
import sharp from 'sharp'

var TIKTOK_API = 'https://business-api.tiktok.com/open_api/v1.3'

// ─── Anti-detecção ────────────────────────────────────────────────────────────
// Filosofia: o Business API é server-to-server. Imitar browser (Origin/Referer/Sec-CH-UA)
// é anti-padrão — cliente legítimo não envia esses headers. O que o TikTok detecta é
// padrão COMPORTAMENTAL: velocidade, repetição, sequência fixa. Investir aí.

// User-Agent fixo e identificável (conforme convenção de SDK). Rotação de UA em S2S
// não engana nada e pode ser sinal extra de anomalia (mesmo token, UA muda a cada call).
var UA = 'HawkLaunch/1.0 (+https://hawklaunch.vercel.app)'

// request_id para idempotência — docs v1.3 (/campaign/create/):
// "supports idempotency to prevent you from sending the same request twice within 10 seconds"
// "The value should be a string representation of a 64-bit integer number"
// Máx. 64-bit signed = 9223372036854775807 (19 dígitos). Usamos ts(13) + 5 dígitos = 18 dígitos.
function makeRequestId() {
  var ts = Date.now() // 13 dígitos
  var suffix = 10000 + Math.floor(Math.random() * 89999) // 5 dígitos fixos
  return String(ts) + String(suffix)
}

// Delay curto com distribuição triangular simétrica. Usar APENAS para micro-pausas
// entre chamadas muito próximas (ex: handshake, retry curto). Para pausas entre
// operações lógicas, usar humanDelay().
function rndDelay(min, max) {
  var val = min + ((Math.random() + Math.random()) / 2) * (max - min)
  return new Promise(r => setTimeout(r, Math.floor(val)))
}

// Delay humano: distribuição log-normal-like com cauda longa.
// Humanos no UI têm tempos medianos rápidos mas com pausas ocasionais longas
// (distração, leitura, pensamento). 90% das vezes fica entre min e (min+max)/2;
// 10% das vezes pode ir até max (ou além se spikeChance=true).
function humanDelay(min, max, spikeChance) {
  var r = Math.random()
  var val
  if (spikeChance !== false && r > 0.92) {
    // 8% de chance de "pausa longa" — vai até 1.5x max
    val = max + Math.random() * (max * 0.5)
  } else {
    // 92% dos casos: enviesado pra baixo, mediana em ~1/3 do range
    var biased = Math.pow(Math.random(), 1.8)
    val = min + biased * (max - min)
  }
  return new Promise(res => setTimeout(res, Math.floor(val)))
}

// Fisher-Yates — retorna cópia embaralhada, não muta o original
function shuffleCopy(arr) {
  if (!Array.isArray(arr)) return arr
  var out = arr.slice()
  for (var i = out.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var tmp = out[i]; out[i] = out[j]; out[j] = tmp
  }
  return out
}

function pickRandom(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

function humanizeValue(base, pct) {
  var delta = base * (pct / 100)
  var raw = base + (Math.random() * delta * 2 - delta)
  return Math.round(raw / 5) * 5
}

// Conversão de BRL para moeda da conta — taxas aproximadas
// O usuário sempre insere budget em BRL; a API TikTok espera na moeda da conta
var BRL_TO_CURRENCY = {
  BRL: 1,
  USD: 0.18,
  CLP: 160,
  MXN: 3.5,
  ARS: 200,
  COP: 750,
  EUR: 0.16,
}

function convertBudget(brlValue, currency) {
  var rate = BRL_TO_CURRENCY[currency]
  if (!rate) return brlValue // moeda desconhecida — envia como está
  var converted = Math.round(brlValue * rate)
  // Arredonda para múltiplo de 5 na moeda destino
  return Math.round(converted / 5) * 5
}

function tzToUTC(dateStr, tz) {
  // Convert a datetime string in a given timezone to UTC
  // e.g. "2026-04-12 06:00:00" in America/Sao_Paulo → "2026-04-12 09:00:00" UTC
  if (!tz) return dateStr
  try {
    var asUTC = new Date(dateStr.replace(' ', 'T') + 'Z')
    var formatted = asUTC.toLocaleString('sv-SE', { timeZone: tz }).replace(',', '')
    var asTZ = new Date(formatted.replace(' ', 'T') + 'Z')
    var offsetMs = asUTC.getTime() - asTZ.getTime()
    var utcTime = new Date(asUTC.getTime() + offsetMs)
    return utcTime.toISOString().replace('T', ' ').substring(0, 19)
  } catch(e) {
    return dateStr
  }
}

function jitterSchedule(scheduleStr, minMinutes, maxMinutes, tz) {
  try {
    var base = scheduleStr || new Date(Date.now() + 10*60000).toISOString().replace('T',' ').substring(0,19)
    // Convert from target timezone to UTC (TikTok API expects UTC+0)
    var utcStr = tz ? tzToUTC(base, tz) : base
    var d = new Date(utcStr.replace(' ', 'T') + 'Z')
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

async function ttOnce(endpoint, token, method, body, proxyRaw) {
  var proxyUrl = parseProxy(proxyRaw || null)
  var agent = proxyUrl ? makeAgent(proxyUrl) : null
  var opts = {
    method: method || 'GET',
    headers: {
      'Access-Token': token,
      'Content-Type': 'application/json',
      'User-Agent': UA,
    }
  }
  if (body) opts.body = typeof body === 'string' ? body : JSON.stringify(body)
  if (agent) opts.agent = agent
  opts.signal = AbortSignal.timeout(20000)
  var r = await nodeFetch(TIKTOK_API + endpoint, opts)
  // Lê como text primeiro: se o proxy retornar body vazio/HTML, r.json() explodiria com
  // "Unexpected end of JSON input" sem pista do motivo. Status HTTP + primeiros bytes ajudam diagnóstico.
  var text = await r.text()
  if (!text || text.trim().length === 0) {
    throw new Error('resposta vazia (HTTP ' + r.status + (proxyUrl ? ' via proxy' : '') + ')')
  }
  try {
    return JSON.parse(text)
  } catch(e) {
    throw new Error('não-JSON (HTTP ' + r.status + '): ' + text.substring(0, 120).replace(/\s+/g, ' '))
  }
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

// Ruído exploratório: um humano no Ads Manager UI normalmente lista campanhas,
// pixels e identidades antes de criar uma nova campanha. Fazer 1-2 GETs "de bisbilhotice"
// quebra a fingerprint comportamental de "sempre cria direto sem olhar nada".
// Chamada com probabilidade (~60%) — não sempre, pra não virar padrão fixo também.
async function exploreNoise(token, advertiserId, proxyRaw, logFn) {
  if (Math.random() > 0.6) return // 40% das contas pulam (varia execução pra execução)
  var endpoints = [
    '/campaign/get/?advertiser_id=' + advertiserId + '&page_size=10',
    '/pixel/list/?advertiser_id=' + advertiserId,
    '/identity/get/?advertiser_id=' + advertiserId,
    '/ad/get/?advertiser_id=' + advertiserId + '&page_size=10',
  ]
  var shuffled = shuffleCopy(endpoints)
  var n = 1 + Math.floor(Math.random() * 2) // 1 ou 2 chamadas
  for (var i = 0; i < n; i++) {
    try {
      await ttOnce(shuffled[i], token, 'GET', null, proxyRaw)
      if (logFn) logFn(advertiserId, '👁️  ' + shuffled[i].split('?')[0])
    } catch(e) { /* ignora silenciosamente — é só ruído */ }
    if (i < n - 1) await humanDelay(1500, 4500)
  }
  await humanDelay(2000, 6000) // pausa "pensando" antes de começar a criar
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
  // tt() já adiciona "(3 tentativas)" quando o erro vem dele — evita duplicar o suffix
  return { ok: false, error: lastError.includes('(3 tentativas)') ? lastError : lastError + ' (3 tentativas)' }
}

var WANTED_CTAS = ['buy here','shop','shop today','buy today','order today','buy now','show now','order here','learn more','shop now']

async function getOrCreateCTA(token, advertiserId, proxyRaw, objectiveType, promotionType) {
  var ctaObj = objectiveType || 'WEB_CONVERSIONS'
  var ctaPromo = promotionType || 'WEBSITE'
  var rec = await tt('/creative/cta/recommend/?advertiser_id=' + advertiserId + '&new_version=true&objective_type=' + ctaObj + '&promotion_type=' + ctaPromo + '&language=en', token, 'GET', null, proxyRaw)
  if (rec.code !== 0 || !rec.data || !rec.data.recommend_assets || rec.data.recommend_assets.length === 0) return { ok: false, error: 'CTA recommend failed' }
  var assets = rec.data.recommend_assets
  var filtered = assets.filter(function(a) { return WANTED_CTAS.indexOf((a.asset_content || '').toLowerCase()) !== -1 })
  if (filtered.length === 0) filtered = assets
  var content = []
  for (var i = 0; i < filtered.length; i++) {
    content.push({ asset_content: filtered[i].asset_content, asset_ids: filtered[i].asset_ids })
  }
  var createRes = await tt('/creative/portfolio/create/', token, 'POST', {
    advertiser_id: advertiserId,
    creative_portfolio_type: 'CTA',
    portfolio_content: content
  }, proxyRaw)
  if (createRes.code !== 0 || !createRes.data) return { ok: false, error: 'CTA create failed: ' + (createRes.message || '') }
  return { ok: true, call_to_action_id: createRes.data.creative_portfolio_id }
}


async function resizeCardImage(imgBuf) {
  // TikTok inverte width/height no upload — enviar 750(w)x421(h) para que leia como 421x750
  var resized = await sharp(imgBuf, { failOnError: false })
    .resize(750, 421, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 6 })
    .toBuffer()
  var meta = await sharp(resized).metadata()
  if (meta.width !== 750 || meta.height !== 421) {
    resized = await sharp(resized).resize(750, 421, { fit: 'fill' }).png().toBuffer()
  }
  return resized
}

async function uploadCardImage(token, advertiserId, imgBuf) {
  var resized = await resizeCardImage(imgBuf)
  var imageMd5 = createHash('md5').update(resized).digest('hex')
  var formData = new FormData()
  formData.append('advertiser_id', advertiserId)
  formData.append('upload_type', 'UPLOAD_BY_FILE')
  formData.append('image_signature', imageMd5)
  formData.append('image_file', new Blob([resized], { type: 'image/png' }), 'card_' + Date.now() + '.png')
  var uploadRes = await nodeFetch(TIKTOK_API + '/file/image/ad/upload/', {
    method: 'POST',
    headers: { 'Access-Token': token },
    body: formData,
  })
  var data = await uploadRes.json()
  if (data.code !== 0 || !data.data || !data.data.image_id) return { ok: false, error: 'Image upload failed: ' + (data.message || JSON.stringify(data)) }
  return { ok: true, image_id: data.data.image_id, image_url: data.data.image_url || '' }
}

async function createDisplayCard(token, advertiserId, proxyRaw, imageUrl, title, cta, _existingImageId) {
  // Sempre re-upload por conta — image_id de outra conta dá "Insufficient permissions"
  var imageId = null
  if (imageUrl) {
    try {
      var dlRes = await nodeFetch(imageUrl)
      if (dlRes.ok) {
        var imgBuf = Buffer.from(await dlRes.arrayBuffer())
        if (imgBuf && imgBuf.length > 100) {
          var uploadRes = await uploadCardImage(token, advertiserId, imgBuf)
          if (uploadRes.ok) imageId = uploadRes.image_id
        }
      }
    } catch(e) {}
  }
  if (!imageId) return { ok: false, error: 'No card image available' }
  var portfolioRes = await tt('/creative/portfolio/create/', token, 'POST', {
    advertiser_id: advertiserId,
    creative_portfolio_type: 'CARD',
    portfolio_content: [{
      card_type: 'IMAGE',
      image_id: imageId,
      title: (title || '').substring(0, 54) || 'Shop Now',
      call_to_action: cta || 'SHOP_NOW'
    }]
  }, proxyRaw)
  if (portfolioRes.code !== 0 || !portfolioRes.data) return { ok: false, error: 'Card failed: ' + (portfolioRes.message || '') + ' (img=' + imageId + ')' }
  return { ok: true, card_id: portfolioRes.data.creative_portfolio_id }
}

function parseProxyList(rawList) {
  if (!Array.isArray(rawList)) return []
  return rawList.map(parseProxy).filter(Boolean)
}

// Mapeamento permanente conta→proxy. Uma mesma conta SEMPRE pega o mesmo slot
// no pool de proxies — combinado com stickifyProxy abaixo, isso garante IP estável
// por conta ao longo do tempo (padrão humano: anunciante sempre do mesmo lugar).
// Não rotacionar por tempo: rotação temporal = anomalia em account↔IP history.
function proxyForAccount(proxyList, accountIndex) {
  if (!proxyList || proxyList.length === 0) return null
  return proxyList[accountIndex % proxyList.length]
}

// Injeta sticky session id no proxy para manter o MESMO IP real residencial
// por advertiser em todas as chamadas de uma operação. Sem isso, proxies
// "rotativas" mudam o IP a cada request — TikTok vê IP hopping (bot).
//
// Cada provider usa uma sintaxe de sticky DIFERENTE (posição + delimitador).
// Detectamos pelo host:
//
//   DataImpulse (docs.dataimpulse.com/proxies/parameters/session-id):
//     Session no USERNAME. "__" separa login de params, "." separa key=value, ";" separa params
//     Formato: username__sessid.NUMERO  OU  username__cr.br;sessid.NUMERO
//     Duração: ~30 min por session id
//
//   IPRoyal (docs.iproyal.com/proxies/residential/proxy/rotation):
//     Session no PASSWORD. "_" separa params. Session id = 8 chars alfanuméricos.
//     Formato: password_country-br_session-XXXXXXXX_lifetime-30m
//     Duração: opcional via _lifetime- (1s a 7d, unidade única)
//
//   Bright Data / genérico:
//     Session no USERNAME com "-session-sXXX"
//
// Se proxy é sem auth ou formato inválido, retorna original (não quebra).
function stickifyProxy(proxyRaw, advertiserId) {
  if (!proxyRaw || !advertiserId) return proxyRaw
  var trimmed = String(proxyRaw).trim()
  if (!trimmed) return proxyRaw

  var bare = trimmed.replace(/^https?:\/\//, '')

  var user, pass, host, port
  if (bare.includes('@')) {
    var atIdx = bare.lastIndexOf('@')
    var authStr = bare.slice(0, atIdx)
    var hostStr = bare.slice(atIdx + 1)
    var authColon = authStr.indexOf(':')
    if (authColon < 0) return proxyRaw
    user = authStr.slice(0, authColon)
    pass = authStr.slice(authColon + 1)
    var hostParts = hostStr.split(':')
    if (hostParts.length !== 2) return proxyRaw
    host = hostParts[0]; port = hostParts[1]
  } else {
    var parts = bare.split(':')
    if (parts.length !== 4) return proxyRaw
    host = parts[0]; port = parts[1]; user = parts[2]; pass = parts[3]
  }

  if (!user || !pass || !host || !port) return proxyRaw

  var sessionNum = String(advertiserId).replace(/\D/g, '').slice(-10) // só dígitos
  if (!sessionNum) return proxyRaw

  var newUser = user
  var newPass = pass
  var hostLower = host.toLowerCase()

  if (hostLower.includes('dataimpulse.com')) {
    // DataImpulse: username__sessid.NUMERO (ou ;sessid.NUMERO se já tem params)
    if (/__[^:]*sessid\.[^;]+/.test(user)) {
      newUser = user.replace(/sessid\.[^;]+/, 'sessid.' + sessionNum)
    } else if (user.includes('__')) {
      newUser = user + ';sessid.' + sessionNum
    } else {
      newUser = user + '__sessid.' + sessionNum
    }
  } else if (hostLower.includes('iproyal.com')) {
    // IPRoyal: session no PASSWORD. 8 chars alfanuméricos (pad 8 zeros à esquerda se adv_id for curto).
    // Remove _session-/_lifetime- anteriores (idempotente) e reaplica.
    var ipSession = sessionNum.slice(-8).padStart(8, '0')
    newPass = pass.replace(/_session-[^_]+/g, '').replace(/_lifetime-[^_]+/g, '')
    newPass = newPass + '_session-' + ipSession + '_lifetime-30m'
  } else {
    // Padrão Bright Data / genérico: -session-sXXX no USERNAME
    var sessionTag = 's' + sessionNum
    if (/-session-[^-]+/.test(user)) {
      newUser = user.replace(/-session-[^-]+/, '-session-' + sessionTag)
    } else {
      newUser = user + '-session-' + sessionTag
    }
  }
  return 'http://' + newUser + ':' + newPass + '@' + host + ':' + port
}

export default async function handler(req, res) {
  try {
    var action = req.query.a
    // Use token from Authorization header (each browser has its own), fallback to Supabase
    var authHeader = req.headers && req.headers['authorization']
    var token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null) || await getToken()
    if (!token && action !== 'token' && action !== 'test_proxy') return res.status(401).json({ error: 'No token' })

    if (action === 'upload_card_image' && req.method === 'POST') {
      var body = req.body
      var advId = body && body.advertiser_id
      if (!advId || !body.image_base64) return res.status(400).json({ error: 'advertiser_id and image_base64 required' })
      var rawBuf = Buffer.from(body.image_base64, 'base64')
      try {
        var uploadRes = await uploadCardImage(token, advId, rawBuf)
        if (!uploadRes.ok) return res.json({ code: -1, error: uploadRes.error, data: null })
        return res.json({ code: 0, data: { image_id: uploadRes.image_id, image_url: uploadRes.image_url || '' } })
      } catch(e) {
        return res.json({ code: -1, error: e.message, data: null })
      }
    }

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
      var proxyRaw = stickifyProxy((body && body.proxy) || null, advId)

      try {
        var campRes = await tt('/campaign/get/?advertiser_id=' + advId + '&page_size=100', token, 'GET', null, proxyRaw)
        if (campRes.code !== 0) return res.json({ code: campRes.code, message: campRes.message, disabled: 0 })
        var camps = (campRes.data && campRes.data.list) ? campRes.data.list : []
        if (camps.length === 0) return res.json({ code: 0, data: { disabled: 0, total: 0 } })

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
      } catch(e) {
        return res.json({ code: -1, message: e.message })
      }
    }

    if (action === 'delete_campaigns' && req.method === 'POST') {
      var body = req.body
      var advId = body && body.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })

      var proxyRaw = stickifyProxy((body && body.proxy) || null, advId)

      try {
        var campRes = await tt('/campaign/get/?advertiser_id=' + advId + '&page_size=100', token, 'GET', null, proxyRaw)
        if (campRes.code !== 0) return res.json({ code: campRes.code, message: campRes.message, deleted: 0 })
        var camps = (campRes.data && campRes.data.list) ? campRes.data.list : []
        if (camps.length === 0) return res.json({ code: 0, data: { deleted: 0, total: 0 } })

        var deleted = 0; var errors = []

        for (var i = 0; i < camps.length; i++) {
          var campId = camps[i].campaign_id
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
      } catch(e) {
        return res.json({ code: -1, message: e.message })
      }
    }

    if (action === 'ad_list_review') {
      var advId = req.query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      var proxyRaw = stickifyProxy(req.query.proxy || null, advId)

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
      var adId = body && body.ad_id
      var adgroupId = body && body.adgroup_id
      var advId = body && body.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      if (!adgroupId && !adId) return res.status(400).json({ error: 'adgroup_id or ad_id required' })
      var proxyRaw = stickifyProxy((body && body.proxy) || null, advId)
      var result
      if (adgroupId) {
        // Manual campaign appeal: POST /adgroup/appeal/
        var appealPayload = { advertiser_id: advId, adgroup_id: adgroupId, appeal_reason: "I don't think there's a violation" }
        if (adId) appealPayload.ad_id = adId
        result = await tt('/adgroup/appeal/', token, 'POST', appealPayload, proxyRaw)
      } else {
        // Smart+ appeal: POST /smart_plus/ad/appeal/
        result = await tt('/smart_plus/ad/appeal/', token, 'POST', {
          advertiser_id: advId,
          smart_plus_ad_id: adId,
          appeal_reason: "I don't think there's a violation",
          appeal_description: "I don't think there's a violation",
        }, proxyRaw)
      }
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
      return res.json(await tt('/file/video/ad/search/?advertiser_id=' + advId + '&page_size=50', token))
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
      // skip_sticky: alguns providers rejeitam a sintaxe genérica "-session-XXX" → 407.
      // Frontend retenta com skip_sticky=true quando a primeira tentativa falha com 407.
      var sparkProxy = body.skip_sticky ? (body.proxy || null) : stickifyProxy(body.proxy || null, body.advertiser_id)
      return res.json(await authorizeSpark(token, body.advertiser_id, body.auth_code, sparkProxy))
    }

    if (action === 'spark_info' && req.method === 'POST') {
      var body = req.body || {}
      if (!body.advertiser_id || !body.auth_code) return res.status(400).json({ error: 'need advertiser_id + auth_code' })
      var sparkInfoProxy = stickifyProxy(body.proxy || null, body.advertiser_id)
      return res.json(await tt('/tt_video/info/?advertiser_id=' + body.advertiser_id + '&auth_code=' + encodeURIComponent(body.auth_code), token, 'GET', null, sparkInfoProxy))
    }

    if (action === 'launch_smart' && req.method === 'POST') {
      var body = req.body
      var testMode = !!body.test_mode
      var preAuthSparks = body.pre_authorized_sparks || {}
      var results = { campaigns: 0, adgroups: 0, ads: 0, spark_authorized: 0, cta_created: 0, errors: [], logs: [] }
      var sparkCodes = body.spark_codes || []
      var sparkAuthCache = {}
      var ctaCache = {}
      var L = function(advId, msg) { results.logs.push({ account: advId, message: msg, time: new Date().toISOString() }) }

      var proxyList = parseProxyList(body.proxy_list || [])
      var accountIndex = body.account_index != null ? body.account_index : 0
      var rawAccountProxy = proxyForAccount(proxyList, accountIndex)

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
        // Sticky: mesma conta sempre do mesmo IP real (session id = advertiser_id).
        // Evita IP hopping que a rotação nativa do provider causaria sem isso.
        var accountProxy = stickifyProxy(rawAccountProxy, advId)
        if (accountProxy) {
          L('system', '🛡️ Proxy (sticky): ' + accountProxy.replace(/\/\/([^:]+):([^@]+)@/, '//**:**@'))
        } else {
          L('system', '⚠️ Sem proxy — IP direto da Vercel')
        }
        sparkAuthCache[advId] = {}
        var codesForAccount = body.rotation ? [sparkCodes[accountIndex % sparkCodes.length]] : sparkCodes

        var noPermission = false
        for (var s = 0; s < codesForAccount.length; s++) {
          var code = codesForAccount[s]
          // sparks já autorizados pelo frontend — pula chamada à API.
          // Move autorização para fora do envelope Vercel 60s e evita 504s que gerariam
          // request_ids novos no retry (= campanhas duplicadas). Frontend autoriza 1x por conta.
          if (preAuthSparks[code]) {
            sparkAuthCache[advId][code] = { ok: true, identity_id: preAuthSparks[code].identity_id, item_id: preAuthSparks[code].item_id }
            L(advId, '✅ (pre-auth) spark ' + (s+1) + '/' + codesForAccount.length)
            results.spark_authorized++
            continue
          }
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

        // CTA portfolio
        var existingCtaId = (body.cta_cache && body.cta_cache[advId]) ? body.cta_cache[advId] : null
        if (existingCtaId) {
          ctaCache[advId] = existingCtaId
          L(advId, '✅ CTA reutilizado: ' + existingCtaId)
        } else {
          L(advId, 'Creating CTA portfolio...')
          try {
            var cta = await getOrCreateCTA(token, advId, accountProxy)
            if (cta.ok) {
              ctaCache[advId] = cta.call_to_action_id
              L(advId, '✅ CTA criado: ' + cta.call_to_action_id)
              results.cta_created++
              results.cta_cache = results.cta_cache || {}
              results.cta_cache[advId] = cta.call_to_action_id
            } else {
              L(advId, '⚠️ CTA: ' + cta.error)
              results.errors.push({ account: advId, step: 'cta', error: cta.error })
              if (cta.error && cta.error.toLowerCase().includes('permission')) {
                L(advId, '⛔ Sem permissão — conta ignorada')
                noPermission = true
              }
            }
          } catch(e) {
            L(advId, '❌ CTA error: ' + e.message)
          }
        }
      }

      var campaignsPerAccount = body.campaigns_per_account || 1

      for (var i = 0; i < body.accounts.length; i++) {
        var advId = body.accounts[i].advertiser_id
        var accountCurrency = body.accounts[i].currency || 'BRL'
        // Sticky por conta (mesma session id do primeiro loop — mesmo IP real)
        var accountProxy = stickifyProxy(rawAccountProxy, advId)
        // Pula conta sem permissão
        if (noPermission) { noPermission = false; continue }
        var accountSparks = sparkAuthCache[advId] || {}
        var ctaId = ctaCache[advId] || null
        var pixelId = body.pixel_id || null

        // Ruído comportamental: "olha o dashboard" antes de começar a criar
        if (!testMode) await exploreNoise(token, advId, accountProxy, L)

        if (!pixelId) {
          try {
            var pr = await tt('/pixel/list/?advertiser_id=' + advId, token, 'GET', null, accountProxy)
            if (pr.data && pr.data.pixels && pr.data.pixels.length > 0) pixelId = pr.data.pixels[0].pixel_id
          } catch(e) {}
          if (!pixelId) { L(advId, '⚠️ No pixel'); results.errors.push({ account: advId, step: 'pixel', error: 'No pixel' }); continue }
        }

        // Display Card (interactive add-on) — reusa card_id cacheado pelo frontend entre calls
        var displayCardId = (body.display_card_cache && body.display_card_cache[advId]) || null
        if (displayCardId) {
          L(advId, '✅ Display Card reutilizado: ' + displayCardId)
        } else if (body.display_card && (body.display_card.image_url || body.display_card.image_id)) {
          L(advId, 'Creating Display Card...')
          try {
            var cardRes = await createDisplayCard(token, advId, accountProxy, body.display_card.image_url, body.display_card.title, body.display_card.cta || 'SHOP_NOW', body.display_card.image_id)
            if (cardRes.ok) {
              displayCardId = cardRes.card_id
              L(advId, '✅ Display Card: ' + displayCardId)
            } else {
              L(advId, '⚠️ Display Card: ' + cardRes.error)
              results.errors.push({ account: advId, step: 'display_card', error: cardRes.error })
            }
          } catch(e) {
            L(advId, '❌ Display Card error: ' + e.message)
          }
        }
        // Sempre retorna display_card_id — frontend cacheia p/ reutilizar nos próximos calls
        if (displayCardId) { results.display_card_ids = results.display_card_ids || {}; results.display_card_ids[advId] = displayCardId }

        for (var cp = 0; cp < campaignsPerAccount; cp++) {
          var seqNum = String((body.start_seq || 1) + cp).padStart(2, '0')
          var baseBudget = body.budget || 111
          var convertedBudget = convertBudget(baseBudget, accountCurrency)
          var humanBudget = humanizeValue(convertedBudget, 10)
          if (accountCurrency !== 'BRL') L(advId, '💱 Budget: R$' + baseBudget + ' → ' + accountCurrency + ' ' + humanBudget)
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
          var campRes, campOk = false
          for (var campAttempt = 0; campAttempt < 3; campAttempt++) {
            try {
              campRes = await tt('/smart_plus/campaign/create/', token, 'POST', campPayload, accountProxy)
              campOk = true; break
            } catch(e) {
              L(advId, '❌ Campaign network error: ' + e.message)
              if (campAttempt < 2) { L(advId, '🔄 Campaign retry ' + (campAttempt+2) + '/3...'); await rndDelay(5000 + campAttempt*5000, 10000 + campAttempt*5000) }
            }
          }
          if (!campOk) {
            results.errors.push({ account: advId, step: 'campaign', error: 'network error after 3 retries' })
            continue
          }
          if (campRes.code !== 0) {
            L(advId, '❌ Campaign: ' + campRes.message)
            results.errors.push({ account: advId, step: 'campaign', error: campRes.message })
            continue
          }
          var campaignId = campRes.data.campaign_id
          L(advId, '✅ Campaign: ' + campaignId)
          results.campaigns++
          // Tempo "humano" entre criar campanha e configurar adgroup (lê targeting, budget, bid)
          if (!testMode) await humanDelay(3500, 9000)

          var tz = body.timezone || 'America/Sao_Paulo'
          var scheduleStart = body.schedule_start
            ? body.schedule_start
            : new Date(Date.now() + 10*60000).toLocaleString('sv-SE', { timeZone: tz }).replace(',', '')
          var jitteredSchedule = jitterSchedule(scheduleStart, 0, 8, tz)
          var baseCpa = parseFloat(body.target_cpa) || 0
          if (baseCpa > 0) baseCpa = convertBudget(baseCpa, accountCurrency)
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
            promotion_website_type: 'UNSET',
            targeting_spec: { location_ids: body.location_ids || ['3469034'] },
            schedule_type: 'SCHEDULE_FROM_NOW',
            schedule_start_time: jitteredSchedule,
            click_attribution_window: 'SEVEN_DAYS',
            view_attribution_window: 'ONE_DAY',
            operation_status: body.start_paused ? 'DISABLE' : 'ENABLE',
          }
          if (baseCpa > 0) {
            agPayload.bid_type = 'BID_TYPE_CUSTOM'
            agPayload.conversion_bid_price = baseCpa
          } else {
            agPayload.bid_type = 'BID_TYPE_NO_BID'
          }
          var agRes, agOk = false
          for (var agAttempt = 0; agAttempt < 3; agAttempt++) {
            try {
              agRes = await tt('/smart_plus/adgroup/create/', token, 'POST', agPayload, accountProxy)
              agOk = true; break
            } catch(e) {
              L(advId, '❌ AdGroup network error: ' + e.message)
              if (agAttempt < 2) { L(advId, '🔄 AdGroup retry ' + (agAttempt+2) + '/3...'); await rndDelay(5000 + agAttempt*5000, 10000 + agAttempt*5000) }
            }
          }
          if (!agOk) {
            results.errors.push({ account: advId, step: 'adgroup', error: 'network error after 3 retries' })
            continue
          }
          if (agRes.code !== 0) {
            L(advId, '❌ AdGroup: ' + agRes.message)
            results.errors.push({ account: advId, step: 'adgroup', error: agRes.message })
            continue
          }
          var adgroupId = agRes.data.adgroup_id
          L(advId, '✅ AdGroup: ' + adgroupId)
          results.adgroups++
          // Tempo humano entre adgroup e primeiro ad (escolhe creative, escreve texto, preview)
          if (!testMode) await humanDelay(5000, 12000)

          var codesForAccount = body.rotation ? [sparkCodes[accountIndex % sparkCodes.length]] : sparkCodes
          var adsPerCode = body.ads_per_code || 2
          // Embaralha textos do ad por conta para reduzir similaridade entre contas
          var adTextsForAccount = shuffleCopy(body.ad_texts || ['Shop now'])
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
                ad_text_list: adTextsForAccount.map(function(t) { return { ad_text: t } }),
                landing_page_url_list: [{ landing_page_url: accountDomain }],
              }
              if (ctaId) {
                adPayload.ad_configuration = { call_to_action_id: ctaId }
              } else {
                adPayload.call_to_action_list = [{ call_to_action: body.call_to_action || 'SHOP_NOW' }]
              }
              if (displayCardId) {
                adPayload.interactive_add_on_list = [{ card_id: displayCardId }]
              }
              // Tempo humano entre ads do mesmo adgroup (troca creative/texto)
              if (c > 0 || a > 0) {
                if (!testMode) await humanDelay(2500, 7000)
              }
              L(advId, 'Ad ' + (c+1) + '-' + (a+1) + '...')
              var adRes, adOk = false
              for (var adAttempt = 0; adAttempt < 3; adAttempt++) {
                try {
                  adRes = await tt('/smart_plus/ad/create/', token, 'POST', adPayload, accountProxy)
                  if (adRes.code !== 0 && adRes.message && (adRes.message.includes('concurrent') || adRes.message.includes('does not exist'))) {
                    if (adAttempt < 2) {
                      L(advId, '⏳ ' + (adRes.message.includes('concurrent') ? 'Concurrent limit' : 'Transient error') + ', retry ' + (adAttempt+2) + '/3...')
                      await rndDelay(3000 + adAttempt*4000, 7000 + adAttempt*4000)
                      // "does not exist" / "concurrent" = resource ainda não foi criado no TikTok
                      // → novo request_id é seguro (não há nada pra deduplicar)
                      adPayload.request_id = makeRequestId()
                      continue
                    }
                  }
                  adOk = true; break
                } catch(e) {
                  // Timeout/rede → MANTER request_id. Se a request original chegou no TikTok,
                  // o retry com mesmo id retorna o ad existente (dentro dos 10s de idempotência
                  // documentados em _campaign_create_.md, mesma regra se aplica a ad/create)
                  L(advId, '❌ Ad network error: ' + e.message)
                  if (adAttempt < 2) { L(advId, '🔄 Ad retry ' + (adAttempt+2) + '/3...'); await rndDelay(3000 + adAttempt*3000, 6000 + adAttempt*3000) }
                }
              }
              if (!adOk) {
                results.errors.push({ account: advId, step: 'ad', error: 'network error after 3 retries' })
                continue
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

    // Adiciona ads a um adgroup já existente (Smart+) — usado em batches pelo Modo Teste CTV
    if (action === 'test_add_ads' && req.method === 'POST') {
      var body = req.body
      var results = { ads: 0, errors: [], logs: [] }
      var L = function(advId, msg) { results.logs.push({ account: advId, message: msg, time: new Date().toISOString() }) }

      var advId = body.advertiser_id
      var adgroupId = body.adgroup_id
      var ctaId = body.cta_id || null
      var displayCardId = body.display_card_id || null
      var sparkCodes = body.spark_codes || []
      var preAuthSparks = body.pre_authorized_sparks || {}
      var adName = body.ad_name || 'TESTE'
      var adTexts = body.ad_texts || ['Shop now']
      var landingPageUrl = body.landing_page_url || ''

      if (!advId || !adgroupId) return res.status(400).json({ error: 'advertiser_id e adgroup_id obrigatórios' })

      var proxyList = parseProxyList(body.proxy_list || [])
      var accountIndex = body.account_index != null ? body.account_index : 0
      var rawAccountProxy = proxyForAccount(proxyList, accountIndex)
      var accountProxy = stickifyProxy(rawAccountProxy, advId)

      if (accountProxy) {
        L('system', '🛡️ Proxy (sticky): ' + accountProxy.replace(/\/\/([^:]+):([^@]+)@/, '//**:**@'))
      }

      for (var c = 0; c < sparkCodes.length; c++) {
        var code = sparkCodes[c]
        var sd = preAuthSparks[code]
        if (!sd) { L(advId, '⚠️ Spark ' + (c+1) + ' not pre-authorized'); results.errors.push({ account: advId, step: 'ad', error: 'not pre-authorized: ' + code }); continue }

        var adSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
        var adPayload = {
          request_id: makeRequestId(),
          advertiser_id: advId,
          adgroup_id: adgroupId,
          ad_name: adName + ' ' + adSuffix,
          creative_list: [{ creative_info: { ad_format: 'SINGLE_VIDEO', tiktok_item_id: sd.item_id, identity_type: 'AUTH_CODE', identity_id: sd.identity_id } }],
          ad_text_list: adTexts.map(function(t) { return { ad_text: t } }),
          landing_page_url_list: [{ landing_page_url: landingPageUrl }],
        }
        if (ctaId) {
          adPayload.ad_configuration = { call_to_action_id: ctaId }
        } else {
          adPayload.call_to_action_list = [{ call_to_action: 'SHOP_NOW' }]
        }
        if (displayCardId) {
          adPayload.interactive_add_on_list = [{ card_id: displayCardId }]
        }

        L(advId, 'Ad ' + (c+1) + '/' + sparkCodes.length + '...')
        var adRes, adOk = false
        for (var adAttempt = 0; adAttempt < 3; adAttempt++) {
          try {
            adRes = await tt('/smart_plus/ad/create/', token, 'POST', adPayload, accountProxy)
            if (adRes.code !== 0 && adRes.message && (adRes.message.includes('concurrent') || adRes.message.includes('does not exist'))) {
              if (adAttempt < 2) {
                L(advId, '⏳ ' + (adRes.message.includes('concurrent') ? 'Concurrent limit' : 'Transient error') + ', retry ' + (adAttempt+2) + '/3...')
                await rndDelay(3000 + adAttempt*4000, 7000 + adAttempt*4000)
                adPayload.request_id = makeRequestId()
                continue
              }
            }
            adOk = true; break
          } catch(e) {
            L(advId, '❌ Ad network error: ' + e.message)
            if (adAttempt < 2) { L(advId, '🔄 Ad retry ' + (adAttempt+2) + '/3...'); await rndDelay(3000 + adAttempt*3000, 6000 + adAttempt*3000) }
          }
        }
        if (!adOk) { results.errors.push({ account: advId, step: 'ad', error: 'network error after 3 retries' }); continue }
        if (adRes.code !== 0) {
          L(advId, '❌ Ad: ' + adRes.message)
          results.errors.push({ account: advId, step: 'ad', error: adRes.message })
        } else {
          var adId = adRes.data.smart_plus_ad_id || '?'
          L(advId, '✅ Ad ' + (c+1) + ' | ag=' + adgroupId + ' ad=' + adId)
          results.ads++
        }
      }

      return res.json({ code: 0, data: results })
    }

    if (action === 'launch_manual' && req.method === 'POST') {
      var body = req.body
      var testModeM = !!body.test_mode
      var preAuthSparksM = body.pre_authorized_sparks || {}
      var results = { campaigns: 0, adgroups: 0, ads: 0, errors: [], logs: [], created: [] }
      var L = function(advId, msg) { results.logs.push({ account: advId, message: msg, time: new Date().toISOString() }) }

      var proxyList = parseProxyList(body.proxy_list || [])
      var accountIndex = body.account_index != null ? body.account_index : 0
      var rawAccountProxy = proxyForAccount(proxyList, accountIndex)

      var domainList = Array.isArray(body.domain_list) ? body.domain_list.filter(Boolean) : []
      var accountDomain = domainList.length > 0
        ? domainList[accountIndex % domainList.length]
        : (body.landing_page_url || '')

      if (domainList.length > 0) L('system', '🌐 Domínio: ' + accountDomain)

      await rndDelay(2000, 4000)

      for (var i = 0; i < body.accounts.length; i++) {
        var advId = body.accounts[i].advertiser_id
        var accountCurrency = body.accounts[i].currency || 'BRL'
        // Sticky: mesmo IP real pra todas as chamadas desta conta
        var accountProxy = stickifyProxy(rawAccountProxy, advId)
        if (accountProxy) {
          L('system', '🛡️ Proxy (sticky): ' + accountProxy.replace(/\/\/([^:]+):([^@]+)@/, '//**:**@'))
        } else {
          L('system', '⚠️ Sem proxy — IP direto da Vercel')
        }
        var sparkAuthCache = {}

        // Ruído comportamental antes de começar — apenas na criação de campanha nova (não em calls de adgroup extra)
        if (!testModeM && !body.existing_campaign_id) await exploreNoise(token, advId, accountProxy, L)

        // Spark authorization (AUTH_CODE identity only)
        var noPermissionM = false
        if (body.identity_type === 'AUTH_CODE' && body.spark_codes && body.spark_codes.length > 0) {
          var codesForAccount = body.rotation ? [body.spark_codes[accountIndex % body.spark_codes.length]] : body.spark_codes
          for (var s = 0; s < codesForAccount.length; s++) {
            var code = codesForAccount[s]
            // sparks já autorizados pelo frontend — pula chamada à API (evita 504 + duplicatas)
            if (preAuthSparksM[code]) {
              sparkAuthCache[code] = { ok: true, identity_id: preAuthSparksM[code].identity_id, item_id: preAuthSparksM[code].item_id }
              L(advId, '✅ (pre-auth) spark ' + (s+1) + '/' + codesForAccount.length)
              continue
            }
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

        // Pixel (needed for CONVERSIONS / WEB_CONVERSIONS objective)
        var pixelId = body.pixel_id || null
        var objType = body.objective_type || 'WEB_CONVERSIONS'
        if (!pixelId && (objType === 'CONVERSIONS' || objType === 'WEB_CONVERSIONS')) {
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

        // Display Card (interactive add-on) — reusa card_id cacheado pelo frontend entre calls
        var displayCardIdM = (body.display_card_cache && body.display_card_cache[advId]) || null
        if (displayCardIdM) {
          L(advId, '✅ Display Card reutilizado: ' + displayCardIdM)
        } else if (body.display_card && (body.display_card.image_url || body.display_card.image_id)) {
          L(advId, 'Creating Display Card...')
          try {
            var cardResM = await createDisplayCard(token, advId, accountProxy, body.display_card.image_url, body.display_card.title, body.display_card.cta || body.call_to_action || 'SHOP_NOW', body.display_card.image_id)
            if (cardResM.ok) {
              displayCardIdM = cardResM.card_id
              L(advId, '✅ Display Card: ' + displayCardIdM)
            } else {
              L(advId, '⚠️ Display Card: ' + cardResM.error)
              results.errors.push({ account: advId, step: 'display_card', error: cardResM.error })
            }
          } catch(e) {
            L(advId, '❌ Display Card error: ' + e.message)
          }
        }
        if (displayCardIdM) { results.display_card_ids = results.display_card_ids || {}; results.display_card_ids[advId] = displayCardIdM }

        var campaignsPerAccount = body.campaigns_per_account || 1
        var existingCampaignId = body.existing_campaign_id || null

        for (var cp = 0; cp < campaignsPerAccount; cp++) {
          var isCBO = body.budget_mode !== 'abo'
          var convertedBudget = convertBudget(body.budget || 50, accountCurrency)
          var humanBudget = humanizeValue(convertedBudget, 10)
          var effectiveObjective = body.objective_type || 'WEB_CONVERSIONS'
          if (body.identity_type === 'AUTH_CODE' && effectiveObjective === 'CONVERSIONS') effectiveObjective = 'WEB_CONVERSIONS'

          var campaignId, campPayload
          if (existingCampaignId) {
            campaignId = existingCampaignId
            campPayload = { campaign_name: body.campaign_name || 'HL' }
            L(advId, '🔗 Conjunto em campanha existente: ' + campaignId)
          } else {
          var seqNum = String((body.start_seq || 1) + cp).padStart(2, '0')
          if (cp === 0 && accountCurrency !== 'BRL') L(advId, '💱 Budget: R$' + (body.budget || 50) + ' → ' + accountCurrency + ' ' + humanBudget)

          // Campaign — Smart Creative (ACO) requires WEB_CONVERSIONS, not CONVERSIONS
          campPayload = {
            advertiser_id: advId,
            request_id: makeRequestId(),
            campaign_name: (body.campaign_name || 'HL') + ' ' + seqNum,
            objective_type: effectiveObjective,
            budget_mode: isCBO ? 'BUDGET_MODE_DAY' : 'BUDGET_MODE_INFINITE',
            budget_optimize_on: isCBO,
            operation_status: body.start_paused ? 'DISABLE' : 'ENABLE',
          }
          if (isCBO) campPayload.budget = humanBudget

          L(advId, 'Campaign: ' + campPayload.campaign_name)
          var campRes
          try {
            campRes = await tt('/campaign/create/', token, 'POST', campPayload, accountProxy)
          } catch(e) {
            L(advId, '❌ Campaign network error: ' + e.message)
            results.errors.push({ account: advId, step: 'campaign', error: e.message })
            await rndDelay(1500, 3000)
            continue
          }
          if (campRes.code !== 0) {
            L(advId, '❌ Campaign: ' + campRes.message)
            results.errors.push({ account: advId, step: 'campaign', error: campRes.message })
            await rndDelay(1500, 3000)
            continue
          }
          campaignId = campRes.data.campaign_id
          L(advId, '✅ Campaign: ' + campaignId)
          results.campaigns++
          if (!testModeM) await humanDelay(3500, 9000)
          } // end if/else existing_campaign_id

          for (var ag = 0; ag < 1; ag++) { // ag loop mantido por compatibilidade; iterações controladas pelo frontend

          // Ad Group
          var tz = body.timezone || 'America/Sao_Paulo'
          var scheduleStart = body.schedule_start
            ? body.schedule_start
            : new Date(Date.now() + 10*60000).toLocaleString('sv-SE', { timeZone: tz }).replace(',', '')
          var jitteredSchedule = jitterSchedule(scheduleStart, 0, 8, tz)

          var agPayload = {
            request_id: makeRequestId(),
            advertiser_id: advId,
            campaign_id: campaignId,
            adgroup_name: body.adgroup_name || ('AG ' + campPayload.campaign_name),
            placement_type: 'PLACEMENT_TYPE_NORMAL',
            placements: ['PLACEMENT_TIKTOK'],
            billing_event: body.billing_event || 'OCPM',
            optimization_goal: body.optimization_goal || 'CONVERT',
            schedule_type: 'SCHEDULE_FROM_NOW',
            schedule_start_time: jitteredSchedule,
            location_ids: body.location_ids || ['3469034'],
            pacing: 'PACING_MODE_SMOOTH',
            operation_status: body.start_paused ? 'DISABLE' : 'ENABLE',
          }
          // promotion_type not needed for REACH, VIDEO_VIEWS, ENGAGEMENT
          if (effectiveObjective !== 'REACH' && effectiveObjective !== 'VIDEO_VIEWS' && effectiveObjective !== 'ENGAGEMENT') {
            agPayload.promotion_type = 'WEBSITE'
            agPayload.promotion_website_type = 'UNSET'
            agPayload.landing_page_url = accountDomain
          }
          if (body.age_groups && body.age_groups.length > 0) agPayload.age_groups = body.age_groups
          if (body.gender && body.gender !== 'GENDER_UNLIMITED') agPayload.gender = body.gender
          if (body.os && body.os.length > 0) agPayload.operating_systems = body.os

          if (!isCBO) {
            // ABO: budget at adgroup level
            agPayload.budget_mode = 'BUDGET_MODE_DAY'
            agPayload.budget = humanBudget
          }
          // CBO: budget_mode at adgroup level is ignored per v1.3 docs

          if (pixelId && (effectiveObjective === 'CONVERSIONS' || effectiveObjective === 'WEB_CONVERSIONS')) {
            agPayload.pixel_id = pixelId
            agPayload.optimization_event = body.optimization_event || 'SHOPPING'
            agPayload.click_attribution_window = 'SEVEN_DAYS'
            agPayload.view_attribution_window = 'ONE_DAY'
          }

          // VIDEO_VIEWS requires bid_display_mode CPV
          if (effectiveObjective === 'VIDEO_VIEWS' && agPayload.billing_event === 'CPV') {
            agPayload.bid_display_mode = 'CPV'
          }

          if (!isCBO && body.bid_price && parseFloat(body.bid_price) > 0) {
            agPayload.bid_type = 'BID_TYPE_CUSTOM'
            var convertedBid = convertBudget(parseFloat(body.bid_price), accountCurrency)
            // CPC billing uses bid_price; OCPM/CPM/CPV uses conversion_bid_price
            if (agPayload.billing_event === 'CPC') {
              agPayload.bid_price = convertedBid
            } else {
              agPayload.conversion_bid_price = convertedBid
            }
          } else {
            agPayload.bid_type = 'BID_TYPE_NO_BID'
          }

          // Smart Creative (ACO) — docs v1.3 recomendam CUSTOM + /ad/aco/create/
          if (body.identity_type === 'AUTH_CODE') {
            agPayload.creative_material_mode = 'CUSTOM'
          }

          var agRes
          try {
            agRes = await tt('/adgroup/create/', token, 'POST', agPayload, accountProxy)
          } catch(e) {
            L(advId, '❌ AdGroup network error: ' + e.message)
            results.errors.push({ account: advId, step: 'adgroup', error: e.message })
            await rndDelay(1500, 3000)
            continue
          }
          if (agRes.code !== 0) {
            L(advId, '❌ AdGroup: ' + agRes.message)
            results.errors.push({ account: advId, step: 'adgroup', error: agRes.message })
            await rndDelay(1500, 3000)
            continue
          }
          var adgroupId = agRes.data.adgroup_id
          L(advId, '✅ AdGroup: ' + adgroupId)
          results.adgroups++
          if (!testModeM) await humanDelay(5000, 12000)

          // Ads — Spark (AUTH_CODE) mode — Smart Creative (ACO)
          if (body.identity_type === 'AUTH_CODE') {
            var sparkCodes2 = body.spark_codes || []
            var codesForAds = body.rotation ? [sparkCodes2[accountIndex % sparkCodes2.length]] : sparkCodes2

            // Build media_info_list from all spark codes
            var mediaInfoList = []
            for (var c = 0; c < codesForAds.length; c++) {
              var sd = sparkAuthCache[codesForAds[c]]
              if (!sd || !sd.ok) { L(advId, '⚠️ Spark ' + (c+1) + ' não autorizado'); continue }
              mediaInfoList.push({
                media_info: {
                  tiktok_item_id: sd.item_id,
                  identity_id: sd.identity_id,
                  identity_type: 'AUTH_CODE',
                },
                material_operation_status: 'ENABLE'
              })
            }
            if (mediaInfoList.length === 0) { L(advId, '⚠️ Nenhum Spark autorizado'); continue }

            // Build title_list (max 5)
            var titleList = (body.ad_texts && body.ad_texts.length > 0)
              ? body.ad_texts.slice(0, 5).map(function(t) { return { title: t, material_operation_status: 'ENABLE' } })
              : [{ title: 'Shop now', material_operation_status: 'ENABLE' }]

            // CTA Portfolio (same approach as Smart+ — raw enums not supported)
            var needsPromotion = effectiveObjective !== 'REACH' && effectiveObjective !== 'VIDEO_VIEWS' && effectiveObjective !== 'ENGAGEMENT'
            var ctaResult
            try {
              ctaResult = await getOrCreateCTA(token, advId, accountProxy, effectiveObjective, needsPromotion ? 'WEBSITE' : undefined)
            } catch(e) {
              ctaResult = { ok: false, error: e.message }
            }
            if (!ctaResult.ok) {
              L(advId, '⚠️ CTA Portfolio: ' + ctaResult.error)
              results.errors.push({ account: advId, step: 'cta', error: ctaResult.error })
            }

            // ACO tem limite de 30 vídeos por ad — divide em chunks se exceder
            var ACO_MAX = 30
            var acoChunks = []
            for (var chkStart = 0; chkStart < mediaInfoList.length; chkStart += ACO_MAX) {
              acoChunks.push(mediaInfoList.slice(chkStart, chkStart + ACO_MAX))
            }
            if (acoChunks.length > 1) L(advId, '⚠️ ' + mediaInfoList.length + ' vídeos > limite ACO de 30 → dividindo em ' + acoChunks.length + ' ads no mesmo adgroup')

            for (var cki = 0; cki < acoChunks.length; cki++) {
              var chunkMedia = acoChunks[cki]
              var chunkSuffix = acoChunks.length > 1 ? ' ' + (cki+1) + '/' + acoChunks.length : ''
              var acoPayload = {
                advertiser_id: advId,
                adgroup_id: adgroupId,
                media_info_list: chunkMedia,
                title_list: titleList,
                landing_page_urls: [{ landing_page_url: accountDomain }],
                common_material: {
                  ad_name: (body.ad_name || campPayload.campaign_name) + chunkSuffix,
                },
              }
              if (ctaResult.ok) {
                acoPayload.common_material.call_to_action_id = ctaResult.call_to_action_id
              } else {
                acoPayload.call_to_action_list = [{ call_to_action: body.call_to_action || 'SHOP_NOW' }]
              }
              if (displayCardIdM) {
                acoPayload.card_list = [{ card_id: displayCardIdM }]
              }

              L(advId, 'Smart Creative' + chunkSuffix + ': ' + chunkMedia.length + ' vídeo(s), ' + titleList.length + ' texto(s)...')
              if (!testModeM) await humanDelay(2500, 6000)
              else if (cki > 0) await rndDelay(1500, 3000)
              var adResM
              try {
                adResM = await tt('/ad/aco/create/', token, 'POST', acoPayload, accountProxy)
                if (adResM.code !== 0 && adResM.message && adResM.message.includes('concurrent')) {
                  await humanDelay(10000, 18000)
                  adResM = await tt('/ad/aco/create/', token, 'POST', acoPayload, accountProxy)
                }
              } catch(e) {
                L(advId, '❌ ACO Ad' + chunkSuffix + ' network error: ' + e.message)
                results.errors.push({ account: advId, step: 'ad', error: e.message })
                continue
              }
              if (adResM.code !== 0) {
                L(advId, '❌ ACO Ad' + chunkSuffix + ': ' + adResM.message)
                results.errors.push({ account: advId, step: 'ad', error: adResM.message })
              } else {
                L(advId, '✅ Smart Creative' + chunkSuffix + ' criado | camp=' + campaignId + ' ag=' + adgroupId)
                results.ads++
                results.created.push({ account: advId, campaign_id: campaignId, adgroup_id: adgroupId, campaign_name: campPayload.campaign_name })
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
                landing_page_url: accountDomain,
                display_name: body.display_name || '',
                deeplink_type: 'NORMAL',
              }
              if (body.ad_texts && body.ad_texts.length > 0) creativeV.ad_text = body.ad_texts[v % body.ad_texts.length]
              if (displayCardIdM) creativeV.card_id = displayCardIdM
              var adPayloadV = { advertiser_id: advId, adgroup_id: adgroupId, creatives: [creativeV], request_id: makeRequestId() }
              L(advId, 'Ad vídeo ' + (v+1) + '/' + videoIds.length + '...')
              var adResV, adOkV = false
              for (var adAttemptV = 0; adAttemptV < 3; adAttemptV++) {
                try {
                  adResV = await tt('/ad/create/', token, 'POST', adPayloadV, accountProxy)
                  if (adResV.code !== 0 && adResV.message && (adResV.message.includes('concurrent') || adResV.message.includes('does not exist'))) {
                    if (adAttemptV < 2) {
                      L(advId, '⏳ ' + (adResV.message.includes('concurrent') ? 'Concurrent limit' : 'Transient error') + ', retry ' + (adAttemptV+2) + '/3...')
                      await rndDelay(3000 + adAttemptV*4000, 7000 + adAttemptV*4000)
                      // Resource não propagou → novo request_id seguro
                      adPayloadV.request_id = makeRequestId()
                      continue
                    }
                  }
                  adOkV = true; break
                } catch(e) {
                  // Timeout → mantém request_id para idempotência
                  L(advId, '❌ Ad network error: ' + e.message)
                  if (adAttemptV < 2) { L(advId, '🔄 Ad retry ' + (adAttemptV+2) + '/3...'); await rndDelay(3000 + adAttemptV*3000, 6000 + adAttemptV*3000) }
                }
              }
              if (!adOkV) {
                results.errors.push({ account: advId, step: 'ad', error: 'network error after 3 retries' })
                continue
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
          } // ag loop
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
      return res.json(await tt('/tool/region/?advertiser_id=' + advId + '&placements=["PLACEMENT_TIKTOK"]&objective_type=WEB_CONVERSIONS', token))
    }

    res.status(400).json({ error: 'Unknown action', action: action })
  } catch(err) {
    res.status(500).json({ error: err.message, stack: err.stack, type: err.constructor.name })
  }
}
