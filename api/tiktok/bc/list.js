const { tiktokFetch } = require('../../_lib/tiktok')

export default async function handler(req, res) {
  // Get token from header OR fetch from Lovable
  let token = null
  const auth = req.headers['authorization']
  if (auth?.startsWith('Bearer ')) {
    token = auth.slice(7)
  } else {
    // Fetch token from Lovable Edge Function
    try {
      const r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
        headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
      })
      const d = await r.json()
      token = d.data?.access_token
    } catch(e) {}
  }

  if (!token) return res.status(401).json({ error: 'No token available' })

  const data = await tiktokFetch('/bc/get/?page_size=100', token)
  res.json(data)
}
