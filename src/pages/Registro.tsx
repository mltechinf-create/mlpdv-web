import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Building2, User, Lock, Mail, Phone, MapPin, ArrowLeft, Check } from 'lucide-react'

export default function Registro() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [empresa, setEmpresa] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    cidade: '',
    uf: '',
    telefone: '',
    email: ''
  })

  const [usuario, setUsuario] = useState({
    nome: '',
    cpf: '',
    senha: '',
    confirmarSenha: ''
  })

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (usuario.senha !== usuario.confirmarSenha) {
      setError('As senhas não conferem')
      return
    }

    setLoading(true)
    setError('')

    const cnpjDigits = empresa.cnpj.replace(/\D/g, '')
    const cpfDigits = usuario.cpf.replace(/\D/g, '')

    try {
      const { error: empresaError } = await supabase.rpc('upsert_empresa', {
        p_cnpj: cnpjDigits,
        p_razao_social: empresa.razao_social.toUpperCase(),
        p_nome_fantasia: empresa.nome_fantasia?.toUpperCase() || null,
        p_cidade: empresa.cidade?.toUpperCase() || null,
        p_uf: empresa.uf?.toUpperCase() || null,
        p_telefone: empresa.telefone || null,
        p_origem: 'web'
      })

      if (empresaError) throw empresaError

      const { error: userError } = await supabase.rpc('upsert_usuario', {
        p_cnpj: cnpjDigits,
        p_login: cpfDigits,
        p_nome: usuario.nome.toUpperCase(),
        p_senha: usuario.senha,
        p_perfil: 'admin',
        p_email: empresa.email || null,
        p_origem: 'web',
        p_cpf: cpfDigits
      })

      if (userError) throw userError

      setStep(3)
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#006669] to-[#00A5AB] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00A5AB]/20 rounded-full mb-4">
            <Check className="w-8 h-8 text-[#006669]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Cadastro Realizado!</h1>
          <p className="text-gray-500 mb-6">
            Sua empresa foi cadastrada com sucesso. Agora você pode fazer login.
          </p>
          <button
            onClick={() => navigate(`/${empresa.cnpj.replace(/\D/g, '')}`)}
            className="w-full bg-[#006669] hover:bg-[#004d4f] text-white font-semibold py-3 rounded-lg transition"
          >
            Ir para Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#006669] to-[#00A5AB] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <button
          onClick={() => step === 1 ? navigate('/') : setStep(1)}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Cadastre sua Empresa</h1>
          <p className="text-gray-500 mt-1">
            {step === 1 ? 'Dados da empresa' : 'Dados do administrador'}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-[#006669]' : 'bg-gray-300'}`} />
            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-[#006669]' : 'bg-gray-300'}`} />
          </div>
        </div>

        <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2) }}>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={empresa.cnpj}
                    onChange={(e) => setEmpresa({ ...empresa, cnpj: formatCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social *</label>
                <input
                  type="text"
                  value={empresa.razao_social}
                  onChange={(e) => setEmpresa({ ...empresa, razao_social: e.target.value })}
                  placeholder="Nome da empresa"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={empresa.nome_fantasia}
                  onChange={(e) => setEmpresa({ ...empresa, nome_fantasia: e.target.value })}
                  placeholder="Nome comercial"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={empresa.cidade}
                      onChange={(e) => setEmpresa({ ...empresa, cidade: e.target.value })}
                      placeholder="Cidade"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                  <input
                    type="text"
                    value={empresa.uf}
                    onChange={(e) => setEmpresa({ ...empresa, uf: e.target.value.toUpperCase().slice(0, 2) })}
                    placeholder="RS"
                    maxLength={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={empresa.telefone}
                      onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={empresa.email}
                      onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })}
                      placeholder="email@empresa.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={usuario.nome}
                    onChange={(e) => setUsuario({ ...usuario, nome: e.target.value })}
                    placeholder="Seu nome"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                <input
                  type="text"
                  value={usuario.cpf}
                  onChange={(e) => setUsuario({ ...usuario, cpf: formatCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={usuario.senha}
                    onChange={(e) => setUsuario({ ...usuario, senha: e.target.value })}
                    placeholder="Crie uma senha"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={usuario.confirmarSenha}
                    onChange={(e) => setUsuario({ ...usuario, confirmarSenha: e.target.value })}
                    placeholder="Repita a senha"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mt-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[#006669] hover:bg-[#004d4f] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : step === 1 ? (
              'Continuar'
            ) : (
              'Cadastrar'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
