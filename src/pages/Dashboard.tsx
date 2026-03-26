import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { api, clearToken } from '@/lib/api'

const TIKTOK_AUTH_URL = `https://business-api.tiktok.com/portal/auth?app_id=7617705058569814033&state=hawklaunch&rid=hl${Date.now()}&redirect_uri=${encodeURIComponent('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/tiktok-oauth-callback')}`

export default function Dashboard() {
  const navigate = useNavigate()
  const { connected, bcId, setBcId, setConnected } = useAppStore()
  const [bcs, setBcs] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loadingBc, setLoadingBc] = useState(false)
  const [loadingAcc, setLoadingAcc] = useState(false)
  const [stats, setStats] = useState({ spend: 0, total: 0, active: 0, campaigns: 0 })
  const [filter, setFilter] = useState('all')

  // Delete campaigns modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'check' | 'confirm' | 'deleting' | 'done'>('check')
  const [accountsWithCamps, setAccountsWithCamps] = useState<{ id: string; name: string; count: number }[]>([])
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set())
  const [deleteLogs, setDeleteLogs] = useState<{ id: string; name: string; deleted: number; ok: boolean; error?: string }[]>([])
  const [deleteProgress, setDeleteProgress] = useState(0)
  const deleteAbort = useRef(false)

  // Close accounts modal state
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closeStep, setCloseStep] = useState<'confirm' | 'closing' | 'done'>('confirm')
  const [selectedForClose, setSelectedForClose] = useState<Set<string>>(new Set())
  const [closeLogs, setCloseLogs] = useState<{ id: string; name: string; ok: boolean; error?: string }[]>([])
  const [closeProgress, setCloseProgress] = useState(0)

  function handleDisconnect() {
    clearToken()
    setConnected(false)
    setBcId('')
    setBcs([])
    setAccounts([])
    localStorage.removeItem('hawklaunch_connected')
    localStorage.removeItem('hawklaunch_token')
    localStorage.removeItem('hawklaunch_bc')
    localStorage.removeItem('hawklaunch_advertisers')
  }

  // Load BCs
  useEffect(() => {
    if (!connected) return
    setLoadingBc(true)
    api.getBcList()
      .then(res => {
        // bc/get returns { data: { list: [{ bc_info: {...}, user_role }] } }
        const raw = res.data?.list || []
        const list = raw.map((item: any) => ({
          bc_id: item.bc_info?.bc_id || item.bc_id,
          bc_name: item.bc_info?.name || item.bc_info?.company || item.bc_name || item.bc_id,
          status: item.bc_info?.status,
          company: item.bc_info?.company,
          role: item.user_role,
        }))
        setBcs(list)
        if (list.length > 0 && !bcId) {
          setBcId(list[0].bc_id)
          localStorage.setItem('hawklaunch_bc', list[0].bc_id)
        }
      })
      .catch(err => console.error('BC error:', err))
      .finally(() => setLoadingBc(false))
  }, [connected])

  // Load accounts from BC
  useEffect(() => {
    if (!bcId) return
    setLoadingAcc(true)
    api.getBcAdvertisers(bcId)
      .then(res => {
        const list = res.data?.list || []
        setAccounts(list)
        const active = list.filter((a: any) => {
          const s = a.advertiser_status || a.status || ''
          return s === 'STATUS_ENABLE' || s === 'ENABLE'
        }).length
        setStats({ spend: 0, total: list.length, active, campaigns: 0 })
      })
      .catch(err => console.error('Accounts error:', err))
      .finally(() => setLoadingAcc(false))
  }, [bcId])

  async function openDeleteModal() {
    const activeAccounts = accounts.filter((a: any) => {
      const s = a.advertiser_status || a.status || ''
      return s === 'STATUS_ENABLE' || s === 'ENABLE'
    })
    setDeleteStep('check')
    setDeleteLogs([])
    setDeleteProgress(0)
    setAccountsWithCamps([])
    setShowDeleteModal(true)

    // Check which active accounts have campaigns
    const found: { id: string; name: string; count: number }[] = []
    const BATCH = 5
    for (let i = 0; i < activeAccounts.length; i += BATCH) {
      const batch = activeAccounts.slice(i, i + BATCH)
      await Promise.all(batch.map(async (a: any) => {
        try {
          const r = await api.getCampaigns(a.advertiser_id)
          const count = r.data?.list?.length || 0
          if (count > 0) found.push({ id: a.advertiser_id, name: a.advertiser_name || a.name || a.advertiser_id, count })
        } catch {}
      }))
      setDeleteProgress(Math.round(((i + BATCH) / activeAccounts.length) * 100))
    }
    setAccountsWithCamps(found)
    setSelectedForDelete(new Set(found.map(a => a.id)))
    setDeleteStep('confirm')
  }

  async function runDelete() {
    const toDelete = accountsWithCamps.filter(a => selectedForDelete.has(a.id))
    if (toDelete.length === 0) return
    setDeleteStep('deleting')
    setDeleteLogs([])
    setDeleteProgress(0)
    deleteAbort.current = false

    for (let i = 0; i < toDelete.length; i++) {
      if (deleteAbort.current) break
      const acc = toDelete[i]
      try {
        const r = await api.deleteCampaigns(acc.id)
        setDeleteLogs(prev => [...prev, { id: acc.id, name: acc.name, deleted: (r as any).deleted || 0, ok: (r as any).ok !== false }])
      } catch(e: any) {
        setDeleteLogs(prev => [...prev, { id: acc.id, name: acc.name, deleted: 0, ok: false, error: e.message }])
      }
      setDeleteProgress(Math.round(((i + 1) / toDelete.length) * 100))
      if (i < toDelete.length - 1) await new Promise(r => setTimeout(r, 800))
    }
    setDeleteStep('done')
  }

  function openCloseModal() {
    setCloseStep('confirm')
    setCloseLogs([])
    setCloseProgress(0)
    setSelectedForClose(new Set(accounts.map((a: any) => a.advertiser_id)))
    setShowCloseModal(true)
  }

  async function runClose() {
    const toClose = accounts.filter((a: any) => selectedForClose.has(a.advertiser_id))
    if (toClose.length === 0) return
    setCloseStep('closing')
    setCloseLogs([])
    setCloseProgress(0)

    const ids = toClose.map((a: any) => a.advertiser_id)
    try {
      const r = await api.removeBcAccounts(bcId, ids) as any
      if (r.code === 0 && r.data) {
        const removedSet = new Set(r.data.removed || [])
        const logs = toClose.map((a: any) => ({
          id: a.advertiser_id,
          name: a.advertiser_name || a.name || a.advertiser_id,
          ok: removedSet.has(a.advertiser_id),
          error: (r.data.errors || []).find((e: any) => e.id === a.advertiser_id)?.error,
        }))
        setCloseLogs(logs)
      } else {
        setCloseLogs(toClose.map((a: any) => ({ id: a.advertiser_id, name: a.advertiser_name || a.advertiser_id, ok: false, error: r.message || 'Erro' })))
      }
    } catch(e: any) {
      setCloseLogs(toClose.map((a: any) => ({ id: a.advertiser_id, name: a.advertiser_name || a.advertiser_id, ok: false, error: e.message })))
    }
    setCloseProgress(100)
    setCloseStep('done')
  }

  const filteredAccounts = accounts.filter(a => {
    const s = a.advertiser_status || a.status || ''
    if (filter === 'active') return s === 'STATUS_ENABLE' || s === 'ENABLE'
    if (filter === 'suspended') return s !== 'STATUS_ENABLE' && s !== 'ENABLE'
    return true
  })

  const activeCount = accounts.filter((a: any) => {
    const s = a.advertiser_status || a.status || ''
    return s === 'STATUS_ENABLE' || s === 'ENABLE'
  }).length

  const suspendedCount = accounts.length - activeCount

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          { label: 'Gasto hoje', value: `R$ ${stats.spend}`, color: 'border-t-hawk-accent' },
          { label: 'Total contas', value: String(stats.total), color: 'border-t-cyan-500' },
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
            <div className="flex gap-2">
              {accounts.length > 0 && (
                <>
                  <button onClick={openDeleteModal} className="btn btn-secondary btn-sm">🗑️ Deletar Campanhas</button>
                  <button onClick={openCloseModal} className="btn btn-danger btn-sm">🔒 Fechar Contas do BC</button>
                </>
              )}
              <button onClick={handleDisconnect} className="btn btn-danger btn-sm">🔌 Desconectar</button>
            </div>
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
                {loadingBc ? (
                  <div className="text-sm text-gray-400 mt-2">⏳ Carregando BCs...</div>
                ) : bcs.length > 0 ? (
                  <select
                    className="select"
                    value={bcId || ''}
                    onChange={(e) => { setBcId(e.target.value); localStorage.setItem('hawklaunch_bc', e.target.value) }}
                  >
                    {bcs.map((bc: any) => (
                      <option key={bc.bc_id} value={bc.bc_id}>
                        {bc.bc_name} ({bc.bc_id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-yellow-400 mt-2">⚠️ Nenhum BC encontrado</div>
                )}
              </div>
              <div>
                <label className="label mb-1.5 block">Filtro</label>
                <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">Todas ({accounts.length})</option>
                  <option value="active">✅ Ativas ({activeCount})</option>
                  <option value="suspended">🚫 Suspensas ({suspendedCount})</option>
                </select>
              </div>
            </div>

            {loadingAcc ? (
              <div className="text-sm text-gray-400 py-4">⏳ Carregando contas do BC {bcId}...</div>
            ) : filteredAccounts.length > 0 ? (
              <>
                <div className="label mb-2">Ad accounts ({filteredAccounts.length} de {accounts.length})</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
                  {filteredAccounts.map((a: any) => {
                    const name = a.advertiser_name || a.name || 'Sem nome'
                    const id = a.advertiser_id
                    const status = a.advertiser_status || a.status || ''
                    const isActive = status === 'STATUS_ENABLE' || status === 'ENABLE'
                    return (
                      <div key={id} className="bg-hawk-input border border-hawk-border rounded-lg p-3 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{id}</div>
                        </div>
                        <div className="text-[10px] text-gray-500">{a.currency || 'BRL'}</div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500 py-4">
                {accounts.length === 0 ? 'Nenhuma conta neste BC.' : 'Nenhuma conta neste filtro.'}
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">Conecte sua conta TikTok Business para começar.</p>
            <a href={TIKTOK_AUTH_URL} className="btn btn-primary">🔗 Conectar TikTok Business</a>
          </>
        )}
      </div>

      {/* Delete Campaigns Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-hawk-card border border-hawk-border rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-hawk-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-500/15 rounded-lg flex items-center justify-center text-lg">🗑️</div>
                <div>
                  <h2 className="font-bold text-base">Deletar Campanhas</h2>
                  <p className="text-[11px] text-gray-500">Apenas contas ativas com campanha</p>
                </div>
              </div>
              {(deleteStep === 'confirm' || deleteStep === 'done') && (
                <button onClick={() => setShowDeleteModal(false)} className="text-gray-500 hover:text-white text-lg">✕</button>
              )}
            </div>

            <div className="p-5">
              {/* Step: checking */}
              {deleteStep === 'check' && (
                <div className="text-center py-8">
                  <div className="text-3xl mb-3 animate-pulse">🔍</div>
                  <p className="text-sm text-gray-300 mb-4">Verificando contas ativas com campanhas...</p>
                  <div className="w-full bg-hawk-border rounded-full h-1.5">
                    <div className="bg-hawk-accent h-1.5 rounded-full transition-all" style={{ width: deleteProgress + '%' }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{deleteProgress}%</p>
                </div>
              )}

              {/* Step: confirm */}
              {deleteStep === 'confirm' && (
                <>
                  {accountsWithCamps.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-3xl mb-3">✅</div>
                      <p className="text-sm text-gray-300">Nenhuma conta ativa com campanhas encontrada.</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-2 mb-4">
                        <span className="text-base">⚠️</span>
                        <p className="text-[12px] text-red-300">Esta ação é <strong>irreversível</strong>. As campanhas serão deletadas permanentemente.</p>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="label">{accountsWithCamps.length} conta(s) com campanha</span>
                        <div className="flex gap-2">
                          <button className="text-[11px] text-hawk-accent hover:underline" onClick={() => setSelectedForDelete(new Set(accountsWithCamps.map(a => a.id)))}>Todas</button>
                          <span className="text-gray-600">·</span>
                          <button className="text-[11px] text-gray-400 hover:underline" onClick={() => setSelectedForDelete(new Set())}>Nenhuma</button>
                        </div>
                      </div>

                      <div className="space-y-1.5 max-h-[280px] overflow-y-auto mb-5">
                        {accountsWithCamps.map(a => (
                          <div key={a.id} onClick={() => {
                            const n = new Set(selectedForDelete)
                            n.has(a.id) ? n.delete(a.id) : n.add(a.id)
                            setSelectedForDelete(n)
                          }} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer border transition-colors ${selectedForDelete.has(a.id) ? 'border-red-500/50 bg-red-500/8' : 'border-hawk-border hover:border-gray-500'}`}>
                            <div className={`w-4 h-4 border-2 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${selectedForDelete.has(a.id) ? 'bg-red-500 border-red-500 text-white' : 'border-hawk-border'}`}>
                              {selectedForDelete.has(a.id) ? '✓' : ''}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-semibold truncate">{a.name}</div>
                              <div className="text-[10px] text-gray-500 font-mono">{a.id}</div>
                            </div>
                            <div className="text-[11px] text-orange-400 font-mono flex-shrink-0">{a.count} camp.</div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={runDelete}
                        disabled={selectedForDelete.size === 0}
                        className="btn btn-danger w-full disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        🗑️ Deletar campanhas de {selectedForDelete.size} conta(s)
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Step: deleting */}
              {deleteStep === 'deleting' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">Deletando...</span>
                    <span className="text-xs text-gray-400">{deleteProgress}%</span>
                  </div>
                  <div className="w-full bg-hawk-border rounded-full h-1.5 mb-4">
                    <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{ width: deleteProgress + '%' }} />
                  </div>
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                    {deleteLogs.map((l, i) => (
                      <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] ${l.ok ? 'bg-green-500/8 border border-green-500/20' : 'bg-red-500/8 border border-red-500/20'}`}>
                        <span>{l.ok ? '✅' : '❌'}</span>
                        <span className="flex-1 truncate font-semibold">{l.name}</span>
                        <span className="text-gray-400 font-mono">{l.ok ? l.deleted + ' deletadas' : l.error || 'erro'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step: done */}
              {deleteStep === 'done' && (
                <div>
                  <div className="text-center py-4 mb-4">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-sm font-semibold">
                      {deleteLogs.filter(l => l.ok).reduce((s, l) => s + l.deleted, 0)} campanhas deletadas
                      {' '}de {deleteLogs.filter(l => l.ok).length} conta(s)
                    </p>
                    {deleteLogs.some(l => !l.ok) && (
                      <p className="text-xs text-red-400 mt-1">{deleteLogs.filter(l => !l.ok).length} conta(s) com erro</p>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-4">
                    {deleteLogs.map((l, i) => (
                      <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] ${l.ok ? 'bg-green-500/8 border border-green-500/20' : 'bg-red-500/8 border border-red-500/20'}`}>
                        <span>{l.ok ? '✅' : '❌'}</span>
                        <span className="flex-1 truncate">{l.name}</span>
                        <span className="font-mono text-gray-400">{l.ok ? l.deleted + ' camp.' : l.error || 'erro'}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setShowDeleteModal(false)} className="btn btn-primary w-full">Fechar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Close Accounts Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-hawk-card border border-hawk-border rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-hawk-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-500/15 rounded-lg flex items-center justify-center text-lg">🔒</div>
                <div>
                  <h2 className="font-bold text-base">Fechar Contas do BC</h2>
                  <p className="text-[11px] text-gray-500">Remove as ad accounts do Business Center</p>
                </div>
              </div>
              {(closeStep === 'confirm' || closeStep === 'done') && (
                <button onClick={() => setShowCloseModal(false)} className="text-gray-500 hover:text-white text-lg">✕</button>
              )}
            </div>

            <div className="p-5">
              {closeStep === 'confirm' && (
                <>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-2 mb-4">
                    <span className="text-base">⚠️</span>
                    <p className="text-[12px] text-red-300">
                      Esta ação <strong>remove as contas do BC</strong> via API TikTok.<br />
                      Necessário antes de desativar o Business Center.
                    </p>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="label">{accounts.length} conta(s) no BC</span>
                    <div className="flex gap-2">
                      <button className="text-[11px] text-hawk-accent hover:underline" onClick={() => setSelectedForClose(new Set(accounts.map((a: any) => a.advertiser_id)))}>Todas</button>
                      <span className="text-gray-600">·</span>
                      <button className="text-[11px] text-gray-400 hover:underline" onClick={() => setSelectedForClose(new Set())}>Nenhuma</button>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto mb-5">
                    {accounts.map((a: any) => {
                      const id = a.advertiser_id
                      const name = a.advertiser_name || a.name || id
                      const isSelected = selectedForClose.has(id)
                      return (
                        <div key={id} onClick={() => {
                          const n = new Set(selectedForClose)
                          n.has(id) ? n.delete(id) : n.add(id)
                          setSelectedForClose(n)
                        }} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer border transition-colors ${isSelected ? 'border-red-500/50 bg-red-500/8' : 'border-hawk-border hover:border-gray-500'}`}>
                          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${isSelected ? 'bg-red-500 border-red-500 text-white' : 'border-hawk-border'}`}>
                            {isSelected ? '✓' : ''}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold truncate">{name}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{id}</div>
                          </div>
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${(a.status === 'STATUS_ENABLE' || a.status === 'ENABLE') ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                            {(a.status === 'STATUS_ENABLE' || a.status === 'ENABLE') ? 'ATIVA' : 'INATIVA'}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    onClick={runClose}
                    disabled={selectedForClose.size === 0}
                    className="btn btn-danger w-full disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    🔒 Fechar {selectedForClose.size} conta(s) do BC
                  </button>
                </>
              )}

              {closeStep === 'closing' && (
                <div className="text-center py-8">
                  <div className="text-3xl mb-3 animate-pulse">🔒</div>
                  <p className="text-sm text-gray-300">Removendo contas do BC...</p>
                </div>
              )}

              {closeStep === 'done' && (
                <div>
                  <div className="text-center py-4 mb-4">
                    <div className="text-3xl mb-2">{closeLogs.every(l => l.ok) ? '✅' : '⚠️'}</div>
                    <p className="text-sm font-semibold">
                      {closeLogs.filter(l => l.ok).length} conta(s) removidas do BC
                    </p>
                    {closeLogs.some(l => !l.ok) && (
                      <p className="text-xs text-red-400 mt-1">{closeLogs.filter(l => !l.ok).length} com erro</p>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-[240px] overflow-y-auto mb-4">
                    {closeLogs.map((l, i) => (
                      <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] ${l.ok ? 'bg-green-500/8 border border-green-500/20' : 'bg-red-500/8 border border-red-500/20'}`}>
                        <span>{l.ok ? '✅' : '❌'}</span>
                        <span className="flex-1 truncate font-semibold">{l.name}</span>
                        <span className="text-gray-400 font-mono text-[10px]">{l.ok ? 'removida' : (l.error || 'erro')}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setShowCloseModal(false); api.getBcAdvertisers(bcId).then(r => setAccounts(r.data?.list || [])) }} className="btn btn-primary w-full">Fechar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center text-base">⚡</div>
          <h2 className="text-lg font-bold">Quick Launch</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { type: 'smart-spark', icon: '🔥', title: 'Smart+ V2', desc: 'Smart+ com Spark Ads. Versão atualizada.', badge: 'novo', cls: 'badge-new' },
            { type: 'smart-catalog', icon: '⚡', title: 'Smart+ V1', desc: 'Versão anterior do Smart+. Em descontinuação.', badge: 'legado', cls: 'badge-popular' },
            { type: 'manual', icon: '🎯', title: 'Manual', desc: 'Controle total. CBO ou ABO.', badge: 'clássico', cls: 'badge-catalog' },
          ].map((c) => (
            <div key={c.type} onClick={() => navigate('/launch')}
              className="bg-hawk-card border-2 border-hawk-border rounded-xl p-6 cursor-pointer transition-all hover:border-gray-500 hover:-translate-y-0.5 group">
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
