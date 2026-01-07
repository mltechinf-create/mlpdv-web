import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Plus, Search, Edit, Trash2, Package, X, Save, RefreshCw, Menu } from 'lucide-react'

interface Produto {
  id: string
  codigo_interno: string | null
  nome: string
  categoria: string | null
  preco_venda: number
  preco_custo: number
  margem: number
  estoque: number
  estoque_minimo: number
  unidade_venda: string
  ean_gtin: string | null
  ncm: string | null
  cest: string | null
  cfop: string | null
  csosn: number | null
  fracionado: boolean
  em_promocao: boolean
  preco_promocional: number | null
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
    codigo_interno: '',
    nome: '',
    categoria: '',
    preco_custo: '',
    margem: '',
    preco_venda: '',
    estoque: '',
    estoque_minimo: '',
    unidade_venda: 'UN',
    fracionado: false,
    ean_gtin: '',
    ncm: '',
    cest: '',
    cfop: '5102',
    csosn: '',
    em_promocao: false,
    preco_promocional: ''
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
    console.log('[PRODUTOS] Buscando para CNPJ:', cnpj)
    
    // Primeiro buscar todos para debug
    const { data: allData } = await supabase
      .from('produtos')
      .select('cnpj, nome')
      .limit(10)
    console.log('[PRODUTOS] Amostra de todos:', allData)
    
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('cnpj', cnpj)
      .order('nome')

