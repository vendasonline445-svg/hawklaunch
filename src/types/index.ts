export type CampaignType = 'smart-spark' | 'smart-catalog' | 'manual'
export type IdentityType = 'CUSTOMIZED_USER' | 'TT_USER' | 'BC_AUTH_TT' | 'AUTH_CODE'
export type SparkMethod = 'pull' | 'push' | 'code'
export type BudgetMode = 'cbo' | 'abo'
export type ProxyMode = 'off' | 'per-account' | 'random'

export interface AdAccount {
  advertiser_id: string
  advertiser_name: string
  status: string
  currency: string
  timezone: string
  balance: number
  identity_id?: string
  pixel_id?: string
}

export interface Identity {
  identity_id: string
  identity_type: IdentityType
  display_name: string
  profile_image?: string
}

export interface SparkProfile {
  identity_id: string
  display_name: string
  profile_image?: string
  tt_user_id?: string
}

export interface VideoAsset {
  video_id: string
  file_name?: string
  duration: number
  width: number
  height: number
  preview_url?: string
  material_id?: string
}

export interface CampaignConfig {
  type: CampaignType
  accounts: AdAccount[]
  identity: {
    type: IdentityType
    sparkMethod: SparkMethod
    sparkProfileId?: string
    authCodes?: string[]
    customName?: string
    customImage?: string
    applyToAll: boolean
    adsOnlyMode: boolean
  }
  creative: {
    source: 'pull' | 'push' | 'library' | 'recommended'
    videoIds: string[]
    destinationUrl: string
    adTexts: string[]
    callToAction: string
    autoEnhancements: boolean
  }
  structure: {
    campaignsPerAccount: number
    adGroupsPerCampaign: number
    adsPerAdGroup: number
    objective: string
    budgetMode: BudgetMode
    dailyBudget: number
    targetCpa?: number
    randomizeBudget: boolean
    randomizeStructure: boolean
    budgetMin?: number
    budgetMax?: number
    offerName: string
    startSequence: number
  }
  targeting: {
    automatic: boolean
    ageRanges: string[]
    country: string
    language: string
    os: string[]
    gender: string
  }
  proxy: {
    mode: ProxyMode
    protocol: string
    list: string[]
  }
  schedule: string
}

export interface LaunchLog {
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
  accountId?: string
}

export interface Preset {
  id: string
  name: string
  config: Partial<CampaignConfig>
  createdAt: string
}
