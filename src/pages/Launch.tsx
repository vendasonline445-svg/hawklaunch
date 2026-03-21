import { useState } from 'react'
import { useAppStore } from '@/store'
import type { CampaignType } from '@/types'

const STEPS = ['Contas', 'Identity', 'Criativos', 'Estrutura', 'Targeting', 'Proxy', 'Lançar']

const CAMPAIGN_TYPES: { type: CampaignType; icon: string; title: string; desc: string; badge: string; cls: string }[] = [
  { type: 'smart-spark', icon: '🔥', title: 'Smart+ Spark Ads', desc: 'Upgraded Smart+ com identidade Spark. Push ou Pull de posts orgânicos.', badge: 'novo', cls: 'badge-new' },
  { type: 'smart-catalog', icon: '📦', title: 'Smart+ Catálogo', desc: 'Catalog Ads com vídeos gerados dos produtos.', badge: 'catálogo', cls: 'badge-catalog' },
  { type: 'manual', icon: '🎯', title: 'Manual', desc: 'Controle total. CBO ou ABO.', badge: 'clássico', cls: 'badge-popular' },
]

export default function Launch() {
  const { currentStep, setStep, campaignType, setCampaignType } = useAppStore()

  return (
    <div className="animate-fade-in">
      {/* Campaign Type */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {CAMPAIGN_TYPES.map((c) => (
          <div
            key={c.type}
            onClick={() => setCampaignType(c.type)}
            className={`bg-hawk-card border-2 rounded-xl p-5 cursor-pointer transition-all relative overflow-hidden ${
              campaignType === c.type ? 'border-hawk-accent bg-hawk-accent/5 shadow-[0_0_30px_rgba(249,115,22,0.1)]' : 'border-hawk-border hover:border-gray-500'
            }`}
          >
            {campaignType === c.type && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-hawk-accent rounded-full flex items-center justify-center text-xs text-white font-bold">✓</div>
            )}
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className="text-sm font-bold mb-1">{c.title}</div>
            <div className="text-[11px] text-gray-400 leading-relaxed mb-2">{c.desc}</div>
            <span className={`badge ${c.cls}`}>{c.badge}</span>
          </div>
        ))}
      </div>

      {/* Steps Nav */}
      <div className="flex gap-1 mb-7 bg-[#12141c] p-1.5 rounded-xl overflow-x-auto">
        {STEPS.map((s, i) => (
          <div
            key={i}
            onClick={() => setStep(i)}
            className={`step-tab ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}
          >
            <span className="block font-mono text-[10px] opacity-60 mb-0.5">
              {String(i + 1).padStart(2, '0')}
            </span>
            {s}
          </div>
        ))}
      </div>

      {/* Step Content */}
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

/* ============ STEP 0: ACCOUNTS ============ */
function StepAccounts() {
  const { setStep } = useAppStore()
  const [accounts] = useState([
    { advertiser_id: '7389012345678', advertiser_name: 'Demo Account 01', status: 'active' },
    { advertiser_id: '7389012345679', advertiser_name: 'Demo Account 02', status: 'active' },
    { advertiser_id: '7389012345680', advertiser_name: 'Demo Account 03', status: 'suspended' },
  ])
  const [selected, setSelected] = useState<Set<string>>(new Set(['7389012345678']))

  const toggle = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">👥</div>
          <h2 className="text-lg font-bold">Selecionar Ad Accounts</h2>
        </div>
        <button className="btn btn-secondary btn-sm">↻ Carregar Contas</button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div><label className="label mb-1.5 block">Business Center</label><select className="select"><option>— Conecte primeiro —</option></select></div>
        <div><label className="label mb-1.5 block">Filtro</label><select className="select"><option>Todas</option><option>✅ Podem subir</option><option>🚫 Suspensas</option></select></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {accounts.map((a) => (
          <div
            key={a.advertiser_id}
            onClick={() => toggle(a.advertiser_id)}
            className={`bg-hawk-input border rounded-lg p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
              selected.has(a.advertiser_id) ? 'border-hawk-accent bg-hawk-accent/5' : 'border-hawk-border hover:border-gray-500'
            }`}
          >
            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center text-xs flex-shrink-0 ${
              selected.has(a.advertiser_id) ? 'bg-hawk-accent border-hawk-accent text-white' : 'border-hawk-border'
            }`}>
              {selected.has(a.advertiser_id) && '✓'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">{a.advertiser_name}</div>
              <div className="text-[11px] text-gray-500 font-mono">{a.advertiser_id}</div>
            </div>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-6 pt-5 border-t border-hawk-border">
        <button className="btn btn-primary" onClick={() => setStep(1)}>Próximo → Identity</button>
      </div>
    </div>
  )
}

/* ============ STEP 1: IDENTITY ============ */
function StepIdentity() {
  const { setStep, campaignType } = useAppStore()
  const [identityType, setIdentityType] = useState<'spark' | 'custom'>('spark')
  const [sparkMethod, setSparkMethod] = useState('pull')

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
          <strong className="text-gray-100">Smart+ com Spark Ads</strong> — Use posts orgânicos do TikTok como criativos.
          O engagement (likes, shares, comentários) é atribuído ao post original.
        </div>
      </div>

      <h4 className="label mb-3">Tipo de identity</h4>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { key: 'spark', icon: '🔗', title: 'Spark Ads', desc: 'Perfil TikTok linkado via BC' },
          { key: 'custom', icon: '⚡', title: 'Custom User', desc: 'Nome + avatar, sem perfil real' },
        ].map((t) => (
          <div
            key={t.key}
            onClick={() => setIdentityType(t.key as any)}
            className={`bg-hawk-input border-2 rounded-lg p-5 cursor-pointer transition-all text-center ${
              identityType === t.key ? 'border-purple-500 bg-purple-500/5' : 'border-hawk-border hover:border-gray-500'
            }`}
          >
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="text-sm font-bold mb-1">{t.title}</div>
            <div className="text-[11px] text-gray-500">{t.desc}</div>
          </div>
        ))}
      </div>

      {identityType === 'spark' && (
        <div className="card-sm bg-hawk-input mt-4">
          <h4 className="text-sm font-bold mb-4">🔗 Configuração Spark Ads</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="label mb-1.5 block">Perfil Spark <span className="required">*</span></label><select className="select"><option>— Carregar Perfis —</option></select></div>
            <div>
              <label className="label mb-1.5 block">Método</label>
              <select className="select" value={sparkMethod} onChange={(e) => setSparkMethod(e.target.value)}>
                <option value="pull">Pull — Usar posts existentes</option>
                <option value="push">Push — Enviar vídeo novo</option>
                <option value="code">Auth Code — Código do criador</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button className="btn btn-secondary btn-sm">↻ Sincronizar Perfis</button>
            <button className="btn btn-ghost btn-sm">＋ Criar Perfil</button>
          </div>

          {sparkMethod === 'code' && (
            <>
              <div className="bg-hawk-accent/8 border border-hawk-accent/20 rounded-lg p-4 flex gap-3 mb-4">
                <span className="text-xl">🔑</span>
                <div className="text-[13px] text-gray-300">
                  <strong>Auth Code:</strong> O criador gera o código no app: Post → ⋯ → Ad Settings → Generate. Batch de até 20 códigos.
                </div>
              </div>
              <label className="label mb-1.5 block">Video Auth Codes <span className="required">*</span></label>
              <textarea className="input font-mono text-xs min-h-[80px]" placeholder={"Cole os códigos aqui (um por linha)\nEx: abc123def456"} />
              <button className="btn btn-secondary btn-sm mt-2">🔍 Buscar & Autorizar</button>
            </>
          )}

          <div className="mt-4 space-y-3">
            <ToggleRow title="TikTok Ads Only Mode" desc="Post pushed fica privado, visível apenas como anúncio" />
            <ToggleRow title="Mesma Identity para todas as contas" desc="Usa o mesmo perfil Spark em todas as ad accounts" defaultOn />
          </div>
        </div>
      )}

      {identityType === 'custom' && (
        <div className="card-sm bg-hawk-input mt-4">
          <h4 className="text-sm font-bold mb-4">⚡ Custom User</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="label mb-1.5 block">Nome <span className="required">*</span></label><input className="input" placeholder="Ex: Loja Achados" /></div>
            <div><label className="label mb-1.5 block">Idioma</label><select className="select"><option>🇧🇷 Português</option><option>🇺🇸 English</option></select></div>
          </div>
          <button className="btn btn-primary btn-sm">⚡ Criar em todas as contas</button>
        </div>
      )}

      {/* Pixel */}
      <div className="card-sm bg-hawk-input mt-4">
        <h4 className="text-sm font-bold mb-4">📡 Pixel</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label mb-1.5 block">Pixel</label><select className="select"><option>— Carregar Pixels —</option></select></div>
          <div className="flex items-end gap-2"><button className="btn btn-secondary btn-sm">📥 Carregar</button><button className="btn btn-ghost btn-sm">🔗 Vincular</button></div>
        </div>
      </div>

      <StepFooter prev={0} next={2} />
    </div>
  )
}

