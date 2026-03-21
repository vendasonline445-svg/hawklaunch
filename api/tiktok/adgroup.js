const { tiktokFetch, getToken } = require('../_lib/tiktok')
export default async function handler(req, res) {
  const token = getToken(req)
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const data = await tiktokFetch('/adgroup/create/', token, { method: 'POST', body: JSON.stringify(req.body) })
  res.json(data)
}
