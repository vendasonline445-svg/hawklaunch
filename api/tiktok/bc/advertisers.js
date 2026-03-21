const { tiktokFetch, getToken } = require('../../_lib/tiktok')
export default async function handler(req, res) {
  const token = getToken(req)
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const bcId = req.query.bc_id
  if (!bcId) return res.status(400).json({ error: 'bc_id required' })
  const data = await tiktokFetch(`/bc/advertiser/get/?bc_id=${bcId}&page=1&page_size=100`, token)
  res.json(data)
}
