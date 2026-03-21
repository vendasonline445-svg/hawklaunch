import { create } from 'zustand'
import type { CampaignConfig, AdAccount, LaunchLog, CampaignType } from '@/types'

interface AppState {
  // Connection
  accessToken: string | null
  bcId: string | null
  connected: boolean

  // Campaign wizard
  currentStep: number
  campaignType: CampaignType
  selectedAccounts: AdAccount[]
  config: CampaignConfig

  // Launch
  isLaunching: boolean
  launchLogs: LaunchLog[]
  launchProgress: number

  // Actions
  setAccessToken: (token: string) => void
  setBcId: (id: string) => void
  setConnected: (v: boolean) => void
  setStep: (step: number) => void
  setCampaignType: (type: CampaignType) => void
  setSelectedAccounts: (accounts: AdAccount[]) => void
  updateConfig: (partial: Partial<CampaignConfig>) => void
  addLog: (log: LaunchLog) => void
  setLaunching: (v: boolean) => void
  setProgress: (v: number) => void
  reset: () => void
}

const defaultConfig: CampaignConfig = {
  type: 'smart-spark',
  accounts: [],
  identity: {
    type: 'BC_AUTH_TT',
    sparkMethod: 'pull',
    applyToAll: true,
    adsOnlyMode: false,
  },
  creative: {
    source: 'pull',
    videoIds: [],
    destinationUrl: '',
    adTexts: [],
    callToAction: 'SHOP_NOW',
    autoEnhancements: true,
  },
  structure: {
    campaignsPerAccount: 1,
    adGroupsPerCampaign: 1,
    adsPerAdGroup: 1,
    objective: 'CONVERSIONS',
    budgetMode: 'cbo',
    dailyBudget: 50,
    randomizeBudget: false,
    randomizeStructure: false,
    offerName: '',
    startSequence: 1,
  },
  targeting: {
    automatic: true,
    ageRanges: ['AGE_18_24', 'AGE_25_34', 'AGE_35_44', 'AGE_45_54', 'AGE_55_100'],
    country: 'BR',
    language: 'pt',
    os: ['ANDROID', 'IOS'],
    gender: 'GENDER_UNLIMITED',
  },
  proxy: {
    mode: 'off',
    protocol: 'auto',
    list: [],
  },
  schedule: 'now',
}

export const useAppStore = create<AppState>((set) => ({
  accessToken: null,
  bcId: null,
  connected: false,
  currentStep: 0,
  campaignType: 'smart-spark',
  selectedAccounts: [],
  config: defaultConfig,
  isLaunching: false,
  launchLogs: [],
  launchProgress: 0,

  setAccessToken: (token) => set({ accessToken: token, connected: true }),
  setBcId: (id) => set({ bcId: id }),
  setConnected: (v) => set({ connected: v }),
  setStep: (step) => set({ currentStep: step }),
  setCampaignType: (type) => set((s) => ({
    campaignType: type,
    config: { ...s.config, type },
  })),
  setSelectedAccounts: (accounts) => set((s) => ({
    selectedAccounts: accounts,
    config: { ...s.config, accounts },
  })),
  updateConfig: (partial) => set((s) => ({
    config: { ...s.config, ...partial },
  })),
  addLog: (log) => set((s) => ({
    launchLogs: [...s.launchLogs, log],
  })),
  setLaunching: (v) => set({ isLaunching: v }),
  setProgress: (v) => set({ launchProgress: v }),
  reset: () => set({
    currentStep: 0,
    selectedAccounts: [],
    config: defaultConfig,
    isLaunching: false,
    launchLogs: [],
    launchProgress: 0,
  }),
}))
