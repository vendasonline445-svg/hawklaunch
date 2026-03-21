export default async function handler(req, res) {
  try {
    var tokenRes = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
      headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
    })
    var tokenData = await tokenRes.json()
    var token = tokenData.data.access_token

    var bcId = '7608040000504234001'
    var url = 'https://business-api.tiktok.com/open_api/v1.3/bc/advertiser/get/?bc_id=' + bcId + '&page=1&page_size=10'
    
    var r = await fetch(url, {
      headers: { 'Access-Token': token, 'Content-Type': 'application/json' }
    })
    
    var text = await r.text()
    
    res.json({
      status: r.status,
      content_type: r.headers.get('content-type'),
      body_preview: text.substring(0, 500),
      body_length: text.length
    })
  } catch(err) {
    res.status(500).json({ error: err.message, stack: err.stack })
  }
}
