export default async function handler(req, res) {
  // Get token
  let token = null
  try {
    const r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
      headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
    })
    const d = await r.json()
    token = d.data?.access_token
  } catch(e) {}

  const APP_ID = process.env.TIKTOK_APP_ID
  const SECRET = process.env.TIKTOK_APP_SECRET

  // Test 1: oauth2/advertiser/get (query params auth)
  const url1 = `https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/?app_id=${APP_ID}&secret=${SECRET}&access_token=${token}`
  const r1 = await fetch(url1)
  const d1 = await r1.json()

  // Test 2: advertiser/info with the known ID (header auth)
  const url2 = `https://business-api.tiktok.com/open_api/v1.3/advertiser/info/?advertiser_ids=["7608010387140771841"]`
  const r2 = await fetch(url2, { headers: { 'Access-Token': token } })
  const d2 = await r2.json()

  // Test 3: bc/get (header auth)
  const url3 = `https://business-api.tiktok.com/open_api/v1.3/bc/get/?page_size=10`
  const r3 = await fetch(url3, { headers: { 'Access-Token': token } })
  const d3 = await r3.json()

  res.json({
    token_preview: token ? token.substring(0, 10) + '...' : null,
    app_id: APP_ID,
    test1_oauth2_advertiser_get: d1,
    test2_advertiser_info: d2,
    test3_bc_get: d3,
  })
}
