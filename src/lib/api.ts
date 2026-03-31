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
  if (!res.ok) throw new Error('API ' + res.status)
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

  authorizeSpark: (advertiserId: string, authCode: string) => request('a=spark_authorize', {
    method: 'POST',
    body: JSON.stringify({ advertiser_id: advertiserId, auth_code: authCode }),
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

  // appeal em nível de ad: POST /appeal/ad/ com reason NO_VIOLATION
  appealAd: (advId: string, adId: string, proxy?: string) => request('a=ad_appeal', {
    method: 'POST',
    body: JSON.stringify({ advertiser_id: advId, ad_id: adId, proxy: proxy || null }),
  }),
}
