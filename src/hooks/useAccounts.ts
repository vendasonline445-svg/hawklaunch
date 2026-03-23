import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
const CACHE_KEY = 'hawklaunch_accounts_cache'
const CAMP_CACHE_KEY = 'hawklaunch_campaign_status_cache'
const SELECTED_KEY = 'hawklaunch_selected_accounts'

export function useAccounts(bcId: string | null) {
  const [accounts, setAccounts] = useState<any[]>(() => {
    try { const c = localStorage.getItem(CACHE_KEY); return c ? JSON.parse(c) : [] } catch { return [] }
  })
  const [selected, setSelected] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem(SELECTED_KEY); return s ? new Set(JSON.parse(s)) : new Set() } catch { return new Set() }
  })
  const [campaignStatus, setCampaignStatus] = useState<Record<string, boolean>>(() => {
    try { const s = localStorage.getItem(CAMP_CACHE_KEY); return s ? JSON.parse(s) : {} } catch { return {} }
  })
  const [loading, setLoading] = useState(false)
  const [checkingCampaigns, setCheckingCampaigns] = useState(false)
  const [campaignCheckProgress, setCampaignCheckProgress] = useState(0)

  useEffect(() => {
    localStorage.setItem(SELECTED_KEY, JSON.stringify([...selected]))
  }, [selected])

  async function checkCampaignsInBackground(list: any[]) {
    setCheckingCampaigns(true)
    setCampaignCheckProgress(0)
    const status: Record<string, boolean> = {}
    const BATCH = 5
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

    for (let i = 0; i < list.length; i += BATCH) {
      const batch = list.slice(i, i + BATCH)
      await Promise.all(batch.map(async (acc: any) => {
        try {
          const r = await api.getCampaigns(acc.advertiser_id)
          const camps = r.data?.list || []
          status[acc.advertiser_id] = camps.length > 0
        } catch {
          status[acc.advertiser_id] = false
        }
      }))
      setCampaignCheckProgress(Math.round(((i + BATCH) / list.length) * 100))
      setCampaignStatus({ ...status })
      if (i + BATCH < list.length) await delay(800)
    }

    localStorage.setItem(CAMP_CACHE_KEY, JSON.stringify(status))
    setCampaignStatus(status)
    setCheckingCampaigns(false)
    setCampaignCheckProgress(100)
  }

  function loadAccounts() {
    if (!bcId) return
    setLoading(true)
    api.getBcAdvertisers(bcId)
      .then((res: any) => {
        const list = res.data?.list || []
        setAccounts(list)
        localStorage.setItem(CACHE_KEY, JSON.stringify(list))
        checkCampaignsInBackground(list)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  function toggle(id: string) {
    const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n)
  }
  function selectAll(ids: string[]) { setSelected(new Set(ids)) }
  function selectNone() { setSelected(new Set()) }

  return {
    accounts, selected, loading, loadAccounts, toggle, selectAll, selectNone, setSelected,
    campaignStatus, checkingCampaigns, campaignCheckProgress
  }
}
