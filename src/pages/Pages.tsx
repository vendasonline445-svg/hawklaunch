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

type AdItem = { advId: string; ad_id: string; adgroup_id: string; ad_name: string; operation_status: string }
type BcAccount = { advertiser_id: string; advertiser_name?: string; name?: string; advertiser_status?: string; status?: string }
type ScanState = 'idle' | 'scanning' | 'done'

export function Creatives() {
  const { bcId } = useAppStore()
  const [proxy, setProxy] = useState('')

  // BC account list
  const [bcAccounts, setBcAccounts] = useState<BcAccount[]>([])
  const [bcLoading, setBcLoading] = useState(false)
  const [bcLoaded, setBcLoaded] = useState(false)

  // Scan state: per-account rejected ad counts and ads
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [scanProgress, setScanProgress] = useState(0)
  const [scanLog, setScanLog] = useState<string[]>([])
  const [rejectedByAccount, setRejectedByAccount] = useState<Map<string, AdItem[]>>(new Map())
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())

  // Appeal state
  const [phase, setPhase] = useState<'idle' | 'appealing' | 'done'>('idle')
  const [appealLogs, setAppealLogs] = useState<string[]>([])
  const [appealProgress, setAppealProgress] = useState(0)
  const [showFullLog, setShowFullLog] = useState(false)
  const abortRef = useRef(false)

  function ts() {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  async function loadBcAccounts() {
    if (!bcId) return
    setBcLoading(true)
    setBcLoaded(false)
    setScanState('idle')
    setRejectedByAccount(new Map())
    setSelectedAccounts(new Set())
    try {
      const res = await api.getBcAdvertisers(bcId) as any
      const list: BcAccount[] = res.data?.list || []
      setBcAccounts(list)
      setBcLoaded(true)
    } catch {
      setBcAccounts([])
      setBcLoaded(true)
    } finally {
      setBcLoading(false)
    }
  }

  async function runScan() {
    if (bcAccounts.length === 0) return
    setScanState('scanning')
    setScanProgress(0)
    setScanLog([])
    setRejectedByAccount(new Map())
    setSelectedAccounts(new Set())
    abortRef.current = false

    const result = new Map<string, AdItem[]>()
    for (let i = 0; i < bcAccounts.length; i++) {
      if (abortRef.current) break
      const acc = bcAccounts[i]
      const advId = acc.advertiser_id
      const label = (acc.advertiser_name || acc.name || advId).slice(0, 30)
      setScanLog(prev => [...prev, `[${ts()}] 🔍 ${label}...`])
      try {
        const r = await api.listRejectedAds(advId, proxy || undefined) as any
        const list: AdItem[] = (r.data?.list || []).map((ad: any) => ({
          advId,
          ad_id: ad.ad_id,
          adgroup_id: ad.adgroup_id || '',
          ad_name: ad.ad_name,
          operation_status: ad.operation_status || ad.secondary_status || ad.primary_status || 'REVIEW_REJECT'
        }))
        result.set(advId, list)
        const scanned = r.data?.scanned ?? 0
        if (list.length > 0) {
          setScanLog(prev => [...prev, `[${ts()}] ⚠️ ${list.length} rejeitado(s) de ${scanned} ads — ${label}`])
        } else if (scanned > 0 && r.data?.debug_sample?.length > 0) {
          // Mostra status brutos para identificar os valores corretos da API
          const sample = r.data.debug_sample
          setScanLog(prev => [...prev, `[${ts()}] 🔎 ${scanned} ads, nenhum capturado. Status brutos (amostra):`])
          sample.forEach((s: any) => {
            setScanLog(prev => [...prev, `       op="${s.op}" sec="${s.sec}" pri="${s.pri}" st="${s.st}"`])
          })
        }
      } catch (e: any) {
        result.set(advId, [])
        setScanLog(prev => [...prev, `[${ts()}] ❌ Erro — ${label}: ${e.message}`])
      }
      setScanProgress(Math.round(((i + 1) / bcAccounts.length) * 100))
      if (i < bcAccounts.length - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, Math.floor(500 + Math.random() * 800)))
      }
    }

    setRejectedByAccount(new Map(result))
    // auto-seleciona contas com rejeições
    const withRejections = new Set([...result.entries()].filter(([, ads]) => ads.length > 0).map(([id]) => id))
    setSelectedAccounts(withRejections)
    setScanState('done')
  }

  function toggleAccount(id: string) {
    setSelectedAccounts(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  // Appeal em nível de ad — um request por ad_id
  const adsToAppeal: AdItem[] = [...selectedAccounts].flatMap(id => rejectedByAccount.get(id) || [])

  async function runAppeal() {
    if (adsToAppeal.length === 0) return
    setPhase('appealing')
    setAppealLogs([])
    setAppealProgress(0)
    abortRef.current = false

    for (let i = 0; i < adsToAppeal.length; i++) {
      if (abortRef.current) break
      const item = adsToAppeal[i]
      const label = (item.ad_name || item.ad_id).slice(0, 45)
      try {
        const r = await api.appealAd(item.advId, item.ad_id, proxy || undefined) as any
        if (r.code === 0) {
          setAppealLogs(prev => [...prev, `[${ts()}] ✓ ${label} — appeal enviado`])
        } else {
          setAppealLogs(prev => [...prev, `[${ts()}] ✗ ${label} — ${r.message || 'erro'}`])
        }
      } catch (e: any) {
        setAppealLogs(prev => [...prev, `[${ts()}] ✗ ${label} — ${e.message}`])
      }
      setAppealProgress(Math.round(((i + 1) / adsToAppeal.length) * 100))
      if (i < adsToAppeal.length - 1 && !abortRef.current) {
        setAppealLogs(prev => [...prev, `[${ts()}] ⏳ Aguardando...`])
        const delay = 2000 + ((Math.random() + Math.random()) / 2) * 3000
        await new Promise(r => setTimeout(r, Math.floor(delay)))
      }
    }
    setPhase('done')
  }

  const successCount = appealLogs.filter(l => l.includes('] ✓')).length
  const errorCount   = appealLogs.filter(l => l.includes('] ✗')).length
  const totalRejected = [...rejectedByAccount.values()].reduce((s, ads) => s + ads.length, 0)
  const accountsWithRejections = [...rejectedByAccount.entries()].filter(([, ads]) => ads.length > 0).length

  return (
    <div className="animate-fade-in space-y-5">

      {/* Header + config */}
      <div className="card">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 bg-amber-500/15 rounded-md flex items-center justify-center">⚖️</div>
          <div>
            <h2 className="text-lg font-bold">Appeal em Massa — CTV</h2>
            <p className="text-[11px] text-gray-500">Contesta anúncios com review rejeitado via TikTok Ads API</p>
          </div>
        </div>

        {/* Proxy */}
        <div className="mb-4">
          <label className="label mb-1.5 block">Proxy <span className="text-gray-600">(opcional — host:port:user:pass)</span></label>
          <input
            className="input font-mono text-xs"
            placeholder="1.2.3.4:8080:user:pass"
            value={proxy}
            onChange={e => setProxy(e.target.value)}
            disabled={scanState === 'scanning' || phase === 'appealing'}
          />
        </div>

        {/* Load + Scan buttons */}
        <div className="flex gap-3">
          <button
            onClick={loadBcAccounts}
            disabled={!bcId || bcLoading || scanState === 'scanning' || phase === 'appealing'}
            className="btn btn-secondary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {bcLoading ? '⏳ Carregando...' : '🔄 Carregar contas do BC'}
          </button>
          {bcLoaded && bcAccounts.length > 0 && (
            <button
              onClick={runScan}
              disabled={scanState === 'scanning' || phase === 'appealing'}
              className="btn btn-primary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🔍 Escanear CTVs Rejeitados
            </button>
          )}
        </div>

        {!bcId && <p className="text-[11px] text-gray-600 mt-3">Nenhum BC conectado. Conecte no Dashboard primeiro.</p>}
      </div>

      {/* Scan progress */}
      {scanState === 'scanning' && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold animate-pulse">🔍 Escaneando contas... {scanProgress}%</span>
            <button onClick={() => { abortRef.current = true }} className="text-xs text-gray-500 hover:text-red-400">⛔ Cancelar</button>
          </div>
          <div className="w-full bg-hawk-border rounded-full h-1.5 mb-3">
            <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: scanProgress + '%' }} />
          </div>
          <div className="bg-hawk-input rounded-lg p-3 font-mono text-xs leading-relaxed text-gray-400 max-h-48 overflow-y-auto space-y-0.5">
            {scanLog.map((l, i) => (
              <div key={i} className={l.includes('⚠️') ? 'text-amber-400' : l.includes('❌') ? 'text-red-400' : ''}>{l}</div>
            ))}
          </div>
        </div>
      )}

      {/* Account list with scan results */}
      {bcLoaded && bcAccounts.length > 0 && scanState !== 'scanning' && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-semibold">{bcAccounts.length} contas</span>
              {scanState === 'done' && (
                <span className="text-[11px] text-gray-500 ml-2">
                  — {accountsWithRejections > 0
                    ? <span className="text-amber-400">{totalRejected} ads rejeitados em {accountsWithRejections} conta(s)</span>
                    : <span className="text-green-400">nenhum rejeitado ✓</span>}
                </span>
              )}
            </div>
            {scanState === 'done' && accountsWithRejections > 0 && (
              <div className="flex gap-2">
                <button className="text-[11px] text-amber-400 hover:underline" onClick={() => {
                  const withRej = new Set([...rejectedByAccount.entries()].filter(([,ads]) => ads.length > 0).map(([id]) => id))
                  setSelectedAccounts(withRej)
                }}>Com rejeição</button>
                <span className="text-gray-600">·</span>
                <button className="text-[11px] text-hawk-accent hover:underline" onClick={() => setSelectedAccounts(new Set(bcAccounts.map(a => a.advertiser_id)))}>Todas</button>
                <span className="text-gray-600">·</span>
                <button className="text-[11px] text-gray-400 hover:underline" onClick={() => setSelectedAccounts(new Set())}>Nenhuma</button>
              </div>
            )}
          </div>

          <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
            {bcAccounts.map(acc => {
              const id = acc.advertiser_id
              const label = acc.advertiser_name || acc.name || id
              const st = acc.advertiser_status || acc.status || ''
              const isActive = st === 'STATUS_ENABLE' || st === 'ENABLE'
              const sel = selectedAccounts.has(id)
              const rejectedAds = rejectedByAccount.get(id)
              const rejCount = rejectedAds?.length ?? null
              const scanned = scanState === 'done'

              return (
                <div
                  key={id}
                  onClick={() => scanned && rejCount !== null && rejCount > 0 ? toggleAccount(id) : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors
                    ${scanned && rejCount !== null && rejCount > 0
                      ? sel
                        ? 'border-amber-500/60 bg-amber-500/8 cursor-pointer'
                        : 'border-red-500/30 bg-red-500/5 cursor-pointer hover:border-red-400/50'
                      : 'border-hawk-border'}
                  `}
                >
                  {/* Checkbox — só mostra se escaneado e tem rejeições */}
                  {scanned && rejCount !== null && rejCount > 0 ? (
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${sel ? 'bg-amber-500 border-amber-500 text-black' : 'border-red-400'}`}>
                      {sel ? '✓' : ''}
                    </div>
                  ) : (
                    <div className="w-4 h-4 flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium truncate">{label}</div>
                    <div className="text-[10px] text-gray-600 font-mono">{id}</div>
                  </div>

                  {/* Status da conta */}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${isActive ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-500'}`}>
                    {isActive ? 'ATIVA' : st || 'INATIVA'}
                  </span>

                  {/* Badge de scan */}
                  {scanned && rejCount !== null && (
                    rejCount > 0
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 flex-shrink-0 ml-1">
                          ⚠️ {rejCount} rejeitado{rejCount !== 1 ? 's' : ''}
                        </span>
                      : <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/15 text-green-400 flex-shrink-0 ml-1">
                          ✓ OK
                        </span>
                  )}
                  {scanned && rejCount === null && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-500/15 text-gray-500 flex-shrink-0 ml-1">erro</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Appeal button */}
          {scanState === 'done' && adsToAppeal.length > 0 && phase === 'idle' && (
            <div className="mt-4 space-y-2">
              <p className="text-[11px] text-gray-500 text-center">
                {adsToAppeal.length} ad{adsToAppeal.length !== 1 ? 's' : ''} rejeitado{adsToAppeal.length !== 1 ? 's' : ''} em {selectedAccounts.size} conta{selectedAccounts.size !== 1 ? 's' : ''} selecionada{selectedAccounts.size !== 1 ? 's' : ''}
              </p>
              <button
                onClick={runAppeal}
                className="btn w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                ⚖️ Enviar Appeal — {adsToAppeal.length} ad{adsToAppeal.length !== 1 ? 's' : ''} de {selectedAccounts.size} conta{selectedAccounts.size !== 1 ? 's' : ''}
              </button>
            </div>
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
            <div className="text-3xl mb-2">⚖️</div>
            <p className="text-sm font-semibold">
              <span className="text-green-400">✓ {successCount} appeal{successCount !== 1 ? 's' : ''} enviado{successCount !== 1 ? 's' : ''}</span>
              {errorCount > 0 && <span className="text-red-400 ml-3">✗ {errorCount} erro{errorCount !== 1 ? 's' : ''}</span>}
            </p>
          </div>

          <div className="flex gap-3 mb-4">
            <button onClick={() => { setPhase('idle'); setScanState('idle'); setRejectedByAccount(new Map()); setSelectedAccounts(new Set()); setAppealLogs([]) }} className="btn btn-primary flex-1">
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
