var API = '/api/tk'

function getToken(): string | null {
  return localStorage.getItem('hawklaunch_token')
}

export function setToken(token: string) {
  localStorage.setItem('hawklaunch_token', token)
}

export function clearToken() {
  localStorage.removeItem('hawklaunch_token')
  localStorage.removeItem('hawklaunch_connected')
}

async function request(params: string, options: RequestInit = {}) {
  var token = getToken()
  var res = await fetch(API + '?' + params, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
      ...options.headers as Record<string, string>,
    },
    ...options,
  })
  if (!res.ok) {
    var detail = ''
    try { var body = await res.json(); detail = body.error || body.message || '' } catch(e) {}
    throw new Error('API ' + res.status + (detail ? ': ' + detail : ''))
  }
  return res.json()
}

export var api = {
  getToken: () => request('a=token'),
  getBcList: () => request('a=bc_list'),
  getBcAdvertisers: (bcId: string) => request('a=bc_advertisers&bc_id=' + bcId),
  getIdentities: (advId: string, type?: string) => request('a=identity_get&advertiser_id=' + advId + (type ? '&identity_type=' + type : '')),
  getPixels: (advId: string) => request('a=pixel&advertiser_id=' + advId),
  getVideos: (advId: string) => request('a=videos&advertiser_id=' + advId),
  getCampaigns: (advId: string) => request('a=campaign_get&advertiser_id=' + advId),

  authorizeSpark: (advertiserId: string, authCode: string, proxy?: string, skipSticky?: boolean) => request('a=spark_authorize', {
    method: 'POST',
    body: JSON.stringify({ advertiser_id: advertiserId, auth_code: authCode, ...(proxy ? { proxy } : {}), ...(skipSticky ? { skip_sticky: true } : {}) }),
  }),

  launchSmart: (payload: any) => request('a=launch_smart', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  deleteCampaigns: (advertiserId: string, proxy?: string) => request('a=delete_campaigns', {
    method: 'POST',
    body: JSON.stringify({ advertiser_id: advertiserId, proxy: proxy || null }),
  }),

  disableCampaigns: (advertiserId: string, proxy?: string) => request('a=disable_campaigns', {
    method: 'POST',
    body: JSON.stringify({ advertiser_id: advertiserId, proxy: proxy || null }),
  }),

  launchManual: (payload: any) => request('a=launch_manual', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  testProxy: (proxy: string) => request('a=test_proxy', {
    method: 'POST',
    body: JSON.stringify({ proxy }),
  }),

  createAccounts: (payload: any) => request('a=create_accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  removeBcAccounts: (bcId: string, advertiserIds: string[]) => request('a=remove_bc_accounts', {
    method: 'POST',
    body: JSON.stringify({ bc_id: bcId, advertiser_ids: advertiserIds }),
  }),

  listRejectedAds: (advId: string, proxy?: string) =>
    request('a=ad_list_review&advertiser_id=' + advId + (proxy ? '&proxy=' + encodeURIComponent(proxy) : '')),

  // appeal: usa /adgroup/appeal/ (manual) ou /smart_plus/ad/appeal/ (smart+)
  appealAd: (advId: string, adId: string, adgroupId?: string, proxy?: string) => request('a=ad_appeal', {
    method: 'POST',
    body: JSON.stringify({ advertiser_id: advId, ad_id: adId, adgroup_id: adgroupId || null, proxy: proxy || null }),
  }),

  uploadCardImage: (advertiserId: string, base64: string, fileName: string) => request('a=upload_card_image', {
    method: 'POST',
    body: JSON.stringify({ advertiser_id: advertiserId, image_base64: base64, file_name: fileName }),
  }),

  testAddAds: (payload: any) => request('a=test_add_ads', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
}
