const { tiktokFetch, getToken } = require('../../_lib/tiktok')
export default async function handler(req, res) {
  const token = getToken(req)
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const data = await tiktokFetch('/bc/get/', token)
  res.json(data)
}
