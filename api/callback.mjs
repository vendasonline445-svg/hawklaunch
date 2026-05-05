import https from 'https'

var APP_ID = process.env.TIKTOK_APP_ID || '7617705058569814033'
var APP_SECRET = process.env.TIKTOK_APP_SECRET || ''
var FALLBACK_URL = process.env.HAWKLAUNCH_URL || 'https://hawklaunch.vercel.app'
var TIKTOK_API = 'https://business-api.tiktok.com/open_api/v1.3'

async function fetchJson(url, options) {
  var res = await fetch(url, options)
  return res.json()
}

export default async function handler(req, res) {
  var url = new URL(req.url, 'https://x.com')
  var authCode = url.searchParams.get('auth_code') || url.searchParams.get('code')
  var state = url.searchParams.get('state') || ''

  var redirectBase = FALLBACK_URL
  if (state.startsWith('hl_')) {
    var origin = decodeURIComponent(state.slice(3))
    if (origin.startsWith('https://')) redirectBase = origin
  }

  if (!authCode) {
    res.status(400).send('<html><body><h2>Erro: auth_code não recebido</h2></body></html>')
    return
  }

  try {
    var tokenData = await fetchJson(TIKTOK_API + '/oauth2/access_token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: APP_ID, secret: APP_SECRET, auth_code: authCode }),
    })

    if (tokenData.code !== 0) {
      res.status(400).send('<html><body><h2>Erro TikTok: ' + tokenData.message + '</h2></body></html>')
      return
    }

    var access_token = tokenData.data.access_token
    var advertiser_ids = tokenData.data.advertiser_ids

    var redirectTo = redirectBase + '/?connected=true&token=' + encodeURIComponent(access_token) +
      '&advertisers=' + encodeURIComponent(JSON.stringify(advertiser_ids))

    res.writeHead(302, { Location: redirectTo })
    res.end()
  } catch (err) {
    res.status(500).send('<html><body><h2>Erro: ' + err.message + '</h2></body></html>')
  }
}
