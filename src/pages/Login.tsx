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
  const [manterConectado, setManterConectado] = useState(false)

  useEffect(() => {
    if (cnpjParam) {
      const cnpjDigits = cnpjParam.replace(/\D/g, '')
      loadEmpresa(cnpjDigits)
      
      // Verificar se tem credenciais salvas para este CNPJ
      const savedCreds = localStorage.getItem('mlpdv_saved_login_' + cnpjDigits)
      if (savedCreds) {
        const { cpf: savedCpf, senha: savedSenha } = JSON.parse(savedCreds)
        setCpf(savedCpf)
        setSenha(savedSenha)
        setManterConectado(true)
      }
      
      // Verificar se já tem sessão válida
      const session = localStorage.getItem('mlpdv_session')
      if (session) {
        const parsed = JSON.parse(session)
        if (parsed.cnpj === cnpjDigits) {
          navigate('/' + cnpjParam + '/dashboard')
        }
      }
    }
  }, [cnpjParam, navigate])

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

      // Salvar credenciais se "Manter conectado" estiver marcado
      if (manterConectado) {
        localStorage.setItem('mlpdv_saved_login_' + cnpjDigits, JSON.stringify({ cpf, senha }))
      } else {
        localStorage.removeItem('mlpdv_saved_login_' + cnpjDigits)
      }

      navigate('/' + cnpjParam + '/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#006669] to-[#00A5AB] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00A5AB]/20 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-[#006669]" />
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A5AB] focus:border-[#00A5AB] outline-none"
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A5AB] focus:border-[#00A5AB] outline-none"
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={manterConectado}
              onChange={(e) => setManterConectado(e.target.checked)}
              className="w-4 h-4 text-[#006669] border-gray-300 rounded focus:ring-[#00A5AB]"
            />
            <span className="text-sm text-gray-600">Manter conectado</span>
          </label>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#006669] hover:bg-[#004d4f] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
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
