import { Routes, Route } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import Dashboard from '@/pages/Dashboard'
import Launch from '@/pages/Launch'
import { Campaigns, Accounts, Creatives, Identities, Pixels, Settings, Logs } from '@/pages/Pages'

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px] min-h-screen">
        <Topbar />
        <div className="p-7">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/launch" element={<Launch />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/creatives" element={<Creatives />} />
            <Route path="/identities" element={<Identities />} />
            <Route path="/pixels" element={<Pixels />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/logs" element={<Logs />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
