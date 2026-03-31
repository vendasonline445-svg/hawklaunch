import { useRef, useState } from 'react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store'

export function Campaigns() {
  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">📋</div>
        <h2 className="text-lg font-bold">Campanhas Ativas</h2>
      </div>
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-sm">Nenhuma campanha criada ainda.<br />Vá em "Nova Campanha" para começar.</p>
      </div>
    </div>
  )
}

export function Accounts() {
  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">👥</div>
        <h2 className="text-lg font-bold">Gerenciar Ad Accounts</h2>
      </div>
      <p className="text-sm text-gray-400">Conecte o TikTok Business para carregar suas ad accounts.</p>
    </div>
  )
}

type AdItem = { advId: string; ad_id: string; ad_name: string; operation_status: string }
type BcAccount = { advertiser_id: string; advertiser_name?: string; name?: string; advertiser_status?: string; status?: string }

export function Creatives() {
  const { bcId } = useAppStore()
  const [accountIds, setAccountIds] = useState('')
  const [proxy, setProxy] = useState('')
  const [bcAccounts, setBcAccounts] = useState<BcAccount[]>([])
  const [bcLoading, setBcLoading] = useState(false)
  const [bcLoaded, setBcLoaded] = useState(false)
  const [bcSelected, setBcSelected] = useState<Set<string>>(new Set())
  const [phase, setPhase] = useState<'idle' | 'checking' | 'results' | 'appealing' | 'done'>('idle')
  const [checkLogs, setCheckLogs] = useState<string[]>([])
  const [foundAds, setFoundAds] = useState<AdItem[]>([])
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set())
  const [appealLogs, setAppealLogs] = useState<string[]>([])
  const [appealProgress, setAppealProgress] = useState(0)
  const [showFullLog, setShowFullLog] = useState(false)
  const abortRef = useRef(false)

  function ts() {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  async function runCheck() {
    const ids = accountIds.split('\n').map(s => s.trim()).filter(Boolean)
    if (ids.length === 0) return
    setPhase('checking')
    setCheckLogs([])
    setFoundAds([])
    abortRef.current = false

    const allAds: AdItem[] = []
    for (let i = 0; i < ids.length; i++) {
      if (abortRef.current) break
      const advId = ids[i]
      setCheckLogs(prev => [...prev, `[${ts()}] 🔍 Verificando conta ${advId}...`])
      try {
        const r = await api.listRejectedAds(advId, proxy || undefined) as any
        const list: any[] = r.data?.list || []
        const scanned: number = r.data?.scanned ?? list.length
        list.forEach(ad => allAds.push({ advId, ad_id: ad.ad_id, ad_name: ad.ad_name, operation_status: ad.operation_status || ad.secondary_status || ad.primary_status || 'REVIEW_REJECT' }))
        setCheckLogs(prev => [...prev, `[${ts()}] ${list.length > 0 ? `⚠️ ${list.length} rejeitado(s)` : '✅ Nenhum rejeitado'} de ${scanned} ads — ${advId}`])
      } catch (e: any) {
        setCheckLogs(prev => [...prev, `[${ts()}] ❌ Erro em ${advId}: ${e.message}`])
      }
      if (i < ids.length - 1 && !abortRef.current) {
        const delay = 500 + ((Math.random() + Math.random()) / 2) * 1000
        await new Promise(r => setTimeout(r, Math.floor(delay)))
      }
    }
    setFoundAds(allAds)
    setSelectedAds(new Set(allAds.map(a => a.ad_id)))
    setPhase('results')
  }

  async function runAppeal() {
    const toAppeal = foundAds.filter(a => selectedAds.has(a.ad_id))
    if (toAppeal.length === 0) return
    setPhase('appealing')
    setAppealLogs([])
    setAppealProgress(0)
    abortRef.current = false

    for (let i = 0; i < toAppeal.length; i++) {
      if (abortRef.current) break
      const item = toAppeal[i]
      const label = (item.ad_name || item.ad_id).slice(0, 45)
      try {
        const r = await api.appealAd(item.advId, item.ad_id, proxy || undefined) as any
        if (r.code === 0) {
          setAppealLogs(prev => [...prev, `[${ts()}] ✓ ${label} — appeal enviado`])
        } else {
          setAppealLogs(prev => [...prev, `[${ts()}] ✗ ${label} — erro: ${r.message || 'desconhecido'}`])
        }
      } catch (e: any) {
        setAppealLogs(prev => [...prev, `[${ts()}] ✗ ${label} — erro: ${e.message}`])
      }
      setAppealProgress(Math.round(((i + 1) / toAppeal.length) * 100))
      if (i < toAppeal.length - 1 && !abortRef.current) {
        setAppealLogs(prev => [...prev, `[${ts()}] ⏳ Aguardando antes do próximo...`])
        const delay = 2000 + ((Math.random() + Math.random()) / 2) * 3000
        await new Promise(r => setTimeout(r, Math.floor(delay)))
      }
    }
    setPhase('done')
  }

  function toggleAd(adId: string) {
    setSelectedAds(prev => {
      const n = new Set(prev)
      n.has(adId) ? n.delete(adId) : n.add(adId)
      return n
    })
  }

  async function loadBcAccounts() {
    if (!bcId) return
    setBcLoading(true)
    setBcLoaded(false)
    try {
      const res = await api.getBcAdvertisers(bcId) as any
      const list: BcAccount[] = res.data?.list || []
      setBcAccounts(list)
      setBcSelected(new Set())
      setBcLoaded(true)
    } catch (e) {
      setBcAccounts([])
      setBcLoaded(true)
    } finally {
      setBcLoading(false)
    }
  }

  function toggleBcAccount(id: string) {
    setBcSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function applyBcSelection() {
    const current = new Set(accountIds.split('\n').map(s => s.trim()).filter(Boolean))
    bcSelected.forEach(id => current.add(id))
    setAccountIds([...current].join('\n'))
  }

  const uniqueAccounts = [...new Set(foundAds.map(a => a.advId))].length
  const selectedCount = foundAds.filter(a => selectedAds.has(a.ad_id)).length
  const successCount = appealLogs.filter(l => l.includes('] ✓')).length
  const errorCount = appealLogs.filter(l => l.includes('] ✗')).length

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header card */}
      <div className="card">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 bg-amber-500/15 rounded-md flex items-center justify-center">⚖️</div>
          <div>
            <h2 className="text-lg font-bold">Appeal em Massa — CTV</h2>
            <p className="text-[11px] text-gray-500">Contesta anúncios com review rejeitado via TikTok Ads API</p>
          </div>
        </div>

        {/* BC account picker */}
        <div className="mb-5 border border-hawk-border rounded-xl p-4 bg-hawk-input/40">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold text-gray-300">Carregar contas do BC</span>
              {bcId && <span className="text-[10px] text-gray-600 ml-2 font-mono">{bcId}</span>}
            </div>
            <button
              onClick={loadBcAccounts}
              disabled={!bcId || bcLoading || phase === 'checking' || phase === 'appealing'}
              className="btn btn-secondary btn-sm text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {bcLoading ? '⏳ Carregando...' : '🔄 Carregar do BC'}
            </button>
          </div>

          {!bcId && (
            <p className="text-[11px] text-gray-600">Nenhum BC conectado. Conecte no Dashboard primeiro.</p>
          )}

          {bcLoaded && bcAccounts.length === 0 && (
            <p className="text-[11px] text-gray-500">Nenhuma conta encontrada no BC.</p>
          )}

          {bcLoaded && bcAccounts.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-gray-500">{bcAccounts.length} conta(s) — {bcSelected.size} selecionada(s)</span>
                <div className="flex gap-2">
                  <button className="text-[11px] text-hawk-accent hover:underline" onClick={() => setBcSelected(new Set(bcAccounts.map(a => a.advertiser_id)))}>Todas</button>
                  <span className="text-gray-600">·</span>
                  <button className="text-[11px] text-gray-400 hover:underline" onClick={() => setBcSelected(new Set())}>Nenhuma</button>
                </div>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto mb-3">
                {bcAccounts.map(acc => {
                  const id = acc.advertiser_id
                  const label = acc.advertiser_name || acc.name || id
                  const st = acc.advertiser_status || acc.status || ''
                  const isActive = st === 'STATUS_ENABLE' || st === 'ENABLE'
                  const sel = bcSelected.has(id)
                  return (
                    <div
                      key={id}
                      onClick={() => toggleBcAccount(id)}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer border transition-colors ${sel ? 'border-amber-500/50 bg-amber-500/5' : 'border-hawk-border hover:border-gray-500'}`}
                    >
                      <div className={`w-3.5 h-3.5 border-2 rounded flex items-center justify-center text-[9px] flex-shrink-0 ${sel ? 'bg-amber-500 border-amber-500 text-black' : 'border-hawk-border'}`}>
                        {sel ? '✓' : ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium truncate">{label}</div>
                        <div className="text-[9px] text-gray-600 font-mono">{id}</div>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${isActive ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-500'}`}>
                        {isActive ? 'ATIVA' : st || 'INATIVA'}
                      </span>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={applyBcSelection}
                disabled={bcSelected.size === 0}
                className="btn btn-primary w-full text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ➕ Adicionar {bcSelected.size > 0 ? `${bcSelected.size} conta(s)` : 'selecionadas'} ao campo abaixo
              </button>
            </>
          )}
        </div>

        {/* Config fields */}
        <div className="grid grid-cols-1 gap-4 mb-5">
          <div>
            <label className="label mb-1.5 block">Ad Account IDs <span className="text-gray-600">(um por linha)</span></label>
            <textarea
              className="input font-mono text-xs resize-none"
              rows={5}
              placeholder={'123456789012345\n234567890123456\n345678901234567'}
              value={accountIds}
              onChange={e => setAccountIds(e.target.value)}
              disabled={phase === 'checking' || phase === 'appealing'}
            />
            <p className="text-[10px] text-gray-600 mt-1">{accountIds.split('\n').filter(s => s.trim()).length} conta(s)</p>
          </div>
          <div>
            <label className="label mb-1.5 block">Proxy <span className="text-gray-600">(opcional — host:port:user:pass)</span></label>
            <input
              className="input font-mono text-xs"
              placeholder="1.2.3.4:8080:user:pass"
              value={proxy}
              onChange={e => setProxy(e.target.value)}
              disabled={phase === 'checking' || phase === 'appealing'}
            />
          </div>
        </div>

        <button
          onClick={runCheck}
          disabled={!accountIds.trim() || phase === 'checking' || phase === 'appealing'}
          className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          🔍 Verificar CTVs Rejeitados
        </button>
      </div>

      {/* Checking phase */}
      {phase === 'checking' && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold animate-pulse">🔍 Verificando contas...</span>
            <button onClick={() => { abortRef.current = true }} className="text-xs text-gray-500 hover:text-red-400">⛔ Cancelar</button>
          </div>
          <div className="bg-hawk-input rounded-lg p-3 font-mono text-xs leading-relaxed text-gray-300 max-h-64 overflow-y-auto space-y-0.5">
            {checkLogs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      )}

      {/* Results phase */}
      {phase === 'results' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm font-semibold">
                {foundAds.length > 0
                  ? `${foundAds.length} anúncio(s) rejeitado(s) em ${uniqueAccounts} conta(s)`
                  : 'Nenhum anúncio com review rejeitado encontrado ✓'}
              </span>
            </div>
            <button onClick={runCheck} className="btn btn-secondary btn-sm text-xs">🔄 Verificar novamente</button>
          </div>

          {foundAds.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="label">{selectedCount} selecionado(s)</span>
                <div className="flex gap-2">
                  <button className="text-[11px] text-hawk-accent hover:underline" onClick={() => setSelectedAds(new Set(foundAds.map(a => a.ad_id)))}>Todos</button>
                  <span className="text-gray-600">·</span>
                  <button className="text-[11px] text-gray-400 hover:underline" onClick={() => setSelectedAds(new Set())}>Nenhum</button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-[360px] overflow-y-auto mb-5">
                {foundAds.map(ad => {
                  const selected = selectedAds.has(ad.ad_id)
                  return (
                    <div
                      key={ad.ad_id}
                      onClick={() => toggleAd(ad.ad_id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer border transition-colors ${selected ? 'border-amber-500/50 bg-amber-500/5' : 'border-hawk-border hover:border-gray-500'}`}
                    >
                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${selected ? 'bg-amber-500 border-amber-500 text-black' : 'border-hawk-border'}`}>
                        {selected ? '✓' : ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold truncate">{ad.ad_name || '(sem nome)'}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{ad.advId} · {ad.ad_id}</div>
                      </div>
                      <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-400 flex-shrink-0">
                        {ad.operation_status}
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={runAppeal}
                disabled={selectedCount === 0}
                className="btn w-full bg-amber-500 hover:bg-amber-600 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ⚖️ Enviar Appeal em Massa ({selectedCount} selecionado{selectedCount !== 1 ? 's' : ''})
              </button>
            </>
          )}
        </div>
      )}

      {/* Appealing phase */}
      {phase === 'appealing' && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Enviando appeals...</span>
            <span className="text-xs text-gray-400">{appealProgress}%</span>
          </div>
          <div className="w-full bg-hawk-border rounded-full h-1.5 mb-4">
            <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: appealProgress + '%' }} />
          </div>
          <div className="bg-hawk-input rounded-lg p-3 font-mono text-xs leading-relaxed text-gray-300 max-h-64 overflow-y-auto space-y-0.5">
            {appealLogs.map((l, i) => (
              <div key={i} className={l.includes('] ✓') ? 'text-green-400' : l.includes('] ✗') ? 'text-red-400' : 'text-gray-500'}>{l}</div>
            ))}
          </div>
          <button onClick={() => { abortRef.current = true }} className="btn btn-secondary w-full mt-4 text-xs">⛔ Cancelar</button>
        </div>
      )}

      {/* Done phase */}
      {phase === 'done' && (
        <div className="card">
          <div className="text-center py-4 mb-4">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm font-semibold">
              <span className="text-green-400">✓ {successCount} appeal{successCount !== 1 ? 's' : ''} enviado{successCount !== 1 ? 's' : ''}</span>
              {errorCount > 0 && <span className="text-red-400 ml-3">✗ {errorCount} erro{errorCount !== 1 ? 's' : ''}</span>}
            </p>
          </div>

          <div className="flex gap-3 mb-4">
            <button onClick={() => { setPhase('idle'); setFoundAds([]); setCheckLogs([]); setAppealLogs([]); setAccountIds(''); setProxy('') }} className="btn btn-primary flex-1">
              🔄 Nova Verificação
            </button>
            <button onClick={() => setShowFullLog(v => !v)} className="btn btn-secondary flex-1">
              {showFullLog ? 'Ocultar Log' : 'Ver Log Completo'}
            </button>
          </div>

          {showFullLog && (
            <div className="bg-hawk-input rounded-lg p-3 font-mono text-xs leading-relaxed max-h-64 overflow-y-auto space-y-0.5">
              {appealLogs.map((l, i) => (
                <div key={i} className={l.includes('] ✓') ? 'text-green-400' : l.includes('] ✗') ? 'text-red-400' : 'text-gray-500'}>{l}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function Identities() {
  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🔗</div>
        <h2 className="text-lg font-bold">Identities & Spark Profiles</h2>
      </div>
      <p className="text-sm text-gray-400">Gerencie perfis Spark Ads e Custom Users vinculados.</p>
    </div>
  )
}

export function Pixels() {
  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">📡</div>
        <h2 className="text-lg font-bold">Pixels</h2>
      </div>
      <p className="text-sm text-gray-400">Crie, vincule e monitore seus TikTok Pixels.</p>
    </div>
  )
}

export function Settings() {
  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">⚙️</div>
        <h2 className="text-lg font-bold">Configurações</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div><label className="label mb-1.5 block">TikTok App ID</label><input className="input" defaultValue="7617705058569814033" /></div>
        <div><label className="label mb-1.5 block">App Secret</label><input className="input" type="password" defaultValue="a781230..." /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">Webhook URL</label><input className="input" placeholder="https://seusite.com/webhook" /></div>
        <div><label className="label mb-1.5 block">API Base</label><input className="input" disabled value="https://business-api.tiktok.com" /></div>
      </div>
    </div>
  )
}

export function Logs() {
  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">📜</div>
        <h2 className="text-lg font-bold">Logs de Atividade</h2>
      </div>
      <div className="p-3 bg-hawk-input rounded-md font-mono text-xs leading-[2] text-gray-500 max-h-[400px] overflow-y-auto">
        [{new Date().toISOString()}] Sistema iniciado<br />
        [{new Date().toISOString()}] Aguardando conexão TikTok Business...
      </div>
    </div>
  )
}