    if (error) {
      console.error('[PRODUTOS] Erro:', error)
    }
    console.log('[PRODUTOS] Encontrados:', data?.length || 0)
    setProdutos(data || [])
    setLoading(false)
  }

  const openModal = (produto?: Produto) => {
    if (produto) {
      setEditingProduto(produto)
      setForm({
        codigo_interno: produto.codigo_interno || '',
        nome: produto.nome,
        categoria: produto.categoria || '',
        preco_custo: String(produto.preco_custo || 0),
        margem: String(produto.margem || 0),
        preco_venda: String(produto.preco_venda),
        estoque: String(produto.estoque),
        estoque_minimo: String(produto.estoque_minimo || 0),
        unidade_venda: produto.unidade_venda || 'UN',
        fracionado: produto.fracionado || false,
        ean_gtin: produto.ean_gtin || '',
        ncm: produto.ncm || '',
        cest: produto.cest || '',
        cfop: produto.cfop || '5102',
        csosn: String(produto.csosn || ''),
        em_promocao: produto.em_promocao || false,
        preco_promocional: String(produto.preco_promocional || '')
      })
    } else {
      setEditingProduto(null)
      setForm({ 
        codigo_interno: '', nome: '', categoria: '', 
        preco_custo: '', margem: '', preco_venda: '', 
        estoque: '0', estoque_minimo: '0', unidade_venda: 'UN', fracionado: false,
        ean_gtin: '', ncm: '', cest: '', cfop: '5102', csosn: '',
        em_promocao: false, preco_promocional: ''
      })
    }
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const cnpj = cnpjParam?.replace(/\D/g, '') || ''
    setSaving(true)

    try {
      const produtoData = {
          codigo_interno: form.codigo_interno || null,
          nome: form.nome.toUpperCase(),
          categoria: form.categoria?.toUpperCase() || null,
          preco_custo: parseFloat(form.preco_custo) || 0,
          margem: parseFloat(form.margem) || 0,
          preco_venda: parseFloat(form.preco_venda) || 0,
          estoque: parseFloat(form.estoque) || 0,
          estoque_minimo: parseFloat(form.estoque_minimo) || 0,
          unidade_venda: form.unidade_venda,
          fracionado: form.fracionado,
          ean_gtin: form.ean_gtin || null,
          ncm: form.ncm || null,
          cest: form.cest || null,
          cfop: form.cfop || null,
          csosn: form.csosn ? parseInt(form.csosn) : null,
          em_promocao: form.em_promocao,
          preco_promocional: form.preco_promocional ? parseFloat(form.preco_promocional) : null,
          updated_at: new Date().toISOString()
        }

        if (editingProduto) {
          await supabase
            .from('produtos')
            .update(produtoData)
            .eq('id', editingProduto.id)
        } else {
          await supabase
            .from('produtos')
            .insert({
              cnpj,
              local_id: `web_${Date.now()}`,
              origem: 'web',
              ...produtoData
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
    p.codigo_interno?.toLowerCase().includes(search.toLowerCase()) ||
    p.ean_gtin?.toLowerCase().includes(search.toLowerCase())
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
            className="bg-[#006669] hover:bg-[#004d4f] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
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
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum produto cadastrado</p>
            <button onClick={() => openModal()} className="mt-4 text-[#006669] hover:underline">
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
                    <td className="px-4 py-3 text-sm text-gray-600">{produto.codigo_interno || '-'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{produto.nome}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{produto.categoria || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      R$ {produto.preco_venda.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600 hidden sm:table-cell">
                      {produto.estoque} {produto.unidade_venda}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openModal(produto)} className="p-2 hover:bg-[#00A5AB]/20 rounded-lg text-[#006669]" title="Editar">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-xl">
              <h2 className="font-semibold text-gray-800">
                {editingProduto ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Dados básicos */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Dados Básicos</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Código Interno</label>
                    <input type="text" value={form.codigo_interno} onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">EAN/GTIN</label>
                    <input type="text" value={form.ean_gtin} onChange={(e) => setForm({ ...form, ean_gtin: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label>
                    <select value={form.unidade_venda} onChange={(e) => setForm({ ...form, unidade_venda: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none">
                      <option value="UN">UN</option>
                      <option value="KG">KG</option>
                      <option value="L">L</option>
                      <option value="M">M</option>
                      <option value="CX">CX</option>
                      <option value="PC">PC</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Produto *</label>
                  <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" required />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                    <input type="text" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" />
                  </div>
                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.fracionado} onChange={(e) => setForm({ ...form, fracionado: e.target.checked })}
                        className="rounded border-gray-300" />
                      Fracionado
                    </label>
                  </div>
                </div>
              </div>

              {/* Preços */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Preços</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Preço Custo</label>
                    <input type="number" step="0.01" value={form.preco_custo} onChange={(e) => setForm({ ...form, preco_custo: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Margem %</label>
                    <input type="number" step="0.01" value={form.margem} onChange={(e) => setForm({ ...form, margem: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Preço Venda *</label>
                    <input type="number" step="0.01" value={form.preco_venda} onChange={(e) => setForm({ ...form, preco_venda: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none font-medium" required />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.em_promocao} onChange={(e) => setForm({ ...form, em_promocao: e.target.checked })}
                      className="rounded border-gray-300" />
                    <label className="text-xs font-medium text-gray-600">Em Promoção</label>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Preço Promocional</label>
                    <input type="number" step="0.01" value={form.preco_promocional} onChange={(e) => setForm({ ...form, preco_promocional: e.target.value })}
                      disabled={!form.em_promocao}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none disabled:bg-gray-100 disabled:opacity-50" />
                  </div>
                </div>
              </div>

              {/* Estoque */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Estoque</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estoque Atual</label>
                    <input type="number" step="0.001" value={form.estoque} onChange={(e) => setForm({ ...form, estoque: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estoque Mínimo</label>
                    <input type="number" step="0.001" value={form.estoque_minimo} onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" />
                  </div>
                </div>
              </div>

              {/* Fiscal */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Dados Fiscais</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">NCM</label>
                    <input type="text" value={form.ncm} onChange={(e) => setForm({ ...form, ncm: e.target.value })}
                      maxLength={8} placeholder="00000000"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">CEST</label>
                    <input type="text" value={form.cest} onChange={(e) => setForm({ ...form, cest: e.target.value })}
                      maxLength={7} placeholder="0000000"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">CFOP</label>
                    <select value={form.cfop} onChange={(e) => setForm({ ...form, cfop: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none">
                      <option value="5102">5102</option>
                      <option value="5101">5101</option>
                      <option value="5405">5405</option>
                      <option value="5403">5403</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">CSOSN</label>
                    <select value={form.csosn} onChange={(e) => setForm({ ...form, csosn: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#00A5AB] outline-none">
                      <option value="">Selecione</option>
                      <option value="102">102 - Tributação SN</option>
                      <option value="103">103 - Isento ICMS</option>
                      <option value="300">300 - Imune</option>
                      <option value="400">400 - Não tributada</option>
                      <option value="500">500 - ICMS ST</option>
                      <option value="900">900 - Outros</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 sticky bottom-0 bg-white pb-2">
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
