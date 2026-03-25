import { useLocation, useNavigate } from 'react-router-dom'

const nav = [
  { section: 'Principal' },
  { icon: '📊', label: 'Dashboard', path: '/' },
  { icon: '🚀', label: 'Nova Campanha', path: '/launch' },
  { icon: '📋', label: 'Campanhas', path: '/campaigns' },
  { section: 'Configuração' },
  { icon: '👥', label: 'Ad Accounts', path: '/accounts' },
  { icon: '🎬', label: 'Criativos', path: '/creatives' },
  { icon: '🔗', label: 'Identities', path: '/identities' },
  { icon: '📡', label: 'Pixels', path: '/pixels' },
  { icon: '🛡️', label: 'Proxies', path: '/proxies' },
  { section: 'Sistema' },
  { icon: '⚙️', label: 'Configurações', path: '/settings' },
  { icon: '📜', label: 'Logs', path: '/logs' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <aside className="w-[260px] bg-[#12141c] border-r border-hawk-border flex flex-col fixed top-0 left-0 bottom-0 z-50">
      <div className="px-5 py-6 border-b border-hawk-border flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-hawk-accent to-orange-400 rounded-[10px] flex items-center justify-center text-lg font-extrabold text-white font-mono">
          H
        </div>
        <div className="text-lg font-bold tracking-tight">
          Hawk<span className="text-hawk-accent">Launch</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {nav.map((item, i) =>
          'section' in item && !('path' in item) ? (
            <div key={i} className="text-[10px] font-semibold uppercase tracking-[1.5px] text-gray-600 px-3 pt-4 pb-2">
              {item.section}
            </div>
          ) : (
            <div
              key={i}
              onClick={() => item.path && navigate(item.path)}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="text-lg w-6 text-center">{item.icon}</span>
              {item.label}
            </div>
          )
        )}
      </nav>

      <div className="px-5 py-4 border-t border-hawk-border">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2 animate-pulse-dot" />
        <span className="text-xs text-gray-600">API Conectada · v2.0</span>
      </div>
    </aside>
  )
}
