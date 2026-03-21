import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { api } from '@/lib/api'

const TIKTOK_AUTH_URL = `https://business-api.tiktok.com/portal/auth?app_id=7617705058569814033&state=hawklaunch&redirect_uri=${encodeURIComponent('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/tiktok-oauth-callback')}`

export default function Dashboard() {
  const navigate = useNavigate()
  const { connected, bcId, setBcId } = useAppStore()
  const [bcs, setBcs] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loadingBc, setLoadingBc] = useState(false)
  const [loadingAcc, setLoadingAcc] = useState(false)
  const [stats, setStats] = useState({ spend: 0, accounts: 0, campaigns: 0, ads: 0 })

  // Load BCs when connected
  useEffect(() => {
    if (!connected) return
    setLoadingBc(true)
    api.getBcList()
      .then(res => {
        const list = res.data?.list || []
        setBcs(list)
        if (list.length > 0 && !bcId) {
          const firstBc = list[0].bc_id
          setBcId(firstBc)
          localStorage.setItem('hawklaunch_bc', firstBc)
        }
      })
      .catch(console.error)
      .finally(() => setLoadingBc(false))
  }, [connected])

  // Load accounts when BC selected
  useEffect(() => {
    if (!bcId) return
    setLoadingAcc(true)
    api.getAdvertisers(bcId)
      .then(res => {
        const list = res.data?.list || []
        setAccounts(list)
        setStats(s => ({ ...s, accounts: list.filter((a: any) => a.status === 'STATUS_ENABLE').length }))
      })
      .catch(console.error)
      .finally(() => setLoadingAcc(false))
  }, [bcId])

  return (
    <div className="animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          { label: 'Gasto hoje', value: `R$ ${stats.spend}`, color: 'border-t-hawk-accent' },
          { label: 'Contas ativas', value: String(stats.accounts), color: 'border-t-cyan-500' },
          { label: 'Campanhas', value: String(stats.campaigns), color: 'border-t-purple-500' },
          { label: 'Anúncios ativos', value: String(stats.ads), color: 'border-t-green-500' },
        ].map((s, i) => (
          <div key={i} className={`card border-t-2 ${s.color}`}>
            <div className="label mb-2">{s.label}</div>
            <div className="text-2xl font-extrabold font-mono">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Connection */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center text-base">🔌</div>
            <h2 className="text-lg font-bold">Conexão TikTok</h2>
          </div>
        </div>
        {connected ? (
          <div>
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-4">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Conectado ao TikTok Business
            </div>

            {/* BC Selector */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label mb-1.5 block">Business Center</label>
                <select
                  className="select"
                  value={bcId || ''}
                  onChange={(e) => { setBcId(e.target.value); localStorage.setItem('hawklaunch_bc', e.target.value) }}
                  disabled={loadingBc}
                >
                  {loadingBc ? (
                    <option>Carregando BCs...</option>
                  ) : bcs.length === 0 ? (
                    <option>Nenhum BC encontrado</option>
                  ) : (
                    bcs.map((bc: any) => (
                      <option key={bc.bc_id} value={bc.bc_id}>{bc.bc_name || bc.bc_id}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="label mb-1.5 block">Ad Accounts</label>
                <div className="text-sm text-gray-300 mt-2">
                  {loadingAcc ? '⏳ Carregando...' : `${accounts.length} conta(s) encontrada(s)`}
                </div>
              </div>
            </div>

            {/* Accounts List */}
            {accounts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                {accounts.slice(0, 12).map((a: any) => (
                  <div key={a.advertiser_id} className="bg-hawk-input border border-hawk-border rounded-lg p-3 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === 'STATUS_ENABLE' ? 'bg-green-500' : a.status === 'STATUS_DISABLE' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{a.advertiser_name || 'Sem nome'}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{a.advertiser_id}</div>
                    </div>
                    <div className="text-[10px] text-gray-500">{a.currency || 'BRL'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">
              Conecte sua conta TikTok Business para começar. O OAuth trará automaticamente seu Business Center e contas.
            </p>
            <a href={TIKTOK_AUTH_URL} className="btn btn-primary">🔗 Conectar TikTok Business</a>
          </>
        )}
      </div>

      {/* Quick Launch */}
      <div className="card">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center text-base">⚡</div>
          <h2 className="text-lg font-bold">Quick Launch</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { type: 'smart-spark', icon: '🔥', title: 'Smart+ Spark Ads', desc: 'Smart+ com vídeos orgânicos via Spark. Melhor performance + social proof.', badge: 'novo', cls: 'badge-new' },
            { type: 'smart-catalog', icon: '📦', title: 'Smart+ Catálogo', desc: 'Video Shopping Ads com produtos do catálogo. Ideal para e-commerce.', badge: 'catálogo', cls: 'badge-catalog' },
            { type: 'manual', icon: '🎯', title: 'Manual', desc: 'Controle total sobre campanha, grupo e anúncio. CBO ou ABO.', badge: 'clássico', cls: 'badge-popular' },
          ].map((c) => (
            <div
              key={c.type}
              onClick={() => navigate('/launch')}
              className="bg-hawk-card border-2 border-hawk-border rounded-xl p-6 cursor-pointer transition-all hover:border-gray-500 hover:-translate-y-0.5 group"
            >
              <div className="text-3xl mb-3">{c.icon}</div>
              <div className="text-base font-bold mb-1.5 group-hover:text-hawk-accent transition-colors">{c.title}</div>
              <div className="text-xs text-gray-400 leading-relaxed mb-3">{c.desc}</div>
              <span className={`badge ${c.cls}`}>{c.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
