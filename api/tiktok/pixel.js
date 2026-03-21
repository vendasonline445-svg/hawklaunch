const { tiktokFetch, getToken } = require('../_lib/tiktok')
export default async function handler(req, res) {
  const token = getToken(req)
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const { advertiser_id } = req.query
  if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
  const data = await tiktokFetch(`/pixel/list/?advertiser_id=${advertiser_id}`, token)
  res.json(data)
}
