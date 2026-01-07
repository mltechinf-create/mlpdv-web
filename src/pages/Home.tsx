import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Building2, Plus, Trash2, LogIn, Search } from 'lucide-react'

interface SavedCompany {
  cnpj: string
  nome: string
  lastAccess: string
}

export default function Home() {
  const navigate = useNavigate()
  const [savedCompanies, setSavedCompanies] = useState<SavedCompany[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [cnpjInput, setCnpjInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSavedCompanies()
  }, [])

  const loadSavedCompanies = () => {
    const saved = localStorage.getItem('mlpdv_saved_companies')
    if (saved) {
      const parsed = JSON.parse(saved) as SavedCompany[]
      parsed.sort((a, b) => new Date(b.lastAccess).getTime() - new Date(a.lastAccess).getTime())
      setSavedCompanies(parsed)
    }
  }

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  const handleAddCompany = async () => {
    const cnpjDigits = cnpjInput.replace(/\D/g, '')
    if (cnpjDigits.length !== 14) {
      setError('CNPJ deve ter 14 dígitos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data } = await supabase
        .from('empresas')
        .select('nome_fantasia, razao_social')
        .eq('cnpj', cnpjDigits)
        .single()

      if (!data) {
        setError('Empresa não encontrada')
        setLoading(false)
        return
      }

      const newCompany: SavedCompany = {
        cnpj: cnpjDigits,
        nome: data.nome_fantasia || data.razao_social,
        lastAccess: new Date().toISOString()
      }

      const existing = savedCompanies.filter(c => c.cnpj !== cnpjDigits)
      const updated = [newCompany, ...existing]
      localStorage.setItem('mlpdv_saved_companies', JSON.stringify(updated))
      setSavedCompanies(updated)
      setCnpjInput('')
      setShowAdd(false)
      navigate('/' + cnpjDigits)
    } catch (err) {
      setError('Erro ao buscar empresa')
    } finally {
      setLoading(false)
    }
  }

  const handleAccessCompany = (cnpj: string) => {
    const updated = savedCompanies.map(c => 
      c.cnpj === cnpj ? { ...c, lastAccess: new Date().toISOString() } : c
    )
    localStorage.setItem('mlpdv_saved_companies', JSON.stringify(updated))
    navigate('/' + cnpj)
  }

  const handleRemoveCompany = (cnpj: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Remover esta empresa dos acessos salvos?')) return
    const updated = savedCompanies.filter(c => c.cnpj !== cnpj)
    localStorage.setItem('mlpdv_saved_companies', JSON.stringify(updated))
    setSavedCompanies(updated)
  }

  const formatCNPJDisplay = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#006669] to-[#00A5AB] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#006669] p-6 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-3">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">ML PDV Web</h1>
          <p className="text-white/70 text-sm mt-1">Painel Administrativo</p>
        </div>

        <div className="p-6">
          {savedCompanies.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-3">Empresas salvas</p>
              <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                {savedCompanies.map(company => (
                  <button
                    key={company.cnpj}
                    onClick={() => handleAccessCompany(company.cnpj)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition group"
                  >
                    <div className="text-left">
                      <p className="font-medium text-gray-800">{company.nome}</p>
                      <p className="text-xs text-gray-500">{formatCNPJDisplay(company.cnpj)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleRemoveCompany(company.cnpj, e)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <LogIn className="w-4 h-4 text-[#006669]" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma empresa salva</p>
            </div>
          )}

          {showAdd ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={cnpjInput}
                  onChange={(e) => setCnpjInput(formatCNPJ(e.target.value))}
                  placeholder="Digite o CNPJ da empresa"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAdd(false); setError(''); setCnpjInput('') }}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddCompany}
                  disabled={loading}
                  className="flex-1 bg-[#006669] hover:bg-[#004d4f] text-white py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Acessar'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#006669] hover:text-[#006669] transition"
            >
              <Plus className="w-5 h-5" />
              Adicionar Empresa
            </button>
          )}
        </div>
      </div>

      <p className="text-white/60 text-xs mt-4">
        Desenvolvido por ML Tech Soluções
      </p>
    </div>
  )
}
