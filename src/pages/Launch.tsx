import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { api } from '@/lib/api'

const STEPS = ['Contas', 'Identity', 'Criativos', 'Estrutura', 'Targeting', 'Proxy', 'Lançar']

export default function Launch() {
  const { currentStep, setStep, campaignType, setCampaignType, bcId } = useAppStore()

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-3 gap-4 mb-7">
        {[
          { type: 'smart-spark', icon: '🔥', title: 'Smart+ Spark Ads', desc: 'Push ou Pull de posts orgânicos.', badge: 'novo', cls: 'badge-new' },
          { type: 'smart-catalog', icon: '📦', title: 'Smart+ Catálogo', desc: 'Vídeos gerados dos produtos.', badge: 'catálogo', cls: 'badge-catalog' },
          { type: 'manual', icon: '🎯', title: 'Manual', desc: 'Controle total. CBO ou ABO.', badge: 'clássico', cls: 'badge-popular' },
        ].map((c) => (
          <div key={c.type} onClick={() => setCampaignType(c.type as any)}
            className={`bg-hawk-card border-2 rounded-xl p-5 cursor-pointer transition-all relative overflow-hidden ${
              campaignType === c.type ? 'border-hawk-accent bg-hawk-accent/5 shadow-[0_0_30px_rgba(249,115,22,0.1)]' : 'border-hawk-border hover:border-gray-500'
            }`}>
            {campaignType === c.type && <div className="absolute top-3 right-3 w-6 h-6 bg-hawk-accent rounded-full flex items-center justify-center text-xs text-white font-bold">✓</div>}
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className="text-sm font-bold mb-1">{c.title}</div>
            <div className="text-[11px] text-gray-400 leading-relaxed mb-2">{c.desc}</div>
            <span className={`badge ${c.cls}`}>{c.badge}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-7 bg-[#12141c] p-1.5 rounded-xl overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={i} onClick={() => setStep(i)}
            className={`step-tab ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}>
            <span className="block font-mono text-[10px] opacity-60 mb-0.5">{String(i + 1).padStart(2, '0')}</span>
            {s}
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

function StepAccounts() {
  const { setStep, bcId, setSelectedAccounts } = useAppStore()
  const [accounts, setAccounts] = useState<any[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!bcId) return
    setLoading(true)
    api.getBcAdvertisers(bcId)
      .then(res => setAccounts(res.data?.list || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [bcId])

  const filtered = accounts.filter(a => {
    if (!filter) return true
    const name = (a.advertiser_name || '').toLowerCase()
    const id = (a.advertiser_id || '')
    return name.includes(filter.toLowerCase()) || id.includes(filter)
  })

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(a => a.advertiser_id)))
    }
  }

  function toggle(id: string) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  function handleNext() {
    const selectedAccounts = accounts.filter(a => selected.has(a.advertiser_id))
    setSelectedAccounts(selectedAccounts)
    setStep(1)
  }

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">👥</div>
          <h2 className="text-lg font-bold">Selecionar Ad Accounts</h2>
        </div>
        <span className="text-sm text-gray-400">{selected.size} de {accounts.length} selecionadas</span>
      </div>

      <div className="flex gap-3 mb-4">
        <input className="input flex-1" placeholder="🔍 Buscar por nome ou ID..." value={filter} onChange={e => setFilter(e.target.value)} />
        <button className="btn btn-secondary btn-sm" onClick={toggleAll}>
          {selected.size === filtered.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">⏳ Carregando {bcId ? 'contas do BC...' : 'contas...'}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
          {filtered.map(a => (
            <div key={a.advertiser_id} onClick={() => toggle(a.advertiser_id)}
              className={`bg-hawk-input border rounded-lg p-3 flex items-center gap-3 cursor-pointer transition-all ${
                selected.has(a.advertiser_id) ? 'border-hawk-accent bg-hawk-accent/5' : 'border-hawk-border hover:border-gray-500'
              }`}>
              <div className={`w-5 h-5 border-2 rounded flex items-center justify-center text-xs flex-shrink-0 ${
                selected.has(a.advertiser_id) ? 'bg-hawk-accent border-hawk-accent text-white' : 'border-hawk-border'
              }`}>{selected.has(a.advertiser_id) && '✓'}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold truncate">{a.advertiser_name}</div>
                <div className="text-[10px] text-gray-500 font-mono">{a.advertiser_id}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-6 pt-5 border-t border-hawk-border">
        <span className="text-xs text-gray-500">{selected.size} conta(s) selecionada(s)</span>
        <button className="btn btn-primary" onClick={handleNext} disabled={selected.size === 0}>
          Próximo → Identity
        </button>
      </div>
    </div>
  )
}

function StepIdentity() {
  const { setStep, selectedAccounts, campaignType } = useAppStore()
  const [identityType, setIdentityType] = useState<'spark' | 'custom'>('spark')
  const [sparkMethod, setSparkMethod] = useState('pull')
  const [identities, setIdentities] = useState<any[]>([])
  const [loadingId, setLoadingId] = useState(false)
  const [selectedIdentity, setSelectedIdentity] = useState('')

  useEffect(() => {
    if (selectedAccounts.length === 0) return
    setLoadingId(true)
    api.getIdentities(selectedAccounts[0].advertiser_id)
      .then(res => {
        const list = res.data?.list || []
        setIdentities(list)
        if (list.length > 0) setSelectedIdentity(list[0].identity_id)
      })
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
        <span className="badge badge-new">Spark Ads</span>
      </div>

      <div className="bg-purple-500/8 border border-purple-500/20 rounded-lg p-4 flex gap-3 mb-5">
        <span className="text-xl">💡</span>
        <div className="text-[13px] text-gray-300 leading-relaxed">
          <strong className="text-gray-100">Smart+ com Spark Ads</strong> — Use posts orgânicos do TikTok. O engagement é atribuído ao post original.
        </div>
      </div>

      <h4 className="label mb-3">Tipo de identity</h4>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { key: 'spark', icon: '🔗', title: 'Spark Ads', desc: 'Perfil TikTok via BC' },
          { key: 'custom', icon: '⚡', title: 'Custom User', desc: 'Nome + avatar customizado' },
        ].map(t => (
          <div key={t.key} onClick={() => setIdentityType(t.key as any)}
            className={`bg-hawk-input border-2 rounded-lg p-5 cursor-pointer transition-all text-center ${
              identityType === t.key ? 'border-purple-500 bg-purple-500/5' : 'border-hawk-border hover:border-gray-500'
            }`}>
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="text-sm font-bold mb-1">{t.title}</div>
            <div className="text-[11px] text-gray-500">{t.desc}</div>
          </div>
        ))}
      </div>

      {identityType === 'spark' && (
        <div className="card-sm bg-hawk-input">
          <h4 className="text-sm font-bold mb-4">🔗 Configuração Spark Ads</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label mb-1.5 block">Perfil Spark <span className="required">*</span></label>
              {loadingId ? (
                <div className="text-xs text-gray-400 mt-2">⏳ Carregando identities...</div>
              ) : (
                <select className="select" value={selectedIdentity} onChange={e => setSelectedIdentity(e.target.value)}>
                  {identities.length === 0 && <option>Nenhuma identity encontrada</option>}
                  {identities.map((id: any) => (
                    <option key={id.identity_id} value={id.identity_id}>
                      {id.display_name || id.identity_id} ({id.identity_type})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="label mb-1.5 block">Método</label>
              <select className="select" value={sparkMethod} onChange={e => setSparkMethod(e.target.value)}>
                <option value="pull">Pull — Posts existentes</option>
                <option value="push">Push — Enviar vídeo novo</option>
                <option value="code">Auth Code — Código do criador</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button className="btn btn-secondary btn-sm" onClick={() => {
              if (selectedAccounts[0]) {
                setLoadingId(true)
                api.getIdentities(selectedAccounts[0].advertiser_id)
                  .then(res => setIdentities(res.data?.list || []))
                  .finally(() => setLoadingId(false))
              }
            }}>↻ Sincronizar</button>
          </div>

          {sparkMethod === 'code' && (
            <>
              <div className="bg-hawk-accent/8 border border-hawk-accent/20 rounded-lg p-4 flex gap-3 mb-4">
                <span className="text-xl">🔑</span>
                <div className="text-[13px] text-gray-300">
                  <strong>Auth Code:</strong> Criador gera no app: Post → ⋯ → Ad Settings → Generate. Batch até 20.
                </div>
              </div>
              <label className="label mb-1.5 block">Video Auth Codes</label>
              <textarea className="input font-mono text-xs min-h-[80px]" placeholder={"Cole os códigos (um por linha)"} />
            </>
          )}

          <div className="mt-4 space-y-3">
            <ToggleRow title="TikTok Ads Only Mode" desc="Post pushed fica privado" />
            <ToggleRow title="Mesma Identity para todas" desc="Usa o mesmo perfil em todas as contas" defaultOn />
          </div>
        </div>
      )}

      {identityType === 'custom' && (
        <div className="card-sm bg-hawk-input">
          <h4 className="text-sm font-bold mb-4">⚡ Custom User</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="label mb-1.5 block">Nome</label><input className="input" placeholder="Ex: Loja Achados" /></div>
            <div><label className="label mb-1.5 block">Idioma</label><select className="select"><option>🇧🇷 Português</option><option>🇺🇸 English</option></select></div>
          </div>
          <button className="btn btn-primary btn-sm">⚡ Criar em todas as contas</button>
        </div>
      )}

      <div className="card-sm bg-hawk-input mt-4">
        <h4 className="text-sm font-bold mb-4">📡 Pixel</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label mb-1.5 block">Pixel</label><select className="select"><option>— Carregar Pixels —</option></select></div>
          <div className="flex items-end gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => {
              if (selectedAccounts[0]) api.getPixels(selectedAccounts[0].advertiser_id).then(res => console.log('Pixels:', res))
            }}>📥 Carregar</button>
          </div>
        </div>
      </div>

      <StepFooter prev={0} next={2} />
    </div>
  )
}

function StepCreative() {
  const { campaignType, selectedAccounts } = useAppStore()
  const [videos, setVideos] = useState<any[]>([])
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const isSpark = campaignType !== 'smart-catalog'

  function loadVideos() {
    if (selectedAccounts.length === 0) return
    setLoading(true)
    api.getVideos(selectedAccounts[0].advertiser_id)
      .then(res => setVideos(res.data?.list || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🎬</div>
          <h2 className="text-lg font-bold">Creative Assets</h2>
        </div>
        {isSpark ? <span className="badge badge-new">Spark</span> : <span className="badge badge-catalog">Catálogo</span>}
      </div>

      <div className="flex gap-2 mb-4">
        <button className="btn btn-secondary btn-sm" onClick={loadVideos}>
          {loading ? '⏳ Carregando...' : '🎬 Carregar Vídeos da Conta'}
        </button>
        <button className="btn btn-secondary btn-sm">📤 Upload Vídeos</button>
      </div>

      {videos.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {videos.slice(0, 20).map((v: any) => (
            <div key={v.video_id || v.material_id} onClick={() => {
              const id = v.video_id || v.material_id
              const next = new Set(selectedVideos)
              next.has(id) ? next.delete(id) : next.add(id)
              setSelectedVideos(next)
            }}
              className={`bg-hawk-input border-2 rounded-lg overflow-hidden cursor-pointer transition-all relative ${
                selectedVideos.has(v.video_id || v.material_id) ? 'border-hawk-accent' : 'border-hawk-border hover:border-gray-500'
              }`}>
              <div className="w-full aspect-[9/16] bg-[#12141c] flex items-center justify-center">
                {v.preview_url || v.video_cover_url ? (
                  <img src={v.preview_url || v.video_cover_url} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-gray-600">🎥</span>
                )}
              </div>
              <div className="p-2">
                <div className="text-[10px] font-medium truncate">{v.file_name || v.video_id || 'Video'}</div>
                {v.duration && <div className="text-[9px] text-gray-500">{Math.round(v.duration)}s</div>}
              </div>
              {selectedVideos.has(v.video_id || v.material_id) && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-hawk-accent rounded-full flex items-center justify-center text-[10px] text-white font-bold">✓</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 pt-5 border-t border-hawk-border">
        <h4 className="label mb-3">Detalhes do anúncio</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="label mb-1.5 block">URL de destino <span className="required">*</span></label><input className="input" placeholder="https://seusite.com/oferta" /></div>
          <div><label className="label mb-1.5 block">Call to Action</label>
            <select className="select">
              <option value="SHOP_NOW">Compre Agora</option><option value="LEARN_MORE">Saiba Mais</option>
              <option value="ORDER_NOW">Peça Já</option><option value="VIEW_NOW">Ver Oferta</option>
              <option value="SIGN_UP">Cadastre-se</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="label mb-1.5 block">Textos do anúncio (um por linha)</label>
          <textarea className="input min-h-[80px]" placeholder={"Oferta imperdível!\nFrete grátis\nÚltimas unidades"} />
        </div>
        <ToggleRow title="Automatic Enhancements (Symphony)" desc="IA otimiza resize, qualidade, tradução" defaultOn />
      </div>

      <StepFooter prev={1} next={3} />
    </div>
  )
}

function StepStructure() {
  const [offerName, setOfferName] = useState('')
  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🏗️</div>
        <h2 className="text-lg font-bold">Campaign Structure</h2>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div><label className="label mb-1.5 block">Campanhas / conta</label><input className="input" type="number" defaultValue={1} min={1} /></div>
        <div><label className="label mb-1.5 block">Grupos / campanha</label><input className="input" type="number" defaultValue={1} min={1} /></div>
        <div><label className="label mb-1.5 block">Anúncios / grupo</label><input className="input" type="number" defaultValue={1} min={1} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div><label className="label mb-1.5 block">Objetivo</label>
          <select className="select"><option>Conversões (Website)</option><option>Lead Generation</option><option>App Promotion</option></select></div>
        <div><label className="label mb-1.5 block">Tipo de orçamento</label>
          <select className="select"><option value="cbo">CBO</option><option value="abo">ABO</option></select></div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div><label className="label mb-1.5 block">Orçamento diário (BRL)</label><input className="input" type="number" defaultValue={50} min={20} /></div>
        <div><label className="label mb-1.5 block">Target CPA</label><input className="input" type="number" placeholder="Opcional" /></div>
      </div>
      <div className="space-y-3 mb-5">
        <ToggleRow title="Randomizar orçamento" desc="Valor aleatório entre min e max" />
        <ToggleRow title="Randomizar estrutura (±1)" desc="Campanhas/grupos variam ±1" />
      </div>
      <div className="pt-5 border-t border-hawk-border">
        <h4 className="label mb-3">Nomenclatura</h4>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div><label className="label mb-1.5 block">Nome da oferta</label><input className="input" placeholder="CREME FACIAL" value={offerName} onChange={e => setOfferName(e.target.value)} /></div>
          <div><label className="label mb-1.5 block">Sequência inicial</label><input className="input" type="number" defaultValue={1} min={1} /></div>
        </div>
        <div className="px-3 py-2.5 bg-hawk-input rounded-md font-mono text-sm text-hawk-accent">
          Prévia: {offerName || 'OFERTA'} 01
        </div>
      </div>
      <StepFooter prev={2} next={4} />
    </div>
  )
}

function StepTargeting() {
  const [auto, setAuto] = useState(true)
  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🎯</div>
        <h2 className="text-lg font-bold">Audience Targeting</h2>
      </div>
      <ToggleRow title="Automatic Targeting (Smart+)" desc="IA do TikTok encontra o melhor público" defaultOn onChange={setAuto} />
      <div className={auto ? 'opacity-50 pointer-events-none mt-4' : 'mt-4'}>
        <h4 className="label mb-3">Faixas etárias</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {['13–17', '18–24', '25–34', '35–44', '45–54', '55+'].map((a, i) => (
            <div key={a} className={`chip ${i > 0 ? 'active' : ''}`} onClick={e => (e.target as HTMLElement).classList.toggle('active')}>{a}</div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="label mb-1.5 block">País</label>
            <select className="select"><option>🇧🇷 Brasil</option><option>🇺🇸 EUA</option><option>🇲🇽 México</option></select></div>
          <div><label className="label mb-1.5 block">Idioma</label>
            <select className="select"><option>Português</option><option>Inglês</option><option>Espanhol</option></select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label mb-2 block">Sistema operacional</label>
            <div className="flex gap-2"><div className="chip active">Android</div><div className="chip active">iOS</div></div></div>
          <div><label className="label mb-2 block">Gênero</label>
            <div className="flex gap-2"><div className="chip active">Todos</div><div className="chip">Masculino</div><div className="chip">Feminino</div></div></div>
        </div>
      </div>
      <StepFooter prev={3} next={5} />
    </div>
  )
}

function StepProxy() {
  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🛡️</div>
          <h2 className="text-lg font-bold">Proxy Settings</h2>
        </div>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-hawk-input text-gray-500 uppercase tracking-wider">Opcional</span>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div><label className="label mb-1.5 block">Modo</label>
          <select className="select"><option>Desativado</option><option>Por Conta</option><option>Aleatório</option></select></div>
        <div><label className="label mb-1.5 block">Protocolo</label>
          <select className="select"><option>Auto</option><option>SOCKS5</option><option>HTTP</option></select></div>
      </div>
      <label className="label mb-1.5 block">Proxies (um por linha)</label>
      <textarea className="input font-mono text-xs min-h-[100px]" placeholder={"ip:porta:usuario:senha"} />
      <StepFooter prev={4} next={6} />
    </div>
  )
}

function StepLaunch() {
  const { setStep, selectedAccounts, campaignType } = useAppStore()
  const [launching, setLaunching] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [schedule, setSchedule] = useState('now')

  async function handleLaunch() {
    setLaunching(true)
    setLogs([])
    setProgress(0)

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

    addLog('🔄 Iniciando lançamento...')
    setProgress(5)

    for (let i = 0; i < selectedAccounts.length; i++) {
      const acc = selectedAccounts[i]
      const pctBase = ((i / selectedAccounts.length) * 90) + 5

      addLog(`📋 [${i+1}/${selectedAccounts.length}] Conta: ${acc.advertiser_name || acc.advertiser_id}`)
      setProgress(pctBase)

      try {
        // Create campaign
        addLog(`  🏗️ Criando campanha Smart+...`)
        const campaignRes = await api.createCampaign({
          advertiser_id: acc.advertiser_id,
          campaign_name: `HawkLaunch ${new Date().toLocaleDateString('pt-BR')}`,
          objective_type: 'CONVERSIONS',
          budget_mode: 'BUDGET_MODE_DAY',
          budget: 50,
        })

        if (campaignRes.code === 0) {
          const campaignId = campaignRes.data?.campaign_id
          addLog(`  ✅ Campanha criada: ${campaignId}`)

          // Create ad group
          addLog(`  🎯 Criando ad group...`)
          const adgroupRes = await api.createAdGroup({
            advertiser_id: acc.advertiser_id,
            campaign_id: campaignId,
            adgroup_name: `AG ${new Date().toLocaleDateString('pt-BR')}`,
            optimization_goal: 'CONVERT',
            billing_event: 'CPC',
            budget: 50,
            schedule_type: 'SCHEDULE_FROM_NOW',
            location_ids: ['6105047'],
          })

          if (adgroupRes.code === 0) {
            addLog(`  ✅ Ad group criado: ${adgroupRes.data?.adgroup_id}`)
          } else {
            addLog(`  ⚠️ Ad group erro: ${adgroupRes.message}`)
          }
        } else {
          addLog(`  ❌ Campanha erro: ${campaignRes.message}`)
        }
      } catch (err: any) {
        addLog(`  ❌ Erro: ${err.message}`)
      }

      setProgress(pctBase + (90 / selectedAccounts.length))
    }

    setProgress(100)
    addLog('🚀 Lançamento concluído!')
    setLaunching(false)
  }

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🚀</div>
        <h2 className="text-lg font-bold">Launch Checklist</h2>
      </div>

      <div className="space-y-0 mb-6">
        {[
          { ok: true, text: 'Conta TikTok conectada' },
          { ok: selectedAccounts.length > 0, text: `Ad accounts selecionadas (${selectedAccounts.length})` },
          { ok: true, text: `Tipo: ${campaignType}` },
          { ok: true, text: 'Budget definido' },
        ].map((c, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-hawk-border last:border-b-0 text-sm">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              c.ok ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
            }`}>{c.ok ? '✓' : '!'}</div>
            <span>{c.text}</span>
          </div>
        ))}
      </div>

      <h4 className="label mb-3">Quando iniciar?</h4>
      <div className="flex flex-wrap gap-2 mb-6">
        {['now', '5min', '15min', '30min', '1h'].map(s => (
          <div key={s} className={`chip ${schedule === s ? 'active' : ''}`} onClick={() => setSchedule(s)}>
            {s === 'now' ? '⚡ Agora' : `+${s}`}
          </div>
        ))}
      </div>

      <div className="text-center py-8">
        <button onClick={handleLaunch} disabled={launching || selectedAccounts.length === 0}
          className="inline-flex items-center gap-3 px-12 py-4 bg-gradient-to-r from-hawk-accent to-orange-400 text-white rounded-full text-lg font-bold cursor-pointer shadow-[0_8px_40px_rgba(249,115,22,0.4)] hover:shadow-[0_12px_50px_rgba(249,115,22,0.6)] hover:-translate-y-0.5 transition-all disabled:opacity-50">
          🚀 LANÇAR CAMPANHAS
        </button>
        <p className="mt-4 text-xs text-gray-500">
          {selectedAccounts.length} conta(s) × campanhas = <strong>{selectedAccounts.length} ads</strong>
        </p>
      </div>

      {(launching || logs.length > 0) && (
        <div className="mt-4">
          <div className="h-1.5 bg-hawk-input rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-hawk-accent to-orange-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-3 bg-hawk-input rounded-md font-mono text-xs leading-[1.8] text-gray-400">
            {logs.map((l, i) => <div key={i} dangerouslySetInnerHTML={{ __html: l.replace('✅', '<span style="color:#22c55e">✅</span>').replace('❌', '<span style="color:#ef4444">❌</span>') }} />)}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-6 pt-5 border-t border-hawk-border">
        <button className="btn btn-secondary" onClick={() => setStep(5)}>← Proxy</button>
        <div className="flex gap-2">
          {launching && <button className="btn btn-danger btn-sm">⛔ Parar</button>}
        </div>
      </div>
    </div>
  )
}

function StepFooter({ prev, next }: { prev: number; next: number }) {
  const { setStep } = useAppStore()
  return (
    <div className="flex justify-between items-center mt-6 pt-5 border-t border-hawk-border">
      <button className="btn btn-secondary" onClick={() => setStep(prev)}>← Voltar</button>
      <button className="btn btn-primary" onClick={() => setStep(next)}>Próximo →</button>
    </div>
  )
}

function ToggleRow({ title, desc, defaultOn, onChange }: { title: string; desc: string; defaultOn?: boolean; onChange?: (v: boolean) => void }) {
  const [on, setOn] = useState(defaultOn || false)
  return (
    <div className="flex items-center justify-between p-3 bg-hawk-input border border-hawk-border rounded-md">
      <div><div className="text-sm font-semibold">{title}</div><div className="text-[11px] text-gray-500">{desc}</div></div>
      <div className={`toggle ${on ? 'on' : ''}`} onClick={() => { setOn(!on); onChange?.(!on) }} />
    </div>
  )
}
