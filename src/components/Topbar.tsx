import { useLocation } from 'react-router-dom'
import { useAppStore } from '@/store'

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/launch': 'Nova Campanha',
  '/campaigns': 'Campanhas',
  '/accounts': 'Ad Accounts',
  '/creatives': 'Criativos',
  '/identities': 'Identities',
  '/pixels': 'Pixels',
  '/settings': 'Configurações',
  '/logs': 'Logs',
}

export default function Topbar() {
  const location = useLocation()
  const { connected, bcId } = useAppStore()

  return (
    <header className="h-[60px] bg-[#12141c]/80 backdrop-blur-xl border-b border-hawk-border flex items-center justify-between px-7 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h1 className="text-[15px] font-semibold text-gray-100">
          {titles[location.pathname] || 'HawkLaunch'}
        </h1>
        <span className="text-xs text-gray-600">DigitalHawks</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-hawk-card border border-hawk-border rounded-full text-xs text-gray-400">
          🔑 BC: {bcId || '—'}
        </div>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs ${
          connected ? 'border-green-500/50 text-green-400' : 'border-hawk-border text-gray-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 animate-pulse-dot' : 'bg-gray-600'}`} />
          {connected ? 'Online' : 'Offline'}
        </div>
      </div>
    </header>
  )
}
