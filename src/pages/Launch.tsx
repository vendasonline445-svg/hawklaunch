import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/store'
import { api } from '@/lib/api'

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

/* ====== STEP 0: ACCOUNTS (Escala-style) ====== */
function StepAccounts() {
  const { setStep, bcId, setSelectedAccounts } = useAppStore()
  const [accounts, setAccounts] = useState<any[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!bcId) return
    setLoading(true)
    api.getBcAdvertisers(bcId)
      .then(res => setAccounts(res.data?.list || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [bcId])

  const counts = useMemo(() => {
    const canRun = accounts.filter(a => a.status === 'STATUS_ENABLE').length
    const suspended = accounts.filter(a => a.status !== 'STATUS_ENABLE' && a.status !== 'UNKNOWN').length
    const unknown = accounts.filter(a => a.status === 'UNKNOWN').length
    return { total: accounts.length, canRun, suspended: suspended + unknown }
  }, [accounts])

  const filtered = useMemo(() => {
    let list = accounts
    if (filter === 'active') list = list.filter(a => a.status === 'STATUS_ENABLE')
    if (filter === 'suspended') list = list.filter(a => a.status !== 'STATUS_ENABLE')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a => (a.advertiser_name || '').toLowerCase().includes(q) || (a.advertiser_id || '').includes(q))
    }
    return list
  }, [accounts, filter, search])

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(a => a.advertiser_id)))
  }
  function toggle(id: string) {
    const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n)
  }
  function handleNext() {
    setSelectedAccounts(accounts.filter(a => selected.has(a.advertiser_id)))
    setStep(1)
  }

  function statusBadge(status: string) {
    if (status === 'STATUS_ENABLE') return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/15 text-green-400">ATIVA</span>
    if (status === 'STATUS_DISABLE') return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-400">DESATIVADA</span>
    if (status === 'STATUS_SELF_SERVICE_UNAUDITED') return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/15 text-orange-400">UNAUDITED</span>
    if (status === 'STATUS_PENDING_CONFIRM') return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400">PENDENTE</span>
    if (status === 'STATUS_PUNISHED') return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-400">SUSPENSA</span>
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-500/15 text-gray-400">{status}</span>
  }

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">👥</div>
          <h2 className="text-lg font-bold">Select Ad Accounts</h2>
        </div>
        <div className="text-sm text-gray-400">
          <span className="text-hawk-accent font-bold">{selected.size}</span> selecionada(s)
        </div>
      </div>

      {/* Load + Select All buttons */}
      <div className="flex gap-2 mb-4">
        <button className="btn btn-primary btn-sm" onClick={() => {
          if (!bcId) return
          setLoading(true)
          api.getBcAdvertisers(bcId)
            .then(res => setAccounts(res.data?.list || []))
            .finally(() => setLoading(false))
        }}>
          {loading ? '⏳ Carregando...' : 'Load Accounts'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={toggleAll}>
          {selected.size === filtered.length && filtered.length > 0 ? 'Nenhuma' : 'Todas'}
        </button>
      </div>

      {/* Search */}
      <input className="input mb-4" placeholder="🔍 Buscar conta..." value={search} onChange={e => setSearch(e.target.value)} />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'all', label: `Todas (${counts.total})`, cls: '' },
          { key: 'active', label: `✅ Podem Subir (${counts.canRun})`, cls: '' },
          { key: 'suspended', label: `🚫 Suspensas (${counts.suspended})`, cls: '' },
        ].map(f => (
          <div key={f.key} className={`chip ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</div>
        ))}
      </div>

      {/* Account list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">⏳ Carregando contas do BC...</div>
      ) : filtered.length > 0 ? (
        <div className="max-h-[500px] overflow-y-auto border border-hawk-border rounded-lg divide-y divide-hawk-border">
          {filtered.map(a => (
            <div key={a.advertiser_id} onClick={() => toggle(a.advertiser_id)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                selected.has(a.advertiser_id) ? 'bg-hawk-accent/5' : 'hover:bg-hawk-card'
              }`}>
              <div className={`w-5 h-5 border-2 rounded flex items-center justify-center text-xs flex-shrink-0 ${
                selected.has(a.advertiser_id) ? 'bg-hawk-accent border-hawk-accent text-white' : 'border-hawk-border'
              }`}>{selected.has(a.advertiser_id) ? '✓' : ''}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{a.advertiser_name}</div>
                <div className="text-[11px] text-gray-500 font-mono">{a.advertiser_id}</div>
              </div>
              {statusBadge(a.status)}
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Clique em "Load Accounts" para carregar</div>
      ) : (
        <div className="text-center py-12 text-gray-500">Nenhuma conta neste filtro</div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-hawk-border">
        <div className="text-xs text-hawk-accent font-semibold">{selected.size} conta(s) selecionada(s)</div>
        <button className="btn btn-primary" onClick={handleNext} disabled={selected.size === 0}>
          Próximo → Identity
        </button>
      </div>
    </div>
  )
}

