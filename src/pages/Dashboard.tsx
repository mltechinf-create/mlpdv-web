import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Package, Users, ShoppingCart, LogOut, BarChart3, Settings, Menu, X, RefreshCw, Check } from 'lucide-react'

interface Empresa {
  nome_fantasia: string | null
  razao_social: string
  updated_at?: string
}

interface Session {
  id: string
  cnpj: string
  nome: string
  perfil: string
}

export default function Dashboard() {
  const { cnpj: cnpjParam } = useParams<{ cnpj: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [stats, setStats] = useState({ produtos: 0, clientes: 0, vendas: 0 })
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const sessionData = localStorage.getItem('mlpdv_session')
    if (!sessionData) {
      navigate(`/${cnpjParam}`)
      return
    }

    const parsed = JSON.parse(sessionData)
    setSession(parsed)
    loadData(cnpjParam?.replace(/\D/g, '') || parsed.cnpj)
  }, [navigate, cnpjParam])

  const loadData = async (cnpj: string) => {
    setLoading(true)
    const { data: empresaData } = await supabase
      .from('empresas')
      .select('nome_fantasia, razao_social, updated_at')
      .eq('cnpj', cnpj)
      .single()

    if (empresaData) {
      setEmpresa(empresaData)
      if (empresaData.updated_at) {
        setLastSync(new Date(empresaData.updated_at))
      }
    }

    const [produtosRes, clientesRes, vendasRes] = await Promise.all([
      supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('cnpj', cnpj),
      supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('cnpj', cnpj),
      supabase.from('vendas').select('id', { count: 'exact', head: true }).eq('cnpj', cnpj)
    ])

    setStats({
      produtos: produtosRes.count || 0,
      clientes: clientesRes.count || 0,
      vendas: vendasRes.count || 0
    })
    setLoading(false)
  }

  const handleSync = async () => {
    if (syncing) return
    setSyncing(true)
    const cnpj = cnpjParam?.replace(/\D/g, '') || session?.cnpj || ''
    
    try {
      // Atualiza timestamp da empresa
      await supabase
        .from('empresas')
        .update({ updated_at: new Date().toISOString() })
        .eq('cnpj', cnpj)
      
      setLastSync(new Date())
      // Recarrega os dados
      await loadData(cnpj)
    } catch (err) {
      console.error('Erro ao sincronizar:', err)
    } finally {
      setSyncing(false)
    }
  }

  const formatSyncDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString().slice(-2)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} às ${hours}:${minutes}`
  }

  const handleLogout = () => {
    localStorage.removeItem('mlpdv_session')
    navigate(`/${cnpjParam}`)
  }

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      {/* Header ML Tech */}
      <header className="bg-gradient-to-r from-[#006669] to-[#00A5AB] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-lg">
                  ML
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-lg leading-tight">ML PDV</h1>
                  <p className="text-xs text-white/70">Painel Administrativo</p>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <div className="text-right">
                <p className="font-medium text-sm">{empresa?.nome_fantasia || empresa?.razao_social}</p>
                <p className="text-xs text-white/70">CNPJ: {formatCNPJ(session.cnpj)}</p>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{session.nome}</p>
                  <p className="text-xs text-white/70 capitalize">{session.perfil}</p>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button 
              className="md:hidden p-2 hover:bg-white/10 rounded-lg"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 px-4 py-3 space-y-2">
            <div className="py-2">
              <p className="font-medium">{empresa?.nome_fantasia || empresa?.razao_social}</p>
              <p className="text-xs text-white/70">CNPJ: {formatCNPJ(session.cnpj)}</p>
            </div>
            <div className="py-2 border-t border-white/10">
              <p className="text-sm">{session.nome}</p>
              <p className="text-xs text-white/70 capitalize">{session.perfil}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full py-2 text-left text-sm flex items-center gap-2 text-white/80 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Boas-vindas */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Olá, {session.nome.split(' ')[0]}!
            </h2>
            <p className="text-sm text-gray-500">Resumo do seu negócio</p>
          </div>
          <button 
            onClick={() => loadData(cnpjParam?.replace(/\D/g, '') || session.cnpj)}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Link 
            to={`/${cnpjParam}/produtos`} 
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#006669] to-[#00A5AB] rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.produtos}</p>
                <p className="text-xs text-gray-500">Produtos</p>
              </div>
            </div>
          </Link>

          <Link 
            to={`/${cnpjParam}/clientes`} 
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.clientes}</p>
                <p className="text-xs text-gray-500">Clientes</p>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 opacity-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.vendas}</p>
                <p className="text-xs text-gray-500">Vendas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu de navegação */}
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Acesso Rápido</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Link 
            to={`/${cnpjParam}/produtos`} 
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col items-center gap-2"
          >
            <div className="p-2 bg-[#006669]/10 rounded-lg">
              <Package className="w-6 h-6 text-[#006669]" />
            </div>
            <span className="text-sm font-medium text-gray-700">Produtos</span>
          </Link>

          <Link 
            to={`/${cnpjParam}/clientes`} 
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col items-center gap-2"
          >
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Clientes</span>
          </Link>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 opacity-40 cursor-not-allowed">
            <div className="p-2 bg-violet-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-violet-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Relatórios</span>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 opacity-40 cursor-not-allowed">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Settings className="w-6 h-6 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Config</span>
          </div>
        </div>

        {/* Badge de sincronização */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#006669] hover:bg-[#006669]/5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-[#006669]/30 transition-all cursor-pointer disabled:opacity-50 mb-4"
        >
          {syncing ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Check className="w-3 h-3 text-green-500" />
          )}
          <span>
            {syncing ? 'Sincronizando...' : lastSync ? `Sincronizado em ${formatSyncDate(lastSync)}` : 'Sincronizar'}
          </span>
        </button>

        {/* Footer */}
        <footer className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            <span className="font-medium text-[#006669]">ML Tech Soluções</span> • © 2026
          </p>
        </footer>
      </main>
    </div>
  )
}
