import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store'

const INDUSTRIES = [
  { label: 'E-commerce / Varejo', value: 290001 },
  { label: 'Saúde & Beleza', value: 290002 },
  { label: 'Moda & Vestuário', value: 290003 },
  { label: 'Tecnologia', value: 290004 },
  { label: 'Educação', value: 290005 },
  { label: 'Alimentação & Bebidas', value: 290006 },
  { label: 'Entretenimento', value: 290007 },
  { label: 'Finanças', value: 290008 },
  { label: 'Jogos', value: 290009 },
  { label: 'Viagens & Turismo', value: 290010 },
  { label: 'Outro', value: 290099 },
]

const CURRENCIES = ['BRL', 'USD', 'EUR', 'MXN', 'ARS', 'COP', 'CLP']
const TIMEZONES = [
  'America/Sao_Paulo',
  'America/New_York',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Buenos_Aires',
  'Europe/London',
  'Europe/Madrid',
  'UTC',
]

const QUANTITY_PRESETS = [10, 20, 50, 100]
const SEQ_KEY = 'hawklaunch_acct_seq'

function loadSeq(): number {
  const v = localStorage.getItem(SEQ_KEY)
  return v ? parseInt(v, 10) : 1
}

interface LogEntry {
  message: string
  time: string
}

export default function CreateAccounts() {
  const { bcId } = useAppStore()

  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
  const [quantity, setQuantity] = useState(10)
  const [customQty, setCustomQty] = useState('')
  const [currency, setCurrency] = useState('BRL')
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [country, setCountry] = useState('BR')
  const [industry, setIndustry] = useState(290001)
  const [proxyListRaw, setProxyListRaw] = useState('')
  const [delayMin, setDelayMin] = useState(30)
  const [delayMax, setDelayMax] = useState(90)
  const [startSeq, setStartSeq] = useState<number>(() => loadSeq())
  const [bcListRaw, setBcListRaw] = useState<string>(() => '')

  const [running, setRunning] = useState(false)
  const [activeBcIndex, setActiveBcIndex] = useState(0)
  const [exhaustedBcSet, setExhaustedBcSet] = useState<Set<string>>(new Set())
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [created, setCreated] = useState<{ name: string; advertiser_id: string; bc_id: string }[]>([])
  const [errors, setErrors] = useState<{ name: string; error: string }[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef(false)
  const logsRef = useRef<LogEntry[]>([])

  useEffect(() => {
    if (bcId && !bcListRaw) setBcListRaw(bcId)
  }, [bcId])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const effectiveQty = customQty ? (parseInt(customQty) || 1) : quantity

  function parseBcList(): string[] {
    return bcListRaw.split('\n').map(l => l.trim()).filter(Boolean)
  }

  function addLog(msg: string) {
    const entry = { message: msg, time: new Date().toISOString() }
    logsRef.current = [...logsRef.current, entry]
    setLogs([...logsRef.current])
  }

  function rndDelaySec(min: number, max: number): Promise<void> {
    const ms = Math.floor(Math.random() * (max - min + 1) + min) * 1000
    return new Promise(r => setTimeout(r, ms))
  }

  function isMaxAccountsError(msg: string): boolean {
    return msg.toLowerCase().includes('maximum number') || msg.toLowerCase().includes('maximum')
  }

  async function handleCreate() {
    const bcList = parseBcList()
    if (!bcList.length) { alert('Adicione pelo menos uma BC.'); return }
    if (!companyName.trim()) { alert('Informe o nome da empresa.'); return }
    if (effectiveQty < 1) { alert('Quantidade inválida.'); return }

    const proxyList = proxyListRaw.split('\n').map(l => l.trim()).filter(Boolean)

    cancelRef.current = false
    logsRef.current = []
    setRunning(true)
    setActiveBcIndex(0)
    setExhaustedBcSet(new Set())
    setLogs([])
    setCreated([])
    setErrors([])

    const createdList: { name: string; advertiser_id: string; bc_id: string }[] = []
    const errorList: { name: string; error: string }[] = []
    const exhaustedBcs = new Set<string>()

    let bcIdx = 0
    let seq = startSeq
    let i = 0

    addLog('🚀 Iniciando farm de ' + effectiveQty + ' contas | ' + bcList.length + ' BC(s)')
    if (bcList.length > 1) addLog('📋 BCs: ' + bcList.join(' → '))

    while (i < effectiveQty) {
      if (cancelRef.current) { addLog('⛔ Cancelado pelo usuário.'); break }

      // Avança para próxima BC disponível
      while (bcIdx < bcList.length && exhaustedBcs.has(bcList[bcIdx])) bcIdx++
      if (bcIdx >= bcList.length) {
        addLog('🚫 Todas as BCs atingiram o limite máximo. Encerrando.')
        break
      }

      const currentBc = bcList[bcIdx]
      setActiveBcIndex(bcIdx)

      const acc = {
        name: companyName + ' ' + String(seq).padStart(7, '0'),
        company: companyName,
        website,
      }
      const proxy = proxyList.length ? proxyList[i % proxyList.length] : null

      if (i > 0) {
        const wait = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin
        addLog('⏳ Aguardando ' + wait + 's...')
        await rndDelaySec(delayMin, delayMax)
        if (cancelRef.current) { addLog('⛔ Cancelado pelo usuário.'); break }
      }

      if (proxy) {
        addLog('🛡️ [' + (i + 1) + '/' + effectiveQty + '] Proxy: ' + proxy.replace(/\/\/([^:]+):([^@]+)@/, '//**:**@'))
      }
      const bcLabel = bcList.length > 1 ? ' [BC ' + (bcIdx + 1) + '/' + bcList.length + ']' : ''
      addLog('🔨 [' + (i + 1) + '/' + effectiveQty + ']' + bcLabel + ' Criando: ' + acc.name)

      try {
        const res = await fetch('/api/tk?a=create_account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bc_id: currentBc,
            account: acc,
            default_website: website,
            currency,
            timezone,
            country,
            industry,
            proxy: proxy || null,
          }),
        })
        const data = await res.json()

        if (data.code === 0 && data.data?.advertiser_id) {
          const newId = data.data.advertiser_id
          addLog('✅ Criada: ' + acc.name + ' → ' + newId)
          createdList.push({ name: acc.name, advertiser_id: newId, bc_id: currentBc })
          setCreated([...createdList])
          seq++
          setStartSeq(seq)
          localStorage.setItem(SEQ_KEY, String(seq))
          i++
        } else {
          const errMsg = data.message || data.error || JSON.stringify(data)

          if (isMaxAccountsError(errMsg)) {
            addLog('⚠️ BC ' + currentBc.slice(-8) + ' atingiu o limite máximo.')
            exhaustedBcs.add(currentBc)
            setExhaustedBcSet(new Set(exhaustedBcs))
            const nextIdx = bcList.findIndex((bc, idx) => idx > bcIdx && !exhaustedBcs.has(bc))
            if (nextIdx !== -1) {
              addLog('🔄 Migrando para BC ' + bcList[nextIdx].slice(-8) + '...')
              bcIdx = nextIdx
            } else {
              addLog('🚫 Sem BCs disponíveis. Encerrando.')
              break
            }
            // Retenta a mesma conta na nova BC (não incrementa i nem seq)
          } else {
            addLog('❌ Falha: ' + acc.name + ' → ' + errMsg + ' (code ' + data.code + ')')
            errorList.push({ name: acc.name, error: errMsg })
            setErrors([...errorList])
            i++
            seq++
          }
        }
      } catch (e: any) {
        addLog('❌ Erro de rede: ' + e.message)
        errorList.push({ name: acc.name, error: e.message })
        setErrors([...errorList])
        i++
        seq++
      }
    }

    addLog('🏁 Concluído: ' + createdList.length + ' criadas, ' + errorList.length + ' erros')
    setRunning(false)
  }

  const bcList = parseBcList()
  const previewFirst = companyName ? companyName + ' ' + String(startSeq).padStart(7, '0') : null
  const previewLast = companyName && effectiveQty > 1 ? companyName + ' ' + String(startSeq + effectiveQty - 1).padStart(7, '0') : null

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-hawk-accent/10 rounded-xl flex items-center justify-center text-xl">🏗️</div>
        <div>
          <h1 className="text-xl font-bold">Criar Contas</h1>
          <p className="text-xs text-gray-500">Farm de ad accounts com rotação automática de BCs</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Left */}
        <div className="space-y-4">

          {/* BCs */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Business Centers</h2>
              <span className="text-xs text-gray-500">{bcList.length} BC(s)</span>
            </div>
            <textarea
              className="input w-full h-24 text-sm font-mono resize-none"
              placeholder={'7605067912235499536\n7608040000504234001\n7607319256224595984'}
              value={bcListRaw}
              onChange={e => setBcListRaw(e.target.value)}
              disabled={running}
            />
            <p className="text-xs text-gray-600">Uma BC por linha. Quando uma BC encher, rotaciona automaticamente para a próxima.</p>

            {running && bcList.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {bcList.map((bc, idx) => (
                  <span key={bc} className={`text-xs font-mono px-2 py-0.5 rounded border ${
                    exhaustedBcSet.has(bc)
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 line-through'
                      : idx === activeBcIndex
                        ? 'bg-hawk-accent/20 border-hawk-accent text-hawk-accent'
                        : 'bg-[#0d0f18] border-hawk-border text-gray-500'
                  }`}>
                    {idx === activeBcIndex && !exhaustedBcSet.has(bc) ? '▶ ' : ''}{bc.slice(-8)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Farm config */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-sm">Configuração do Farm</h2>

            <div>
              <label className="label">Nome da Empresa</label>
              <input
                className="input w-full"
                placeholder="Ex: CASA DO CIRCO PRODUCOES LTDA"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                disabled={running}
              />
            </div>

            <div>
              <label className="label">Site da Empresa</label>
              <input
                className="input w-full"
                placeholder="https://seusite.com.br"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                disabled={running}
              />
            </div>

            <div>
              <label className="label">Quantidade de Contas</label>
              <div className="flex gap-2 flex-wrap">
                {QUANTITY_PRESETS.map(q => (
                  <button
                    key={q}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      !customQty && quantity === q
                        ? 'bg-hawk-accent text-white border-hawk-accent'
                        : 'bg-[#1a1d28] text-gray-400 border-hawk-border hover:border-hawk-accent/50'
                    }`}
                    onClick={() => { setQuantity(q); setCustomQty('') }}
                    disabled={running}
                  >
                    {q}
                  </button>
                ))}
                <input
                  type="number"
                  className={`input w-24 text-center ${customQty ? 'border-hawk-accent' : ''}`}
                  placeholder="Outro"
                  min={1}
                  max={500}
                  value={customQty}
                  onChange={e => setCustomQty(e.target.value)}
                  disabled={running}
                />
              </div>
            </div>

            {/* Sequencial */}
            <div className="pt-1 border-t border-hawk-border">
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Sequencial inicial</label>
                <button
                  className="text-xs text-gray-500 hover:text-hawk-accent"
                  onClick={() => { setStartSeq(1); localStorage.setItem(SEQ_KEY, '1') }}
                  disabled={running}
                >
                  ↺ resetar
                </button>
              </div>
              <input
                type="number"
                className="input w-full font-mono"
                min={1}
                max={9999999}
                value={startSeq}
                onChange={e => {
                  const v = Math.max(1, parseInt(e.target.value) || 1)
                  setStartSeq(v)
                  localStorage.setItem(SEQ_KEY, String(v))
                }}
                disabled={running}
              />
              {previewFirst && (
                <div className="mt-2 bg-[#0d0f18] rounded-lg border border-hawk-border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Primeira:</span>
                    <span className="text-xs font-mono text-hawk-accent">{previewFirst}</span>
                  </div>
                  {previewLast && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Última:</span>
                      <span className="text-xs font-mono text-gray-400">{previewLast}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-hawk-border/50">
                    <span className="text-xs text-gray-600">Próximo batch:</span>
                    <span className="text-xs font-mono text-gray-500">{String(startSeq + effectiveQty).padStart(7, '0')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-sm">Proxies</h2>
              <span className="text-xs text-gray-600">{proxyListRaw.split('\n').filter(l => l.trim()).length} proxy(s)</span>
            </div>
            <textarea
              className="input w-full h-28 text-sm font-mono resize-none"
              placeholder="http://user:pass@ip:porta&#10;user:pass@ip:porta"
              value={proxyListRaw}
              onChange={e => setProxyListRaw(e.target.value)}
              disabled={running}
            />
            <p className="text-xs text-gray-600 mt-1.5">Rodízio automático por conta.</p>
          </div>

          <div className="card space-y-3">
            <h2 className="font-semibold text-sm">Configuração da Conta</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Moeda</label>
                <select className="input w-full" value={currency} onChange={e => setCurrency(e.target.value)} disabled={running}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">País</label>
                <input className="input w-full" placeholder="BR" value={country} onChange={e => setCountry(e.target.value.toUpperCase())} maxLength={2} disabled={running} />
              </div>
            </div>
            <div>
              <label className="label">Fuso Horário</label>
              <select className="input w-full" value={timezone} onChange={e => setTimezone(e.target.value)} disabled={running}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Indústria</label>
              <select className="input w-full" value={industry} onChange={e => setIndustry(Number(e.target.value))} disabled={running}>
                {INDUSTRIES.map(ind => <option key={ind.value} value={ind.value}>{ind.label} ({ind.value})</option>)}
              </select>
            </div>
          </div>

          <div className="card space-y-3">
            <h2 className="font-semibold text-sm">Anti-Detecção</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Delay mín. (seg)</label>
                <input type="number" className="input w-full" min={10} max={300} value={delayMin} onChange={e => setDelayMin(Number(e.target.value))} disabled={running} />
              </div>
              <div>
                <label className="label">Delay máx. (seg)</label>
                <input type="number" className="input w-full" min={10} max={600} value={delayMax} onChange={e => setDelayMax(Number(e.target.value))} disabled={running} />
              </div>
            </div>
            <p className="text-xs text-gray-600">Espera aleatória de {delayMin}s–{delayMax}s entre cada conta.</p>
            {effectiveQty > 1 && delayMin > 0 && (
              <div className="bg-[#0d0f18] rounded-lg p-3 border border-hawk-border">
                <p className="text-xs text-gray-500">
                  Tempo estimado: <span className="text-gray-300">{Math.round(effectiveQty * (delayMin + delayMax) / 2 / 60)}–{Math.round(effectiveQty * delayMax / 60)} min</span> para {effectiveQty} contas
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Launch */}
      <div className="flex gap-3">
        <button
          className="btn-primary flex-1 py-3 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCreate}
          disabled={running || !companyName.trim() || !bcList.length}
        >
          {running ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Criando contas...</>
          ) : (
            <>🏗️ Farmar {effectiveQty} conta{effectiveQty !== 1 ? 's' : ''} em {bcList.length} BC{bcList.length !== 1 ? 's' : ''}</>
          )}
        </button>
        {running && (
          <button
            className="px-6 py-3 rounded-lg border border-red-500/40 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors"
            onClick={() => { cancelRef.current = true }}
          >
            ⛔ Cancelar
          </button>
        )}
      </div>

      {!bcList.length && (
        <p className="text-center text-xs text-yellow-500/80">⚠️ Adicione pelo menos uma BC para continuar.</p>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Log de Criação</h2>
            <div className="flex gap-3 text-xs">
              {created.length > 0 && <span className="text-green-400">✅ {created.length} criadas</span>}
              {errors.length > 0 && <span className="text-red-400">❌ {errors.length} erros</span>}
            </div>
          </div>
          <div className="bg-[#0d0f18] rounded-lg border border-hawk-border p-3 max-h-72 overflow-y-auto font-mono text-xs space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2 leading-relaxed">
                <span className="text-gray-600 shrink-0">{log.time.substring(11, 19)}</span>
                <span className={
                  log.message.startsWith('✅') ? 'text-green-400' :
                  log.message.startsWith('❌') ? 'text-red-400' :
                  log.message.startsWith('⚠️') ? 'text-yellow-400' :
                  log.message.startsWith('🔄') ? 'text-blue-400' :
                  log.message.startsWith('🚫') ? 'text-orange-400' :
                  log.message.startsWith('🏁') ? 'text-hawk-accent font-semibold' :
                  'text-gray-300'
                }>{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>

          {created.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-400">Contas criadas — IDs:</h3>
                <button
                  className="text-xs text-hawk-accent hover:underline"
                  onClick={() => navigator.clipboard.writeText(created.map(c => c.advertiser_id).join('\n'))}
                >
                  📋 Copiar IDs
                </button>
              </div>
              <div className="bg-[#0d0f18] rounded-lg border border-hawk-border p-3 font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
                {created.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-green-400 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-hawk-accent">{c.advertiser_id}</span>
                    <span className="text-gray-500 truncate">{c.name}</span>
                    <span className="text-gray-700 font-mono shrink-0">BC:{c.bc_id.slice(-6)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

