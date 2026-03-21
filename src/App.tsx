import { useEffect } from 'react'
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import Dashboard from '@/pages/Dashboard'
import Launch from '@/pages/Launch'
import { Campaigns, Accounts, Creatives, Identities, Pixels, Settings, Logs } from '@/pages/Pages'
import { useAppStore } from '@/store'

export default function App() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setConnected } = useAppStore()

  useEffect(() => {
    const oauth = searchParams.get('oauth')
    const connected = searchParams.get('connected')
    if (oauth === 'success' || connected === 'true') {
      setConnected(true)
      localStorage.setItem('hawklaunch_connected', 'true')
      navigate('/', { replace: true })
    }
  }, [searchParams])

  useEffect(() => {
    const saved = localStorage.getItem('hawklaunch_connected')
    if (saved === 'true') setConnected(true)
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px] min-h-screen">
        <Topbar />
        <div className="p-7">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/launch" element={<Launch />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/creatives" element={<Creatives />} />
            <Route path="/identities" element={<Identities />} />
            <Route path="/pixels" element={<Pixels />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
