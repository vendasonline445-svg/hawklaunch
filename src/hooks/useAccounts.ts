import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

const CACHE_KEY = 'hawklaunch_accounts_cache'
const SELECTED_KEY = 'hawklaunch_selected_accounts'

export function useAccounts(bcId: string | null) {
  const [accounts, setAccounts] = useState<any[]>(() => {
    try { const c = localStorage.getItem(CACHE_KEY); return c ? JSON.parse(c) : [] } catch { return [] }
  })
  const [selected, setSelected] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem(SELECTED_KEY); return s ? new Set(JSON.parse(s)) : new Set() } catch { return new Set() }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    localStorage.setItem(SELECTED_KEY, JSON.stringify([...selected]))
  }, [selected])

  function loadAccounts() {
    if (!bcId) return
    setLoading(true)
    api.getBcAdvertisers(bcId)
      .then((res: any) => {
        const list = res.data?.list || []
        setAccounts(list)
        localStorage.setItem(CACHE_KEY, JSON.stringify(list))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  function toggle(id: string) {
    const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n)
  }

  function selectAll(ids: string[]) { setSelected(new Set(ids)) }
  function selectNone() { setSelected(new Set()) }

  return { accounts, selected, loading, loadAccounts, toggle, selectAll, selectNone, setSelected }
}
