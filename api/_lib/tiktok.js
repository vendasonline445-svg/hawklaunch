const TIKTOK_API = 'https://business-api.tiktok.com/open_api/v1.3'

async function tiktokFetch(endpoint, accessToken, options = {}) {
  const url = `${TIKTOK_API}${endpoint}`
  const res = await fetch(url, {
    headers: {
      'Access-Token': accessToken,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  return res.json()
}

function getToken(req) {
  const auth = req.headers['authorization']
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return req.headers['x-access-token'] || null
}

module.exports = { tiktokFetch, getToken }
