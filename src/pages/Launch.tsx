import { useState, useEffect, useMemo, useRef } from 'react'
import { useAppStore } from '@/store'
import { api } from '@/lib/api'
import { useAccounts } from '@/hooks/useAccounts'

const STEPS = ['Contas', 'Identity', 'Criativos', 'Estrutura', 'Targeting', 'Proxy', 'Lançar']

export default function Launch() {
  const { currentStep, setStep, campaignType, setCampaignType } = useAppStore()
  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-3 gap-4 mb-7">
        {([
          { type: 'smart-spark', icon: '🔥', title: 'Smart+ Spark Ads', badge: 'novo', cls: 'badge-new' },
          { type: 'smart-catalog', icon: '📦', title: 'Smart+ Catálogo', badge: 'catálogo', cls: 'badge-catalog' },
          { type: 'manual', icon: '🎯', title: 'Manual', badge: 'clássico', cls: 'badge-popular' },
        ] as const).map(c => (
          <div key={c.type} onClick={() => setCampaignType(c.type as any)}
            className={`bg-hawk-card border-2 rounded-xl p-4 cursor-pointer transition-all relative ${campaignType === c.type ? 'border-hawk-accent bg-hawk-accent/5' : 'border-hawk-border hover:border-gray-500'}`}>
            {campaignType === c.type && <div className="absolute top-2 right-2 w-5 h-5 bg-hawk-accent rounded-full flex items-center justify-center text-[10px] text-white font-bold">✓</div>}
            <span className="text-xl">{c.icon}</span>
            <span className="text-sm font-bold ml-2">{c.title}</span>
            <span className={`badge ${c.cls} ml-2`}>{c.badge}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-1 mb-7 bg-[#12141c] p-1.5 rounded-xl overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={i} onClick={() => setStep(i)} className={`step-tab ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}>
            <span className="block font-mono text-[10px] opacity-60 mb-0.5">{String(i+1).padStart(2,'0')}</span>{s}
          </div>
        ))}
      </div>
      {currentStep === 0 && <StepAccounts />}
      {currentStep === 1 && <StepIdentity />}
      {currentStep === 2 && <StepCreative />}
      {currentStep === 3 && <StepStructure />}
      {currentStep === 4 && <StepTargeting />}
      {currentStep === 5 && <StepProxy />}
      {currentStep === 6 && <StepLaunch />}
    </div>
  )
}

