const { tiktokFetch, getToken } = require('../_lib/tiktok')
export default async function handler(req, res) {
  const token = getToken(req)
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method === 'GET') {
    const { advertiser_id, identity_type } = req.query
    if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
    let url = `/identity/get/?advertiser_id=${advertiser_id}`
    if (identity_type) url += `&identity_type=${identity_type}`
    const data = await tiktokFetch(url, token)
    return res.json(data)
  }
  if (req.method === 'POST') {
    const data = await tiktokFetch('/identity/create/', token, { method: 'POST', body: JSON.stringify(req.body) })
    return res.json(data)
  }
  res.status(405).json({ error: 'Method not allowed' })
}
