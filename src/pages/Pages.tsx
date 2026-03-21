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

export function Creatives() {
  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 bg-hawk-accent/10 rounded-md flex items-center justify-center">🎬</div>
        <h2 className="text-lg font-bold">Biblioteca de Criativos</h2>
      </div>
      <p className="text-sm text-gray-400">Upload e gerenciamento de vídeos para todas as campanhas.</p>
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