/* ====== STEP 0: ACCOUNTS (cached + TikTok links) ====== */
function StepAccounts() {
  const { setStep, bcId, setSelectedAccounts } = useAppStore()
  const { accounts, selected, loading, loadAccounts, toggle, selectAll, selectNone, campaignStatus, checkingCampaigns, campaignCheckProgress } = useAccounts(bcId)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

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
    ids.forEach(id => {
      window.open(`https://ads.tiktok.com/i18n/manage/campaign?aadvid=${id}&is_refresh_page=true`, '_blank')
    })
  }

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5"><div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">👥</div><h2 className="text-lg font-bold">Select Ad Accounts</h2></div>
        <div className="text-sm text-gray-400"><span className="text-hawk-accent font-bold">{selected.size}</span> selecionada(s)</div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <button className="btn btn-primary btn-sm" onClick={loadAccounts}>
          {loading ? '⏳ Carregando...' : accounts.length > 0 ? '↻ Recarregar' : 'Load Accounts'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => selectAll(filtered.map(a => a.advertiser_id))}>Todas</button>
        <button className="btn btn-secondary btn-sm" onClick={selectNone}>Nenhuma</button>
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
                <div className="text-[11px] text-gray-500 font-mono">{a.advertiser_id}</div>
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
          setStep(1)
        }} disabled={selected.size === 0}>Próximo → Identity</button>
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
  const [ctas, setCtas] = useState<Set<string>>(new Set(['SHOP_NOW','LEARN_MORE','ORDER_NOW','BUY_NOW','SIGN_UP','VIEW_NOW','GET_OFFER','VISIT_STORE','CONTACT_US','DOWNLOAD']))
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
          <div><label className="label mb-1.5 block">CTAs (selecione vários)</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {[
                {v:'GET_NOW',l:'Get it now'},{v:'LEARN_MORE',l:'Learn more'},{v:'SHOP_NOW',l:'Shop now'},
                {v:'CHECK_IT_OUT',l:'Check it out'},{v:'GET_YOUR_ORDER_NOW',l:'Get your order now'},
                {v:'PLACE_ORDER_TODAY',l:'Place your order today'},{v:'ORDER_YOURS_TODAY',l:'Order yours today'},
                {v:'GET_YOURS',l:'Get yours'},{v:'CLICK_TO_SHOP_NOW',l:'Click to shop now'},
                {v:'BUY_NOW',l:'Buy it now'},{v:'DOWNLOAD',l:'Download'},{v:'SIGN_UP',l:'Sign up'},
                {v:'CONTACT_US',l:'Contact us'},{v:'APPLY_NOW',l:'Apply now'},{v:'BOOK_NOW',l:'Book now'},
                {v:'PLAY_GAME',l:'Play game'},{v:'WATCH_NOW',l:'Watch now'},{v:'READ_MORE',l:'Read more'},
                {v:'VIEW_NOW',l:'View now'},{v:'GET_QUOTE',l:'Get quote'},{v:'ORDER_NOW',l:'Order now'},
                {v:'INSTALL_NOW',l:'Install now'},{v:'GET_SHOWTIMES',l:'Get showtimes'},
                {v:'LISTEN_NOW',l:'Listen now'},{v:'INTERESTED',l:'Interested'},{v:'SUBSCRIBE',l:'Subscribe'},
                {v:'GET_TICKETS_NOW',l:'Get tickets now'},{v:'EXPERIENCE_NOW',l:'Experience now'},
                {v:'PRE_ORDER_NOW',l:'Pre-order now'},{v:'VISIT_STORE',l:'Visit store'},
                {v:'DONATE_NOW',l:'Donate now'},
              ].map(c=><div key={c.v} onClick={()=>{const n=new Set(ctas);n.has(c.v)?n.delete(c.v):n.add(c.v);setCtas(n);localStorage.setItem('hawklaunch_ctas',JSON.stringify([...n]))}}
                className={`chip text-[10px] ${ctas.has(c.v)?'active':''}`}>{c.l}</div>)}
            </div></div>
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
function StepProxy() {
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
      <StepFooter prev={4} next={6}/>
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

  async function launch() {
    setLaunching(true); setLogs([]); setProgress(0); setResult(null); setShowModal(true); abortRef.current = false

    const sparkCodes = (localStorage.getItem('hawklaunch_spark_codes') || '').split('\n').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
    const proxyList = (localStorage.getItem('hawklaunch_proxy_list') || '').split('\n').map((p: string) => p.trim()).filter((p: string) => p.length > 0)
    const ctaCacheRaw = localStorage.getItem('hawklaunch_cta_cache')
    const ctaCacheSaved: Record<string, string> = ctaCacheRaw ? JSON.parse(ctaCacheRaw) : {}
    const destUrl = localStorage.getItem('hawklaunch_dest_url') || ''
    const domainList = (localStorage.getItem('hawklaunch_domain_list') || '').split('\n').map((d: string) => d.trim()).filter((d: string) => d.length > 0)
    const adTexts = (localStorage.getItem('hawklaunch_ad_texts') || '').split('\n').filter((t: string) => t.trim())
    const ctasRaw = localStorage.getItem('hawklaunch_ctas')
    const ctas = ctasRaw ? JSON.parse(ctasRaw) : ['SHOP_NOW']
    const budget = parseInt(localStorage.getItem('hawklaunch_budget') || '80')
    const targetCpa = parseInt(localStorage.getItem('hawklaunch_target_cpa') || '0')
    const adsPerCode = parseInt(localStorage.getItem('hawklaunch_ads_per_code') || '2')
    const offerName = localStorage.getItem('hawklaunch_offer_name') || 'HL'

    if (sparkCodes.length === 0) { addLog('ERROR', 'Nenhum Spark Code configurado!'); setLaunching(false); return }
    if (!destUrl) { addLog('ERROR', 'URL de destino não configurada!'); setLaunching(false); return }

    addLog('INFO', 'Iniciando lançamento Smart+ Spark Ads...')
    if (domainList.length > 0) {
      addLog('INFO', '🌐 Rodízio de domínios: ' + domainList.length + ' domínio(s) configurado(s)')
    }
    if (proxyList.length > 0) {
      addLog('INFO', '🛡️ Proxy ativa: ' + proxyList.length + ' proxy(ies) configurada(s)')
    } else {
      addLog('WARN', '⚠️ Sem proxy — requests saindo do IP da Vercel')
    }
    addLog('INFO', selectedAccounts.length + ' conta(s) × ' + sparkCodes.length + ' código(s) × ' + adsPerCode + ' ad(s)/código')
    addLog('DEBUG', 'Budget: R$' + budget + '/dia | CPA: ' + (targetCpa ? 'R$' + targetCpa : 'Auto'))
    setProgress(5)

    let scheduleStart = undefined
    if (schedule === 'custom' && customSchedule) {
      // Converte Brasília (UTC-3) para UTC
      const localDate = new Date(customSchedule)
      const utcDate = new Date(localDate.getTime() + 3 * 3600000)
      scheduleStart = utcDate.toISOString().replace('T', ' ').substring(0, 19)
      addLog('INFO', '🕐 Início agendado: ' + customSchedule + ' BRT → ' + scheduleStart + ' UTC')
    } else if (schedule !== 'now') {
      const mins = schedule === '1h' ? 60 : schedule === '3h' ? 180 : schedule === '6h' ? 360 : schedule === '12h' ? 720 : 60
      const d = new Date(Date.now() + mins * 60000)
      scheduleStart = d.toISOString().replace('T', ' ').substring(0, 19)
      addLog('INFO', '🕐 Início agendado: +' + schedule + ' → ' + scheduleStart + ' UTC')
    }

    try {
      const payload = {
        accounts: selectedAccounts,
        campaign_name: offerName + ' ' + new Date().toLocaleDateString('pt-BR'),
        adgroup_name: 'AG ' + offerName + ' ' + new Date().toLocaleDateString('pt-BR'),
        ad_name: offerName,
        spark_codes: sparkCodes,
        rotation: true,
        campaigns_per_account: parseInt(localStorage.getItem('hawklaunch_camps_per_account') || '5'),
        ads_per_code: adsPerCode,
        landing_page_url: destUrl,
        domain_list: domainList,
        cta_cache: ctaCacheSaved,
        start_paused: startPaused,
        ad_texts: adTexts,
        call_to_action_list: ctas,
        budget: budget,
        target_cpa: targetCpa || undefined,
        pixel_id: localStorage.getItem('hawklaunch_pixel_id') || undefined, optimization_event: localStorage.getItem('hawklaunch_opt_event') || 'SHOPPING',
        location_ids: ['3469034'],
        schedule_start: scheduleStart,
      }

      addLog('DEBUG', 'Payload montado, enviando...')
      setProgress(15)

      // Per-campaign loop with delays
      const campsPerAcc = parseInt(localStorage.getItem('hawklaunch_camps_per_account') || '5')
      let totalResult = { campaigns: 0, adgroups: 0, ads: 0 }
      let allLogs: any[] = []
      let allErrors: any[] = []
      const rndWait = (min: number, max: number) => new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min))

      for (let ai = 0; ai < selectedAccounts.length; ai++) {
        const acc = selectedAccounts[ai]
        addLog('INFO', '━━━ Conta ' + (ai+1) + '/' + selectedAccounts.length + ': ' + (acc.advertiser_name || acc.advertiser_id) + ' ━━━')
        if (abortRef.current) { addLog('WARN', '⛔ Lançamento interrompido pelo usuário'); break }
        if (ai > 0) { addLog('INFO', '⏳ Aguardando antes da próxima conta...'); await rndWait(120000, 180000) }

        for (let cp = 0; cp < campsPerAcc; cp++) {
          if (abortRef.current) { addLog('WARN', '⛔ Interrompido'); break }
          if (cp > 0) { addLog('DEBUG', '⏳ Aguardando entre campanhas...'); await rndWait(4000, 8000) }
          setProgress(Math.round(15 + (((ai * campsPerAcc + cp) / (selectedAccounts.length * campsPerAcc)) * 80)))

          const singlePayload = { ...payload, accounts: [acc], campaigns_per_account: 1, start_seq: ((payload as any).start_seq || 1) + (ai * campsPerAcc) + cp, proxy_list: proxyList, account_index: ai }
          try {
            const r = await api.launchSmart(singlePayload)
            if (r.code === 0 && r.data) {
              const d = r.data as any
              totalResult.campaigns += d.campaigns || 0
              totalResult.adgroups += d.adgroups || 0
              totalResult.ads += d.ads || 0
              // Salva CTA IDs retornados para reutilizar nas próximas campanhas
              if (d.cta_cache) {
                const merged = { ...ctaCacheSaved, ...d.cta_cache }
                localStorage.setItem('hawklaunch_cta_cache', JSON.stringify(merged))
                Object.assign(ctaCacheSaved, d.cta_cache)
              }
              if (d.logs) d.logs.forEach((l: any) => {
                const cat = l.message.includes('❌') ? 'ERROR' : l.message.includes('✅') ? 'OK' : l.message.includes('⚠') ? 'WARN' : 'INFO'
                addLog(cat, l.message)
              })
              if (d.errors) allErrors.push(...d.errors)
            } else { addLog('ERROR', 'API: ' + ((r as any).message || (r as any).error || '?')) }
          } catch(e: any) { addLog('ERROR', 'Fatal: ' + e.message + (e.stack ? ' | ' + e.stack.split('\n')[1] : '')) }
        }
      }

      setProgress(100)
      setResult(totalResult)
      addLog('OK', '✅ MISSÃO COMPLETA! ' + totalResult.campaigns + ' camp, ' + totalResult.adgroups + ' ag, ' + totalResult.ads + ' ads')
      if (allErrors.length) allErrors.forEach((e: any) => addLog('ERROR', '[' + e.step + '] ' + e.error))
      selectedAccounts.forEach((acc: any) => addLog('INFO', '• ' + (acc.advertiser_name || acc.advertiser_id)))

    } catch(err: any) {
      addLog('ERROR', 'Fatal: ' + err.message)
    }

    setLaunching(false)
  }

  function catColor(cat: string) {
    if (cat === 'OK') return 'text-green-400 bg-green-500/15'
    if (cat === 'ERROR') return 'text-red-400 bg-red-500/15'
    if (cat === 'WARN') return 'text-yellow-400 bg-yellow-500/15'
    if (cat === 'INFO') return 'text-blue-400 bg-blue-500/15'
    return 'text-gray-400 bg-gray-500/15'
  }

  const checklist = [
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
                  selectedAccounts.forEach((acc: any) => {
                    window.open('https://ads.tiktok.com/i18n/manage/campaign?aadvid=' + acc.advertiser_id + '&is_refresh_page=true', '_blank')
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
            UTC (TikTok): {new Date(new Date(customSchedule).getTime() + 3*3600000).toISOString().replace('T',' ').slice(0,19)}
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
      <p className="mt-3 text-xs text-gray-500">{selectedAccounts.length} conta(s) — Smart+ Spark Ads</p>
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
      <button className="btn btn-secondary" onClick={() => setStep(5)}>← Proxy</button>
    </div>
  </div>
}

function StepFooter({prev,next}:{prev:number;next:number}){const{setStep}=useAppStore();return<div className="flex justify-between mt-6 pt-4 border-t border-hawk-border"><button className="btn btn-secondary" onClick={()=>setStep(prev)}>← Voltar</button><button className="btn btn-primary" onClick={()=>setStep(next)}>Próximo →</button></div>}
function ToggleRow({title,desc,defaultOn,onChange}:{title:string;desc:string;defaultOn?:boolean;onChange?:(v:boolean)=>void}){const[on,setOn]=useState(defaultOn||false);return<div className="flex items-center justify-between p-3 bg-hawk-input border border-hawk-border rounded-md mb-2"><div><div className="text-sm font-semibold">{title}</div><div className="text-[11px] text-gray-500">{desc}</div></div><div className={`toggle ${on?'on':''}`} onClick={()=>{setOn(!on);onChange?.(!on)}}/></div>}
