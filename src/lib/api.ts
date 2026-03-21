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
  const data = await res.json()
  if (data.code !== undefined && data.code !== 0) {
    throw new Error(data.message || 'TikTok API error')
  }
  return data
}

export const api = {
  // Auth - exchange code for token
  exchangeToken: (authCode: string) =>
    request('/auth', { method: 'POST', body: JSON.stringify({ auth_code: authCode }) }),

  // BC
  getBcList: () => request('/bc/list'),
  getAdvertisers: (bcId: string) => request(`/bc/advertisers?bc_id=${bcId}`),

  // Identity
  getIdentities: (advId: string, type?: string) =>
    request(`/identity?advertiser_id=${advId}${type ? `&identity_type=${type}` : ''}`),
  createIdentity: (body: any) =>
    request('/identity', { method: 'POST', body: JSON.stringify(body) }),

  // Pixel
  getPixels: (advId: string) => request(`/pixel?advertiser_id=${advId}`),

  // Videos
  getVideos: (advId: string) => request(`/videos?advertiser_id=${advId}`),

  // Campaign
  getCampaigns: (advId: string) => request(`/campaign?advertiser_id=${advId}`),
  createCampaign: (body: any) =>
    request('/campaign', { method: 'POST', body: JSON.stringify(body) }),

  // Ad Group
  createAdGroup: (body: any) =>
    request('/adgroup', { method: 'POST', body: JSON.stringify(body) }),

  // Ad
  createAd: (body: any) =>
    request('/ad', { method: 'POST', body: JSON.stringify(body) }),

  // Report
  getReport: (body: any) =>
    request('/report', { method: 'POST', body: JSON.stringify(body) }),
}
