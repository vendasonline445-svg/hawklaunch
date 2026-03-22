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

  launchSmart: (payload: any) => request('a=launch_smart', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
}
