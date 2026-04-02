import { useState, useEffect, useMemo, useRef } from 'react'
import { useAppStore } from '@/store'
import { api } from '@/lib/api'
import { useAccounts } from '@/hooks/useAccounts'

const STEPS_DEFAULT = ['Contas', 'Identity', 'Criativos', 'Estrutura', 'Targeting', 'Proxy', 'Lançar']
const STEPS_QUEUE = ['Fila', 'Contas', 'Smart+', 'Manual', 'Proxy', 'Lançar']

export default function Launch() {
  const { currentStep, setStep, campaignType, setCampaignType } = useAppStore()
  const isQueue = campaignType === 'queue'
  const steps = isQueue ? STEPS_QUEUE : STEPS_DEFAULT

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-4 gap-3 mb-7">
        {([
          { type: 'smart-spark', icon: '🔥', title: 'Smart+ V2', badge: 'novo', cls: 'badge-new' },
          { type: 'smart-catalog', icon: '⚡', title: 'Smart+ V1', badge: 'legado', cls: 'badge-popular' },
          { type: 'manual', icon: '🎯', title: 'Manual', badge: 'clássico', cls: 'badge-catalog' },
          { type: 'queue', icon: '📋', title: 'Nova Fila', badge: 'combo', cls: 'badge-new' },
        ] as const).map(c => (
          <div key={c.type} onClick={() => { setCampaignType(c.type as any); setStep(0) }}
            className={`bg-hawk-card border-2 rounded-xl p-4 cursor-pointer transition-all relative ${campaignType === c.type ? 'border-hawk-accent bg-hawk-accent/5' : 'border-hawk-border hover:border-gray-500'}`}>
            {campaignType === c.type && <div className="absolute top-2 right-2 w-5 h-5 bg-hawk-accent rounded-full flex items-center justify-center text-[10px] text-white font-bold">✓</div>}
            <span className="text-xl">{c.icon}</span>
            <span className="text-sm font-bold ml-2">{c.title}</span>
            <span className={`badge ${c.cls} ml-2`}>{c.badge}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-1 mb-7 bg-[#12141c] p-1.5 rounded-xl overflow-x-auto">
        {steps.map((s, i) => (
          <div key={i} onClick={() => setStep(i)} className={`step-tab ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}>
            <span className="block font-mono text-[10px] opacity-60 mb-0.5">{String(i+1).padStart(2,'0')}</span>{s}
          </div>
        ))}
      </div>
      {isQueue ? (
        <>
          {currentStep === 0 && <QueueStepBuilder />}
          {currentStep === 1 && <StepAccounts nextStep={2} />}
          {currentStep === 2 && <QueueSmartConfig />}
          {currentStep === 3 && <QueueManualConfig />}
          {currentStep === 4 && <StepProxy prevStep={3} nextStep={5} />}
          {currentStep === 5 && <StepLaunch />}
        </>
      ) : (
        <>
          {currentStep === 0 && <StepAccounts />}
          {currentStep === 1 && (campaignType === 'manual' ? <ManualStepIdentity /> : <StepIdentity />)}
          {currentStep === 2 && (campaignType === 'manual' ? <ManualStepCreative /> : <StepCreative />)}
          {currentStep === 3 && (campaignType === 'manual' ? <ManualStepStructure /> : <StepStructure />)}
          {currentStep === 4 && (campaignType === 'manual' ? <ManualStepTargeting /> : <StepTargeting />)}
          {currentStep === 5 && <StepProxy />}
          {currentStep === 6 && <StepLaunch />}
        </>
      )}
    </div>
  )
}

/* ====== STEP 0: ACCOUNTS (cached + TikTok links) ====== */
function StepAccounts({ nextStep = 1 }: { nextStep?: number }) {
  const { setStep, bcId, setSelectedAccounts } = useAppStore()
  const { accounts, selected, loading, loadAccounts, toggle, selectAll, selectNone, setSelected, campaignStatus, checkingCampaigns, campaignCheckProgress } = useAccounts(bcId)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [deleting, setDeleting] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState({ done: 0, total: 0, errors: 0 })
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const counts = useMemo(() => {
    const canRun = accounts.filter(a => a.status === 'STATUS_ENABLE').length
    const withCamp = accounts.filter(a => campaignStatus[a.advertiser_id] === true).length
    const noCamp = accounts.filter(a => campaignStatus[a.advertiser_id] === false).length
    return { total: accounts.length, canRun, suspended: accounts.length - canRun, withCamp, noCamp }
  }, [accounts, campaignStatus])

  const filtered = useMemo(() => {
    let list = accounts
    if (filter === 'active') list = list.filter(a => a.status === 'STATUS_ENABLE')
    if (filter === 'suspended') list = list.filter(a => a.status !== 'STATUS_ENABLE')
    if (filter === 'no_campaign') list = list.filter(a => campaignStatus[a.advertiser_id] === false)
    if (filter === 'with_campaign') list = list.filter(a => campaignStatus[a.advertiser_id] === true)
    if (search) { const q = search.toLowerCase(); list = list.filter(a => (a.advertiser_name||'').toLowerCase().includes(q) || (a.advertiser_id||'').includes(q)) }
    return list
  }, [accounts, filter, search, campaignStatus])

  function statusBadge(s: string) {
    if (s === 'STATUS_ENABLE') return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/15 text-green-400">ATIVA</span>
    if (s === 'STATUS_SELF_SERVICE_UNAUDITED') return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/15 text-orange-400">UNAUDITED</span>
    if (s === 'STATUS_PUNISHED') return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-400">SUSPENSA</span>
    if (s === 'STATUS_DISABLE') return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-400">DESATIVADA</span>
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-500/15 text-gray-400">{s?.replace('STATUS_','') || 'N/A'}</span>
  }

  function openInTikTok(ids: string[]) {
    if (ids.length === 0) return
    if (!window.confirm(`Tem certeza que deseja abrir ${ids.length} conta(s) no navegador?`)) return
    ids.forEach((id, i) => {
      setTimeout(() => {
        window.open(`https://ads.tiktok.com/i18n/manage/campaign?aadvid=${id}&is_refresh_page=true`, '_blank')
      }, i * 350)
    })
  }

  const accountsWithCampaign = accounts.filter(a => campaignStatus[a.advertiser_id] === true)

  const [deleteLog, setDeleteLog] = useState<string[]>([])
  const addDeleteLog = (msg: string) => setDeleteLog(prev => [...prev, msg])

  async function deleteCampaignsFromSelected() {
    const targets = [...selected].filter(id => campaignStatus[id] === true)
    if (targets.length === 0) return
    setDeleting(true)
    setDeleteLog([])
    setDeleteProgress({ done: 0, total: targets.length, errors: 0 })

    // Lê proxies configuradas para usar uma por conta
    const proxyList = (localStorage.getItem('hawklaunch_proxy_list') || '')
      .split('\n').map(p => p.trim()).filter(Boolean)

    let errors = 0
    for (let i = 0; i < targets.length; i++) {
      const advId = targets[i]
      const acc = accounts.find(a => a.advertiser_id === advId)
      const accName = acc?.advertiser_name || advId
      const proxy = proxyList.length > 0 ? proxyList[i % proxyList.length] : undefined

      addDeleteLog('━━━ (' + (i+1) + '/' + targets.length + ') ' + accName)
      if (proxy) addDeleteLog('🛡️ Proxy: ' + proxy.replace(/\/\/([^:]+):([^@]+)@/, '//**:**@'))

      try {
        const r = await api.deleteCampaigns(advId, proxy)
        if ((r as any).code === 0) {
          const d = (r as any).data
          addDeleteLog('✅ ' + d.deleted + '/' + d.total + ' campanha(s) deletada(s)')
          if (d.errors && d.errors.length) d.errors.forEach((e: string) => addDeleteLog('⚠️ ' + e))
        } else {
          addDeleteLog('❌ ' + ((r as any).message || 'Erro'))
          errors++
        }
      } catch(e: any) {
        addDeleteLog('❌ ' + e.message)
        errors++
      }

      setDeleteProgress({ done: i + 1, total: targets.length, errors })

      // Delay humano entre contas: 20-35 segundos para não correlacionar requests
      if (i < targets.length - 1) {
        const wait = Math.floor(Math.random() * 15000) + 20000
        addDeleteLog('⏳ Aguardando ' + Math.round(wait/1000) + 's antes da próxima conta...')
        await new Promise(r => setTimeout(r, wait))
      }
    }

    setDeleting(false)
    loadAccounts()
  }

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5"><div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">👥</div><h2 className="text-lg font-bold">Select Ad Accounts</h2></div>
        <div className="text-sm text-gray-400"><span className="text-hawk-accent font-bold">{selected.size}</span> selecionada(s)</div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="bg-hawk-card border border-hawk-border rounded-2xl w-[420px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🗑️</span>
              <h3 className="text-lg font-bold">Deletar campanhas</h3>
            </div>
            {!deleting && deleteLog.length === 0 ? (
              <>
                <p className="text-sm text-gray-400 mb-2">
                  Serão deletadas <strong className="text-white">todas as campanhas</strong> das contas abaixo:
                </p>
                <div className="max-h-[160px] overflow-y-auto mb-3 space-y-1">
                  {[...selected].filter(id => campaignStatus[id] === true).map(id => {
                    const acc = accounts.find(a => a.advertiser_id === id)
                    return <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-hawk-input rounded text-xs"><span className="text-orange-400">⚠</span><span className="truncate">{acc?.advertiser_name || id}</span></div>
                  })}
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300 mb-3">
                  🛡️ Cada conta será processada individualmente com delays de 20-35s e proxy dedicada para não acionar o antifraude.
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-300 mb-5">
                  ⚠️ Irreversível — campanhas serão marcadas como DELETADAS no TikTok Ads.
                </div>
                <div className="flex gap-3">
                  <button className="btn btn-secondary flex-1" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                  <button className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors"
                    onClick={deleteCampaignsFromSelected}>
                    🗑️ Confirmar Delete
                  </button>
                </div>
              </>
            ) : (
              <div className="py-2">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>{deleting ? '🗑️ Deletando...' : '✅ Concluído'}</span>
                  <span>{deleteProgress.done}/{deleteProgress.total} contas</span>
                </div>
                <div className="h-2 bg-hawk-input rounded-full overflow-hidden mb-3">
                  <div className={'h-full rounded-full transition-all ' + (deleting ? 'bg-red-500' : 'bg-green-500')}
                    style={{width: deleteProgress.total > 0 ? (deleteProgress.done / deleteProgress.total * 100) + '%' : '0%'}} />
                </div>
                <div className="max-h-[200px] overflow-y-auto space-y-0.5 bg-hawk-bg rounded-lg p-3 font-mono text-[11px]">
                  {deleteLog.map((l, i) => (
                    <div key={i} className={'leading-relaxed ' + (l.startsWith('✅') ? 'text-green-400' : l.startsWith('❌') ? 'text-red-400' : l.startsWith('⚠') ? 'text-yellow-400' : l.startsWith('⏳') ? 'text-gray-500' : l.startsWith('🛡') ? 'text-blue-400' : 'text-gray-300')}>{l}</div>
                  ))}
                </div>
                {!deleting && (
                  <button className="btn btn-primary w-full mt-4" onClick={() => { setShowDeleteModal(false); setDeleteLog([]) }}>Fechar</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button className="btn btn-primary btn-sm" onClick={loadAccounts}>
          {loading ? '⏳ Carregando...' : accounts.length > 0 ? '↻ Recarregar' : 'Load Accounts'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => selectAll(filtered.map(a => a.advertiser_id))}>Todas visíveis</button>
        <button className="btn btn-secondary btn-sm" onClick={selectNone}>Nenhuma</button>
        {accountsWithCampaign.length > 0 && (
          <button className="btn btn-secondary btn-sm border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
            onClick={() => setSelected(new Set(accountsWithCampaign.map(a => a.advertiser_id)))}>
            📢 Selecionar c/ campanha ({accountsWithCampaign.length})
          </button>
        )}
        {[...selected].some(id => campaignStatus[id] === true) && (
          <button className="btn btn-secondary btn-sm border-red-500/40 text-red-400 hover:bg-red-500/10"
            onClick={() => setShowDeleteModal(true)}>
            🗑️ Deletar campanhas ({[...selected].filter(id => campaignStatus[id] === true).length})
          </button>
        )}
      </div>

      {/* Search */}
      {checkingCampaigns && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="flex-1 h-1 bg-hawk-input rounded-full overflow-hidden">
            <div className="h-full bg-hawk-accent/50 rounded-full transition-all duration-300" style={{width: campaignCheckProgress + '%'}} />
          </div>
          <span className="text-[11px] text-gray-500">Verificando campanhas... {campaignCheckProgress}%</span>
        </div>
      )}
      <input className="input mb-4" placeholder="🔍 Buscar conta..." value={search} onChange={e => setSearch(e.target.value)} />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'all', label: `Todas (${counts.total})` },
          { key: 'active', label: `✅ Ativas (${counts.canRun})` },
          { key: 'no_campaign', label: `🆓 Sem campanha (${counts.noCamp})` },
          { key: 'with_campaign', label: `📢 Com campanha (${counts.withCamp})` },
          { key: 'suspended', label: `🚫 Suspensas (${counts.suspended})` },
        ].map(f => (
          <div key={f.key} className={`chip ${filter===f.key?'active':''}`} onClick={() => setFilter(f.key)}>{f.label}</div>
        ))}
      </div>

      {/* Account list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">⏳ Carregando contas do BC...</div>
      ) : filtered.length > 0 ? (
        <div className="max-h-[500px] overflow-y-auto border border-hawk-border rounded-lg divide-y divide-hawk-border">
          {filtered.map(a => (
            <div key={a.advertiser_id} onClick={() => toggle(a.advertiser_id)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${selected.has(a.advertiser_id)?'bg-hawk-accent/5':'hover:bg-hawk-card'}`}>
              <div className={`w-5 h-5 border-2 rounded flex items-center justify-center text-xs flex-shrink-0 ${selected.has(a.advertiser_id)?'bg-hawk-accent border-hawk-accent text-white':'border-hawk-border'}`}>
                {selected.has(a.advertiser_id)?'✓':''}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{a.advertiser_name}</div>
                <a href={`https://ads.tiktok.com/i18n/manage/campaign?aadvid=${a.advertiser_id}&is_refresh_page=true`} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="text-[11px] text-gray-500 font-mono hover:text-hawk-accent hover:underline transition-colors">{a.advertiser_id}</a>
              </div>
              {statusBadge(a.status)}
              {campaignStatus[a.advertiser_id] === true && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/15 text-orange-400">COM CAMP</span>
              )}
              {campaignStatus[a.advertiser_id] === false && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400">LIVRE</span>
              )}
            </div>
          ))}
        </div>
      ) : accounts.length > 0 ? (
        <div className="text-center py-12 text-gray-500">Nenhuma conta neste filtro</div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="text-2xl mb-2">👥</div>
          Clique em "Load Accounts" para carregar as contas do BC
        </div>
      )}

      {/* TikTok Ads Manager Links */}
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-hawk-input rounded-lg">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          🔗 Abrir no TikTok Ads Manager
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" disabled={selected.size === 0}
            onClick={() => openInTikTok([...selected])}>
            Abrir Selecionadas ({selected.size})
          </button>
          <button className="btn btn-secondary btn-sm" disabled={filtered.length === 0}
            onClick={() => openInTikTok(filtered.map(a => a.advertiser_id))}>
            Abrir Todas
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-hawk-border">
        <div className="text-xs text-hawk-accent font-semibold">{selected.size} conta(s) selecionada(s)</div>
        <button className="btn btn-primary" onClick={() => {
          setSelectedAccounts(accounts.filter(a => selected.has(a.advertiser_id)))
          setStep(nextStep)
        }} disabled={selected.size === 0}>Próximo →</button>
      </div>
    </div>
  )
}

/* ====== STEP 1: IDENTITY ====== */
function StepIdentity() {
  const { setStep, selectedAccounts } = useAppStore()
  const [identityType, setIdentityType] = useState<'spark'|'custom'>('spark')
  const [identities, setIdentities] = useState<any[]>([])
  const [loadingId, setLoadingId] = useState(false)
  const [selectedIdentity, setSelectedIdentity] = useState('')

  useEffect(() => {
    if (!selectedAccounts.length) return
    setLoadingId(true)
    api.getIdentities(selectedAccounts[0].advertiser_id)
      .then(res => { const l = res.data?.list || []; setIdentities(l); if (l.length) setSelectedIdentity(l[0].identity_id) })
      .finally(() => setLoadingId(false))
  }, [selectedAccounts])

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🔗</div>
        <h2 className="text-lg font-bold">Identity</h2>
      </div>
      <div className="bg-purple-500/8 border border-purple-500/20 rounded-lg p-4 flex gap-3 mb-5">
        <span className="text-xl">💡</span>
        <div className="text-[13px] text-gray-300 leading-relaxed">
          <strong className="text-gray-100">Spark Ads</strong> usa um perfil TikTok real — engagement vai pro perfil. <strong className="text-gray-100">Custom User</strong> cria perfil fictício.
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[{ key:'spark', icon:'🔗', title:'Spark Ads', desc:'Perfil TikTok real via BC' },
          { key:'custom', icon:'⚡', title:'Custom User', desc:'Nome + avatar customizado' }].map(t => (
          <div key={t.key} onClick={() => setIdentityType(t.key as any)}
            className={`bg-hawk-input border-2 rounded-lg p-5 cursor-pointer text-center ${identityType===t.key?'border-purple-500 bg-purple-500/5':'border-hawk-border'}`}>
            <div className="text-2xl mb-2">{t.icon}</div><div className="text-sm font-bold">{t.title}</div><div className="text-[11px] text-gray-500 mt-1">{t.desc}</div>
          </div>
        ))}
      </div>
      {identityType === 'spark' && (
        <div className="card-sm bg-hawk-input">
          <label className="label mb-1.5 block">Perfil Spark</label>
          {loadingId ? <span className="text-xs text-gray-400">⏳</span> :
          <select className="select" value={selectedIdentity} onChange={e => setSelectedIdentity(e.target.value)}>
            {identities.length === 0 && <option>Nenhuma identity</option>}
            {identities.map((id:any) => <option key={id.identity_id} value={id.identity_id}>{id.display_name || id.identity_id} ({id.identity_type})</option>)}
          </select>}
          <button className="btn btn-secondary btn-sm mt-3" onClick={() => {
            if (!selectedAccounts[0]) return; setLoadingId(true)
            api.getIdentities(selectedAccounts[0].advertiser_id).then(res=>{const l=res.data?.list||[];setIdentities(l);if(l.length)setSelectedIdentity(l[0].identity_id)}).finally(()=>setLoadingId(false))
          }}>↻ Sincronizar</button>
          <ToggleRow title="Mesma Identity para todas" desc="Mesmo perfil em todas as contas" defaultOn />
        </div>
      )}
      {identityType === 'custom' && (
        <div className="card-sm bg-hawk-input">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label mb-1.5 block">Nome</label><input className="input" placeholder="Loja Achados" /></div>
            <div><label className="label mb-1.5 block">Idioma</label><select className="select"><option>🇧🇷 PT</option><option>🇺🇸 EN</option></select></div>
          </div>
          <button className="btn btn-primary btn-sm mt-4">⚡ Criar em todas</button>
        </div>
      )}
      <StepFooter prev={0} next={2} />
    </div>
  )
}

