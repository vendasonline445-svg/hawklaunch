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

async function request<T = any>(params: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API}?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers as Record<string, string>,
    },
    ...options,
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export const api = {
  getToken: () => request('a=token'),
  getBcList: () => request('a=bc_list'),
  getBcAdvertisers: (bcId: string) => request('a=bc_advertisers&bc_id=' + bcId),
  getAccountInfo: (advId: string) => request('a=advertiser&advertiser_id=' + advId),
  getIdentities: (advId: string, type?: string) => request('a=identity_get&advertiser_id=' + advId + (type ? '&identity_type=' + type : '')),
  createIdentity: (body: any) => request('a=identity_create', { method: 'POST', body: JSON.stringify(body) }),
  getPixels: (advId: string) => request('a=pixel&advertiser_id=' + advId),
  getVideos: (advId: string) => request('a=videos&advertiser_id=' + advId),
  getCampaigns: (advId: string) => request('a=campaign_get&advertiser_id=' + advId),
  createCampaign: (body: any) => request('a=campaign_create', { method: 'POST', body: JSON.stringify(body) }),
  createAdGroup: (body: any) => request('a=adgroup_create', { method: 'POST', body: JSON.stringify(body) }),
  createAd: (body: any) => request('a=ad_create', { method: 'POST', body: JSON.stringify(body) }),
  getReport: (body: any) => request('a=report', { method: 'POST', body: JSON.stringify(body) }),
}
