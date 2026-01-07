import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Plus, Search, Edit, Trash2, Package, X, Save, RefreshCw } from 'lucide-react'

interface Produto {
  id: string
  codigo: string | null
  codigo_barras: string | null
  nome: string
  categoria: string | null
  preco_venda: number
  preco_custo: number | null
  estoque_atual: number | null
  estoque_minimo: number | null
  unidade: string | null
  ncm: string | null
  ativo: boolean
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
  const [form, setForm] = useState({ codigo: '', codigo_barras: '', nome: '', categoria: '', preco_custo: '', preco_venda: '', estoque_atual: '', estoque_minimo: '', unidade: 'UN', ncm: '' })

  useEffect(() => {
    const sessionData = localStorage.getItem('mlpdv_session')
    if (!sessionData) { navigate(/+cnpjParam); return }
    loadProdutos(cnpjParam?.replace(/\D/g, '') || '')
  }, [navigate, cnpjParam])

  const loadProdutos = async (cnpj: string) => {
    setLoading(true)
    const { data } = await supabase.from('produtos').select('*').eq('cnpj', cnpj).eq('ativo', true).order('nome')
    setProdutos(data || [])
    setLoading(false)
  }

  const openModal = (produto?: Produto) => {
    if (produto) {
      setEditingProduto(produto)
      setForm({ codigo: produto.codigo || '', codigo_barras: produto.codigo_barras || '', nome: produto.nome, categoria: produto.categoria || '', preco_custo: String(produto.preco_custo || ''), preco_venda: String(produto.preco_venda || ''), estoque_atual: String(produto.estoque_atual || ''), estoque_minimo: String(produto.estoque_minimo || ''), unidade: produto.unidade || 'UN', ncm: produto.ncm || '' })
    } else {
      setEditingProduto(null)
      setForm({ codigo: '', codigo_barras: '', nome: '', categoria: '', preco_custo: '', preco_venda: '', estoque_atual: '0', estoque_minimo: '0', unidade: 'UN', ncm: '' })
    }
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const cnpj = cnpjParam?.replace(/\D/g, '') || ''
    setSaving(true)
    try {
      const data = { codigo: form.codigo || null, codigo_barras: form.codigo_barras || null, nome: form.nome.toUpperCase(), categoria: form.categoria?.toUpperCase() || null, preco_custo: parseFloat(form.preco_custo) || 0, preco_venda: parseFloat(form.preco_venda) || 0, estoque_atual: parseFloat(form.estoque_atual) || 0, estoque_minimo: parseFloat(form.estoque_minimo) || 0, unidade: form.unidade || 'UN', ncm: form.ncm || null, updated_at: new Date().toISOString() }
      if (editingProduto) { await supabase.from('produtos').update(data).eq('id', editingProduto.id) }
      else { await supabase.from('produtos').insert({ cnpj, local_id: 'web_'+Date.now(), ativo: true, ...data }) }
      setShowModal(false)
      loadProdutos(cnpj)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleDelete = async (p: Produto) => {
    if (!confirm('Excluir "'+p.nome+'"?')) return
    await supabase.from('produtos').update({ ativo: false }).eq('id', p.id)
    loadProdutos(cnpjParam?.replace(/\D/g, '') || '')
  }

  const filtered = produtos.filter(p => p.nome?.toLowerCase().includes(search.toLowerCase()) || p.codigo?.includes(search) || p.codigo_barras?.includes(search))
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <header className="bg-gradient-to-r from-[#006669] to-[#00A5AB] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4"><div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3"><Link to={'/'+cnpjParam+'/dashboard'} className="p-1.5 hover:bg-white/10 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link><h1 className="text-lg font-semibold">Produtos</h1></div>
          <button onClick={() => openModal()} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-medium"><Plus className="w-4 h-4" />Novo</button>
        </div></div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none text-sm" /></div>
        {loading ? <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-[#00A5AB]" /></div>
        : filtered.length === 0 ? <div className="text-center py-12 text-gray-500"><Package className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">Nenhum produto</p></div>
        : <div className="bg-white rounded-xl shadow-sm overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-4 py-3 font-medium">Produto</th><th className="text-left px-4 py-3 font-medium hidden md:table-cell">Codigo</th><th className="text-right px-4 py-3 font-medium">Preco</th><th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Estoque</th><th className="text-right px-4 py-3 font-medium">Acoes</th></tr></thead>
        <tbody className="divide-y divide-gray-100">{filtered.map(p => <tr key={p.id} className="hover:bg-gray-50"><td className="px-4 py-3"><p className="font-medium text-gray-800 truncate max-w-[200px]">{p.nome}</p>{p.categoria && <p className="text-xs text-gray-400">{p.categoria}</p>}</td><td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.codigo || p.codigo_barras || '-'}</td><td className="px-4 py-3 text-right font-medium text-gray-800">{fmt(p.preco_venda)}</td><td className="px-4 py-3 text-right text-gray-600 hidden sm:table-cell">{p.estoque_atual ?? 0} {p.unidade || 'UN'}</td><td className="px-4 py-3 text-right"><button onClick={() => openModal(p)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 mr-1"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(p)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody></table></div>}
      </main>
      {showModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold text-gray-800">{editingProduto ? 'Editar' : 'Novo'} Produto</h2><button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button></div>
        <form onSubmit={handleSave} className="p-4 space-y-3"><div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label><input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none" required /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Codigo</label><input type="text" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Cod. Barras</label><input type="text" value={form.codigo_barras} onChange={e => setForm({...form, codigo_barras: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label><input type="text" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label><select value={form.unidade} onChange={e => setForm({...form, unidade: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none"><option value="UN">UN</option><option value="KG">KG</option><option value="L">L</option><option value="CX">CX</option><option value="PCT">PCT</option></select></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Preco Custo</label><input type="number" step="0.01" value={form.preco_custo} onChange={e => setForm({...form, preco_custo: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Preco Venda *</label><input type="number" step="0.01" value={form.preco_venda} onChange={e => setForm({...form, preco_venda: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none" required /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Estoque</label><input type="number" step="0.001" value={form.estoque_atual} onChange={e => setForm({...form, estoque_atual: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Est. Minimo</label><input type="number" step="0.001" value={form.estoque_minimo} onChange={e => setForm({...form, estoque_minimo: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">NCM</label><input type="text" value={form.ncm} onChange={e => setForm({...form, ncm: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#00A5AB] outline-none" /></div>
        </div><div className="flex gap-2 pt-2"><button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Cancelar</button><button type="submit" disabled={saving} className="flex-1 bg-[#006669] hover:bg-[#004d4f] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm">{saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Salvar</>}</button></div></form>
      </div></div>}
    </div>
  )
}
