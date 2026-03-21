const { tiktokFetch, getToken } = require('../_lib/tiktok')

export default async function handler(req, res) {
  const token = getToken(req)
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { advertiser_id } = req.query
  if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })

  const data = await tiktokFetch(
    `/advertiser/info/?advertiser_ids=["${advertiser_id}"]`,
    token
  )

  // Flatten response
  if (data.data?.list?.length) {
    return res.json({ code: 0, data: data.data.list[0] })
  }

  res.json(data)
}