/* ====== STEP 1: IDENTITY ====== */
function StepIdentity() {
  const { setStep, selectedAccounts } = useAppStore()
  const [identityType, setIdentityType] = useState<'spark'|'custom'>('spark')
  const [sparkMethod, setSparkMethod] = useState('pull')
  const [identities, setIdentities] = useState<any[]>([])
  const [loadingId, setLoadingId] = useState(false)
  const [selectedIdentity, setSelectedIdentity] = useState('')

  useEffect(() => {
    if (!selectedAccounts.length) return
    setLoadingId(true)
    api.getIdentities(selectedAccounts[0].advertiser_id)
      .then(res => { const l = res.data?.list || []; setIdentities(l); if (l.length) setSelectedIdentity(l[0].identity_id) })
      .catch(console.error)
      .finally(() => setLoadingId(false))
  }, [selectedAccounts])

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🔗</div>
          <h2 className="text-lg font-bold">Identity & Spark Ads</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[{ key:'spark', icon:'🔗', title:'Spark Ads', desc:'Perfil TikTok via BC' },
          { key:'custom', icon:'⚡', title:'Custom User', desc:'Nome + avatar' }].map(t => (
          <div key={t.key} onClick={() => setIdentityType(t.key as any)}
            className={`bg-hawk-input border-2 rounded-lg p-5 cursor-pointer text-center ${identityType === t.key ? 'border-purple-500 bg-purple-500/5' : 'border-hawk-border'}`}>
            <div className="text-2xl mb-2">{t.icon}</div><div className="text-sm font-bold">{t.title}</div><div className="text-[11px] text-gray-500">{t.desc}</div>
          </div>
        ))}
      </div>
      {identityType === 'spark' && (
        <div className="card-sm bg-hawk-input">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="label mb-1.5 block">Perfil Spark</label>
              {loadingId ? <span className="text-xs text-gray-400">⏳</span> :
              <select className="select" value={selectedIdentity} onChange={e => setSelectedIdentity(e.target.value)}>
                {identities.length === 0 && <option>Nenhuma identity</option>}
                {identities.map((id:any) => <option key={id.identity_id} value={id.identity_id}>{id.display_name || id.identity_id} ({id.identity_type})</option>)}
              </select>}
            </div>
            <div><label className="label mb-1.5 block">Método</label>
              <select className="select" value={sparkMethod} onChange={e => setSparkMethod(e.target.value)}>
                <option value="pull">Pull — Posts existentes</option><option value="push">Push — Enviar vídeo</option><option value="code">Auth Code</option>
              </select>
            </div>
          </div>
          {sparkMethod === 'code' && <><label className="label mb-1.5 block">Auth Codes</label><textarea className="input font-mono text-xs min-h-[80px]" placeholder="Um código por linha" /></>}
          <div className="mt-4 space-y-3">
            <ToggleRow title="Ads Only Mode" desc="Post pushed fica privado" />
            <ToggleRow title="Mesma Identity para todas" desc="Mesmo perfil em todas as contas" defaultOn />
          </div>
        </div>
      )}
      {identityType === 'custom' && (
        <div className="card-sm bg-hawk-input">
          <div className="grid grid-cols-2 gap-4"><div><label className="label mb-1.5 block">Nome</label><input className="input" placeholder="Loja Achados" /></div>
          <div><label className="label mb-1.5 block">Idioma</label><select className="select"><option>🇧🇷 PT</option><option>🇺🇸 EN</option></select></div></div>
          <button className="btn btn-primary btn-sm mt-4">⚡ Criar em todas</button>
        </div>
      )}
      <StepFooter prev={0} next={2} />
    </div>
  )
}

