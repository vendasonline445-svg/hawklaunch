import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import Dashboard from '@/pages/Dashboard'
import Launch from '@/pages/Launch'
import { Campaigns, Accounts, Creatives, Identities, Pixels, Settings, Logs } from '@/pages/Pages'
import Proxies from '@/pages/Proxies'
import CreateAccounts from '@/pages/CreateAccounts'
import { useAppStore } from '@/store'
import { setToken } from '@/lib/api'

export default function App() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setConnected, setAccessToken, setBcId } = useAppStore()
  const [loading, setLoading] = useState(false)

  // Handle OAuth callback
  useEffect(() => {
    const oauth = searchParams.get('oauth')
    const connected = searchParams.get('connected')

    if (oauth === 'success' || connected === 'true') {
      setLoading(true)
      // Fetch token from Supabase via our API
      fetch('/api/tk?a=token')
        .then(r => r.json())
        .then(res => {
          if (res.code === 0 && res.data?.access_token) {
            const { access_token, advertiser_ids, bc_ids } = res.data
            setToken(access_token)
            setAccessToken(access_token)
            setConnected(true)
            localStorage.setItem('hawklaunch_connected', 'true')
            if (bc_ids?.length) {
              setBcId(bc_ids[0])
              localStorage.setItem('hawklaunch_bc', bc_ids[0])
            }
            if (advertiser_ids?.length) {
              localStorage.setItem('hawklaunch_advertisers', JSON.stringify(advertiser_ids))
            }
          }
        })
        .catch(console.error)
        .finally(() => {
          setLoading(false)
          navigate('/', { replace: true })
        })
    }
  }, [searchParams])

  // Restore session on page load
  useEffect(() => {
    const saved = localStorage.getItem('hawklaunch_connected')
    const savedToken = localStorage.getItem('hawklaunch_token')
    const savedBc = localStorage.getItem('hawklaunch_bc')
    if (saved === 'true' && savedToken) {
      setConnected(true)
      setAccessToken(savedToken)
      if (savedBc) setBcId(savedBc)
    }
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px] min-h-screen">
        <Topbar />
        <div className="p-7">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-4xl mb-3 animate-bounce">🚀</div>
                <div className="text-sm text-gray-400">Conectando com TikTok...</div>
              </div>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/launch" element={<Launch />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/creatives" element={<Creatives />} />
              <Route path="/identities" element={<Identities />} />
              <Route path="/pixels" element={<Pixels />} />
              <Route path="/proxies" element={<Proxies />} />
              <Route path="/create-accounts" element={<CreateAccounts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          )}
        </div>
      </main>
    </div>
  )
}
