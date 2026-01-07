import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Plus, Search, Edit, Trash2, Users, X, Save, RefreshCw, Menu } from 'lucide-react'

interface Cliente {
  id: string
  cpf_cnpj: string | null
  nome: string
  telefone: string | null
  email: string | null
  cidade: string | null
  uf: string | null
}

export default function Clientes() {
  const { cnpj: cnpjParam } = useParams<{ cnpj: string }>()
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    cpf_cnpj: '',
    nome: '',
    telefone: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: ''
  })

  useEffect(() => {
    const sessionData = localStorage.getItem('mlpdv_session')
    if (!sessionData) {
      navigate(`/${cnpjParam}`)
      return
    }
    loadClientes(cnpjParam?.replace(/\D/g, '') || '')
  }, [navigate, cnpjParam])

  const loadClientes = async (cnpj: string) => {
    setLoading(true)
    console.log('[CLIENTES] Buscando para CNPJ:', cnpj)
    
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('cnpj', cnpj)
      .order('nome')

    if (error) {
      console.error('[CLIENTES] Erro:', error)
    }
    console.log('[CLIENTES] Encontrados:', data?.length || 0)
    setClientes(data || [])
    setLoading(false)
  }

  const openModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente)
      setForm({
        cpf_cnpj: cliente.cpf_cnpj || '',
        nome: cliente.nome,
        telefone: cliente.telefone || '',
        email: cliente.email || '',
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: cliente.cidade || '',
        uf: cliente.uf || ''
      })
    } else {
      setEditingCliente(null)
      setForm({ 
        cpf_cnpj: '', nome: '', telefone: '', email: '',
        cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: ''
      })
    }
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const cnpj = cnpjParam?.replace(/\D/g, '') || ''
    setSaving(true)

    try {
      const clienteData = {
        cpf_cnpj: form.cpf_cnpj.replace(/\D/g, '') || null,
        nome: form.nome.toUpperCase(),
        telefone: form.telefone || null,
        email: form.email || null,
        cep: form.cep.replace(/\D/g, '') || null,
        logradouro: form.logradouro || null,
        numero: form.numero || null,
        bairro: form.bairro || null,
        cidade: form.cidade || null,
        uf: form.uf || null,
        updated_at: new Date().toISOString()
      }

      if (editingCliente) {
        await supabase
          .from('clientes')
          .update(clienteData)
          .eq('id', editingCliente.id)
      } else {
        await supabase
          .from('clientes')
          .insert({
            cnpj,
            local_id: `web_${Date.now()}`,
            ...clienteData
          })
      }

      setShowModal(false)
      loadClientes(cnpj)
    } catch (err) {
      console.error('Erro ao salvar:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cliente?')) return
    const cnpj = cnpjParam?.replace(/\D/g, '') || ''
    
    await supabase.from('clientes').delete().eq('id', id)
    loadClientes(cnpj)
  }

  const filteredClientes = clientes.filter(c => 
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf_cnpj?.includes(search) ||
    c.telefone?.includes(search)
  )

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#006669] to-[#00A5AB] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link to={`/${cnpjParam}/dashboard`} className="p-1.5 hover:bg-white/10 rounded-lg transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-lg font-semibold">Clientes</h1>
            </div>
            <button onClick={() => openModal()} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-medium transition">
              <Plus className="w-4 h-4" />
              Novo
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none text-sm"
          />
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00A5AB]" />
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Nome</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">CPF/CNPJ</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Telefone</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Cidade</th>
                  <th className="text-right px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{cliente.nome}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{cliente.cpf_cnpj || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{cliente.telefone || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                      {cliente.cidade ? `${cliente.cidade}/${cliente.uf}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openModal(cliente)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 mr-1">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cliente.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-800">
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                  <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CPF/CNPJ</label>
                  <input type="text" value={form.cpf_cnpj} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                  <input type="text" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                  <input type="text" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">UF</label>
                  <input type="text" value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value })}
                    maxLength={2}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-[#006669] hover:bg-[#004d4f] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Salvar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
