const API_BASE = '/api/tiktok'

interface TikTokResponse<T = any> {
  code: number
  message: string
  data: T
  request_id: string
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<TikTokResponse<T>> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  return res.json()
}

export const tiktokApi = {
  // OAuth
  getAuthUrl: () => request<{ url: string }>('/auth/url'),

  // Business Center
  getBcList: () =>
    request<{ list: any[] }>('/bc/list'),

  getAdvertisers: (bcId: string) =>
    request<{ list: any[] }>(`/bc/advertisers?bc_id=${bcId}`),

  // Ad Accounts
  getAdAccountInfo: (advertiserId: string) =>
    request<any>(`/advertiser/info?advertiser_id=${advertiserId}`),

  // Identity
  getIdentities: (advertiserId: string, identityType?: string) =>
    request<{ list: any[] }>(
      `/identity/get?advertiser_id=${advertiserId}${identityType ? `&identity_type=${identityType}` : ''}`
    ),

  createIdentity: (data: {
    advertiser_id: string
    display_name: string
    image_uri?: string
  }) => request<{ identity_id: string }>('/identity/create', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Pixel
  getPixels: (advertiserId: string) =>
    request<{ list: any[] }>(`/pixel/list?advertiser_id=${advertiserId}`),

  // Creative / Video
  getVideos: (advertiserId: string) =>
    request<{ list: any[] }>(`/creative/video/list?advertiser_id=${advertiserId}`),

  uploadVideo: (advertiserId: string, formData: FormData) =>
    fetch(`${API_BASE}/creative/video/upload?advertiser_id=${advertiserId}`, {
      method: 'POST',
      body: formData,
    }).then(r => r.json()),

  // Campaign
  createCampaign: (data: any) =>
    request<{ campaign_id: string }>('/campaign/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCampaigns: (advertiserId: string) =>
    request<{ list: any[] }>(`/campaign/get?advertiser_id=${advertiserId}`),

  // Ad Group
  createAdGroup: (data: any) =>
    request<{ adgroup_id: string }>('/adgroup/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Ad
  createAd: (data: any) =>
    request<{ ad_id: string }>('/ad/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Campaign Status
  updateCampaignStatus: (data: {
    advertiser_id: string
    campaign_ids: string[]
    opt_status: 'ENABLE' | 'DISABLE' | 'DELETE'
  }) => request('/campaign/status/update', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Reporting
  getReport: (data: any) =>
    request<any>('/report/integrated/get', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Catalog (DPA)
  getCatalogs: (bcId: string) =>
    request<{ list: any[] }>(`/catalog/list?bc_id=${bcId}`),

  getProductSets: (advertiserId: string, catalogId: string) =>
    request<{ list: any[] }>(
      `/catalog/product_set/list?advertiser_id=${advertiserId}&catalog_id=${catalogId}`
    ),
}
