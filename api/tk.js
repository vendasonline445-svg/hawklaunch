var TIKTOK_API = 'https://business-api.tiktok.com/open_api/v1.3'

async function getToken() {
  try {
    var r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
      headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
    })
    var d = await r.json()
    return d.data ? d.data.access_token : null
  } catch(e) { return null }
}

async function tt(endpoint, token, method, body) {
  var opts = { method: method || 'GET', headers: { 'Access-Token': token, 'Content-Type': 'application/json' } }
  if (body) opts.body = typeof body === 'string' ? body : JSON.stringify(body)
  var r = await fetch(TIKTOK_API + endpoint, opts)
  return r.json()
}

async function authorizeSpark(token, advertiserId, authCode) {
  var authRes = await tt('/tt_video/authorize/', token, 'POST', { advertiser_id: advertiserId, auth_code: authCode })
  var identityId = (authRes.data && authRes.data.identity_id) ? authRes.data.identity_id : null
  if (authRes.code !== 0 || !identityId) return { ok: false, error: authRes.message || 'authorize failed' }
  var infoEp = '/tt_video/info/?advertiser_id=' + advertiserId + '&auth_code=' + encodeURIComponent(authCode)
  var infoRes = await tt(infoEp, token)
  var itemId = (infoRes.data && infoRes.data.item_info) ? infoRes.data.item_info.item_id : null
  if (infoRes.code !== 0 || !itemId) return { ok: false, error: 'info failed: ' + (infoRes.message || ''), identity_id: identityId }
  return { ok: true, identity_id: identityId, item_id: itemId }
}

async function getOrCreateCTA(token, advertiserId) {
  var rec = await tt('/creative/cta/recommend/?advertiser_id=' + advertiserId + '&objective_type=WEB_CONVERSIONS&promotion_type=WEBSITE&identity_type=AUTH_CODE&asset_type=CTA_AUTO_OPTIMIZED&content_type=LANDING_PAGE', token)
  if (rec.code !== 0 || !rec.data || !rec.data.recommend_assets || rec.data.recommend_assets.length < 3) return { ok: false, error: 'CTA recommend failed' }
  var assets = rec.data.recommend_assets
  var content = []
  for (var i = 0; i < Math.min(3, assets.length); i++) {
    content.push({ asset_content: assets[i].asset_content, asset_ids: assets[i].asset_ids })
  }
  var createRes = await tt('/creative/portfolio/create/', token, 'POST', {
    advertiser_id: advertiserId,
    creative_portfolio_type: 'CTA',
    portfolio_content: content
  })
  if (createRes.code !== 0 || !createRes.data) return { ok: false, error: 'CTA create failed: ' + (createRes.message || '') }
  return { ok: true, call_to_action_id: createRes.data.creative_portfolio_id }
}

