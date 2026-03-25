import { useState, useCallback } from 'react'
import { api } from '@/lib/api'

const STORAGE_KEY = 'hawklaunch_proxy_list'

type ProxyStatus = 'untested' | 'testing' | 'ok' | 'fail'

interface ProxyEntry {
  id: string
  raw: string
  status: ProxyStatus
  ip?: string
  latency?: number
  error?: string
}

function makeId() { return Math.random().toString(36).slice(2) }

function loadFromStorage(): ProxyEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY) || ''
  return raw.split('\n').map(l => l.trim()).filter(Boolean).map(l => ({
    id: makeId(), raw: l, status: 'untested' as ProxyStatus
  }))
}

function saveToStorage(entries: ProxyEntry[]) {
  localStorage.setItem(STORAGE_KEY, entries.map(e => e.raw).join('\n'))
}

export default function Proxies() {
  const [entries, setEntries] = useState<ProxyEntry[]>(loadFromStorage)
  const [bulkText, setBulkText] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [testingAll, setTestingAll] = useState(false)
  const [abortAll, setAbortAll] = useState(false)

  const update = useCallback((updated: ProxyEntry[]) => {
    setEntries(updated)
    saveToStorage(updated)
  }, [])

  function addBulk() {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    const existing = new Set(entries.map(e => e.raw))
    const newOnes: ProxyEntry[] = lines.filter(l => !existing.has(l)).map(l => ({ id: makeId(), raw: l, status: 'untested' }))
    const merged = [...entries, ...newOnes]
    update(merged)
    setBulkText('')
    setShowBulk(false)
  }

  function remove(id: string) {
    update(entries.filter(e => e.id !== id))
  }

  function clearAll() {
    if (!confirm('Remover todas as proxies?')) return
    update([])
  }

  async function testOne(id: string) {
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'testing', ip: undefined, latency: undefined, error: undefined } : e))
    try {
      const r = await api.testProxy(entry.raw)
      setEntries(prev => {
        const next = prev.map(e => e.id === id
          ? r.ok
            ? { ...e, status: 'ok' as ProxyStatus, ip: r.ip, latency: r.latency_ms, error: undefined }
            : { ...e, status: 'fail' as ProxyStatus, error: r.error, ip: undefined, latency: undefined }
          : e)
        saveToStorage(next)
        return next
      })
    } catch(err: any) {
      setEntries(prev => {
        const next = prev.map(e => e.id === id ? { ...e, status: 'fail' as ProxyStatus, error: err.message } : e)
        saveToStorage(next)
        return next
      })
    }
  }

  async function testAll() {
    setTestingAll(true)
    setAbortAll(false)
    for (let i = 0; i < entries.length; i++) {
      if (abortAll) break
      await testOne(entries[i].id)
      if (i < entries.length - 1) await new Promise(r => setTimeout(r, 600))
    }
    setTestingAll(false)
  }

  const stats = {
    total: entries.length,
    ok: entries.filter(e => e.status === 'ok').length,
    fail: entries.filter(e => e.status === 'fail').length,
    untested: entries.filter(e => e.status === 'untested').length,
    testing: entries.filter(e => e.status === 'testing').length,
  }

  function statusIcon(s: ProxyStatus) {
    if (s === 'ok') return <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
    if (s === 'fail') return <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
    if (s === 'testing') return <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
    return <span className="w-2 h-2 rounded-full bg-gray-600 flex-shrink-0" />
  }

  function maskProxy(raw: string) {
    return raw.replace(/\/\/([^:]+):([^@]+)@/, '//**:**@')
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-hawk-accent/10 rounded-lg flex items-center justify-center text-xl">🛡️</div>
            <div>
              <h1 className="text-lg font-bold">Proxies</h1>
              <p className="text-xs text-gray-500">Gerencie as proxies usadas nas automações</p>
            </div>
          </div>
          <div className="flex gap-2">
            {testingAll
              ? <button className="btn btn-secondary btn-sm border-red-500/40 text-red-400" onClick={() => setAbortAll(true)}>⛔ Parar</button>
              : <button className="btn btn-secondary btn-sm" onClick={testAll} disabled={entries.length === 0}>⚡ Testar Todas</button>
            }
            <button className="btn btn-primary btn-sm" onClick={() => setShowBulk(v => !v)}>+ Adicionar</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-300' },
            { label: 'OK', value: stats.ok, color: 'text-green-400' },
            { label: 'Falha', value: stats.fail, color: 'text-red-400' },
            { label: 'Não testadas', value: stats.untested, color: 'text-gray-500' },
          ].map(s => (
            <div key={s.label} className="bg-hawk-input rounded-lg px-4 py-3 text-center">
              <div className={'text-2xl font-bold font-mono ' + s.color}>{s.value}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk add panel */}
      {showBulk && (
        <div className="card mb-5 border-hawk-accent/30">
          <h3 className="text-sm font-bold mb-3">📋 Colar proxies em massa</h3>
          <div className="text-[11px] text-gray-500 mb-3 space-y-1">
            <div>Formatos aceitos (um por linha):</div>
            <div className="font-mono bg-hawk-bg rounded px-3 py-2 space-y-1 text-gray-400">
              <div>http://usuario:senha@host:porta</div>
              <div>host:porta:usuario:senha</div>
              <div>host:porta</div>
            </div>
          </div>
          <textarea
            className="input font-mono text-xs min-h-[140px] mb-3"
            placeholder={'http://user:pass@1.2.3.4:8080\n5.6.7.8:3128:user:pass\n9.10.11.12:1080'}
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
          />
          <div className="flex gap-3">
            <button className="btn btn-secondary flex-1" onClick={() => { setShowBulk(false); setBulkText('') }}>Cancelar</button>
            <button className="btn btn-primary flex-1" onClick={addBulk} disabled={!bulkText.trim()}>
              ✅ Adicionar {bulkText.split('\n').filter(l => l.trim()).length} proxies
            </button>
          </div>
        </div>
      )}

      {/* Proxy list */}
      {entries.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🛡️</div>
          <div className="text-base font-semibold mb-2">Nenhuma proxy configurada</div>
          <div className="text-sm text-gray-500 mb-5">Adicione proxies para proteger as automações do HawkLaunch</div>
          <button className="btn btn-primary" onClick={() => setShowBulk(true)}>+ Adicionar Proxies</button>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400">{entries.length} proxy(ies) configurada(s)</h3>
            <button className="text-xs text-red-400 hover:text-red-300 transition-colors" onClick={clearAll}>🗑️ Limpar tudo</button>
          </div>
          <div className="space-y-2">
            {entries.map((e) => (
              <div key={e.id}
                className={'flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ' +
                  (e.status === 'ok' ? 'border-green-500/20 bg-green-500/5' :
                   e.status === 'fail' ? 'border-red-500/20 bg-red-500/5' :
                   e.status === 'testing' ? 'border-yellow-400/20 bg-yellow-400/5' :
                   'border-hawk-border bg-hawk-input')}>

                {statusIcon(e.status)}

                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[12px] text-gray-200 truncate">{maskProxy(e.raw)}</div>
                  {e.status === 'ok' && (
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-green-400">✓ {e.ip}</span>
                      <span className="text-[11px] text-gray-500">{e.latency}ms</span>
                    </div>
                  )}
                  {e.status === 'fail' && (
                    <div className="text-[11px] text-red-400 mt-0.5 truncate">✕ {e.error}</div>
                  )}
                  {e.status === 'testing' && (
                    <div className="text-[11px] text-yellow-400 mt-0.5">Testando...</div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {e.status !== 'testing' && (
                    <button
                      className="text-[11px] px-2.5 py-1 rounded border border-hawk-border text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
                      onClick={() => testOne(e.id)}>
                      ⚡ Testar
                    </button>
                  )}
                  <button
                    className="text-[11px] px-2 py-1 rounded border border-hawk-border text-gray-600 hover:text-red-400 hover:border-red-500/40 transition-colors"
                    onClick={() => remove(e.id)}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar when testing all */}
          {testingAll && (
            <div className="mt-4 pt-4 border-t border-hawk-border">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>⚡ Testando proxies...</span>
                <span>{stats.ok + stats.fail} / {stats.total}</span>
              </div>
              <div className="h-1.5 bg-hawk-input rounded-full overflow-hidden">
                <div className="h-full bg-hawk-accent rounded-full transition-all duration-300"
                  style={{width: ((stats.ok + stats.fail) / stats.total * 100) + '%'}} />
              </div>
            </div>
          )}

          {/* Summary after test */}
          {!testingAll && stats.untested === 0 && entries.length > 0 && (
            <div className={'mt-4 pt-4 border-t border-hawk-border flex items-center gap-2 text-sm ' + (stats.fail === 0 ? 'text-green-400' : 'text-yellow-400')}>
              {stats.fail === 0
                ? <><span>✅</span> Todas as {stats.ok} proxies funcionando!</>
                : <><span>⚠️</span> {stats.ok} OK · {stats.fail} com falha</>
              }
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-5 p-4 bg-hawk-card border border-hawk-border rounded-xl text-xs text-gray-500 space-y-1.5">
        <div className="text-gray-300 font-semibold mb-2">Como as proxies são usadas</div>
        <div>🚀 <strong className="text-gray-300">Launch (Smart+ V2 / Manual)</strong> — uma proxy por conta, em rodízio</div>
        <div>🗑️ <strong className="text-gray-300">Delete campanhas</strong> — proxy dedicada por conta durante o delete</div>
        <div>🛡️ Configuradas aqui, ficam salvas automaticamente e são lidas em todas as automações</div>
      </div>
    </div>
  )
}
