export default async function handler(req, res) {
  try {
    const r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
      headers: {
        'x-api-key': process.env.HAWKLAUNCH_API_KEY,
        'Content-Type': 'application/json',
      },
    })
    const data = await r.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch token', details: error.message })
  }
}
