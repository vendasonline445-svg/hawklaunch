export default async function handler(req, res) {
  try {
    var tokenRes = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
      headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
    })
    var tokenData = await tokenRes.json()
    var token = tokenData.data.access_token
    var bcId = '7608040000504234001'

    var urls = [
      'https://business-api.tiktok.com/open_api/v1.3/bc/advertiser/get/?bc_id=' + bcId + '&page=1&page_size=10',
      'https://business-api.tiktok.com/open_api/v1.3/bc/advertiser/get?bc_id=' + bcId + '&page=1&page_size=10',
      'https://business-api.tiktok.com/open_api/v1.3/bc/asset/get/?bc_id=' + bcId + '&asset_type=ADVERTISER&page=1&page_size=10',
    ]

    var results = []
    for (var i = 0; i < urls.length; i++) {
      var r = await fetch(urls[i], {
        headers: { 'Access-Token': token, 'Content-Type': 'application/json' }
      })
      var text = await r.text()
      results.push({
        url: urls[i].replace(token, 'TOKEN').replace(bcId, 'BC_ID'),
        status: r.status,
        body: text.substring(0, 300)
      })
    }

    res.json(results)
  } catch(err) {
    res.status(500).json({ error: err.message })
  }
}
