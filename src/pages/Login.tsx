import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Building2, Lock, User, LogIn } from 'lucide-react'

export default function Login() {
  const { cnpj: cnpjParam } = useParams<{ cnpj: string }>()
  const navigate = useNavigate()
  const [cpf, setCpf] = useState('')
  const [empresaNome, setEmpresaNome] = useState<string | null>(null)
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (cnpjParam) {
      loadEmpresa(cnpjParam.replace(/\D/g, ''))
    }
  }, [cnpjParam])

  const loadEmpresa = async (cnpj: string) => {
    const { data } = await supabase
      .from('empresas')
      .select('nome_fantasia, razao_social')
      .eq('cnpj', cnpj)
      .single()
    
    if (data) {
      setEmpresaNome(data.nome_fantasia || data.razao_social)
    }
  }

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const cnpjDigits = cnpjParam?.replace(/\D/g, '') || ''
    const cpfDigits = cpf.replace(/\D/g, '')

    if (!cnpjDigits) {
      setError('CNPJ não informado na URL')
      setLoading(false)
      return
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('verificar_usuario', {
        p_cnpj: cnpjDigits,
        p_login: cpfDigits,
        p_senha: senha
      })

      if (rpcError) throw rpcError

      if (!data || data.length === 0) {
        throw new Error('CPF ou senha incorretos')
      }

      const user = data[0]

      localStorage.setItem('mlpdv_session', JSON.stringify({
        id: user.id,
        cnpj: user.cnpj,
        nome: user.nome,
        perfil: user.perfil,
        permissoes: user.permissoes,
        loggedAt: new Date().toISOString()
      }))

      navigate(`/${cnpjParam}/dashboard`)
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{empresaNome || 'ML PDV'}</h1>
          <p className="text-gray-500 mt-1">Painel Administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Entrar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