/* ====== STEP 2: CRIATIVOS (Spark Codes) ====== */
function StepCreative() {
  const { selectedAccounts } = useAppStore()
  const [creativeMode, setCreativeMode] = useState<'spark-codes'|'upload'|'library'>('spark-codes')
  const [sparkCodes, setSparkCodes] = useState(() => localStorage.getItem('hawklaunch_spark_codes') || '')
  const [videos, setVideos] = useState<any[]>([])
  const [selectedV, setSelectedV] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [destinationUrl, setDestinationUrl] = useState(() => localStorage.getItem('hawklaunch_dest_url') || '')
  const [domainList, setDomainList] = useState(() => localStorage.getItem('hawklaunch_domain_list') || '')

  const domainLines = domainList.split('\n').map(l => l.trim()).filter(Boolean)
  const [adTexts, setAdTexts] = useState(() => localStorage.getItem('hawklaunch_ad_texts') || '')
  const sparkCodeList = sparkCodes.split('\n').map(c => c.trim()).filter(c => c.length > 0)

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-6"><div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🎬</div><h2 className="text-lg font-bold">Criativos</h2></div>
      <h4 className="label mb-3">Fonte dos criativos</h4>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[{ key:'spark-codes', icon:'🔗', title:'Spark Codes', desc:'Códigos de autorização' },
          { key:'upload', icon:'📤', title:'Upload', desc:'Envie vídeos' },
          { key:'library', icon:'📚', title:'Biblioteca', desc:'Vídeos da conta' }].map(m => (
          <div key={m.key} onClick={() => setCreativeMode(m.key as any)}
            className={`bg-hawk-input border-2 rounded-lg p-4 cursor-pointer text-center ${creativeMode===m.key?'border-hawk-accent bg-hawk-accent/5':'border-hawk-border'}`}>
            <div className="text-xl mb-1">{m.icon}</div><div className="text-xs font-bold">{m.title}</div><div className="text-[10px] text-gray-500 mt-1">{m.desc}</div>
          </div>
        ))}
      </div>

      {creativeMode === 'spark-codes' && (
        <div className="card-sm bg-hawk-input mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold">🔗 Spark Ad Codes</h4>
            <span className="text-xs text-gray-400">{sparkCodeList.length} código(s)</span>
          </div>
          <div className="bg-purple-500/8 border border-purple-500/20 rounded-lg p-3 flex gap-3 mb-4">
            <span className="text-base">💡</span>
            <div className="text-[12px] text-gray-300">TikTok app → vídeo → ⋯ → Ad Settings → Generate Code. Um por linha.</div>
          </div>
          <textarea className="input font-mono text-xs min-h-[120px]" placeholder={"Cole os Spark Ad codes (um por linha):\n\n#sHt4m+ih406ylUODt/1YNSMs84oToAd+KtNAcnyI4MxMdUpHykmr2FfmI6xeX7Y="} value={sparkCodes} onChange={e => { setSparkCodes(e.target.value); localStorage.setItem('hawklaunch_spark_codes', e.target.value) }} />
          {sparkCodeList.length > 0 && <div className="mt-3 space-y-2">
            {sparkCodeList.map((code, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-hawk-bg rounded-md">
                <span className="text-green-400 text-xs">✓</span>
                <span className="font-mono text-[11px] text-gray-300 flex-1 truncate">{code}</span>
                <button className="text-gray-500 hover:text-red-400 text-xs" onClick={() => setSparkCodes(sparkCodes.split('\n').filter(l => l.trim() !== code).join('\n'))}>✕</button>
              </div>
            ))}
          </div>}
        </div>
      )}

      {creativeMode === 'upload' && (
        <div className="card-sm bg-hawk-input mb-4">
          <div className="border-2 border-dashed border-hawk-border rounded-lg p-8 text-center cursor-pointer hover:border-gray-500">
            <div className="text-3xl mb-2">📁</div><div className="text-sm text-gray-400">Arraste vídeos ou clique para selecionar</div><div className="text-[10px] text-gray-500 mt-1">MP4, MOV — Máx 500MB</div>
          </div>
        </div>
      )}

      {creativeMode === 'library' && (
        <div className="card-sm bg-hawk-input mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold">📚 Biblioteca</h4>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              if (!selectedAccounts[0]) return; setLoading(true)
              api.getVideos(selectedAccounts[0].advertiser_id).then(res => setVideos(res.data?.list||[])).finally(() => setLoading(false))
            }}>{loading ? '⏳' : '↻ Carregar'}</button>
          </div>
          {videos.length > 0 ? <div className="grid grid-cols-5 gap-3">
            {videos.slice(0,20).map((v:any) => { const id=v.video_id||v.material_id; return <div key={id} onClick={()=>{const n=new Set(selectedV);n.has(id)?n.delete(id):n.add(id);setSelectedV(n)}}
              className={`bg-hawk-bg border-2 rounded-lg overflow-hidden cursor-pointer relative ${selectedV.has(id)?'border-hawk-accent':'border-hawk-border'}`}>
              <div className="w-full aspect-[9/16] bg-[#12141c] flex items-center justify-center">{v.preview_url||v.video_cover_url?<img src={v.preview_url||v.video_cover_url} className="w-full h-full object-cover"/>:<span className="text-xl text-gray-600">🎥</span>}</div>
              <div className="p-1.5"><div className="text-[9px] truncate">{v.file_name||id}</div></div>
              {selectedV.has(id)&&<div className="absolute top-1 right-1 w-4 h-4 bg-hawk-accent rounded-full flex items-center justify-center text-[8px] text-white">✓</div>}
            </div>})}
          </div> : <div className="text-center py-8 text-gray-500 text-sm">Clique em "Carregar"</div>}
        </div>
      )}

      <div className="pt-5 border-t border-hawk-border">
        <h4 className="label mb-3">Detalhes do anúncio</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="label mb-1.5 block">URL de destino <span className="required">*</span></label><input className="input" placeholder="https://seusite.com/oferta" value={destinationUrl} onChange={e=>{setDestinationUrl(e.target.value);localStorage.setItem("hawklaunch_dest_url",e.target.value)}} /></div>
          <div className="mt-4 p-4 bg-hawk-input border border-hawk-border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold">🔄 Rodízio de domínios</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400">recomendado</span>
            </div>
            <div className="text-[12px] text-gray-400 mb-3 leading-relaxed">
              {domainLines.length > 0 && destinationUrl
                ? <span className="text-yellow-400">⚠️ Rodízio ativo — a URL de destino será ignorada</span>
                : domainLines.length > 0
                ? <span className="text-green-400">✓ Rodízio ativo</span>
                : <span>Se preenchido, cada conta recebe um domínio diferente. Deixe vazio para usar a URL de destino.</span>
              }
            </div>
            <textarea
              className="input font-mono text-xs min-h-[90px]"
              placeholder={"https://loja1.com/oferta\nhttps://loja2.com/oferta\nhttps://loja3.com/oferta"}
              value={domainList}
              onChange={e => { setDomainList(e.target.value); localStorage.setItem('hawklaunch_domain_list', e.target.value) }}
            />
            {domainLines.length > 0 && (
              <div className="text-[11px] text-gray-500 mt-1.5 px-1">
                📋 {domainLines.slice(0, 3).map((d, i) => `Conta ${i+1} → ${d}`).join(' · ')}{domainLines.length > 3 ? ' ...' : ' (demais rotacionam)'}
              </div>
            )}
          </div>
        </div>
        <label className="label mb-1.5 block">Textos (um por linha)</label>
        <textarea className="input min-h-[60px]" placeholder="Oferta imperdível!" value={adTexts} onChange={e=>{setAdTexts(e.target.value);localStorage.setItem("hawklaunch_ad_texts",e.target.value)}} />
      </div>
      <div className="mt-4 px-4 py-3 bg-hawk-input rounded-lg flex items-center justify-between">
        <span className="text-xs text-gray-400">{creativeMode==='spark-codes'?`${sparkCodeList.length} código(s)`:creativeMode==='library'?`${selectedV.size} vídeo(s)`:'Upload'}</span>
        {destinationUrl&&<span className="text-[10px] text-green-400">✓ URL configurada</span>}
      </div>
      <StepFooter prev={1} next={3} />
    </div>
  )
}

