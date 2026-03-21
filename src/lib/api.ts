const API_BASE = '/api/tiktok'

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

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers as Record<string, string>,
    },
    ...options,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json()
}

export const api = {
  exchangeToken: (authCode: string) =>
    request('/auth', { method: 'POST', body: JSON.stringify({ auth_code: authCode }) }),

  getToken: () => request('/token'),

  getBcList: () => request('/bc/list'),
  getAdvertisers: (bcId: string) => request(`/bc/advertisers?bc_id=${bcId}`),

  getAccountInfo: (advId: string) => request(`/advertiser?advertiser_id=${advId}`),

  getIdentities: (advId: string, type?: string) =>
    request(`/identity?advertiser_id=${advId}${type ? `&identity_type=${type}` : ''}`),
  createIdentity: (body: any) =>
    request('/identity', { method: 'POST', body: JSON.stringify(body) }),

  getPixels: (advId: string) => request(`/pixel?advertiser_id=${advId}`),
  getVideos: (advId: string) => request(`/videos?advertiser_id=${advId}`),

  getCampaigns: (advId: string) => request(`/campaign?advertiser_id=${advId}`),
  createCampaign: (body: any) =>
    request('/campaign', { method: 'POST', body: JSON.stringify(body) }),
  createAdGroup: (body: any) =>
    request('/adgroup', { method: 'POST', body: JSON.stringify(body) }),
  createAd: (body: any) =>
    request('/ad', { method: 'POST', body: JSON.stringify(body) }),

  getReport: (body: any) =>
    request('/report', { method: 'POST', body: JSON.stringify(body) }),
}
