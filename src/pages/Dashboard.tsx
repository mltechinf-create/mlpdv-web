import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Building2, Package, Users, ShoppingCart, LogOut, BarChart3, Settings } from 'lucide-react'

interface Empresa {
  nome_fantasia: string | null
  razao_social: string
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
    const { data: empresaData } = await supabase
      .from('empresas')
      .select('nome_fantasia, razao_social')
      .eq('cnpj', cnpj)
      .single()

    if (empresaData) setEmpresa(empresaData)

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
  }

  const handleLogout = () => {
    localStorage.removeItem('mlpdv_session')
    navigate(`/${cnpjParam}`)
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="font-semibold text-gray-800">
                {empresa?.nome_fantasia || empresa?.razao_social || 'Carregando...'}
              </h1>
              <p className="text-xs text-gray-500">
                CNPJ: {session.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:block">
              Olá, <strong>{session.nome}</strong>
            </span>
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Sair">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Link to={`/${cnpjParam}/produtos`} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.produtos}</p>
                <p className="text-sm text-gray-500">Produtos</p>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.clientes}</p>
                <p className="text-sm text-gray-500">Clientes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.vendas}</p>
                <p className="text-sm text-gray-500">Vendas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link to={`/${cnpjParam}/produtos`} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition flex flex-col items-center gap-3">
            <Package className="w-10 h-10 text-blue-600" />
            <span className="font-medium text-gray-700">Produtos</span>
          </Link>

          <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center gap-3 opacity-50">
            <Users className="w-10 h-10 text-green-600" />
            <span className="font-medium text-gray-700">Clientes</span>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center gap-3 opacity-50">
            <BarChart3 className="w-10 h-10 text-purple-600" />
            <span className="font-medium text-gray-700">Relatórios</span>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center gap-3 opacity-50">
            <Settings className="w-10 h-10 text-gray-600" />
            <span className="font-medium text-gray-700">Configurações</span>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-800 mb-2">💡 Sincronização</h3>
          <p className="text-sm text-blue-700">
            Os dados cadastrados aqui serão sincronizados automaticamente com o ML PDV Desktop.
          </p>
        </div>
      </div>
    </div>
  )
}