export default async function handler(req, res) {
  try {
    var action = req.query.a
    var token = await getToken()
    if (!token && action !== 'token') return res.status(401).json({ error: 'No token' })

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
      return res.json(await authorizeSpark(token, body.advertiser_id, body.auth_code))
    }
    if (action === 'spark_info' && req.method === 'POST') {
      var body = req.body || {}
      if (!body.advertiser_id || !body.auth_code) return res.status(400).json({ error: 'need advertiser_id + auth_code' })
      return res.json(await tt('/tt_video/info/?advertiser_id=' + body.advertiser_id + '&auth_code=' + encodeURIComponent(body.auth_code), token))
    }

    // ============ SMART+ LAUNCH ============
    if (action === 'launch_smart' && req.method === 'POST') {
      var body = req.body
      var results = { campaigns: 0, adgroups: 0, ads: 0, spark_authorized: 0, cta_created: 0, errors: [], logs: [] }
      var sparkCodes = body.spark_codes || []
      var sparkAuthCache = {}
      var ctaCache = {}
      var L = function(advId, msg) { results.logs.push({ account: advId, message: msg, time: new Date().toISOString() }) }

      // STEP 0: Authorize sparks + create CTAs per account
      for (var i = 0; i < body.accounts.length; i++) {
        var advId = body.accounts[i].advertiser_id
        sparkAuthCache[advId] = {}

        // Authorize each spark code (with rotation)
        var codesForAccount = []
        if (body.rotation) {
          codesForAccount = [sparkCodes[i % sparkCodes.length]]
        } else {
          codesForAccount = sparkCodes
        }

        for (var s = 0; s < codesForAccount.length; s++) {
          var code = codesForAccount[s]
          L(advId, 'Spark ' + (s+1) + '/' + codesForAccount.length + ': authorize...')
          try {
            var sr = await authorizeSpark(token, advId, code)
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

        // Create CTA portfolio
        L(advId, 'Creating CTA portfolio...')
        try {
          var cta = await getOrCreateCTA(token, advId)
          if (cta.ok) {
            ctaCache[advId] = cta.call_to_action_id
            L(advId, '✅ CTA: ' + cta.call_to_action_id)
            results.cta_created++
          } else {
            L(advId, '⚠️ CTA: ' + cta.error)
            results.errors.push({ account: advId, step: 'cta', error: cta.error })
          }
        } catch(e) {
          L(advId, '❌ CTA error: ' + e.message)
        }
      }

      // STEP 1-3: Campaign → AdGroup → Ads per account
      var campaignsPerAccount = body.campaigns_per_account || 1

      for (var i = 0; i < body.accounts.length; i++) {
        var advId = body.accounts[i].advertiser_id
        var accountSparks = sparkAuthCache[advId] || {}
        var ctaId = ctaCache[advId] || null

        // Get pixel
        var pixelId = body.pixel_id || null
        if (!pixelId) {
          try {
            var pr = await tt('/pixel/list/?advertiser_id=' + advId, token)
            if (pr.data && pr.data.pixels && pr.data.pixels.length > 0) pixelId = pr.data.pixels[0].pixel_id
          } catch(e) {}
          if (!pixelId) { L(advId, '⚠️ No pixel'); results.errors.push({ account: advId, step: 'pixel', error: 'No pixel' }); continue }
        }

        for (var cp = 0; cp < campaignsPerAccount; cp++) {
          // CAMPAIGN (Smart+)
          var campPayload = {
            advertiser_id: advId,
            request_id: '' + Date.now() + Math.floor(Math.random()*9999),
            campaign_name: (body.campaign_name || 'HL') + ' ' + (i+1) + '.' + (cp+1) + '-' + Date.now().toString().slice(-4),
            objective_type: 'WEB_CONVERSIONS',
            sales_destination: 'WEBSITE',
            budget_mode: 'BUDGET_MODE_DAY',
            budget: body.budget || 111,
          }
          L(advId, 'Campaign: ' + campPayload.campaign_name)
          var campRes = await tt('/smart_plus/campaign/create/', token, 'POST', campPayload)
          if (campRes.code !== 0) { L(advId, '❌ Campaign: ' + campRes.message); results.errors.push({ account: advId, step: 'campaign', error: campRes.message }); continue }
          var campaignId = campRes.data.campaign_id
          L(advId, '✅ Campaign: ' + campaignId)
          results.campaigns++

          // ADGROUP (Smart+)
          var scheduleStart = new Date(Date.now() + 10*60000).toISOString().replace('T',' ').substring(0,19)
          var bidValue = parseFloat(body.target_cpa) || 55
          var agPayload = {
            request_id: '' + Date.now() + Math.floor(Math.random()*9999),
            advertiser_id: advId,
            campaign_id: campaignId,
            adgroup_name: body.adgroup_name || ('AG ' + campPayload.campaign_name),
            optimization_event: body.optimization_event || 'SHOPPING',
            optimization_goal: 'CONVERT',
            billing_event: 'OCPM',
            pixel_id: pixelId,
            bid_type: 'BID_TYPE_CUSTOM',
            conversion_bid_price: bidValue,
            promotion_type: 'WEBSITE',
            landing_page_url: body.landing_page_url || '',
            targeting_spec: { location_ids: body.location_ids || ['3469034'] },
            schedule_type: 'SCHEDULE_FROM_NOW',
            schedule_start_time: scheduleStart,
          }
          var agRes = await tt('/smart_plus/adgroup/create/', token, 'POST', agPayload)
          if (agRes.code !== 0) { L(advId, '❌ AdGroup: ' + agRes.message); results.errors.push({ account: advId, step: 'adgroup', error: agRes.message }); continue }
          var adgroupId = agRes.data.adgroup_id
          L(advId, '✅ AdGroup: ' + adgroupId)
          results.adgroups++

          // ADS (Smart+) — build creative_list from authorized sparks
          var codesForAccount = body.rotation ? [sparkCodes[i % sparkCodes.length]] : sparkCodes
          var creativeList = []
          for (var c = 0; c < codesForAccount.length; c++) {
            var sd = accountSparks[codesForAccount[c]]
            if (!sd || !sd.ok) continue
            creativeList.push({
              creative_info: {
                ad_format: 'SINGLE_VIDEO',
                tiktok_item_id: sd.item_id,
                identity_type: 'AUTH_CODE',
                identity_id: sd.identity_id,
              }
            })
          }
          if (creativeList.length === 0) { L(advId, '⚠️ No creatives'); continue }

          var adPayload = {
            request_id: '' + Date.now() + Math.floor(Math.random()*9999),
            advertiser_id: advId,
            adgroup_id: adgroupId,
            ad_name: (body.ad_name || campPayload.campaign_name) + ' Ad',
            creative_list: creativeList,
            ad_text_list: (body.ad_texts || ['Shop now']).map(function(t) { return { ad_text: t } }),
            landing_page_url_list: [{ landing_page_url: body.landing_page_url || '' }],
          }
          if (ctaId) adPayload.ad_configuration = { call_to_action_id: ctaId }

          L(advId, 'Creating Smart+ Ad with ' + creativeList.length + ' creative(s)...')
          var adRes = await tt('/smart_plus/ad/create/', token, 'POST', adPayload)
          if (adRes.code !== 0) {
            L(advId, '❌ Ad: ' + adRes.message)
            results.errors.push({ account: advId, step: 'ad', error: adRes.message })
          } else {
            var adId = adRes.data.smart_plus_ad_id || '?'
            L(advId, '✅ Ad: ' + adId + ' (' + creativeList.length + ' creatives)')
            results.ads++
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
    res.status(500).json({ error: err.message })
  }
}