/* ====== STEP 2: CREATIVE ====== */
function StepCreative() {
  const { selectedAccounts } = useAppStore()
  const [videos, setVideos] = useState<any[]>([])
  const [selectedV, setSelectedV] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5"><div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🎬</div><h2 className="text-lg font-bold">Creative Assets</h2></div>
      </div>
      <div className="flex gap-2 mb-4">
        <button className="btn btn-secondary btn-sm" onClick={() => {
          if (!selectedAccounts[0]) return; setLoading(true)
          api.getVideos(selectedAccounts[0].advertiser_id).then(res => setVideos(res.data?.list || [])).finally(() => setLoading(false))
        }}>{loading ? '⏳' : '🎬 Carregar Vídeos'}</button>
      </div>
      {videos.length > 0 && <div className="grid grid-cols-5 gap-3 mb-4">
        {videos.slice(0,20).map((v:any) => {
          const id = v.video_id || v.material_id
          return <div key={id} onClick={() => { const n = new Set(selectedV); n.has(id)?n.delete(id):n.add(id); setSelectedV(n) }}
            className={`bg-hawk-input border-2 rounded-lg overflow-hidden cursor-pointer relative ${selectedV.has(id)?'border-hawk-accent':'border-hawk-border'}`}>
            <div className="w-full aspect-[9/16] bg-[#12141c] flex items-center justify-center">
              {v.preview_url||v.video_cover_url ? <img src={v.preview_url||v.video_cover_url} className="w-full h-full object-cover"/> : <span className="text-xl text-gray-600">🎥</span>}
            </div>
            <div className="p-1.5"><div className="text-[9px] truncate">{v.file_name||id}</div></div>
            {selectedV.has(id) && <div className="absolute top-1 right-1 w-4 h-4 bg-hawk-accent rounded-full flex items-center justify-center text-[8px] text-white">✓</div>}
          </div>
        })}
      </div>}
      <div className="pt-4 border-t border-hawk-border">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="label mb-1.5 block">URL de destino</label><input className="input" placeholder="https://seusite.com/oferta" /></div>
          <div><label className="label mb-1.5 block">CTA</label><select className="select"><option value="SHOP_NOW">Compre Agora</option><option value="LEARN_MORE">Saiba Mais</option></select></div>
        </div>
        <label className="label mb-1.5 block">Textos (um por linha)</label>
        <textarea className="input min-h-[60px]" placeholder="Oferta imperdível!" />
      </div>
      <StepFooter prev={1} next={3} />
    </div>
  )
}

