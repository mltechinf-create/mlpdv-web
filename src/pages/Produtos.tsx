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
  margem: number | null
  estoque_atual: number | null
  estoque_minimo: number | null
  unidade: string | null
  ncm: string | null
  cest: string | null
  csosn: string | null
  cfop: string | null
  pis_cofins: string | null
  ativo: boolean
}

const UNIDADES = ['UN', 'KG', 'LT', 'MT', 'CX', 'PC', 'PCT']
const CSOSN_OPTIONS = ['102', '103', '300', '400', '500', '900']

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
    codigo: '', codigo_barras: '', nome: '', categoria: '',
    preco_custo: '', margem: '', preco_venda: '',
    estoque_atual: '0', estoque_minimo: '0', unidade: 'UN',
    ncm: '', cest: '', csosn: '102', cfop: '5102', pis_cofins: '49'
  })

  useEffect(() => {
    const s = localStorage.getItem('mlpdv_session')
    if (!s) { navigate('/' + cnpjParam); return }
    loadProdutos(cnpjParam?.replace(/\D/g, '') || '')
  }, [navigate, cnpjParam])

  const loadProdutos = async (cnpj: string) => {
    setLoading(true)
    const { data } = await supabase.from('produtos').select('*').eq('cnpj', cnpj).eq('ativo', true).order('nome')
    setProdutos(data || [])
    setLoading(false)
  }

  const openModal = (p?: Produto) => {
    if (p) {
      setEditingProduto(p)
      setForm({
        codigo: p.codigo || '', codigo_barras: p.codigo_barras || '', nome: p.nome,
        categoria: p.categoria || '', preco_custo: String(p.preco_custo || ''),
        margem: String(p.margem || ''), preco_venda: String(p.preco_venda || ''),
        estoque_atual: String(p.estoque_atual || '0'), estoque_minimo: String(p.estoque_minimo || '0'),
        unidade: p.unidade || 'UN', ncm: p.ncm || '', cest: p.cest || '',
        csosn: p.csosn || '102', cfop: p.cfop || '5102', pis_cofins: p.pis_cofins || '49'
      })
    } else {
      setEditingProduto(null)
      setForm({ codigo: '', codigo_barras: '', nome: '', categoria: '', preco_custo: '', margem: '', preco_venda: '', estoque_atual: '0', estoque_minimo: '0', unidade: 'UN', ncm: '', cest: '', csosn: '102', cfop: '5102', pis_cofins: '49' })
    }
    setShowModal(true)
  }

  const calcPreco = (custo: string, margem: string) => {
    const c = parseFloat(custo) || 0
    const m = parseFloat(margem) || 0
    return (c * (1 + m / 100)).toFixed(2)
  }

  const handleCustoChange = (v: string) => {
    setForm(f => ({ ...f, preco_custo: v, preco_venda: calcPreco(v, f.margem) }))
  }

  const handleMargemChange = (v: string) => {
    setForm(f => ({ ...f, margem: v, preco_venda: calcPreco(f.preco_custo, v) }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const cnpj = cnpjParam?.replace(/\D/g, '') || ''
    setSaving(true)
    try {
      const d = {
        codigo: form.codigo || null, codigo_barras: form.codigo_barras || null,
        nome: form.nome.toUpperCase(), categoria: form.categoria?.toUpperCase() || null,
        preco_custo: parseFloat(form.preco_custo) || 0, margem: parseFloat(form.margem) || 0,
        preco_venda: parseFloat(form.preco_venda) || 0, estoque_atual: parseFloat(form.estoque_atual) || 0,
        estoque_minimo: parseFloat(form.estoque_minimo) || 0, unidade: form.unidade,
        ncm: form.ncm || null, cest: form.cest || null, csosn: form.csosn || null,
        cfop: form.cfop || null, pis_cofins: form.pis_cofins || null, updated_at: new Date().toISOString()
      }
      if (editingProduto) await supabase.from('produtos').update(d).eq('id', editingProduto.id)
      else await supabase.from('produtos').insert({ cnpj, local_id: 'web_' + Date.now(), ativo: true, ...d })
      setShowModal(false)
      loadProdutos(cnpj)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleDelete = async (p: Produto) => {
    if (!confirm('Excluir "' + p.nome + '"?')) return
    await supabase.from('produtos').update({ ativo: false }).eq('id', p.id)
    loadProdutos(cnpjParam?.replace(/\D/g, '') || '')
  }

  const filtered = produtos.filter(p => p.nome?.toLowerCase().includes(search.toLowerCase()) || p.codigo?.includes(search) || p.codigo_barras?.includes(search))
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <header className="bg-gradient-to-r from-[#006669] to-[#00A5AB] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4"><div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-2"><Link to={'/' + cnpjParam + '/dashboard'} className="p-1 hover:bg-white/10 rounded"><ArrowLeft className="w-5 h-5" /></Link><h1 className="text-base font-semibold">Produtos</h1></div>
          <button onClick={() => openModal()} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded text-sm"><Plus className="w-4 h-4" />Novo</button>
        </div></div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-3">
        <div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#00A5AB] outline-none" /></div>
        {loading ? <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-[#00A5AB]" /></div>
        : filtered.length === 0 ? <div className="text-center py-8 text-gray-400"><Package className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Nenhum produto</p></div>
        : <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
          <table className="w-full text-xs">
            <thead><tr className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 border-b">
              <th className="text-left px-3 py-2 font-medium">Codigo</th>
              <th className="text-left px-3 py-2 font-medium">Nome</th>
              <th className="text-right px-3 py-2 font-medium hidden sm:table-cell">Estoque</th>
              <th className="text-right px-3 py-2 font-medium">Preco</th>
              <th className="text-center px-2 py-2 font-medium w-16">Acoes</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">{filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50">
                <td className="px-3 py-1.5 text-gray-500 font-mono">{p.codigo || p.codigo_barras || '-'}</td>
                <td className="px-3 py-1.5"><span className="font-medium text-gray-800 line-clamp-1">{p.nome}</span></td>
                <td className="px-3 py-1.5 text-right text-gray-600 hidden sm:table-cell">{p.estoque_atual ?? 0} {p.unidade || 'UN'}</td>
                <td className="px-3 py-1.5 text-right font-medium text-gray-800">{fmt(p.preco_venda)}</td>
                <td className="px-2 py-1.5 text-center"><button onClick={() => openModal(p)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Edit className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(p)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>}
      </main>
      {showModal && <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
        <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-white"><h2 className="font-semibold text-gray-800">{editingProduto ? 'Editar' : 'Novo'} Produto</h2><button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button></div>
          <form onSubmit={handleSave} className="p-4">
            <div className="grid grid-cols-6 gap-3 text-xs">
              <div className="col-span-6"><label className="block font-medium text-gray-600 mb-1">Nome *</label><input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#00A5AB] outline-none" required /></div>
              <div className="col-span-3 sm:col-span-2"><label className="block font-medium text-gray-600 mb-1">Codigo Interno</label><input type="text" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#00A5AB] outline-none" /></div>
              <div className="col-span-3 sm:col-span-2"><label className="block font-medium text-gray-600 mb-1">EAN/GTIN</label><input type="text" value={form.codigo_barras} onChange={e => setForm({...form, codigo_barras: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#00A5AB] outline-none" /></div>
              <div className="col-span-3 sm:col-span-2"><label className="block font-medium text-gray-600 mb-1">Categoria</label><input type="text" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#00A5AB] outline-none" /></div>
              <div className="col-span-3 sm:col-span-1"><label className="block font-medium text-gray-600 mb-1">Unidade</label><select value={form.unidade} onChange={e => setForm({...form, unidade: e.target.value})} className="w-full px-2 py-2 border rounded-lg focus:ring-1 focus:ring-[#00A5AB] outline-none">{UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
              <div className="col-span-2 sm:col-span-1"><label className="block font-medium text-gray-600 mb-1">Custo</label><input type="number" step="0.01" value={form.preco_custo} onChange={e => handleCustoChange(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#00A5AB] outline-none" /></div>
              <div className="col-span-2 sm:col-span-1"><label className="block font-medium text-gray-600 mb-1">Margem %</label><input type="number" step="0.01" value={form.margem} onChange={e => handleMargemChange(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#00A5AB] outline-none" /></div>
              <div className="col-span-2 sm:col-span-1"><label className="block font-medium text-gray-600 mb-1">Venda *</label><input type="number" step="0.01" value={form.preco_venda} onChange={e => setForm({...form, preco_venda: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#00A5AB] outline-none font-semibold text-green-700" required /></div>
              <div className="col-span-3 sm:col-span-1"><label className="block font-medium text-gray-600 mb-1">Estoque</label><input type="number" step="0.001" value={form.estoque_atual} onChange={e => setForm({...form, estoque_atual: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#00A5AB] outline-none" /></div>
              <div className="col-span-3 sm:col-span-1"><label className="block font-medium text-gray-600 mb-1">Est. Min</label><input type="number" step="0.001" value={form.estoque_minimo} onChange={e => setForm({...form, estoque_minimo: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#00A5AB] outline-none" /></div>
              <div className="col-span-6 border-t pt-3 mt-1"><p className="font-semibold text-gray-700 mb-2">Dados Fiscais</p></div>
              <div className="col-span-3 sm:col-span-2"><label className="block font-medium text-gray-600 mb-1">NCM</label><input type="text" value={form.ncm} onChange={e => setForm({...form, ncm: e.target.value})} placeholder="00000000" className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#00A5AB] outline-none font-mono" /></div>
              <div className="col-span-3 sm:col-span-2"><label className="block font-medium text-gray-600 mb-1">CEST</label><input type="text" value={form.cest} onChange={e => setForm({...form, cest: e.target.value})} placeholder="0000000" className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#00A5AB] outline-none font-mono" /></div>
              <div className="col-span-3 sm:col-span-1"><label className="block font-medium text-gray-600 mb-1">CSOSN</label><select value={form.csosn} onChange={e => setForm({...form, csosn: e.target.value})} className="w-full px-2 py-2 border rounded-lg focus:ring-1 focus:ring-[#00A5AB] outline-none">{CSOSN_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="col-span-3 sm:col-span-1"><label className="block font-medium text-gray-600 mb-1">CFOP</label><input type="text" value={form.cfop} onChange={e => setForm({...form, cfop: e.target.value})} placeholder="5102" className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#00A5AB] outline-none font-mono" /></div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t"><button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Cancelar</button><button type="submit" disabled={saving} className="flex-1 bg-[#006669] hover:bg-[#004d4f] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm">{saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Salvar</>}</button></div>
          </form>
        </div>
      </div>}
    </div>
  )
}
