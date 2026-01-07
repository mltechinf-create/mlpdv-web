import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Plus, Search, Edit, Trash2, Package, X, Save } from 'lucide-react'

interface Produto {
  id: string
  codigo: string | null
  nome: string
  categoria: string | null
  preco_venda: number
  estoque_atual: number
  unidade: string
}

export default function Produtos() {
  const { cnpj: cnpjParam } = useParams<{ cnpj: string }>()
  const navigate = useNavigate()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    codigo: '',
    nome: '',
    categoria: '',
    preco_venda: '',
    estoque_atual: '',
    unidade: 'UN'
  })

  useEffect(() => {
    const sessionData = localStorage.getItem('mlpdv_session')
    if (!sessionData) {
      navigate(`/${cnpjParam}`)
      return
    }
    loadProdutos(cnpjParam?.replace(/\D/g, '') || '')
  }, [navigate, cnpjParam])

  const loadProdutos = async (cnpj: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .eq('cnpj', cnpj)
      .eq('ativo', true)
      .order('nome')

    setProdutos(data || [])
    setLoading(false)
  }

  const openModal = (produto?: Produto) => {
    if (produto) {
      setEditingProduto(produto)
      setForm({
        codigo: produto.codigo || '',
        nome: produto.nome,
        categoria: produto.categoria || '',
        preco_venda: String(produto.preco_venda),
        estoque_atual: String(produto.estoque_atual),
        unidade: produto.unidade
      })
    } else {
      setEditingProduto(null)
      setForm({ codigo: '', nome: '', categoria: '', preco_venda: '', estoque_atual: '0', unidade: 'UN' })
    }
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const cnpj = cnpjParam?.replace(/\D/g, '') || ''
    setSaving(true)

    try {
      if (editingProduto) {
        await supabase
          .from('produtos')
          .update({
            codigo: form.codigo || null,
            nome: form.nome.toUpperCase(),
            categoria: form.categoria?.toUpperCase() || null,
            preco_venda: parseFloat(form.preco_venda) || 0,
            estoque_atual: parseFloat(form.estoque_atual) || 0,
            unidade: form.unidade,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduto.id)
      } else {
        await supabase
          .from('produtos')
          .insert({
            cnpj,
            local_id: `web_${Date.now()}`,
            codigo: form.codigo || null,
            nome: form.nome.toUpperCase(),
            categoria: form.categoria?.toUpperCase() || null,
            preco_venda: parseFloat(form.preco_venda) || 0,
            estoque_atual: parseFloat(form.estoque_atual) || 0,
            unidade: form.unidade,
            origem: 'web'
          })
      }

      setShowModal(false)
      loadProdutos(cnpj)
    } catch (err) {
      console.error('Erro ao salvar:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (produto: Produto) => {
    if (!confirm(`Excluir "${produto.nome}"?`)) return

    await supabase
      .from('produtos')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', produto.id)

    loadProdutos(cnpjParam?.replace(/\D/g, '') || '')
  }

  const filtered = produtos.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/${cnpjParam}/dashboard`} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-semibold text-gray-800">Produtos</h1>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Novo
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum produto cadastrado</p>
            <button onClick={() => openModal()} className="mt-4 text-blue-600 hover:underline">
              Cadastrar primeiro produto
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Código</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden sm:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Preço</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 hidden sm:table-cell">Estoque</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((produto) => (
                  <tr key={produto.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{produto.codigo || '-'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{produto.nome}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{produto.categoria || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      R$ {produto.preco_venda.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600 hidden sm:table-cell">
                      {produto.estoque_atual} {produto.unidade}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openModal(produto)} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(produto)} className="p-2 hover:bg-red-100 rounded-lg text-red-600" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-800">
                {editingProduto ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <select value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="UN">UN</option>
                    <option value="KG">KG</option>
                    <option value="L">L</option>
                    <option value="M">M</option>
                    <option value="CX">CX</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input type="text" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Venda *</label>
                  <input type="number" step="0.01" value={form.preco_venda} onChange={(e) => setForm({ ...form, preco_venda: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                  <input type="number" step="0.001" value={form.estoque_atual} onChange={(e) => setForm({ ...form, estoque_atual: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Salvar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