/* ====== STEP 3-6 (compact) ====== */
function StepStructure() {
  const [name, setName] = useState('')
  return <div className="card animate-fade-in">
    <h2 className="text-lg font-bold mb-5">🏗️ Campaign Structure</h2>
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div><label className="label mb-1.5 block">Campanhas/conta</label><input className="input" type="number" defaultValue={1}/></div>
      <div><label className="label mb-1.5 block">Grupos/campanha</label><input className="input" type="number" defaultValue={1}/></div>
      <div><label className="label mb-1.5 block">Anúncios/grupo</label><input className="input" type="number" defaultValue={1}/></div>
    </div>
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div><label className="label mb-1.5 block">Objetivo</label><select className="select"><option>Conversões</option><option>Leads</option></select></div>
      <div><label className="label mb-1.5 block">Orçamento</label><select className="select"><option>CBO</option><option>ABO</option></select></div>
    </div>
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div><label className="label mb-1.5 block">Budget diário (BRL)</label><input className="input" type="number" defaultValue={50}/></div>
      <div><label className="label mb-1.5 block">Target CPA</label><input className="input" type="number" placeholder="Auto"/></div>
    </div>
    <ToggleRow title="Randomizar orçamento" desc="Valor aleatório" />
    <div className="mt-4 pt-4 border-t border-hawk-border">
      <div className="grid grid-cols-2 gap-4"><div><label className="label mb-1.5 block">Oferta</label><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="CREME FACIAL"/></div>
      <div><label className="label mb-1.5 block">Seq. inicial</label><input className="input" type="number" defaultValue={1}/></div></div>
      <div className="mt-2 px-3 py-2 bg-hawk-input rounded font-mono text-sm text-hawk-accent">{name||'OFERTA'} 01</div>
    </div>
    <StepFooter prev={2} next={4}/>
  </div>
}

function StepTargeting() {
  const [auto, setAuto] = useState(true)
  return <div className="card animate-fade-in">
    <h2 className="text-lg font-bold mb-5">🎯 Targeting</h2>
    <ToggleRow title="Auto Targeting (Smart+)" desc="IA do TikTok" defaultOn onChange={setAuto}/>
    <div className={auto?'opacity-40 pointer-events-none mt-4':'mt-4'}>
      <div className="flex flex-wrap gap-2 mb-4">{['18–24','25–34','35–44','45–54','55+'].map(a=><div key={a} className="chip active">{a}</div>)}</div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">País</label><select className="select"><option>🇧🇷 Brasil</option></select></div>
        <div><label className="label mb-1.5 block">Idioma</label><select className="select"><option>Português</option></select></div>
      </div>
    </div>
    <StepFooter prev={3} next={5}/>
  </div>
}

function StepProxy() {
  return <div className="card animate-fade-in">
    <h2 className="text-lg font-bold mb-5">🛡️ Proxy <span className="text-xs text-gray-500 font-normal ml-2">Opcional</span></h2>
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div><label className="label mb-1.5 block">Modo</label><select className="select"><option>Desativado</option><option>Por Conta</option><option>Aleatório</option></select></div>
      <div><label className="label mb-1.5 block">Protocolo</label><select className="select"><option>Auto</option><option>SOCKS5</option><option>HTTP</option></select></div>
    </div>
    <textarea className="input font-mono text-xs min-h-[80px]" placeholder="ip:porta:user:pass"/>
    <StepFooter prev={4} next={6}/>
  </div>
}