/* ============ STEP 2: CREATIVE ============ */
function StepCreative() {
  const { campaignType } = useAppStore()
  const [source, setSource] = useState('pull')
  const isSpark = campaignType === 'smart-spark' || campaignType === 'manual'

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🎬</div>
          <h2 className="text-lg font-bold">Creative Assets</h2>
        </div>
        {isSpark ? <span className="badge badge-new">Spark</span> : <span className="badge badge-catalog">Catálogo</span>}
      </div>

      {isSpark ? (
        <>
          <div className="bg-purple-500/8 border border-purple-500/20 rounded-lg p-4 flex gap-3 mb-4">
            <span className="text-xl">🔥</span>
            <div className="text-[13px] text-gray-300">
              <strong>Smart+ Spark:</strong> Selecione posts do TikTok ou envie vídeos para Push. Combinar Spark e Non-Spark é suportado.
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {['📱 TikTok Posts (Pull)', '📤 Upload (Push)', '📚 Creative Library', '🤖 Recomendados IA'].map((s, i) => (
              <div key={i} className={`chip ${i === 0 ? 'active' : ''}`} onClick={(e) => {
                e.currentTarget.parentElement?.querySelectorAll('.chip').forEach(c => c.classList.remove('active'))
                e.currentTarget.classList.add('active')
              }}>{s}</div>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <button className="btn btn-secondary btn-sm">🎬 Carregar Posts</button>
            <button className="btn btn-secondary btn-sm">📤 Upload Vídeos</button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {['Spark Post #1', 'Spark Post #2', 'Upload #1'].map((v, i) => (
              <div key={i} className={`bg-hawk-input border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${i === 0 ? 'border-hawk-accent' : 'border-hawk-border hover:border-gray-500'} relative`}>
                <div className="w-full aspect-[9/16] bg-[#12141c] flex items-center justify-center text-2xl text-gray-600">🎥</div>
                <div className="p-2"><div className="text-[11px] font-medium truncate">{v}</div></div>
                {i === 0 && <div className="absolute top-2 right-2 w-5 h-5 bg-hawk-accent rounded-full flex items-center justify-center text-[10px] text-white font-bold">✓</div>}
              </div>
            ))}
            <div className="bg-hawk-input border-2 border-dashed border-hawk-border rounded-lg overflow-hidden cursor-pointer hover:border-gray-500">
              <div className="w-full aspect-[9/16] flex items-center justify-center text-2xl text-gray-600">+</div>
              <div className="p-2"><div className="text-[11px] text-gray-500 text-center">Adicionar</div></div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-cyan-500/8 border border-cyan-500/20 rounded-lg p-4 flex gap-3 mb-4">
          <span className="text-xl">📦</span>
          <div className="text-[13px] text-gray-300">
            <strong>Catálogo:</strong> Vídeos gerados automaticamente dos produtos. Opcionalmente adicione vídeos.
          </div>
        </div>
      )}

      {/* Common fields */}
      <div className="mt-5 pt-5 border-t border-hawk-border">
        <h4 className="label mb-3">Detalhes do anúncio</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="label mb-1.5 block">URL de destino <span className="required">*</span></label><input className="input" placeholder="https://seusite.com/oferta" /></div>
          <div><label className="label mb-1.5 block">Call to Action</label>
            <select className="select">
              <option>Compre Agora</option><option>Saiba Mais</option><option>Peça Já</option><option>Ver Oferta</option><option>Cadastre-se</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="label mb-1.5 block">Textos do anúncio (um por linha = variações)</label>
          <textarea className="input min-h-[80px]" placeholder={"Oferta imperdível!\nFrete grátis para todo Brasil\nÚltimas unidades"} />
        </div>
        <ToggleRow title="Automatic Enhancements (Symphony)" desc="IA otimiza resize, qualidade, tradução e dubbing" defaultOn />
      </div>

      <StepFooter prev={1} next={3} />
    </div>
  )
}

/* ============ STEP 3: STRUCTURE ============ */
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
          <select className="select"><option>Conversões (Website)</option><option>Lead Generation</option><option>App Promotion</option></select>
        </div>
        <div><label className="label mb-1.5 block">Tipo de orçamento</label>
          <select className="select"><option value="cbo">CBO — Campaign Budget</option><option value="abo">ABO — Ad Group Budget</option></select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div><label className="label mb-1.5 block">Orçamento diário (BRL) <span className="required">*</span></label><input className="input" type="number" defaultValue={50} min={20} /></div>
        <div><label className="label mb-1.5 block">Target CPA (BRL)</label><input className="input" type="number" placeholder="Opcional — auto" /></div>
      </div>

      <div className="space-y-3 mb-5">
        <ToggleRow title="Randomizar orçamento" desc="Valor aleatório entre min e max" />
        <ToggleRow title="Randomizar estrutura (±1)" desc="Campanhas/grupos variam ±1" />
      </div>

      <div className="pt-5 border-t border-hawk-border">
        <h4 className="label mb-3">Nomenclatura</h4>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div><label className="label mb-1.5 block">Nome da oferta</label><input className="input" placeholder="Ex: CREME FACIAL" value={offerName} onChange={(e) => setOfferName(e.target.value)} /></div>
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

/* ============ STEP 4: TARGETING ============ */
function StepTargeting() {
  const [auto, setAuto] = useState(true)

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🎯</div>
        <h2 className="text-lg font-bold">Audience Targeting</h2>
      </div>

      <div className="bg-hawk-accent/8 border border-hawk-accent/20 rounded-lg p-4 flex gap-3 mb-5">
        <span className="text-xl">🤖</span>
        <div className="text-[13px] text-gray-300">
          <strong>Smart+ Targeting:</strong> Por padrão o TikTok usa targeting automático.
        </div>
      </div>

      <ToggleRow title="Automatic Targeting (Smart+)" desc="Deixar a IA do TikTok encontrar o melhor público" defaultOn onChange={setAuto} />

      <div className={auto ? 'opacity-50 pointer-events-none' : ''}>
        <h4 className="label mt-5 mb-3">Faixas etárias</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {['13–17', '18–24', '25–34', '35–44', '45–54', '55+'].map((a, i) => (
            <div key={a} className={`chip ${i > 0 ? 'active' : ''}`} onClick={(e) => e.currentTarget.classList.toggle('active')}>{a}</div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="label mb-1.5 block">País</label>
            <select className="select"><option>🇧🇷 Brasil</option><option>🇺🇸 EUA</option><option>🇲🇽 México</option><option>🇵🇹 Portugal</option></select>
          </div>
          <div><label className="label mb-1.5 block">Idioma</label>
            <select className="select"><option>Português</option><option>Inglês</option><option>Espanhol</option></select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label mb-2 block">Sistema operacional</label>
            <div className="flex gap-2">
              <div className="chip active">Android</div>
              <div className="chip active">iOS</div>
            </div>
          </div>
          <div>
            <label className="label mb-2 block">Gênero</label>
            <div className="flex gap-2">
              <div className="chip active">Todos</div>
              <div className="chip">Masculino</div>
              <div className="chip">Feminino</div>
            </div>
          </div>
        </div>
      </div>

      <StepFooter prev={3} next={5} />
    </div>
  )
}

/* ============ STEP 5: PROXY ============ */
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
          <select className="select"><option>Desativado</option><option>Por Conta</option><option>Aleatório</option></select>
        </div>
        <div><label className="label mb-1.5 block">Protocolo</label>
          <select className="select"><option>Auto (SOCKS5 → HTTP)</option><option>SOCKS5</option><option>HTTP</option></select>
        </div>
      </div>

      <label className="label mb-1.5 block">Proxies (um por linha)</label>
      <textarea className="input font-mono text-xs min-h-[120px]" placeholder={"ip:porta:usuario:senha\nsocks5://user:pass@ip:port"} />

      <div className="flex items-center gap-3 mt-3">
        <button className="btn btn-secondary btn-sm">🔍 Verificar Proxies</button>
        <span className="text-xs text-gray-500">0 proxies configurados</span>
      </div>

      <StepFooter prev={4} next={6} />
    </div>
  )
}

/* ============ STEP 6: LAUNCH ============ */
function StepLaunch() {
  const { setStep } = useAppStore()
  const [launching, setLaunching] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])

  const launch = () => {
    setLaunching(true)
    const steps = [
      { msg: '🔄 Verificando conexão com TikTok API...', pct: 10 },
      { msg: '✅ Conexão OK — Access Token válido', pct: 20 },
      { msg: '📋 Criando campanha Smart+ Spark Ads...', pct: 35 },
      { msg: '🔗 Configurando Identity Spark Ads (BC_AUTH_TT)...', pct: 50 },
      { msg: '🎬 Vinculando criativos ao ad group...', pct: 65 },
      { msg: '🎯 Aplicando targeting automático...', pct: 80 },
      { msg: '💰 Definindo budget CBO R$ 50/dia...', pct: 90 },
      { msg: '🚀 Campanha criada com sucesso!', pct: 100 },
    ]
    steps.forEach((s, i) => {
      setTimeout(() => {
        setProgress(s.pct)
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${s.msg}`])
      }, (i + 1) * 800)
    })
  }

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🚀</div>
        <h2 className="text-lg font-bold">Launch Checklist</h2>
      </div>

      <div className="space-y-0">
        {[
          { ok: true, text: 'Conta TikTok conectada' },
          { ok: true, text: 'Ad accounts selecionadas (1)' },
          { ok: true, text: 'Identity configurada — Spark Ads' },
          { ok: true, text: 'Criativos selecionados (1 vídeo)' },
          { ok: true, text: 'Budget definido — R$ 50/dia CBO' },
          { ok: false, text: 'URL de destino — configurar' },
        ].map((c, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-hawk-border last:border-b-0 text-sm">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              c.ok ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
            }`}>{c.ok ? '✓' : '!'}</div>
            <span>{c.text}</span>
          </div>
        ))}
      </div>

      <h4 className="label mt-5 mb-3">Quando iniciar?</h4>
      <div className="flex flex-wrap gap-2 mb-6">
        {['⚡ Agora', '+5 min', '+15 min', '+30 min', '+1 hora'].map((s, i) => (
          <div key={s} className={`chip ${i === 0 ? 'active' : ''}`} onClick={(e) => {
            e.currentTarget.parentElement?.querySelectorAll('.chip').forEach(c => c.classList.remove('active'))
            e.currentTarget.classList.add('active')
          }}>{s}</div>
        ))}
      </div>

      <div className="text-center py-8">
        <button
          onClick={launch}
          disabled={launching}
          className="inline-flex items-center gap-3 px-12 py-4 bg-gradient-to-r from-hawk-accent to-orange-400 text-white rounded-full text-lg font-bold cursor-pointer shadow-[0_8px_40px_rgba(249,115,22,0.4)] hover:shadow-[0_12px_50px_rgba(249,115,22,0.6)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
          🚀 LANÇAR CAMPANHAS
        </button>
        <p className="mt-4 text-xs text-gray-500">1 conta × 1 campanha × 1 grupo × 1 anúncio = <strong>1 ad</strong></p>
      </div>

      {launching && (
        <div className="mt-4">
          <div className="h-1.5 bg-hawk-input rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-hawk-accent to-orange-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="max-h-[250px] overflow-y-auto p-3 bg-hawk-input rounded-md font-mono text-xs leading-[1.8] text-gray-400">
            {logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-6 pt-5 border-t border-hawk-border">
        <button className="btn btn-secondary" onClick={() => setStep(5)}>← Proxy</button>
        <div className="flex gap-2">
          <button className="btn btn-danger btn-sm">⛔ Parar</button>
          <button className="btn btn-secondary btn-sm">⏸ Pausar Todas</button>
        </div>
      </div>
    </div>
  )
}

/* ============ SHARED COMPONENTS ============ */
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