/* ====== STEPS 3-6 ====== */
function StepStructure() {
  const { selectedAccounts } = useAppStore()
  const [name, setName] = useState(() => localStorage.getItem('hawklaunch_offer_name') || '')
  const [pixels, setPixels] = useState<any[]>([])
  const [loadingPixels, setLoadingPixels] = useState(false)
  const [selectedPixel, setSelectedPixel] = useState(() => localStorage.getItem('hawklaunch_pixel_id') || '')

  function loadPixels() {
    if (!selectedAccounts[0]) return
    setLoadingPixels(true)
    api.getPixels(selectedAccounts[0].advertiser_id)
      .then((res: any) => {
        const list = res.data?.pixels || []
        setPixels(list)
        if (list.length > 0 && !selectedPixel) {
          setSelectedPixel(list[0].pixel_id)
          localStorage.setItem('hawklaunch_pixel_id', list[0].pixel_id)
        }
      })
      .finally(() => setLoadingPixels(false))
  }

  return <div className="card animate-fade-in"><h2 className="text-lg font-bold mb-5">🏗️ Structure</h2>

    {/* Pixel selector */}
    <div className="card-sm bg-hawk-input mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold">📡 Data Connection (Pixel)</h4>
        <button className="btn btn-secondary btn-sm" onClick={loadPixels}>{loadingPixels ? '⏳' : '📥 Carregar Pixels'}</button>
      </div>
      {pixels.length > 0 ? (
        <div className="space-y-2">
          {pixels.map((p: any) => (
            <div key={p.pixel_id} onClick={() => { setSelectedPixel(p.pixel_id); localStorage.setItem('hawklaunch_pixel_id', p.pixel_id) }}
              className={'flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors border ' + (selectedPixel === p.pixel_id ? 'border-hawk-accent bg-hawk-accent/5' : 'border-hawk-border hover:border-gray-500')}>
              <div className={'w-5 h-5 border-2 rounded-full flex items-center justify-center text-xs flex-shrink-0 ' + (selectedPixel === p.pixel_id ? 'bg-hawk-accent border-hawk-accent text-white' : 'border-hawk-border')}>
                {selectedPixel === p.pixel_id ? '✓' : ''}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold">{p.pixel_name || 'Pixel'}</div>
                <div className="text-[11px] text-gray-500 font-mono">{p.pixel_id}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/15 text-green-400">Ativo</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          {selectedPixel ? <span className="text-green-400 text-xs">✓ Pixel selecionado: {selectedPixel}</span> : 'Clique em "Carregar Pixels" para selecionar'}
        </div>
      )}
    </div>

    <div className="grid grid-cols-2 gap-4 mb-4">
      <div><label className="label mb-1.5 block">Campanhas por conta</label><input className="input" type="number" defaultValue={localStorage.getItem('hawklaunch_camps_per_account') || (localStorage.setItem('hawklaunch_camps_per_account', '5'), '5')} min={1} max={20} onChange={e => localStorage.setItem('hawklaunch_camps_per_account', e.target.value)}/></div>
      <div><label className="label mb-1.5 block">Anúncios por código Spark</label><input className="input" type="number" defaultValue={localStorage.getItem('hawklaunch_ads_per_code') || (localStorage.setItem('hawklaunch_ads_per_code', '2'), '2')} min={1} max={10} onChange={e => localStorage.setItem('hawklaunch_ads_per_code', e.target.value)}/></div>
      <div><label className="label mb-1.5 block">Evento de otimização</label><select className="select" onChange={e => localStorage.setItem('hawklaunch_opt_event', e.target.value)}><option value="SHOPPING">Purchase</option><option value="INITIATE_ORDER">Initiate Checkout</option><option value="ON_WEB_CART">Add to Cart</option><option value="ON_WEB_DETAIL">View Content</option><option value="ADD_BILLING">Add Payment Info</option></select></div>
    </div>

    <div className="bg-purple-500/8 border border-purple-500/20 rounded-lg p-3 flex gap-3 mb-4"><span className="text-base">💡</span><div className="text-[12px] text-gray-300">Smart+ usa orçamento automático no nível da campanha. Estrutura: <strong>1 campanha → 1 ad group → N ads</strong> por conta.</div></div>

    <div className="grid grid-cols-2 gap-4 mb-4">
      <div><label className="label mb-1.5 block">Budget diário (BRL)</label><input className="input" type="number" defaultValue={80} onChange={e => localStorage.setItem('hawklaunch_budget', e.target.value)}/></div>
      <div><label className="label mb-1.5 block">Target CPA</label><input className="input" type="number" placeholder="55" onChange={e => localStorage.setItem('hawklaunch_target_cpa', e.target.value)}/></div>
    </div>

    <ToggleRow title="Randomizar orçamento" desc="Valor aleatório"/>

    <div className="mt-4 pt-4 border-t border-hawk-border">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">Oferta</label><input className="input" value={name} onChange={e=>{setName(e.target.value);localStorage.setItem('hawklaunch_offer_name',e.target.value)}} placeholder="CREME FACIAL"/></div>
        <div><label className="label mb-1.5 block">Seq.</label><input className="input" type="number" defaultValue={1}/></div>
      </div>
      <div className="mt-2 px-3 py-2 bg-hawk-input rounded font-mono text-sm text-hawk-accent">{name||'OFERTA'} 01</div>
    </div>

    <StepFooter prev={2} next={4}/>
  </div>
}
function StepTargeting() {
  const [auto, setAuto] = useState(true)
  return <div className="card animate-fade-in"><h2 className="text-lg font-bold mb-5">🎯 Targeting</h2>
    <ToggleRow title="Auto Targeting" desc="IA do TikTok" defaultOn onChange={setAuto}/>
    <div className={auto?'opacity-40 pointer-events-none mt-4':'mt-4'}><div className="flex flex-wrap gap-2 mb-4">{['18–24','25–34','35–44','45–54','55+'].map(a=><div key={a} className="chip active">{a}</div>)}</div>
    <div className="grid grid-cols-2 gap-4"><div><label className="label mb-1.5 block">País</label><select className="select"><option>🇧🇷 Brasil</option></select></div><div><label className="label mb-1.5 block">Idioma</label><select className="select"><option>Português</option></select></div></div></div>
    <StepFooter prev={3} next={5}/></div>
}
function StepProxy({ prevStep = 4, nextStep = 6 }: { prevStep?: number; nextStep?: number }) {
  const [proxyText, setProxyText] = useState(() => localStorage.getItem('hawklaunch_proxy_list') || '')
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  const proxyLines = proxyText.split('\n').map(l => l.trim()).filter(Boolean)

  function save(val: string) {
    setProxyText(val)
    localStorage.setItem('hawklaunch_proxy_list', val)
    setTestResults([])
  }

  async function testAll() {
    if (!proxyLines.length) return
    setTesting(true)
    setTestResults([])
    const results: any[] = []
    for (let i = 0; i < proxyLines.length; i++) {
      const proxy = proxyLines[i]
      setTestResults([...results, { proxy, status: 'testing' }])
      try {
        const r = await api.testProxy(proxy)
        results.push({ proxy, ...r })
      } catch(e: any) {
        results.push({ proxy, ok: false, error: e.message })
      }
      setTestResults([...results])
    }
    setTesting(false)
  }

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🛡️</div>
        <h2 className="text-lg font-bold">Proxy <span className="text-xs text-gray-500 font-normal ml-2">Opcional</span></h2>
      </div>
      <div className="bg-blue-500/8 border border-blue-500/20 rounded-lg p-4 flex gap-3 mb-5">
        <span className="text-lg">💡</span>
        <div className="text-[13px] text-gray-300 leading-relaxed">
          Uma proxy por linha — atribuída sequencialmente por conta. Se tiver menos proxies que contas, rotaciona.<br/>
          <span className="text-gray-500 text-[12px]">Formatos: <code className="text-hawk-accent">login:senha@host:porta</code> · <code className="text-hawk-accent">host:porta:login:senha</code> · <code className="text-hawk-accent">http://login:senha@host:porta</code></span>
        </div>
      </div>
      <label className="label mb-2 block">Lista de proxies ({proxyLines.length} {proxyLines.length === 1 ? 'proxy' : 'proxies'})</label>
      <textarea
        className="input font-mono text-xs min-h-[140px] mb-3"
        placeholder={"abec7834753bde966d32:e35d1f5e118ccc12@gw.dataimpulse.com:823\nlogin2:senha2@host2:porta2"}
        value={proxyText}
        onChange={e => save(e.target.value)}
      />
      <button className="btn btn-secondary mb-4" disabled={testing || proxyLines.length === 0} onClick={testAll}>
        {testing ? '⏳ Testando...' : '🔌 Testar ' + (proxyLines.length > 0 ? proxyLines.length + ' proxy(ies)' : 'proxies')}
      </button>
      {testResults.length > 0 && (
        <div className="space-y-2 mb-4">
          {testResults.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-[12px] font-mono ${r.status === 'testing' ? 'border-hawk-border bg-hawk-input text-gray-400' : r.ok ? 'border-green-500/30 bg-green-500/5 text-green-300' : 'border-red-500/30 bg-red-500/5 text-red-300'}`}>
              <span className="flex-shrink-0">{r.status === 'testing' ? '⏳' : r.ok ? '✅' : '❌'}</span>
              <span className="flex-1 truncate text-gray-400">{r.proxy.replace(/:([^:@]+)@/, ':**@')}</span>
              {r.ok && <span className="text-green-400 font-semibold">{r.ip}</span>}
              {r.ok && <span className="text-gray-500">{r.latency_ms}ms</span>}
              {!r.ok && r.error && <span className="text-red-400 truncate max-w-[200px]">{r.error}</span>}
            </div>
          ))}
        </div>
      )}
      {proxyLines.length > 0 && (
        <div className="text-[12px] text-gray-500 mb-4 px-1">
          📋 {proxyLines.slice(0, 3).map((p, i) => `Conta ${i+1} → proxy ${i+1}`).join(' · ')}{proxyLines.length < 3 ? ' (demais rotacionam)' : '...'}
        </div>
      )}
      <StepFooter prev={prevStep} next={nextStep}/>
    </div>
  )
}
function StepLaunch() {
  const { setStep, selectedAccounts, campaignType } = useAppStore()
  const [launching, setLaunching] = useState(false)
  const abortRef = useRef(false)
  const [progress, setProgress] = useState(0)
  const [schedule, setSchedule] = useState('now')
  const [customSchedule, setCustomSchedule] = useState('')
  const [startPaused, setStartPaused] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  // Log system with categories
  type LogEntry = { time: string; cat: 'INFO'|'OK'|'ERROR'|'WARN'|'DEBUG'; msg: string }
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logFilter, setLogFilter] = useState('All')

  function addLog(cat: LogEntry['cat'], msg: string) {
    setLogs(p => [...p, { time: new Date().toLocaleTimeString(), cat, msg }])
  }

  const counts = {
    errors: logs.filter(l => l.cat === 'ERROR').length,
    warnings: logs.filter(l => l.cat === 'WARN').length,
    success: logs.filter(l => l.cat === 'OK').length,
    info: logs.filter(l => l.cat === 'INFO' || l.cat === 'DEBUG').length,
  }

  const filteredLogs = logFilter === 'All' ? logs :
    logFilter === 'Errors' ? logs.filter(l => l.cat === 'ERROR') :
    logFilter === 'Warnings' ? logs.filter(l => l.cat === 'WARN') :
    logFilter === 'Success' ? logs.filter(l => l.cat === 'OK') :
    logs.filter(l => l.cat === 'DEBUG')

  function buildScheduleStart() {
    if (schedule === 'custom' && customSchedule) {
      const utcDate = new Date(customSchedule)
      const s = utcDate.toISOString().replace('T', ' ').substring(0, 19)
      addLog('INFO', '🕐 Início agendado: ' + customSchedule + ' local → ' + s + ' UTC')
      return s
    }
    if (schedule !== 'now') {
      const mins = schedule === '1h' ? 60 : schedule === '3h' ? 180 : schedule === '6h' ? 360 : schedule === '12h' ? 720 : 60
      const s = new Date(Date.now() + mins * 60000).toISOString().replace('T', ' ').substring(0, 19)
      addLog('INFO', '🕐 Início agendado: +' + schedule + ' → ' + s + ' UTC')
      return s
    }
    return undefined
  }

  async function launch() {
    setLaunching(true); setLogs([]); setProgress(0); setResult(null); setShowModal(true); abortRef.current = false
    if (campaignType === 'queue') {
      await launchQueue()
    } else if (campaignType === 'manual') {
      await launchManual()
    } else {
      await launchSmart()
    }
    setLaunching(false)
  }

  async function launchSmart() {
    const sparkCodes = (localStorage.getItem('hawklaunch_spark_codes') || '').split('\n').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
    const proxyList = (localStorage.getItem('hawklaunch_proxy_list') || '').split('\n').map((p: string) => p.trim()).filter((p: string) => p.length > 0)
    localStorage.removeItem('hawklaunch_cta_cache')
    const ctaCacheSaved: Record<string, string> = {}
    const destUrl = localStorage.getItem('hawklaunch_dest_url') || ''
    const domainList = (localStorage.getItem('hawklaunch_domain_list') || '').split('\n').map((d: string) => d.trim()).filter((d: string) => d.length > 0)
    const adTexts = (localStorage.getItem('hawklaunch_ad_texts') || '').split('\n').filter((t: string) => t.trim())
    const budget = parseInt(localStorage.getItem('hawklaunch_budget') || '80')
    const targetCpa = parseInt(localStorage.getItem('hawklaunch_target_cpa') || '0')
    const adsPerCode = parseInt(localStorage.getItem('hawklaunch_ads_per_code') || '2')
    const offerName = localStorage.getItem('hawklaunch_offer_name') || 'HL'

    if (sparkCodes.length === 0) { addLog('ERROR', 'Nenhum Spark Code configurado!'); return }
    if (!destUrl) { addLog('ERROR', 'URL de destino não configurada!'); return }

    addLog('INFO', 'Iniciando lançamento Smart+ V2...')
    if (domainList.length > 0) addLog('INFO', '🌐 Rodízio: ' + domainList.length + ' domínio(s)')
    if (proxyList.length > 0) addLog('INFO', '🛡️ Proxy: ' + proxyList.length + ' proxy(ies)')
    else addLog('WARN', '⚠️ Sem proxy — IP da Vercel')
    addLog('INFO', selectedAccounts.length + ' conta(s) × ' + sparkCodes.length + ' código(s) × ' + adsPerCode + ' ad(s)/código')
    addLog('DEBUG', 'Budget: R$' + budget + '/dia | CPA: ' + (targetCpa ? 'R$' + targetCpa : 'Auto'))
    setProgress(5)

    const scheduleStart = buildScheduleStart()
    const campsPerAcc = parseInt(localStorage.getItem('hawklaunch_camps_per_account') || '5')
    let totalResult = { campaigns: 0, adgroups: 0, ads: 0 }
    let allErrors: any[] = []
    const rndWait = (min: number, max: number) => new Promise(r => setTimeout(r, Math.floor(min + ((Math.random() + Math.random()) / 2) * (max - min))))

    try {
      const payload = {
        accounts: selectedAccounts,
        campaign_name: offerName,
        adgroup_name: 'AG ' + offerName,
        ad_name: offerName,
        spark_codes: sparkCodes,
        rotation: true,
        campaigns_per_account: campsPerAcc,
        ads_per_code: adsPerCode,
        landing_page_url: destUrl,
        domain_list: domainList,
        cta_cache: ctaCacheSaved,
        start_paused: startPaused,
        ad_texts: adTexts,
        budget,
        target_cpa: targetCpa || undefined,
        pixel_id: localStorage.getItem('hawklaunch_pixel_id') || undefined,
        optimization_event: localStorage.getItem('hawklaunch_opt_event') || 'SHOPPING',
        location_ids: ['3469034'],
        schedule_start: scheduleStart,
      }

      for (let ai = 0; ai < selectedAccounts.length; ai++) {
        const acc = selectedAccounts[ai]
        addLog('INFO', '━━━ Conta ' + (ai+1) + '/' + selectedAccounts.length + ': ' + (acc.advertiser_name || acc.advertiser_id) + ' ━━━')
        if (abortRef.current) { addLog('WARN', '⛔ Lançamento interrompido pelo usuário'); break }
        if (ai > 0) { addLog('INFO', '⏳ Aguardando antes da próxima conta...'); await rndWait(120000, 180000) }

        let accountNoPermission = false
        for (let cp = 0; cp < campsPerAcc; cp++) {
          if (abortRef.current) { addLog('WARN', '⛔ Interrompido'); break }
          if (accountNoPermission) break
          if (cp > 0) { addLog('DEBUG', '⏳ Aguardando entre campanhas...'); await rndWait(4000, 8000) }
          setProgress(Math.round(15 + (((ai * campsPerAcc + cp) / (selectedAccounts.length * campsPerAcc)) * 80)))

          const singlePayload = { ...payload, accounts: [acc], campaigns_per_account: 1, start_seq: 1 + (ai * campsPerAcc) + cp, proxy_list: proxyList, account_index: ai }
          try {
            const r = await api.launchSmart(singlePayload)
            if (r.code === 0 && r.data) {
              const d = r.data as any
              totalResult.campaigns += d.campaigns || 0
              totalResult.adgroups += d.adgroups || 0
              totalResult.ads += d.ads || 0
              if (d.cta_cache) {
                const merged = { ...ctaCacheSaved, ...d.cta_cache }
                localStorage.setItem('hawklaunch_cta_cache', JSON.stringify(merged))
                Object.assign(ctaCacheSaved, d.cta_cache)
              }
              if (d.logs) d.logs.forEach((l: any) => {
                const cat = l.message.includes('❌') ? 'ERROR' : l.message.includes('✅') ? 'OK' : l.message.includes('⚠') ? 'WARN' : 'INFO'
                addLog(cat, l.message)
              })
              if (d.errors) {
                allErrors.push(...d.errors)
                if (d.errors.some((e: any) => e.step === 'spark' && (e.error || '').toLowerCase().includes('permission'))) {
                  accountNoPermission = true
                }
              }
            } else { addLog('ERROR', 'API: ' + ((r as any).message || (r as any).error || '?')) }
          } catch(e: any) { addLog('ERROR', 'Fatal: ' + e.message) }
        }
      }
    } catch(err: any) { addLog('ERROR', 'Fatal: ' + err.message) }

    setProgress(100)
    setResult(totalResult)
    addLog('OK', '✅ MISSÃO COMPLETA! ' + totalResult.campaigns + ' camp, ' + totalResult.adgroups + ' ag, ' + totalResult.ads + ' ads')
    if (allErrors.length) allErrors.forEach((e: any) => addLog('ERROR', '[' + e.step + '] ' + e.error))
  }

  async function launchManual() {
    const identityType = localStorage.getItem('hawklaunch_manual_identity_type') || 'AUTH_CODE'
    const identityId = localStorage.getItem('hawklaunch_manual_identity_id') || ''
    const displayName = localStorage.getItem('hawklaunch_manual_display_name') || ''
    const objective = localStorage.getItem('hawklaunch_manual_objective') || 'CONVERSIONS'
    const budgetMode = localStorage.getItem('hawklaunch_manual_budget_mode') || 'cbo'
    const bidPrice = localStorage.getItem('hawklaunch_manual_bid_price') || '0'
    const callToAction = localStorage.getItem('hawklaunch_manual_cta') || 'SHOP_NOW'
    const videoIdsRaw = localStorage.getItem('hawklaunch_manual_video_ids')
    const videoIds: string[] = videoIdsRaw ? JSON.parse(videoIdsRaw) : []
    const sparkCodes = (localStorage.getItem('hawklaunch_spark_codes') || '').split('\n').map((c: string) => c.trim()).filter(Boolean)
    const proxyList = (localStorage.getItem('hawklaunch_proxy_list') || '').split('\n').map((p: string) => p.trim()).filter(Boolean)
    const destUrl = localStorage.getItem('hawklaunch_dest_url') || ''
    const domainList = (localStorage.getItem('hawklaunch_domain_list') || '').split('\n').map((d: string) => d.trim()).filter(Boolean)
    const adTexts = (localStorage.getItem('hawklaunch_ad_texts') || '').split('\n').filter((t: string) => t.trim())
    const budget = parseInt(localStorage.getItem('hawklaunch_budget') || '50')
    const adsPerCode = parseInt(localStorage.getItem('hawklaunch_ads_per_code') || '1')
    const campsPerAcc = parseInt(localStorage.getItem('hawklaunch_camps_per_account') || '1')
    const offerName = localStorage.getItem('hawklaunch_offer_name') || 'HL'
    const autoTarget = localStorage.getItem('hawklaunch_manual_auto_target') !== 'false'
    const ageGroupsRaw = localStorage.getItem('hawklaunch_manual_age_groups')
    const ageGroups = ageGroupsRaw ? JSON.parse(ageGroupsRaw) : []
    const gender = localStorage.getItem('hawklaunch_manual_gender') || 'GENDER_UNLIMITED'
    const osRaw = localStorage.getItem('hawklaunch_manual_os')
    const osTarget = osRaw ? JSON.parse(osRaw) : ['ANDROID', 'IOS']

    // Validações
    if (identityType === 'AUTH_CODE' && sparkCodes.length === 0) { addLog('ERROR', 'Nenhum Spark Code configurado!'); return }
    if (identityType !== 'AUTH_CODE' && videoIds.length === 0) { addLog('ERROR', 'Nenhum vídeo selecionado na biblioteca!'); return }
    if (!destUrl && domainList.length === 0) { addLog('ERROR', 'URL de destino não configurada!'); return }

    addLog('INFO', 'Iniciando lançamento Manual Campaigns...')
    addLog('INFO', 'Objetivo: ' + objective + ' | Identity: ' + identityType + ' | Budget Mode: ' + budgetMode.toUpperCase())
    if (proxyList.length > 0) addLog('INFO', '🛡️ Proxy: ' + proxyList.length + ' proxy(ies)')
    else addLog('WARN', '⚠️ Sem proxy — IP da Vercel')
    addLog('DEBUG', 'Budget: R$' + budget + '/dia | Lance: ' + (parseFloat(bidPrice) > 0 ? 'R$' + bidPrice : 'Auto'))
    setProgress(5)

    const scheduleStart = buildScheduleStart()
    const rndWait = (min: number, max: number) => new Promise(r => setTimeout(r, Math.floor(min + ((Math.random() + Math.random()) / 2) * (max - min))))
    let totalResult = { campaigns: 0, adgroups: 0, ads: 0 }
    let allErrors: any[] = []

    const billingByObjective: Record<string, string> = {
      CONVERSIONS: 'OCPM', TRAFFIC: 'OCPM', REACH: 'CPM', VIDEO_VIEWS: 'OCPM',
    }
    const goalByObjective: Record<string, string> = {
      CONVERSIONS: 'CONVERT', TRAFFIC: 'CLICK', REACH: 'REACH', VIDEO_VIEWS: 'VIDEO_PLAY',
    }

    try {
      const payload = {
        campaign_name: offerName,
        adgroup_name: 'AG ' + offerName,
        ad_name: offerName,
        objective_type: objective,
        budget_mode: budgetMode,
        budget,
        bid_price: parseFloat(bidPrice) > 0 ? bidPrice : undefined,
        billing_event: billingByObjective[objective] || 'OCPM',
        optimization_goal: goalByObjective[objective] || 'CONVERT',
        identity_type: identityType,
        identity_id: identityId || undefined,
        display_name: displayName || undefined,
        spark_codes: sparkCodes,
        video_ids: videoIds,
        rotation: true,
        ads_per_code: adsPerCode,
        call_to_action: callToAction,
        landing_page_url: destUrl,
        domain_list: domainList,
        ad_texts: adTexts,
        pixel_id: localStorage.getItem('hawklaunch_pixel_id') || undefined,
        optimization_event: localStorage.getItem('hawklaunch_opt_event') || 'SHOPPING',
        start_paused: startPaused,
        location_ids: ['3469034'],
        schedule_start: scheduleStart,
        age_groups: autoTarget ? [] : ageGroups,
        gender: autoTarget ? 'GENDER_UNLIMITED' : gender,
        os: autoTarget ? [] : osTarget,
      }

      for (let ai = 0; ai < selectedAccounts.length; ai++) {
        const acc = selectedAccounts[ai]
        addLog('INFO', '━━━ Conta ' + (ai+1) + '/' + selectedAccounts.length + ': ' + (acc.advertiser_name || acc.advertiser_id) + ' ━━━')
        if (abortRef.current) { addLog('WARN', '⛔ Interrompido'); break }
        if (ai > 0) { addLog('INFO', '⏳ Aguardando antes da próxima conta...'); await rndWait(120000, 180000) }

        let accountNoPermission = false
        for (let cp = 0; cp < campsPerAcc; cp++) {
          if (abortRef.current) { addLog('WARN', '⛔ Interrompido'); break }
          if (accountNoPermission) break
          if (cp > 0) { addLog('DEBUG', '⏳ Aguardando entre campanhas...'); await rndWait(4000, 8000) }
          setProgress(Math.round(15 + (((ai * campsPerAcc + cp) / (selectedAccounts.length * campsPerAcc)) * 80)))

          const singlePayload = { ...payload, accounts: [acc], campaigns_per_account: 1, start_seq: 1 + (ai * campsPerAcc) + cp, proxy_list: proxyList, account_index: ai }
          try {
            const r = await api.launchManual(singlePayload)
            if (r.code === 0 && r.data) {
              const d = r.data as any
              totalResult.campaigns += d.campaigns || 0
              totalResult.adgroups += d.adgroups || 0
              totalResult.ads += d.ads || 0
              if (d.logs) d.logs.forEach((l: any) => {
                const cat = l.message.includes('❌') ? 'ERROR' : l.message.includes('✅') ? 'OK' : l.message.includes('⚠') ? 'WARN' : 'INFO'
                addLog(cat, l.message)
              })
              if (d.errors) {
                allErrors.push(...d.errors)
                if (d.errors.some((e: any) => e.step === 'spark' && (e.error || '').toLowerCase().includes('permission'))) {
                  accountNoPermission = true
                }
              }
            } else { addLog('ERROR', 'API: ' + ((r as any).message || (r as any).error || '?')) }
          } catch(e: any) { addLog('ERROR', 'Fatal: ' + e.message) }
        }
      }
    } catch(err: any) { addLog('ERROR', 'Fatal: ' + err.message) }

    setProgress(100)
    setResult(totalResult)
    addLog('OK', '✅ MISSÃO COMPLETA! ' + totalResult.campaigns + ' camp, ' + totalResult.adgroups + ' ag, ' + totalResult.ads + ' ads')
    if (allErrors.length) allErrors.forEach((e: any) => addLog('ERROR', '[' + e.step + '] ' + e.error))
  }

  async function launchQueue() {
    const smartCount = parseInt(localStorage.getItem('hawklaunch_queue_smart_count') || '0')
    const manualCount = parseInt(localStorage.getItem('hawklaunch_queue_manual_count') || '0')

    const sparkCodes = (localStorage.getItem('hawklaunch_spark_codes') || '').split('\n').map((c: string) => c.trim()).filter(Boolean)
    const proxyList = (localStorage.getItem('hawklaunch_proxy_list') || '').split('\n').map((p: string) => p.trim()).filter(Boolean)
    const destUrl = localStorage.getItem('hawklaunch_dest_url') || ''
    const domainList = (localStorage.getItem('hawklaunch_domain_list') || '').split('\n').map((d: string) => d.trim()).filter(Boolean)
    const adTexts = (localStorage.getItem('hawklaunch_ad_texts') || '').split('\n').filter((t: string) => t.trim())

    const smartBudget = parseInt(localStorage.getItem('hawklaunch_queue_smart_budget') || '80')
    const smartName = localStorage.getItem('hawklaunch_queue_smart_name') || 'S+'
    const targetCpa = parseInt(localStorage.getItem('hawklaunch_target_cpa') || '0')
    const adsPerCode = parseInt(localStorage.getItem('hawklaunch_ads_per_code') || '2')

    const manualBudget = parseInt(localStorage.getItem('hawklaunch_queue_manual_budget') || '50')
    const manualName = localStorage.getItem('hawklaunch_queue_manual_name') || 'MN'
    const identityType = localStorage.getItem('hawklaunch_manual_identity_type') || 'AUTH_CODE'
    const objective = localStorage.getItem('hawklaunch_manual_objective') || 'CONVERSIONS'
    const budgetMode = localStorage.getItem('hawklaunch_manual_budget_mode') || 'cbo'
    const bidPrice = localStorage.getItem('hawklaunch_manual_bid_price') || '0'
    const callToAction = localStorage.getItem('hawklaunch_manual_cta') || 'SHOP_NOW'
    const autoTarget = localStorage.getItem('hawklaunch_manual_auto_target') !== 'false'
    const ageGroups = (() => { try { return JSON.parse(localStorage.getItem('hawklaunch_manual_age_groups') || '[]') } catch { return [] } })()
    const gender = localStorage.getItem('hawklaunch_manual_gender') || 'GENDER_UNLIMITED'
    const osTarget = (() => { try { return JSON.parse(localStorage.getItem('hawklaunch_manual_os') || '["ANDROID","IOS"]') } catch { return ['ANDROID', 'IOS'] } })()

    if (sparkCodes.length === 0) { addLog('ERROR', 'Nenhum Spark Code configurado!'); return }
    if (!destUrl && domainList.length === 0) { addLog('ERROR', 'URL de destino não configurada!'); return }

    localStorage.removeItem('hawklaunch_cta_cache')
    const ctaCacheSaved: Record<string, string> = {}

    addLog('INFO', 'Iniciando lançamento Fila: ' + smartCount + ' Smart+ + ' + manualCount + ' Manual por conta')
    addLog('INFO', selectedAccounts.length + ' conta(s) selecionada(s)')
    if (proxyList.length > 0) addLog('INFO', '🛡️ Proxy: ' + proxyList.length + ' proxy(ies)')
    else addLog('WARN', '⚠️ Sem proxy — IP da Vercel')
    if (smartCount > 0) addLog('DEBUG', 'Smart+: R$' + smartBudget + '/dia | CPA: ' + (targetCpa ? 'R$' + targetCpa : 'Auto') + ' | Nome: ' + smartName)
    if (manualCount > 0) addLog('DEBUG', 'Manual: R$' + manualBudget + '/dia | ' + budgetMode.toUpperCase() + ' | Nome: ' + manualName)
    setProgress(5)

    const scheduleStart = buildScheduleStart()
    const rndWait = (min: number, max: number) => new Promise(r => setTimeout(r, Math.floor(min + ((Math.random() + Math.random()) / 2) * (max - min))))
    let totalResult = { campaigns: 0, adgroups: 0, ads: 0 }
    let allErrors: any[] = []
    const totalCampsPerAccount = smartCount + manualCount

    const billingByObjective: Record<string, string> = { CONVERSIONS: 'OCPM', TRAFFIC: 'OCPM', REACH: 'CPM', VIDEO_VIEWS: 'OCPM' }
    const goalByObjective: Record<string, string> = { CONVERSIONS: 'CONVERT', TRAFFIC: 'CLICK', REACH: 'REACH', VIDEO_VIEWS: 'VIDEO_PLAY' }

    const smartPayload = {
      accounts: selectedAccounts, campaign_name: smartName, adgroup_name: 'AG ' + smartName, ad_name: smartName,
      spark_codes: sparkCodes, rotation: true, campaigns_per_account: 1, ads_per_code: adsPerCode,
      landing_page_url: destUrl, domain_list: domainList, cta_cache: ctaCacheSaved, start_paused: startPaused, ad_texts: adTexts,
      budget: smartBudget, target_cpa: targetCpa || undefined,
      pixel_id: localStorage.getItem('hawklaunch_pixel_id') || undefined,
      optimization_event: localStorage.getItem('hawklaunch_opt_event') || 'SHOPPING',
      location_ids: ['3469034'], schedule_start: scheduleStart,
    }

    const manualPayload = {
      campaign_name: manualName, adgroup_name: 'AG ' + manualName, ad_name: manualName,
      objective_type: objective, budget_mode: budgetMode, budget: manualBudget,
      bid_price: parseFloat(bidPrice) > 0 ? bidPrice : undefined,
      billing_event: billingByObjective[objective] || 'OCPM', optimization_goal: goalByObjective[objective] || 'CONVERT',
      identity_type: identityType, spark_codes: sparkCodes, video_ids: [] as string[], rotation: true, ads_per_code: adsPerCode,
      call_to_action: callToAction, landing_page_url: destUrl, domain_list: domainList, ad_texts: adTexts,
      pixel_id: localStorage.getItem('hawklaunch_pixel_id') || undefined,
      optimization_event: localStorage.getItem('hawklaunch_opt_event') || 'SHOPPING',
      start_paused: startPaused, location_ids: ['3469034'], schedule_start: scheduleStart,
      age_groups: autoTarget ? [] : ageGroups, gender: autoTarget ? 'GENDER_UNLIMITED' : gender, os: autoTarget ? [] : osTarget,
    }

    try {
      for (let ai = 0; ai < selectedAccounts.length; ai++) {
        const acc = selectedAccounts[ai]
        addLog('INFO', '━━━ Conta ' + (ai+1) + '/' + selectedAccounts.length + ': ' + (acc.advertiser_name || acc.advertiser_id) + ' ━━━')
        if (abortRef.current) { addLog('WARN', '⛔ Interrompido'); break }
        if (ai > 0) { addLog('INFO', '⏳ Aguardando antes da próxima conta...'); await rndWait(120000, 180000) }

        let seqCounter = 1
        let accountNoPermission = false

        // Smart+ campaigns
        if (smartCount > 0) {
          addLog('INFO', '🔥 Smart+ — ' + smartCount + ' campanha(s)...')
          for (let cp = 0; cp < smartCount; cp++) {
            if (abortRef.current || accountNoPermission) break
            if (seqCounter > 1) { addLog('DEBUG', '⏳ Aguardando entre campanhas...'); await rndWait(4000, 8000) }
            setProgress(Math.round(15 + (((ai * totalCampsPerAccount + seqCounter - 1) / (selectedAccounts.length * totalCampsPerAccount)) * 80)))

            const singlePayload = { ...smartPayload, accounts: [acc], campaigns_per_account: 1, start_seq: seqCounter, proxy_list: proxyList, account_index: ai }
            try {
              const r = await api.launchSmart(singlePayload)
              if (r.code === 0 && r.data) {
                const d = r.data as any
                totalResult.campaigns += d.campaigns || 0; totalResult.adgroups += d.adgroups || 0; totalResult.ads += d.ads || 0
                if (d.cta_cache) { Object.assign(ctaCacheSaved, d.cta_cache); localStorage.setItem('hawklaunch_cta_cache', JSON.stringify(ctaCacheSaved)) }
                if (d.logs) d.logs.forEach((l: any) => { const cat = l.message.includes('❌') ? 'ERROR' : l.message.includes('✅') ? 'OK' : l.message.includes('⚠') ? 'WARN' : 'INFO'; addLog(cat, l.message) })
                if (d.errors) { allErrors.push(...d.errors); if (d.errors.some((e: any) => e.step === 'spark' && (e.error || '').toLowerCase().includes('permission'))) accountNoPermission = true }
              } else { addLog('ERROR', 'API: ' + ((r as any).message || '?')) }
            } catch(e: any) { addLog('ERROR', 'Fatal: ' + e.message) }
            seqCounter++
          }
        }

        // Manual campaigns
        if (manualCount > 0 && !accountNoPermission) {
          addLog('INFO', '🎯 Manual — ' + manualCount + ' campanha(s)...')
          for (let cp = 0; cp < manualCount; cp++) {
            if (abortRef.current || accountNoPermission) break
            if (seqCounter > 1) { addLog('DEBUG', '⏳ Aguardando entre campanhas...'); await rndWait(4000, 8000) }
            setProgress(Math.round(15 + (((ai * totalCampsPerAccount + seqCounter - 1) / (selectedAccounts.length * totalCampsPerAccount)) * 80)))

            const singlePayload = { ...manualPayload, accounts: [acc], campaigns_per_account: 1, start_seq: seqCounter, proxy_list: proxyList, account_index: ai }
            try {
              const r = await api.launchManual(singlePayload)
              if (r.code === 0 && r.data) {
                const d = r.data as any
                totalResult.campaigns += d.campaigns || 0; totalResult.adgroups += d.adgroups || 0; totalResult.ads += d.ads || 0
                if (d.logs) d.logs.forEach((l: any) => { const cat = l.message.includes('❌') ? 'ERROR' : l.message.includes('✅') ? 'OK' : l.message.includes('⚠') ? 'WARN' : 'INFO'; addLog(cat, l.message) })
                if (d.errors) { allErrors.push(...d.errors); if (d.errors.some((e: any) => e.step === 'spark' && (e.error || '').toLowerCase().includes('permission'))) accountNoPermission = true }
              } else { addLog('ERROR', 'API: ' + ((r as any).message || '?')) }
            } catch(e: any) { addLog('ERROR', 'Fatal: ' + e.message) }
            seqCounter++
          }
        }
      }
    } catch(err: any) { addLog('ERROR', 'Fatal: ' + err.message) }

    setProgress(100)
    setResult(totalResult)
    addLog('OK', '✅ MISSÃO COMPLETA! ' + totalResult.campaigns + ' camp, ' + totalResult.adgroups + ' ag, ' + totalResult.ads + ' ads')
    if (allErrors.length) allErrors.forEach((e: any) => addLog('ERROR', '[' + e.step + '] ' + e.error))
  }

  function catColor(cat: string) {
    if (cat === 'OK') return 'text-green-400 bg-green-500/15'
    if (cat === 'ERROR') return 'text-red-400 bg-red-500/15'
    if (cat === 'WARN') return 'text-yellow-400 bg-yellow-500/15'
    if (cat === 'INFO') return 'text-blue-400 bg-blue-500/15'
    return 'text-gray-400 bg-gray-500/15'
  }

  const manualIdentityType = localStorage.getItem('hawklaunch_manual_identity_type') || 'AUTH_CODE'
  const manualVideoIds = (() => { try { const r = localStorage.getItem('hawklaunch_manual_video_ids'); return r ? JSON.parse(r) : [] } catch { return [] } })()
  const queueSmartCount = parseInt(localStorage.getItem('hawklaunch_queue_smart_count') || '0')
  const queueManualCount = parseInt(localStorage.getItem('hawklaunch_queue_manual_count') || '0')
  const checklist = campaignType === 'queue' ? [
    { ok: true, t: 'Conectado ao TikTok' },
    { ok: selectedAccounts.length > 0, t: selectedAccounts.length + ' conta(s) selecionada(s)' },
    { ok: queueSmartCount + queueManualCount > 0, t: '📋 Fila: ' + queueSmartCount + ' Smart+ + ' + queueManualCount + ' Manual por conta' },
    { ok: !!(localStorage.getItem('hawklaunch_spark_codes') || '').trim(), t: 'Spark Codes configurados' },
    { ok: !!(localStorage.getItem('hawklaunch_dest_url') || '').trim() || !!(localStorage.getItem('hawklaunch_domain_list') || '').trim(), t: 'URL de destino configurada' },
    { ok: true, t: (localStorage.getItem('hawklaunch_proxy_list') || '').trim() ? '🛡️ Proxy: ' + (localStorage.getItem('hawklaunch_proxy_list') || '').split('\n').filter((l: string) => l.trim()).length + ' proxy(ies)' : '⚠️ Sem proxy (IP da Vercel)' },
  ] : campaignType === 'manual' ? [
    { ok: true, t: 'Conectado ao TikTok' },
    { ok: selectedAccounts.length > 0, t: selectedAccounts.length + ' conta(s) selecionada(s)' },
    { ok: true, t: '🎯 Modo: Manual — ' + (localStorage.getItem('hawklaunch_manual_objective') || 'CONVERSIONS') },
    { ok: manualIdentityType === 'AUTH_CODE'
        ? !!(localStorage.getItem('hawklaunch_spark_codes') || '').trim()
        : manualVideoIds.length > 0,
      t: manualIdentityType === 'AUTH_CODE' ? 'Spark Codes configurados' : manualVideoIds.length + ' vídeo(s) selecionado(s)' },
    { ok: !!(localStorage.getItem('hawklaunch_dest_url') || '').trim() || !!(localStorage.getItem('hawklaunch_domain_list') || '').trim(), t: 'URL de destino configurada' },
    { ok: true, t: (localStorage.getItem('hawklaunch_proxy_list') || '').trim() ? '🛡️ Proxy: ' + (localStorage.getItem('hawklaunch_proxy_list') || '').split('\n').filter((l: string) => l.trim()).length + ' proxy(ies)' : '⚠️ Sem proxy (IP da Vercel)' },
  ] : [
    { ok: true, t: 'Conectado ao TikTok' },
    { ok: selectedAccounts.length > 0, t: selectedAccounts.length + ' conta(s) selecionada(s)' },
    { ok: true, t: 'Tipo: ' + campaignType },
    { ok: !!(localStorage.getItem('hawklaunch_spark_codes') || '').trim(), t: 'Spark Codes configurados' },
    { ok: !!(localStorage.getItem('hawklaunch_dest_url') || '').trim(), t: 'URL de destino configurada' },
    { ok: true, t: (localStorage.getItem('hawklaunch_proxy_list') || '').trim() ? '🛡️ Proxy: ' + (localStorage.getItem('hawklaunch_proxy_list') || '').split('\n').filter((l: string) => l.trim()).length + ' proxy(ies)' : '⚠️ Sem proxy (IP da Vercel)' },
  ]

  // Launch Complete Modal
  const LaunchModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !launching && setShowModal(false)}>
      <div className="bg-hawk-card border border-hawk-border rounded-2xl w-[700px] max-h-[85vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hawk-border">
          <div className="flex items-center gap-3">
            <span className="text-xl">{launching ? '⏳' : result && counts.errors === 0 ? '🚀' : '⚠️'}</span>
            <h3 className="text-lg font-bold">{launching ? 'Lançando...' : 'Launch Complete!'}</h3>
            {!launching && counts.errors === 0 && <span className="w-5 h-5 bg-green-500 rounded flex items-center justify-center text-[10px] text-white">✓</span>}
          </div>
          {launching
            ? <button className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs font-bold rounded-lg border border-red-500/30 transition-colors" onClick={() => { abortRef.current = true; addLog('WARN', '⛔ Interrompendo após conta atual...') }}>⛔ Parar</button>
            : <button className="text-gray-400 hover:text-white text-xl" onClick={() => setShowModal(false)}>✕</button>
          }
        </div>

        {/* Progress */}
        <div className="px-6 py-3 border-b border-hawk-border">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span>{launching ? Math.min(Math.round(progress/100 * selectedAccounts.length), selectedAccounts.length) : selectedAccounts.length} / {selectedAccounts.length} account(s)</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-hawk-input rounded-full overflow-hidden">
            <div className={'h-full rounded-full transition-all duration-300 ' + (counts.errors > 0 ? 'bg-yellow-500' : 'bg-green-500')} style={{width: progress + '%'}} />
          </div>
        </div>

        {/* Counters */}
        <div className="flex gap-2 px-6 py-3 border-b border-hawk-border">
          <span className="text-xs px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 font-semibold">✕ {counts.errors} Errors</span>
          <span className="text-xs px-2.5 py-1 rounded-md bg-yellow-500/10 text-yellow-400 font-semibold">⚠ {counts.warnings} Warnings</span>
          <span className="text-xs px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 font-semibold">✓ {counts.success} Success</span>
          <span className="text-xs px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 font-semibold">i {counts.info} Info</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-6 py-2 border-b border-hawk-border">
          {['All', 'Errors', 'Warnings', 'Success', 'Debug'].map(f => (
            <button key={f} onClick={() => setLogFilter(f)}
              className={'text-[11px] px-2.5 py-1 rounded transition-colors ' + (logFilter === f ? 'bg-hawk-accent/20 text-hawk-accent font-semibold' : 'text-gray-500 hover:text-gray-300')}>
              {f}
            </button>
          ))}
        </div>

        {/* Log entries */}
        <div className="max-h-[300px] overflow-y-auto px-6 py-2">
          {filteredLogs.map((l, i) => (
            <div key={i} className="flex items-start gap-2.5 py-1.5 border-b border-hawk-border/30 last:border-0">
              <span className="text-[10px] text-gray-500 font-mono mt-0.5 flex-shrink-0 w-14">{l.time}</span>
              <span className={'text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ' + catColor(l.cat)}>{l.cat}</span>
              <span className="text-[11px] text-gray-300 leading-relaxed">{l.msg}</span>
            </div>
          ))}
          {filteredLogs.length === 0 && <div className="text-center py-4 text-gray-500 text-xs">Nenhum log nesta categoria</div>}
        </div>

        {/* TikTok links */}
        {!launching && result && result.campaigns > 0 && (
          <div className="px-6 py-3 border-t border-hawk-border">
            <div className="text-xs font-semibold text-gray-400 mb-2">Abrir no TikTok Ads Manager:</div>
            <div className="flex flex-wrap gap-2">
              {selectedAccounts.map((acc: any) => (
                <a key={acc.advertiser_id} href={'https://ads.tiktok.com/i18n/manage/campaign?aadvid=' + acc.advertiser_id + '&is_refresh_page=true'}
                  target="_blank" rel="noopener"
                  className="text-[11px] px-3 py-1.5 bg-hawk-input border border-hawk-border rounded-md hover:border-hawk-accent hover:text-hawk-accent transition-colors truncate max-w-[200px]">
                  {acc.advertiser_name || acc.advertiser_id}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-hawk-border bg-hawk-bg/50">
          <div className="flex items-center gap-2">
            {!launching && result && (
              <span className={'text-xs ' + (counts.errors === 0 ? 'text-green-400' : 'text-yellow-400')}>
                {counts.errors === 0 ? '🎉' : '⚠️'} {result.campaigns} campanha(s) {counts.errors === 0 ? 'criada(s) com sucesso!' : 'com ' + counts.errors + ' erro(s)'}
              </span>
            )}
            {launching && <span className="text-xs text-gray-400">Processando...</span>}
          </div>
          <div className="flex gap-2">
            {!launching && <>
              <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(logs.map(l => l.time + ' [' + l.cat + '] ' + l.msg).join('\n')) }}>📋 Copy</button>
              {selectedAccounts.length > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={() => {
                  if (!window.confirm(`Tem certeza que deseja abrir ${selectedAccounts.length} conta(s) no navegador?`)) return
                  selectedAccounts.forEach((acc: any, i: number) => {
                    setTimeout(() => {
                      window.open('https://ads.tiktok.com/i18n/manage/campaign?aadvid=' + acc.advertiser_id + '&is_refresh_page=true', '_blank')
                    }, i * 350)
                  })
                }}>🔗 Abrir {selectedAccounts.length} conta(s)</button>
              )}
              <button className="btn btn-primary btn-sm" onClick={() => setShowModal(false)}>Fechar</button>
            </>}
          </div>
        </div>
      </div>
    </div>
  )

  return <div className="card animate-fade-in">
    <h2 className="text-lg font-bold mb-5">🚀 Launch</h2>

    {/* Checklist */}
    <div className="space-y-2 mb-6">
      {checklist.map((c, i) =>
        <div key={i} className="flex items-center gap-3 py-2 border-b border-hawk-border text-sm">
          <span className={'w-5 h-5 rounded-full flex items-center justify-center text-xs ' + (c.ok ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400')}>{c.ok ? '✓' : '!'}</span>{c.t}
        </div>
      )}
    </div>

    {/* Schedule */}
    <h4 className="label mb-3">Quando iniciar a veiculação?</h4>
    <div className="flex flex-wrap gap-2 mb-3">
      {(['now', '1h', '3h', '6h', '12h', 'custom'] as const).map(s =>
        <div key={s} className={'chip ' + (schedule === s ? 'active' : '')} onClick={() => setSchedule(s as any)}>
          {s === 'now' ? '⚡ Agora' : s === 'custom' ? '🕐 Horário específico' : '+' + s}
        </div>
      )}
    </div>
    {schedule === 'custom' && (
      <div className="mb-4">
        <label className="label mb-1.5 block text-xs text-gray-400">Horário de início (horário de Brasília — UTC-3)</label>
        <input
          type="datetime-local"
          className="input text-sm"
          value={customSchedule}
          min={new Date(Date.now() + 5*60000).toISOString().slice(0,16)}
          onChange={e => setCustomSchedule(e.target.value)}
        />
        {customSchedule && (
          <div className="text-[11px] text-gray-500 mt-1">
            UTC (TikTok): {new Date(customSchedule).toISOString().replace('T',' ').slice(0,19)}
          </div>
        )}
      </div>
    )}

    {/* Criar pausadas toggle */}
    <div className="flex items-center justify-between p-3 bg-hawk-input border border-hawk-border rounded-lg mb-4">
      <div>
        <div className="text-sm font-semibold">Criar campanhas pausadas</div>
        <div className="text-[11px] text-gray-500">Ative manualmente depois — reduz detecção de automação</div>
      </div>
      <div className={`toggle ${startPaused ? 'on' : ''}`} onClick={() => setStartPaused(!startPaused)}/>
    </div>

    {/* Launch button */}
    <div className="text-center py-6">
      <button onClick={launch} disabled={launching || !selectedAccounts.length || checklist.some(c => !c.ok)}
        className="px-12 py-4 bg-gradient-to-r from-hawk-accent to-orange-400 text-white rounded-full text-lg font-bold shadow-[0_8px_40px_rgba(249,115,22,0.4)] hover:shadow-[0_12px_50px_rgba(249,115,22,0.6)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        {launching ? '⏳ Lançando...' : '🚀 LANÇAR CAMPANHAS'}
      </button>
      <p className="mt-3 text-xs text-gray-500">{selectedAccounts.length} conta(s) — {campaignType === 'queue' ? 'Fila: ' + queueSmartCount + ' Smart+ + ' + queueManualCount + ' Manual' : campaignType === 'manual' ? 'Campanha Manual' : 'Smart+ Spark Ads'}</p>
    </div>

    {/* Last result summary */}
    {result && !showModal && <div className="mt-4 p-4 bg-hawk-input border border-hawk-border rounded-lg cursor-pointer hover:border-hawk-accent transition-colors" onClick={() => setShowModal(true)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{counts.errors === 0 ? '✅' : '⚠️'}</span>
          <span className="text-sm font-semibold">{result.campaigns} campanha(s), {result.ads} ad(s)</span>
          <span className="text-xs text-gray-500">— clique para ver logs</span>
        </div>
        <div className="flex gap-2">
          {counts.errors > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400">{counts.errors} erros</span>}
          <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/15 text-green-400">{counts.success} ok</span>
        </div>
      </div>
    </div>}

    {/* Modal */}
    {showModal && <LaunchModal />}

    <div className="flex justify-between mt-6 pt-4 border-t border-hawk-border">
      <button className="btn btn-secondary" onClick={() => setStep(campaignType === 'queue' ? 4 : 5)}>← Proxy</button>
    </div>
  </div>
}

function StepFooter({prev,next}:{prev:number;next:number}){const{setStep}=useAppStore();return<div className="flex justify-between mt-6 pt-4 border-t border-hawk-border"><button className="btn btn-secondary" onClick={()=>setStep(prev)}>← Voltar</button><button className="btn btn-primary" onClick={()=>setStep(next)}>Próximo →</button></div>}
function ToggleRow({title,desc,defaultOn,onChange}:{title:string;desc:string;defaultOn?:boolean;onChange?:(v:boolean)=>void}){const[on,setOn]=useState(defaultOn||false);return<div className="flex items-center justify-between p-3 bg-hawk-input border border-hawk-border rounded-md mb-2"><div><div className="text-sm font-semibold">{title}</div><div className="text-[11px] text-gray-500">{desc}</div></div><div className={`toggle ${on?'on':''}`} onClick={()=>{setOn(!on);onChange?.(!on)}}/></div>}

/* ====== MANUAL: STEP 1 — IDENTITY ====== */
function ManualStepIdentity() {
  const { setStep, selectedAccounts } = useAppStore()
  const [identityType, setIdentityType] = useState<string>(() => localStorage.getItem('hawklaunch_manual_identity_type') || 'AUTH_CODE')
  const [identities, setIdentities] = useState<any[]>([])
  const [loadingId, setLoadingId] = useState(false)
  const [selectedIdentityId, setSelectedIdentityId] = useState(() => localStorage.getItem('hawklaunch_manual_identity_id') || '')
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('hawklaunch_manual_display_name') || '')
  const [sparkCodes, setSparkCodes] = useState(() => localStorage.getItem('hawklaunch_spark_codes') || '')
  const sparkCodeList = sparkCodes.split('\n').map(c => c.trim()).filter(Boolean)

  function save(type: string) {
    setIdentityType(type)
    localStorage.setItem('hawklaunch_manual_identity_type', type)
  }

  function loadIdentities(type: string) {
    if (!selectedAccounts[0]) return
    setLoadingId(true)
    api.getIdentities(selectedAccounts[0].advertiser_id, type)
      .then(res => {
        const l = res.data?.list || []
        setIdentities(l)
        if (l.length && !selectedIdentityId) {
          setSelectedIdentityId(l[0].identity_id)
          localStorage.setItem('hawklaunch_manual_identity_id', l[0].identity_id)
        }
      })
      .finally(() => setLoadingId(false))
  }

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🔗</div>
        <h2 className="text-lg font-bold">Identity <span className="text-xs font-normal text-gray-500 ml-1">Manual</span></h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { key: 'AUTH_CODE', icon: '🔗', title: 'Spark Ads', desc: 'Via código de autorização do vídeo' },
          { key: 'CUSTOMIZED_USER', icon: '⚡', title: 'Custom User', desc: 'Perfil fictício — nome + avatar' },
        ].map(t => (
          <div key={t.key} onClick={() => { save(t.key); if (t.key !== 'AUTH_CODE') loadIdentities(t.key) }}
            className={`bg-hawk-input border-2 rounded-lg p-5 cursor-pointer text-center ${identityType === t.key ? 'border-hawk-accent bg-hawk-accent/5' : 'border-hawk-border'}`}>
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="text-sm font-bold">{t.title}</div>
            <div className="text-[11px] text-gray-500 mt-1">{t.desc}</div>
          </div>
        ))}
      </div>

      {identityType === 'AUTH_CODE' && (
        <div className="card-sm bg-hawk-input">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold">🔗 Spark Ad Codes</h4>
            <span className="text-xs text-gray-400">{sparkCodeList.length} código(s)</span>
          </div>
          <div className="bg-purple-500/8 border border-purple-500/20 rounded-lg p-3 flex gap-3 mb-3">
            <span className="text-base">💡</span>
            <div className="text-[12px] text-gray-300">TikTok app → vídeo → ⋯ → Ad Settings → Generate Code. Um por linha.</div>
          </div>
          <textarea
            className="input font-mono text-xs min-h-[110px]"
            placeholder="Cole os Spark Ad codes (um por linha)"
            value={sparkCodes}
            onChange={e => { setSparkCodes(e.target.value); localStorage.setItem('hawklaunch_spark_codes', e.target.value) }}
          />
          {sparkCodeList.length > 0 && (
            <div className="mt-2 space-y-1">
              {sparkCodeList.map((code, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-hawk-bg rounded-md">
                  <span className="text-green-400 text-xs">✓</span>
                  <span className="font-mono text-[11px] text-gray-300 flex-1 truncate">{code}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {identityType === 'CUSTOMIZED_USER' && (
        <div className="card-sm bg-hawk-input">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold">⚡ Custom User Identity</h4>
            <button className="btn btn-secondary btn-sm" onClick={() => loadIdentities('CUSTOMIZED_USER')}>{loadingId ? '⏳' : '↻ Carregar'}</button>
          </div>
          {identities.length > 0 ? (
            <div className="space-y-2 mb-3">
              {identities.map((id: any) => (
                <div key={id.identity_id} onClick={() => { setSelectedIdentityId(id.identity_id); localStorage.setItem('hawklaunch_manual_identity_id', id.identity_id) }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer border transition-colors ${selectedIdentityId === id.identity_id ? 'border-hawk-accent bg-hawk-accent/5' : 'border-hawk-border hover:border-gray-500'}`}>
                  <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${selectedIdentityId === id.identity_id ? 'bg-hawk-accent border-hawk-accent text-white' : 'border-hawk-border'}`}>
                    {selectedIdentityId === id.identity_id ? '✓' : ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold">{id.display_name || id.identity_id}</div>
                    <div className="text-[11px] text-gray-500 font-mono">{id.identity_id}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm mb-3">
              {selectedIdentityId ? <span className="text-green-400 text-xs">✓ Identity: {selectedIdentityId}</span> : 'Clique em "Carregar" para ver as identities'}
            </div>
          )}
          <div>
            <label className="label mb-1.5 block">Display Name <span className="text-[10px] text-gray-500">(nome exibido no anúncio)</span></label>
            <input className="input" placeholder="Loja Exemplo" value={displayName}
              onChange={e => { setDisplayName(e.target.value); localStorage.setItem('hawklaunch_manual_display_name', e.target.value) }} />
          </div>
        </div>
      )}

      <StepFooter prev={0} next={2} />
    </div>
  )
}

/* ====== MANUAL: STEP 2 — CRIATIVOS ====== */
function ManualStepCreative() {
  const { selectedAccounts } = useAppStore()
  const identityType = localStorage.getItem('hawklaunch_manual_identity_type') || 'AUTH_CODE'
  const [videos, setVideos] = useState<any[]>([])
  const [selectedV, setSelectedV] = useState<Set<string>>(() => {
    try { const raw = localStorage.getItem('hawklaunch_manual_video_ids'); return raw ? new Set(JSON.parse(raw)) : new Set() } catch { return new Set() }
  })
  const [loading, setLoading] = useState(false)
  const [destinationUrl, setDestinationUrl] = useState(() => localStorage.getItem('hawklaunch_dest_url') || '')
  const [domainList, setDomainList] = useState(() => localStorage.getItem('hawklaunch_domain_list') || '')
  const [adTexts, setAdTexts] = useState(() => localStorage.getItem('hawklaunch_ad_texts') || '')
  const [cta, setCta] = useState(() => localStorage.getItem('hawklaunch_manual_cta') || 'SHOP_NOW')

  const domainLines = domainList.split('\n').map(l => l.trim()).filter(Boolean)

  function toggleVideo(id: string) {
    const n = new Set(selectedV)
    n.has(id) ? n.delete(id) : n.add(id)
    setSelectedV(n)
    localStorage.setItem('hawklaunch_manual_video_ids', JSON.stringify([...n]))
  }

  const CTA_OPTIONS = [
    { v: 'SHOP_NOW', l: 'Shop now' }, { v: 'LEARN_MORE', l: 'Learn more' }, { v: 'ORDER_NOW', l: 'Order now' },
    { v: 'BUY_NOW', l: 'Buy now' }, { v: 'SIGN_UP', l: 'Sign up' }, { v: 'CONTACT_US', l: 'Contact us' },
    { v: 'GET_NOW', l: 'Get it now' }, { v: 'GET_YOURS', l: 'Get yours' }, { v: 'VIEW_NOW', l: 'View now' },
    { v: 'DOWNLOAD', l: 'Download' }, { v: 'APPLY_NOW', l: 'Apply now' }, { v: 'BOOK_NOW', l: 'Book now' },
    { v: 'INSTALL_NOW', l: 'Install now' }, { v: 'WATCH_NOW', l: 'Watch now' }, { v: 'SUBSCRIBE', l: 'Subscribe' },
  ]

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🎬</div>
        <h2 className="text-lg font-bold">Criativos <span className="text-xs font-normal text-gray-500 ml-1">Manual</span></h2>
      </div>

      {identityType === 'AUTH_CODE' ? (
        <div className="bg-purple-500/8 border border-purple-500/20 rounded-lg p-3 flex gap-3 mb-4">
          <span className="text-base">✅</span>
          <div className="text-[12px] text-gray-300">Spark Codes configurados na etapa de Identity. Os vídeos do TikTok serão usados automaticamente.</div>
        </div>
      ) : (
        <div className="card-sm bg-hawk-input mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold">📚 Vídeos da Biblioteca</h4>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              if (!selectedAccounts[0]) return; setLoading(true)
              api.getVideos(selectedAccounts[0].advertiser_id)
                .then(res => setVideos(res.data?.list || []))
                .finally(() => setLoading(false))
            }}>{loading ? '⏳' : '↻ Carregar'}</button>
          </div>
          <div className="text-[11px] text-gray-500 mb-3">{selectedV.size} vídeo(s) selecionado(s)</div>
          {videos.length > 0 ? (
            <div className="grid grid-cols-5 gap-3">
              {videos.slice(0, 20).map((v: any) => {
                const id = v.video_id || v.material_id
                return (
                  <div key={id} onClick={() => toggleVideo(id)}
                    className={`bg-hawk-bg border-2 rounded-lg overflow-hidden cursor-pointer relative ${selectedV.has(id) ? 'border-hawk-accent' : 'border-hawk-border'}`}>
                    <div className="w-full aspect-[9/16] bg-[#12141c] flex items-center justify-center">
                      {v.preview_url || v.video_cover_url
                        ? <img src={v.preview_url || v.video_cover_url} className="w-full h-full object-cover" alt="" />
                        : <span className="text-xl text-gray-600">🎥</span>}
                    </div>
                    <div className="p-1.5"><div className="text-[9px] truncate">{v.file_name || id}</div></div>
                    {selectedV.has(id) && <div className="absolute top-1 right-1 w-4 h-4 bg-hawk-accent rounded-full flex items-center justify-center text-[8px] text-white">✓</div>}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">Clique em "Carregar"</div>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-hawk-border">
        <h4 className="label mb-3">Detalhes do anúncio</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label mb-1.5 block">URL de destino <span className="required">*</span></label>
            <input className="input" placeholder="https://seusite.com/oferta" value={destinationUrl}
              onChange={e => { setDestinationUrl(e.target.value); localStorage.setItem('hawklaunch_dest_url', e.target.value) }} />
          </div>
          <div className="p-4 bg-hawk-input border border-hawk-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold">🔄 Rodízio de domínios</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400">opcional</span>
            </div>
            <textarea
              className="input font-mono text-xs min-h-[72px]"
              placeholder={"https://loja1.com/oferta\nhttps://loja2.com/oferta"}
              value={domainList}
              onChange={e => { setDomainList(e.target.value); localStorage.setItem('hawklaunch_domain_list', e.target.value) }}
            />
            {domainLines.length > 0 && (
              <div className="text-[11px] text-gray-500 mt-1">
                {domainLines.slice(0, 3).map((d, i) => `Conta ${i+1} → ${d}`).join(' · ')}{domainLines.length > 3 ? ' ...' : ''}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="label mb-2 block">Call to Action</label>
          <div className="flex flex-wrap gap-1.5">
            {CTA_OPTIONS.map(c => (
              <div key={c.v} onClick={() => { setCta(c.v); localStorage.setItem('hawklaunch_manual_cta', c.v) }}
                className={`chip text-[10px] ${cta === c.v ? 'active' : ''}`}>{c.l}</div>
            ))}
          </div>
        </div>

        <div>
          <label className="label mb-1.5 block">Textos do anúncio (um por linha)</label>
          <textarea className="input min-h-[70px]" placeholder="Oferta imperdível!" value={adTexts}
            onChange={e => { setAdTexts(e.target.value); localStorage.setItem('hawklaunch_ad_texts', e.target.value) }} />
        </div>
      </div>

      <StepFooter prev={1} next={3} />
    </div>
  )
}

/* ====== MANUAL: STEP 3 — ESTRUTURA ====== */
function ManualStepStructure() {
  const { selectedAccounts } = useAppStore()
  const [objective, setObjective] = useState(() => localStorage.getItem('hawklaunch_manual_objective') || 'CONVERSIONS')
  const [budgetMode, setBudgetMode] = useState(() => localStorage.getItem('hawklaunch_manual_budget_mode') || 'cbo')
  const [pixels, setPixels] = useState<any[]>([])
  const [loadingPixels, setLoadingPixels] = useState(false)
  const [selectedPixel, setSelectedPixel] = useState(() => localStorage.getItem('hawklaunch_pixel_id') || '')

  function saveObjective(v: string) { setObjective(v); localStorage.setItem('hawklaunch_manual_objective', v) }
  function saveBudgetMode(v: string) { setBudgetMode(v); localStorage.setItem('hawklaunch_manual_budget_mode', v) }

  function loadPixels() {
    if (!selectedAccounts[0]) return
    setLoadingPixels(true)
    api.getPixels(selectedAccounts[0].advertiser_id)
      .then((res: any) => {
        const list = res.data?.pixels || []
        setPixels(list)
        if (list.length > 0 && !selectedPixel) {
          setSelectedPixel(list[0].pixel_id)
          localStorage.setItem('hawklaunch_pixel_id', list[0].pixel_id)
        }
      })
      .finally(() => setLoadingPixels(false))
  }

  const OBJECTIVES = [
    { v: 'CONVERSIONS', l: '💰 Conversões', desc: 'Pixel + evento de otimização' },
    { v: 'TRAFFIC', l: '🖱️ Tráfego', desc: 'Cliques para o site' },
    { v: 'REACH', l: '📡 Alcance', desc: 'Máximo de pessoas' },
    { v: 'VIDEO_VIEWS', l: '▶️ Visualizações', desc: 'Reproduções do vídeo' },
  ]

  const OPT_EVENTS: Record<string, { v: string; l: string }[]> = {
    CONVERSIONS: [
      { v: 'SHOPPING', l: 'Purchase' },
      { v: 'INITIATE_ORDER', l: 'Initiate Checkout' },
      { v: 'ON_WEB_CART', l: 'Add to Cart' },
      { v: 'ON_WEB_DETAIL', l: 'View Content' },
      { v: 'ADD_BILLING', l: 'Add Payment Info' },
    ],
    TRAFFIC: [{ v: 'CLICK', l: 'Clique' }],
    REACH: [{ v: 'REACH', l: 'Alcance' }],
    VIDEO_VIEWS: [{ v: 'VIDEO_PLAY', l: 'Reprodução' }],
  }

  return (
    <div className="card animate-fade-in">
      <h2 className="text-lg font-bold mb-5">🏗️ Estrutura <span className="text-xs font-normal text-gray-500 ml-1">Manual</span></h2>

      {/* Objective */}
      <div className="mb-5">
        <label className="label mb-3 block">Objetivo da campanha</label>
        <div className="grid grid-cols-2 gap-3">
          {OBJECTIVES.map(o => (
            <div key={o.v} onClick={() => saveObjective(o.v)}
              className={`bg-hawk-input border-2 rounded-lg p-4 cursor-pointer ${objective === o.v ? 'border-hawk-accent bg-hawk-accent/5' : 'border-hawk-border'}`}>
              <div className="text-sm font-bold mb-1">{o.l}</div>
              <div className="text-[11px] text-gray-500">{o.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pixel (CONVERSIONS only) */}
      {objective === 'CONVERSIONS' && (
        <div className="card-sm bg-hawk-input mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold">📡 Pixel</h4>
            <button className="btn btn-secondary btn-sm" onClick={loadPixels}>{loadingPixels ? '⏳' : '📥 Carregar'}</button>
          </div>
          {pixels.length > 0 ? (
            <div className="space-y-2">
              {pixels.map((p: any) => (
                <div key={p.pixel_id} onClick={() => { setSelectedPixel(p.pixel_id); localStorage.setItem('hawklaunch_pixel_id', p.pixel_id) }}
                  className={'flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer border ' + (selectedPixel === p.pixel_id ? 'border-hawk-accent bg-hawk-accent/5' : 'border-hawk-border hover:border-gray-500')}>
                  <div className={'w-5 h-5 border-2 rounded-full flex items-center justify-center text-xs ' + (selectedPixel === p.pixel_id ? 'bg-hawk-accent border-hawk-accent text-white' : 'border-hawk-border')}>
                    {selectedPixel === p.pixel_id ? '✓' : ''}
                  </div>
                  <div className="flex-1"><div className="text-[13px] font-semibold">{p.pixel_name || 'Pixel'}</div><div className="text-[11px] text-gray-500 font-mono">{p.pixel_id}</div></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-gray-500 text-sm">
              {selectedPixel ? <span className="text-green-400 text-xs">✓ Pixel: {selectedPixel}</span> : 'Clique em "Carregar"'}
            </div>
          )}
          <div className="mt-3">
            <label className="label mb-1.5 block">Evento de otimização</label>
            <select className="select" defaultValue={localStorage.getItem('hawklaunch_opt_event') || 'SHOPPING'}
              onChange={e => localStorage.setItem('hawklaunch_opt_event', e.target.value)}>
              {(OPT_EVENTS[objective] || []).map(ev => <option key={ev.v} value={ev.v}>{ev.l}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Budget mode */}
      <div className="mb-4">
        <label className="label mb-2 block">Modo de orçamento</label>
        <div className="grid grid-cols-2 gap-3">
          {[{ v: 'cbo', l: 'CBO', desc: 'Orçamento na campanha' }, { v: 'abo', l: 'ABO', desc: 'Orçamento no ad group' }].map(b => (
            <div key={b.v} onClick={() => saveBudgetMode(b.v)}
              className={`bg-hawk-input border-2 rounded-lg p-4 cursor-pointer text-center ${budgetMode === b.v ? 'border-hawk-accent bg-hawk-accent/5' : 'border-hawk-border'}`}>
              <div className="text-sm font-bold">{b.l}</div>
              <div className="text-[11px] text-gray-500 mt-1">{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label mb-1.5 block">Budget diário (BRL)</label>
          <input className="input" type="number" defaultValue={localStorage.getItem('hawklaunch_budget') || '50'}
            onChange={e => localStorage.setItem('hawklaunch_budget', e.target.value)} />
        </div>
        <div>
          <label className="label mb-1.5 block">Lance CPA <span className="text-[10px] text-gray-500">(0 = auto)</span></label>
          <input className="input" type="number" placeholder="0" defaultValue={localStorage.getItem('hawklaunch_manual_bid_price') || ''}
            onChange={e => localStorage.setItem('hawklaunch_manual_bid_price', e.target.value)} />
        </div>
        <div>
          <label className="label mb-1.5 block">Campanhas por conta</label>
          <input className="input" type="number" min={1} max={20}
            defaultValue={localStorage.getItem('hawklaunch_camps_per_account') || '1'}
            onChange={e => localStorage.setItem('hawklaunch_camps_per_account', e.target.value)} />
        </div>
        <div>
          <label className="label mb-1.5 block">
            {localStorage.getItem('hawklaunch_manual_identity_type') === 'AUTH_CODE' ? 'Anúncios por código Spark' : 'Vídeos por ad group'}
          </label>
          <input className="input" type="number" min={1} max={10}
            defaultValue={localStorage.getItem('hawklaunch_ads_per_code') || '1'}
            onChange={e => localStorage.setItem('hawklaunch_ads_per_code', e.target.value)} />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-hawk-border">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label mb-1.5 block">Prefixo da campanha</label>
            <input className="input" placeholder="CREME FACIAL"
              defaultValue={localStorage.getItem('hawklaunch_offer_name') || ''}
              onChange={e => localStorage.setItem('hawklaunch_offer_name', e.target.value)} />
          </div>
          <div>
            <label className="label mb-1.5 block">Seq. inicial</label>
            <input className="input" type="number" defaultValue={1} onChange={e => localStorage.setItem('hawklaunch_manual_start_seq', e.target.value)} />
          </div>
        </div>
        <div className="mt-2 px-3 py-2 bg-hawk-input rounded font-mono text-sm text-hawk-accent">
          {localStorage.getItem('hawklaunch_offer_name') || 'OFERTA'} 01
        </div>
      </div>

      <StepFooter prev={2} next={4} />
    </div>
  )
}

/* ====== MANUAL: STEP 4 — TARGETING ====== */
function ManualStepTargeting() {
  const [auto, setAuto] = useState(() => localStorage.getItem('hawklaunch_manual_auto_target') !== 'false')
  const [ageGroups, setAgeGroups] = useState<Set<string>>(() => {
    try { const r = localStorage.getItem('hawklaunch_manual_age_groups'); return r ? new Set(JSON.parse(r)) : new Set(['AGE_18_24','AGE_25_34','AGE_35_44','AGE_45_54','AGE_55_100']) } catch { return new Set(['AGE_18_24','AGE_25_34','AGE_35_44','AGE_45_54','AGE_55_100']) }
  })
  const [gender, setGender] = useState(() => localStorage.getItem('hawklaunch_manual_gender') || 'GENDER_UNLIMITED')
  const [os, setOs] = useState<Set<string>>(() => {
    try { const r = localStorage.getItem('hawklaunch_manual_os'); return r ? new Set(JSON.parse(r)) : new Set(['ANDROID','IOS']) } catch { return new Set(['ANDROID','IOS']) }
  })

  function toggleAge(v: string) {
    const n = new Set(ageGroups); n.has(v) ? n.delete(v) : n.add(v)
    setAgeGroups(n); localStorage.setItem('hawklaunch_manual_age_groups', JSON.stringify([...n]))
  }
  function toggleOs(v: string) {
    const n = new Set(os); n.has(v) ? n.delete(v) : n.add(v)
    setOs(n); localStorage.setItem('hawklaunch_manual_os', JSON.stringify([...n]))
  }
  function saveAuto(v: boolean) { setAuto(v); localStorage.setItem('hawklaunch_manual_auto_target', String(v)) }
  function saveGender(v: string) { setGender(v); localStorage.setItem('hawklaunch_manual_gender', v) }

  return (
    <div className="card animate-fade-in">
      <h2 className="text-lg font-bold mb-5">🎯 Targeting <span className="text-xs font-normal text-gray-500 ml-1">Manual</span></h2>

      <ToggleRow title="Targeting automático" desc="IA do TikTok define o público ideal" defaultOn={auto} onChange={saveAuto} />

      <div className={auto ? 'opacity-40 pointer-events-none mt-4' : 'mt-4'}>
        <div className="mb-5">
          <label className="label mb-2 block">Faixa etária</label>
          <div className="flex flex-wrap gap-2">
            {[
              { v: 'AGE_18_24', l: '18–24' }, { v: 'AGE_25_34', l: '25–34' },
              { v: 'AGE_35_44', l: '35–44' }, { v: 'AGE_45_54', l: '45–54' }, { v: 'AGE_55_100', l: '55+' },
            ].map(a => (
              <div key={a.v} onClick={() => toggleAge(a.v)} className={`chip ${ageGroups.has(a.v) ? 'active' : ''}`}>{a.l}</div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="label mb-2 block">Gênero</label>
          <div className="flex gap-2">
            {[{ v: 'GENDER_UNLIMITED', l: 'Todos' }, { v: 'GENDER_MALE', l: 'Masculino' }, { v: 'GENDER_FEMALE', l: 'Feminino' }].map(g => (
              <div key={g.v} onClick={() => saveGender(g.v)} className={`chip ${gender === g.v ? 'active' : ''}`}>{g.l}</div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="label mb-2 block">Sistema operacional</label>
          <div className="flex gap-2">
            {[{ v: 'ANDROID', l: '🤖 Android' }, { v: 'IOS', l: '🍎 iOS' }].map(o => (
              <div key={o.v} onClick={() => toggleOs(o.v)} className={`chip ${os.has(o.v) ? 'active' : ''}`}>{o.l}</div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label mb-1.5 block">País</label>
            <select className="select" defaultValue="BR" onChange={e => localStorage.setItem('hawklaunch_manual_country', e.target.value)}>
              <option value="BR">🇧🇷 Brasil</option>
              <option value="US">🇺🇸 Estados Unidos</option>
              <option value="MX">🇲🇽 México</option>
              <option value="AR">🇦🇷 Argentina</option>
              <option value="CO">🇨🇴 Colômbia</option>
            </select>
          </div>
          <div>
            <label className="label mb-1.5 block">Idioma</label>
            <select className="select">
              <option value="pt">🇧🇷 Português</option>
              <option value="es">🇲🇽 Espanhol</option>
              <option value="en">🇺🇸 Inglês</option>
            </select>
          </div>
        </div>
      </div>

      <StepFooter prev={3} next={5} />
    </div>
  )
}

/* ====== QUEUE: STEP 0 — FILA BUILDER ====== */
function QueueStepBuilder() {
  const { setStep } = useAppStore()
  const [smartCount, setSmartCount] = useState(() => parseInt(localStorage.getItem('hawklaunch_queue_smart_count') || '3'))
  const [manualCount, setManualCount] = useState(() => parseInt(localStorage.getItem('hawklaunch_queue_manual_count') || '2'))

  function saveSmart(v: number) { const n = Math.max(0, Math.min(20, v)); setSmartCount(n); localStorage.setItem('hawklaunch_queue_smart_count', String(n)) }
  function saveManual(v: number) { const n = Math.max(0, Math.min(20, v)); setManualCount(n); localStorage.setItem('hawklaunch_queue_manual_count', String(n)) }

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">📋</div>
        <h2 className="text-lg font-bold">Fila de Lançamento</h2>
      </div>
      <p className="text-sm text-gray-400 mb-6">Configure quantas campanhas de cada tipo serão criadas <strong className="text-gray-300">por conta</strong>.</p>

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-4 bg-hawk-input border border-hawk-border rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div><div className="text-sm font-bold">Smart+ V2</div><div className="text-[11px] text-gray-500">Campanhas automatizadas pelo TikTok</div></div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 bg-hawk-bg border border-hawk-border rounded-lg flex items-center justify-center text-lg hover:border-gray-500 transition-colors" onClick={() => saveSmart(smartCount - 1)}>-</button>
            <input className="w-12 text-center text-lg font-bold bg-transparent outline-none" type="number" min={0} max={20} value={smartCount} onChange={e => saveSmart(parseInt(e.target.value) || 0)} />
            <button className="w-8 h-8 bg-hawk-bg border border-hawk-border rounded-lg flex items-center justify-center text-lg hover:border-gray-500 transition-colors" onClick={() => saveSmart(smartCount + 1)}>+</button>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-hawk-input border border-hawk-border rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div><div className="text-sm font-bold">Manual</div><div className="text-[11px] text-gray-500">Controle total: budget, bid, targeting</div></div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 bg-hawk-bg border border-hawk-border rounded-lg flex items-center justify-center text-lg hover:border-gray-500 transition-colors" onClick={() => saveManual(manualCount - 1)}>-</button>
            <input className="w-12 text-center text-lg font-bold bg-transparent outline-none" type="number" min={0} max={20} value={manualCount} onChange={e => saveManual(parseInt(e.target.value) || 0)} />
            <button className="w-8 h-8 bg-hawk-bg border border-hawk-border rounded-lg flex items-center justify-center text-lg hover:border-gray-500 transition-colors" onClick={() => saveManual(manualCount + 1)}>+</button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-hawk-accent/5 border border-hawk-accent/20 rounded-lg mb-4">
        <div className="text-sm font-semibold text-hawk-accent">{smartCount + manualCount} campanhas por conta</div>
        <div className="text-[11px] text-gray-400 mt-1">
          {smartCount > 0 && smartCount + ' Smart+'}{smartCount > 0 && manualCount > 0 && ' + '}{manualCount > 0 && manualCount + ' Manual'}
          {smartCount + manualCount === 0 && 'Selecione pelo menos 1 campanha'}
        </div>
      </div>

      <div className="bg-blue-500/8 border border-blue-500/20 rounded-lg p-4 flex gap-3 mb-4">
        <span className="text-lg">💡</span>
        <div className="text-[12px] text-gray-300 leading-relaxed">
          Cada conta recebe <strong>1 domínio</strong> e <strong>1 Spark code</strong> por rotação. Smart+ e Manual são lançados sequencialmente com naming contínuo (01, 02... 05).
        </div>
      </div>

      <div className="flex justify-end mt-6 pt-4 border-t border-hawk-border">
        <button className="btn btn-primary" onClick={() => setStep(1)} disabled={smartCount + manualCount === 0}>Próximo → Contas</button>
      </div>
    </div>
  )
}

/* ====== QUEUE: STEP 2 — SMART+ CONFIG ====== */
function QueueSmartConfig() {
  const { setStep, selectedAccounts } = useAppStore()
  const smartCount = parseInt(localStorage.getItem('hawklaunch_queue_smart_count') || '0')

  const [sparkCodes, setSparkCodes] = useState(() => localStorage.getItem('hawklaunch_spark_codes') || '')
  const [destinationUrl, setDestinationUrl] = useState(() => localStorage.getItem('hawklaunch_dest_url') || '')
  const [domainList, setDomainList] = useState(() => localStorage.getItem('hawklaunch_domain_list') || '')
  const [adTexts, setAdTexts] = useState(() => localStorage.getItem('hawklaunch_ad_texts') || '')
  const [budget, setBudget] = useState(() => localStorage.getItem('hawklaunch_queue_smart_budget') || '80')
  const [name, setName] = useState(() => localStorage.getItem('hawklaunch_queue_smart_name') || '')
  const [targetCpa, setTargetCpa] = useState(() => localStorage.getItem('hawklaunch_target_cpa') || '')
  const [pixels, setPixels] = useState<any[]>([])
  const [loadingPixels, setLoadingPixels] = useState(false)
  const [selectedPixel, setSelectedPixel] = useState(() => localStorage.getItem('hawklaunch_pixel_id') || '')

  const sparkCodeList = sparkCodes.split('\n').map(c => c.trim()).filter(Boolean)
  const domainLines = domainList.split('\n').map(l => l.trim()).filter(Boolean)

  function loadPixels() {
    if (!selectedAccounts[0]) return
    setLoadingPixels(true)
    api.getPixels(selectedAccounts[0].advertiser_id)
      .then((res: any) => {
        const list = res.data?.pixels || []
        setPixels(list)
        if (list.length > 0 && !selectedPixel) { setSelectedPixel(list[0].pixel_id); localStorage.setItem('hawklaunch_pixel_id', list[0].pixel_id) }
      })
      .finally(() => setLoadingPixels(false))
  }

  if (smartCount === 0) return (
    <div className="card animate-fade-in">
      <h2 className="text-lg font-bold mb-4">🔥 Smart+ Config</h2>
      <div className="text-center py-12 text-gray-500">0 campanhas Smart+ na fila — pule esta etapa.</div>
      <StepFooter prev={1} next={3} />
    </div>
  )

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold">🔥 Smart+ Config</h2>
        <span className="text-xs px-2.5 py-1 rounded-md bg-hawk-accent/15 text-hawk-accent font-bold">{smartCount} campanhas/conta</span>
      </div>

      {/* Criativos — shared */}
      <details open className="mb-4 group">
        <summary className="text-sm font-bold cursor-pointer mb-3 text-gray-300 flex items-center gap-2">
          🎬 Criativos <span className="text-[10px] text-gray-500 font-normal">(compartilhado com Manual)</span>
        </summary>
        <div className="space-y-3 pl-1">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label">Spark Ad Codes</label>
              <span className="text-xs text-gray-400">{sparkCodeList.length} código(s)</span>
            </div>
            <textarea className="input font-mono text-xs min-h-[80px]" placeholder="Cole os códigos (um por linha)" value={sparkCodes}
              onChange={e => { setSparkCodes(e.target.value); localStorage.setItem('hawklaunch_spark_codes', e.target.value) }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label mb-1.5 block">URL de destino</label>
              <input className="input" placeholder="https://seusite.com/oferta" value={destinationUrl}
                onChange={e => { setDestinationUrl(e.target.value); localStorage.setItem('hawklaunch_dest_url', e.target.value) }} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label">Rodízio de domínios</label>
                <span className="text-xs text-gray-400">{domainLines.length} domínio(s)</span>
              </div>
              <textarea className="input font-mono text-xs min-h-[60px]" placeholder={"https://loja1.com\nhttps://loja2.com"} value={domainList}
                onChange={e => { setDomainList(e.target.value); localStorage.setItem('hawklaunch_domain_list', e.target.value) }} />
            </div>
          </div>
          <div>
            <label className="label mb-1.5 block">Textos do anúncio</label>
            <textarea className="input min-h-[50px]" placeholder="Oferta imperdível!" value={adTexts}
              onChange={e => { setAdTexts(e.target.value); localStorage.setItem('hawklaunch_ad_texts', e.target.value) }} />
          </div>
        </div>
      </details>

      {/* Estrutura */}
      <details open className="mb-4">
        <summary className="text-sm font-bold cursor-pointer mb-3 text-gray-300">🏗️ Estrutura Smart+</summary>
        <div className="space-y-3 pl-1">
          <div className="flex items-center justify-between">
            <label className="label">Pixel</label>
            <div className="flex items-center gap-2">
              {selectedPixel && <span className="text-green-400 text-[11px]">✓ {selectedPixel}</span>}
              <button className="btn btn-secondary btn-sm" onClick={loadPixels}>{loadingPixels ? '⏳' : '📥 Carregar'}</button>
            </div>
          </div>
          {pixels.length > 0 && (
            <div className="space-y-1">
              {pixels.map((p: any) => (
                <div key={p.pixel_id} onClick={() => { setSelectedPixel(p.pixel_id); localStorage.setItem('hawklaunch_pixel_id', p.pixel_id) }}
                  className={'flex items-center gap-2 px-3 py-2 rounded cursor-pointer border text-xs ' + (selectedPixel === p.pixel_id ? 'border-hawk-accent bg-hawk-accent/5' : 'border-hawk-border')}>
                  <span className={selectedPixel === p.pixel_id ? 'text-hawk-accent' : 'text-gray-500'}>{selectedPixel === p.pixel_id ? '✓' : '○'}</span>
                  <span>{p.pixel_name || 'Pixel'}</span>
                  <span className="text-gray-500 font-mono">{p.pixel_id}</span>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label mb-1.5 block">Budget diário</label>
              <input className="input" type="number" value={budget} onChange={e => { setBudget(e.target.value); localStorage.setItem('hawklaunch_queue_smart_budget', e.target.value) }} />
            </div>
            <div>
              <label className="label mb-1.5 block">Target CPA</label>
              <input className="input" type="number" placeholder="Auto" value={targetCpa} onChange={e => { setTargetCpa(e.target.value); localStorage.setItem('hawklaunch_target_cpa', e.target.value) }} />
            </div>
            <div>
              <label className="label mb-1.5 block">Ads/código</label>
              <input className="input" type="number" min={1} max={10} defaultValue={localStorage.getItem('hawklaunch_ads_per_code') || '2'}
                onChange={e => localStorage.setItem('hawklaunch_ads_per_code', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label mb-1.5 block">Prefixo da campanha</label>
              <input className="input" value={name} placeholder="S+ OFERTA" onChange={e => { setName(e.target.value); localStorage.setItem('hawklaunch_queue_smart_name', e.target.value) }} />
            </div>
            <div>
              <label className="label mb-1.5 block">Evento de otimização</label>
              <select className="select" defaultValue={localStorage.getItem('hawklaunch_opt_event') || 'SHOPPING'} onChange={e => localStorage.setItem('hawklaunch_opt_event', e.target.value)}>
                <option value="SHOPPING">Purchase</option><option value="INITIATE_ORDER">Initiate Checkout</option><option value="ON_WEB_CART">Add to Cart</option><option value="ON_WEB_DETAIL">View Content</option>
              </select>
            </div>
          </div>
          <div className="px-3 py-2 bg-hawk-input rounded font-mono text-sm text-hawk-accent">{name || 'S+ OFERTA'} 01</div>
        </div>
      </details>

      <StepFooter prev={1} next={3} />
    </div>
  )
}

/* ====== QUEUE: STEP 3 — MANUAL CONFIG ====== */
function QueueManualConfig() {
  const { setStep } = useAppStore()
  const manualCount = parseInt(localStorage.getItem('hawklaunch_queue_manual_count') || '0')

  const [identityType, setIdentityType] = useState(() => localStorage.getItem('hawklaunch_manual_identity_type') || 'AUTH_CODE')
  const [cta, setCta] = useState(() => localStorage.getItem('hawklaunch_manual_cta') || 'SHOP_NOW')
  const [objective, setObjective] = useState(() => localStorage.getItem('hawklaunch_manual_objective') || 'CONVERSIONS')
  const [budgetMode, setBudgetMode] = useState(() => localStorage.getItem('hawklaunch_manual_budget_mode') || 'cbo')
  const [budget, setBudget] = useState(() => localStorage.getItem('hawklaunch_queue_manual_budget') || '50')
  const [bidPrice, setBidPrice] = useState(() => localStorage.getItem('hawklaunch_manual_bid_price') || '')
  const [name, setName] = useState(() => localStorage.getItem('hawklaunch_queue_manual_name') || '')

  const [autoTarget, setAutoTarget] = useState(() => localStorage.getItem('hawklaunch_manual_auto_target') !== 'false')
  const [ageGroups, setAgeGroups] = useState<Set<string>>(() => {
    try { const r = localStorage.getItem('hawklaunch_manual_age_groups'); return r ? new Set(JSON.parse(r)) : new Set(['AGE_18_24','AGE_25_34','AGE_35_44','AGE_45_54','AGE_55_100']) } catch { return new Set(['AGE_18_24','AGE_25_34','AGE_35_44','AGE_45_54','AGE_55_100']) }
  })
  const [gender, setGender] = useState(() => localStorage.getItem('hawklaunch_manual_gender') || 'GENDER_UNLIMITED')
  const [os, setOs] = useState<Set<string>>(() => {
    try { const r = localStorage.getItem('hawklaunch_manual_os'); return r ? new Set(JSON.parse(r)) : new Set(['ANDROID','IOS']) } catch { return new Set(['ANDROID','IOS']) }
  })

  const CTA_OPTIONS = [
    { v: 'SHOP_NOW', l: 'Shop now' }, { v: 'LEARN_MORE', l: 'Learn more' }, { v: 'ORDER_NOW', l: 'Order now' },
    { v: 'BUY_NOW', l: 'Buy now' }, { v: 'SIGN_UP', l: 'Sign up' }, { v: 'CONTACT_US', l: 'Contact us' },
    { v: 'GET_NOW', l: 'Get it now' }, { v: 'GET_YOURS', l: 'Get yours' }, { v: 'VIEW_NOW', l: 'View now' },
  ]
  const OBJECTIVES = [
    { v: 'CONVERSIONS', l: '💰 Conversões' }, { v: 'TRAFFIC', l: '🖱️ Tráfego' },
    { v: 'REACH', l: '📡 Alcance' }, { v: 'VIDEO_VIEWS', l: '▶️ Views' },
  ]

  function toggleAge(v: string) { const n = new Set(ageGroups); n.has(v) ? n.delete(v) : n.add(v); setAgeGroups(n); localStorage.setItem('hawklaunch_manual_age_groups', JSON.stringify([...n])) }
  function toggleOs(v: string) { const n = new Set(os); n.has(v) ? n.delete(v) : n.add(v); setOs(n); localStorage.setItem('hawklaunch_manual_os', JSON.stringify([...n])) }

  if (manualCount === 0) return (
    <div className="card animate-fade-in">
      <h2 className="text-lg font-bold mb-4">🎯 Manual Config</h2>
      <div className="text-center py-12 text-gray-500">0 campanhas Manual na fila — pule esta etapa.</div>
      <StepFooter prev={2} next={4} />
    </div>
  )

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold">🎯 Manual Config</h2>
        <span className="text-xs px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-400 font-bold">{manualCount} campanhas/conta</span>
      </div>

      {/* Identity */}
      <details open className="mb-4">
        <summary className="text-sm font-bold cursor-pointer mb-3 text-gray-300">🔗 Identity</summary>
        <div className="pl-1">
          <div className="grid grid-cols-2 gap-3">
            {[{ key: 'AUTH_CODE', icon: '🔗', title: 'Spark Ads' }, { key: 'CUSTOMIZED_USER', icon: '⚡', title: 'Custom User' }].map(t => (
              <div key={t.key} onClick={() => { setIdentityType(t.key); localStorage.setItem('hawklaunch_manual_identity_type', t.key) }}
                className={`bg-hawk-input border-2 rounded-lg p-3 cursor-pointer text-center text-xs font-bold ${identityType === t.key ? 'border-hawk-accent bg-hawk-accent/5' : 'border-hawk-border'}`}>
                <span className="mr-1">{t.icon}</span>{t.title}
              </div>
            ))}
          </div>
          {identityType === 'AUTH_CODE' && <div className="mt-2 text-[11px] text-green-400">✓ Usa os mesmos Spark Codes configurados no passo Smart+</div>}
        </div>
      </details>

      {/* Creative */}
      <details open className="mb-4">
        <summary className="text-sm font-bold cursor-pointer mb-3 text-gray-300">🎬 Criativos</summary>
        <div className="pl-1">
          <div className="text-[11px] text-gray-500 mb-3">URLs, domínios e textos compartilhados do passo anterior.</div>
          <label className="label mb-2 block">Call to Action</label>
          <div className="flex flex-wrap gap-1.5">
            {CTA_OPTIONS.map(c => (
              <div key={c.v} onClick={() => { setCta(c.v); localStorage.setItem('hawklaunch_manual_cta', c.v) }}
                className={`chip text-[10px] ${cta === c.v ? 'active' : ''}`}>{c.l}</div>
            ))}
          </div>
        </div>
      </details>

      {/* Estrutura */}
      <details open className="mb-4">
        <summary className="text-sm font-bold cursor-pointer mb-3 text-gray-300">🏗️ Estrutura</summary>
        <div className="space-y-3 pl-1">
          <div>
            <label className="label mb-2 block">Objetivo</label>
            <div className="grid grid-cols-4 gap-2">
              {OBJECTIVES.map(o => (
                <div key={o.v} onClick={() => { setObjective(o.v); localStorage.setItem('hawklaunch_manual_objective', o.v) }}
                  className={`bg-hawk-input border-2 rounded-lg p-2 cursor-pointer text-center text-[11px] font-bold ${objective === o.v ? 'border-hawk-accent bg-hawk-accent/5' : 'border-hawk-border'}`}>
                  {o.l}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="label mb-2 block">Modo de orçamento</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ v: 'cbo', l: 'CBO — Orçamento na campanha' }, { v: 'abo', l: 'ABO — Orçamento no ad group' }].map(b => (
                <div key={b.v} onClick={() => { setBudgetMode(b.v); localStorage.setItem('hawklaunch_manual_budget_mode', b.v) }}
                  className={`bg-hawk-input border-2 rounded-lg p-2 cursor-pointer text-center text-xs font-bold ${budgetMode === b.v ? 'border-hawk-accent bg-hawk-accent/5' : 'border-hawk-border'}`}>
                  {b.l}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label mb-1.5 block">Budget diário</label>
              <input className="input" type="number" value={budget} onChange={e => { setBudget(e.target.value); localStorage.setItem('hawklaunch_queue_manual_budget', e.target.value) }} />
            </div>
            <div>
              <label className="label mb-1.5 block">Lance CPA <span className="text-[10px] text-gray-500">(0 = auto)</span></label>
              <input className="input" type="number" placeholder="0" value={bidPrice} onChange={e => { setBidPrice(e.target.value); localStorage.setItem('hawklaunch_manual_bid_price', e.target.value) }} />
            </div>
          </div>
          <div>
            <label className="label mb-1.5 block">Prefixo da campanha</label>
            <input className="input" value={name} placeholder="MN OFERTA" onChange={e => { setName(e.target.value); localStorage.setItem('hawklaunch_queue_manual_name', e.target.value) }} />
          </div>
          <div className="px-3 py-2 bg-hawk-input rounded font-mono text-sm text-hawk-accent">{name || 'MN OFERTA'} 01</div>
        </div>
      </details>

      {/* Targeting */}
      <details className="mb-4">
        <summary className="text-sm font-bold cursor-pointer mb-3 text-gray-300">🎯 Targeting</summary>
        <div className="pl-1">
          <ToggleRow title="Targeting automático" desc="IA do TikTok define o público" defaultOn={autoTarget} onChange={v => { setAutoTarget(v); localStorage.setItem('hawklaunch_manual_auto_target', String(v)) }} />
          <div className={autoTarget ? 'opacity-40 pointer-events-none mt-3' : 'mt-3'}>
            <div className="mb-3">
              <label className="label mb-1.5 block text-xs">Faixa etária</label>
              <div className="flex flex-wrap gap-1.5">
                {[{v:'AGE_18_24',l:'18-24'},{v:'AGE_25_34',l:'25-34'},{v:'AGE_35_44',l:'35-44'},{v:'AGE_45_54',l:'45-54'},{v:'AGE_55_100',l:'55+'}].map(a=>(
                  <div key={a.v} onClick={()=>toggleAge(a.v)} className={`chip text-[10px] ${ageGroups.has(a.v)?'active':''}`}>{a.l}</div>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="label mb-1.5 block text-xs">Gênero</label>
              <div className="flex gap-1.5">
                {[{v:'GENDER_UNLIMITED',l:'Todos'},{v:'GENDER_MALE',l:'Masculino'},{v:'GENDER_FEMALE',l:'Feminino'}].map(g=>(
                  <div key={g.v} onClick={()=>{setGender(g.v);localStorage.setItem('hawklaunch_manual_gender',g.v)}} className={`chip text-[10px] ${gender===g.v?'active':''}`}>{g.l}</div>
                ))}
              </div>
            </div>
            <div>
              <label className="label mb-1.5 block text-xs">Sistema operacional</label>
              <div className="flex gap-1.5">
                {[{v:'ANDROID',l:'🤖 Android'},{v:'IOS',l:'🍎 iOS'}].map(o=>(
                  <div key={o.v} onClick={()=>toggleOs(o.v)} className={`chip text-[10px] ${os.has(o.v)?'active':''}`}>{o.l}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </details>

      <StepFooter prev={2} next={4} />
    </div>
  )
}
