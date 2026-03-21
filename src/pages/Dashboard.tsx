import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'

const quickTypes = [
  { type: 'smart-spark' as const, icon: '🔥', title: 'Smart+ Spark Ads', desc: 'Campanha Smart+ com vídeos orgânicos via Spark.', badge: 'novo', badgeClass: 'badge-new' },
  { type: 'smart-catalog' as const, icon: '📦', title: 'Smart+ Catálogo', desc: 'Video Shopping Ads com produtos do catálogo.', badge: 'catálogo', badgeClass: 'badge-catalog' },
  { type: 'manual' as const, icon: '🎯', title: 'Manual', desc: 'Controle total sobre campanha, grupo e anúncio.', badge: 'clássico', badgeClass: 'badge-popular' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { setCampaignType } = useAppStore()

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          { label: 'Gasto Hoje', value: 'R$ 0', color: 'border-t-hawk-accent' },
          { label: 'Contas Ativas', value: '0', color: 'border-t-cyan-500' },
          { label: 'Campanhas', value: '0', color: 'border-t-purple-500' },
          { label: 'Anúncios Ativos', value: '0', color: 'border-t-green-500' },
        ].map((s) => (
          <div key={s.label} className={`card border-t-2 ${s.color}`}>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{s.label}</div>
            <div className="text-3xl font-extrabold font-mono">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card mb-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold flex items-center gap-2.5">
            <span className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center text-base">🔌</span>
            Conexão TikTok
          </h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Conecte sua conta TikTok Business para começar.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            window.location.href = `https://business-api.tiktok.com/portal/auth?app_id=7617705058569814033&state=hawklaunch&redirect_uri=${encodeURIComponent('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/tiktok-oauth-callback')}`
          }}
        >
          🔗 Conectar TikTok Business
        </button>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold flex items-center gap-2.5 mb-5">
          <span className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center text-base">⚡</span>
          Quick Launch
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {quickTypes.map((qt) => (
            <div
              key={qt.type}
              onClick={() => { setCampaignType(qt.type); navigate('/launch') }}
              className="bg-hawk-input border-2 border-hawk-border rounded-xl p-6 cursor-pointer hover:border-gray-500 hover:-translate-y-0.5 transition-all"
            >
              <div className="text-3xl mb-3">{qt.icon}</div>
              <div className="text-base font-bold mb-1.5">{qt.title}</div>
              <div className="text-xs text-gray-400 leading-relaxed mb-2.5">{qt.desc}</div>
              <span className={`badge ${qt.badgeClass}`}>{qt.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