function StepLaunch() {
  const { setStep, selectedAccounts, campaignType } = useAppStore()
  const [launching, setLaunching] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [schedule, setSchedule] = useState('now')

  async function launch() {
    setLaunching(true); setLogs([]); setProgress(0)
    const log = (m:string) => setLogs(p => [...p, `[${new Date().toLocaleTimeString()}] ${m}`])
    log('🔄 Iniciando...'); setProgress(5)
    for (let i = 0; i < selectedAccounts.length; i++) {
      const acc = selectedAccounts[i]; const pct = ((i/selectedAccounts.length)*90)+5
      log(`📋 [${i+1}/${selectedAccounts.length}] ${acc.advertiser_name||acc.advertiser_id}`)
      setProgress(pct)
      try {
        const cr = await api.createCampaign({ advertiser_id: acc.advertiser_id, campaign_name: `HL ${new Date().toLocaleDateString('pt-BR')} ${i+1}`, objective_type:'CONVERSIONS', budget_mode:'BUDGET_MODE_DAY', budget:50 })
        if (cr.code === 0) log(`  ✅ Campanha: ${cr.data?.campaign_id}`)
        else log(`  ❌ ${cr.message}`)
      } catch(e:any) { log(`  ❌ ${e.message}`) }
    }
    setProgress(100); log('🚀 Concluído!'); setLaunching(false)
  }

  return <div className="card animate-fade-in">
    <h2 className="text-lg font-bold mb-5">🚀 Launch</h2>
    <div className="space-y-2 mb-6">
      {[{ok:true,t:'Conectado'},{ok:selectedAccounts.length>0,t:`${selectedAccounts.length} contas`},{ok:true,t:campaignType},{ok:true,t:'Budget R$50'}].map((c,i)=>
        <div key={i} className="flex items-center gap-3 py-2 border-b border-hawk-border text-sm">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${c.ok?'bg-green-500/15 text-green-400':'bg-yellow-500/15 text-yellow-400'}`}>{c.ok?'✓':'!'}</span>{c.t}
        </div>
      )}
    </div>
    <div className="flex gap-2 mb-6">{['now','5min','15min','30min'].map(s=><div key={s} className={`chip ${schedule===s?'active':''}`} onClick={()=>setSchedule(s)}>{s==='now'?'⚡ Agora':'+'+s}</div>)}</div>
    <div className="text-center py-6">
      <button onClick={launch} disabled={launching||!selectedAccounts.length}
        className="px-12 py-4 bg-gradient-to-r from-hawk-accent to-orange-400 text-white rounded-full text-lg font-bold shadow-[0_8px_40px_rgba(249,115,22,0.4)] hover:shadow-[0_12px_50px_rgba(249,115,22,0.6)] transition-all disabled:opacity-50">
        🚀 LANÇAR
      </button>
      <p className="mt-3 text-xs text-gray-500">{selectedAccounts.length} conta(s)</p>
    </div>
    {logs.length>0&&<div className="mt-4">
      <div className="h-1.5 bg-hawk-input rounded-full overflow-hidden mb-3"><div className="h-full bg-gradient-to-r from-hawk-accent to-orange-400 rounded-full transition-all" style={{width:`${progress}%`}}/></div>
      <div className="max-h-[250px] overflow-y-auto p-3 bg-hawk-input rounded-md font-mono text-[11px] leading-[1.8] text-gray-400">{logs.map((l,i)=><div key={i}>{l}</div>)}</div>
    </div>}
    <div className="flex justify-between mt-6 pt-4 border-t border-hawk-border">
      <button className="btn btn-secondary" onClick={()=>setStep(5)}>← Proxy</button>
      {launching&&<button className="btn btn-danger btn-sm">⛔ Parar</button>}
    </div>
  </div>
}

/* ====== SHARED ====== */
function StepFooter({prev,next}:{prev:number;next:number}) {
  const {setStep} = useAppStore()
  return <div className="flex justify-between mt-6 pt-4 border-t border-hawk-border">
    <button className="btn btn-secondary" onClick={()=>setStep(prev)}>← Voltar</button>
    <button className="btn btn-primary" onClick={()=>setStep(next)}>Próximo →</button>
  </div>
}
function ToggleRow({title,desc,defaultOn,onChange}:{title:string;desc:string;defaultOn?:boolean;onChange?:(v:boolean)=>void}) {
  const [on, setOn] = useState(defaultOn||false)
  return <div className="flex items-center justify-between p-3 bg-hawk-input border border-hawk-border rounded-md mb-2">
    <div><div className="text-sm font-semibold">{title}</div><div className="text-[11px] text-gray-500">{desc}</div></div>
    <div className={`toggle ${on?'on':''}`} onClick={()=>{setOn(!on);onChange?.(!on)}}/>
  </div>
}
