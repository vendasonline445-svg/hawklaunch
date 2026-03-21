import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { api, clearToken } from '@/lib/api'

// OAuth URL with BC scope - forces BC + all accounts selection
const TIKTOK_AUTH_URL = `https://business-api.tiktok.com/portal/auth?app_id=7617705058569814033&state=hawklaunch&rid=hawklaunch${Date.now()}&redirect_uri=${encodeURIComponent('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/tiktok-oauth-callback')}`

export default function Dashboard() {
  const navigate = useNavigate()
  const { connected, bcId, setBcId, setConnected } = useAppStore()
  const [bcs, setBcs] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [stats, setStats] = useState({ spend: 0, accounts: 0, active: 0, campaigns: 0 })
  const [filter, setFilter] = useState('all')

  function handleDisconnect() {
    clearToken()
    setConnected(false)
    setBcId('')
    setBcs([])
    setAccounts([])
    setStats({ spend: 0, accounts: 0, active: 0, campaigns: 0 })
    localStorage.removeItem('hawklaunch_connected')
    localStorage.removeItem('hawklaunch_token')
    localStorage.removeItem('hawklaunch_bc')
    localStorage.removeItem('hawklaunch_advertisers')
  }

  useEffect(() => {
    if (!connected) return
    setLoading(true)
    api.getBcList()
      .then(res => {
        const list = res.data?.list || []
        setBcs(list)
        if (list.length > 0) {
          const firstBc = list[0].bc_id
          setBcId(firstBc)
          localStorage.setItem('hawklaunch_bc', firstBc)
        }
      })
      .catch(err => console.error('BC list error:', err))
      .finally(() => setLoading(false))
  }, [connected])

  useEffect(() => {
    if (!bcId) return
    setLoadingAccounts(true)
    api.getBcAdvertisers(bcId)
      .then(res => {
        const list = res.data?.list || []
        setAccounts(list)
        const active = list.filter((a: any) =>
          (a.advertiser_status || a.status) === 'STATUS_ENABLE'
        ).length
        setStats(s => ({ ...s, accounts: list.length, active }))
      })
      .catch(err => console.error('Accounts error:', err))
      .finally(() => setLoadingAccounts(false))
  }, [bcId])

  const filteredAccounts = accounts.filter(a => {
    const status = a.advertiser_status || a.status || ''
    if (filter === 'active') return status === 'STATUS_ENABLE'
    if (filter === 'suspended') return status !== 'STATUS_ENABLE'
    return true
  })

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          { label: 'Gasto hoje', value: `R$ ${stats.spend}`, color: 'border-t-hawk-accent' },
          { label: 'Total contas', value: String(stats.accounts), color: 'border-t-cyan-500' },
          { label: 'Contas ativas', value: String(stats.active), color: 'border-t-purple-500' },
          { label: 'Campanhas', value: String(stats.campaigns), color: 'border-t-green-500' },
        ].map((s, i) => (
          <div key={i} className={`card border-t-2 ${s.color}`}>
            <div className="label mb-2">{s.label}</div>
            <div className="text-2xl font-extrabold font-mono">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center text-base">🔌</div>
            <h2 className="text-lg font-bold">Conexão TikTok</h2>
          </div>
          {connected && (
            <button onClick={handleDisconnect} className="btn btn-danger btn-sm">
              🔌 Desconectar
            </button>
          )}
        </div>
        {connected ? (
          <div>
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-4">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Conectado ao TikTok Business
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label mb-1.5 block">Business Center</label>
                {loading ? (
                  <div className="text-sm text-gray-400 mt-2">⏳ Carregando BCs...</div>
                ) : bcs.length > 0 ? (
                  <select
                    className="select"
                    value={bcId || ''}
                    onChange={(e) => { setBcId(e.target.value); localStorage.setItem('hawklaunch_bc', e.target.value) }}
                  >
                    {bcs.map((bc: any) => (
                      <option key={bc.bc_id} value={bc.bc_id}>
                        {bc.bc_name || bc.bc_id} ({bc.bc_id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-2">
                    <div className="text-sm text-yellow-400 mb-2">⚠️ Nenhum BC encontrado</div>
                    <p className="text-xs text-gray-500 mb-3">
                      Clique em "Desconectar", depois reconecte. Na tela do TikTok, selecione seu Business Center e marque TODAS as contas antes de confirmar.
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="label mb-1.5 block">Filtro</label>
                <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">Todas ({accounts.length})</option>
                  <option value="active">✅ Ativas ({accounts.filter((a:any) => (a.advertiser_status||a.status) === 'STATUS_ENABLE').length})</option>
                  <option value="suspended">🚫 Suspensas ({accounts.filter((a:any) => (a.advertiser_status||a.status) !== 'STATUS_ENABLE').length})</option>
                </select>
              </div>
            </div>

            {loadingAccounts ? (
              <div className="text-sm text-gray-400 py-4">⏳ Carregando contas do BC...</div>
            ) : filteredAccounts.length > 0 ? (
              <>
                <div className="label mb-2">Ad Accounts ({filteredAccounts.length} de {accounts.length})</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                  {filteredAccounts.map((a: any) => {
                    const status = a.advertiser_status || a.status || ''
                    return (
                      <div key={a.advertiser_id} className="bg-hawk-input border border-hawk-border rounded-lg p-3 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          status === 'STATUS_ENABLE' ? 'bg-green-500' :
                          status === 'STATUS_DISABLE' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{a.advertiser_name || a.name || 'Sem nome'}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{a.advertiser_id}</div>
                        </div>
                        <div className="text-[10px] text-gray-500">{a.currency || 'BRL'}</div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : bcs.length > 0 ? (
              <div className="text-sm text-gray-500 py-4">Nenhuma conta encontrada neste BC.</div>
            ) : null}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-3">
              Conecte sua conta TikTok Business para começar. Na tela de autorização:
            </p>
            <div className="bg-hawk-input border border-hawk-border rounded-lg p-4 mb-4 text-xs text-gray-300 leading-relaxed">
              <strong className="text-gray-100">Passo a passo:</strong><br/>
              1. Clique no botão abaixo<br/>
              2. Na tela do TikTok, selecione seu <strong className="text-hawk-accent">Business Center</strong><br/>
              3. Marque <strong className="text-hawk-accent">TODAS as ad accounts</strong> (ou "Select All")<br/>
              4. Confirme a autorização<br/>
              5. Você será redirecionado de volta automaticamente
            </div>
            <a href={TIKTOK_AUTH_URL} className="btn btn-primary">🔗 Conectar TikTok Business</a>
          </>
        )}
      </div>

      <div className="card">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center text-base">⚡</div>
          <h2 className="text-lg font-bold">Quick Launch</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { type: 'smart-spark', icon: '🔥', title: 'Smart+ Spark Ads', desc: 'Smart+ com vídeos orgânicos via Spark.', badge: 'novo', cls: 'badge-new' },
            { type: 'smart-catalog', icon: '📦', title: 'Smart+ Catálogo', desc: 'Video Shopping Ads com produtos do catálogo.', badge: 'catálogo', cls: 'badge-catalog' },
            { type: 'manual', icon: '🎯', title: 'Manual', desc: 'Controle total. CBO ou ABO.', badge: 'clássico', cls: 'badge-popular' },
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
