import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Plus, Search, Edit, Trash2, Package, X, Save, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

interface Produto {
  id: string
  codigo: string | null
  codigo_barras: string | null
  nome: string
  categoria: string | null
  grupo: string | null
  subgrupo: string | null
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
  em_promocao: boolean | null
  preco_promocional: number | null
  data_inicio_promocao: string | null
  data_fim_promocao: string | null
  ativo: boolean
}

const UNIDADES = [
  { value: 'UN', label: 'Unidade (UN)' },
  { value: 'KG', label: 'Quilograma (KG)' },
  { value: 'LT', label: 'Litro (LT)' },
  { value: 'MT', label: 'Metro (MT)' },
  { value: 'CX', label: 'Caixa (CX)' },
  { value: 'PC', label: 'Peca (PC)' },
]

const CSOSN_OPTIONS = [
  { value: '102', label: '102 - Tributada sem permissao de credito' },
  { value: '103', label: '103 - Isencao de ICMS' },
  { value: '300', label: '300 - Imune' },
  { value: '400', label: '400 - Nao tributada' },
  { value: '500', label: '500 - ICMS cobrado anteriormente por ST' },
  { value: '900', label: '900 - Outros' },
]

const PIS_COFINS_OPTIONS = [
  '01 - Operacao Tributavel com Aliquota Basica',
  '04 - Operacao Tributavel Monofasica - Revenda a Aliquota Zero',
  '06 - Operacao Tributavel a Aliquota Zero',
  '07 - Operacao Isenta da Contribuicao',
  '08 - Operacao sem Incidencia da Contribuicao',
  '49 - Outras Operacoes de Saida',
  '99 - Outras Operacoes',
]

const PAGE_SIZES = [50, 100, 150, 250, 350, 500, 0] // 0 = todos

export default function Produtos() {
  const { cnpj: cnpjParam } = useParams<{ cnpj: string }>()
  const navigate = useNavigate()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('geral')
  const [pageSize, setPageSize] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const [grupos, setGrupos] = useState<string[]>([])
  const [subgrupos, setSubgrupos] = useState<string[]>([])

  const [form, setForm] = useState({
    codigo: '', codigo_barras: '', nome: '', grupo: '', subgrupo: '',
    preco_custo: '', margem: '', preco_venda: '',
    estoque_atual: '0', estoque_minimo: '0', unidade: 'UN',
    ncm: '', cest: '', csosn: '102', cfop: '', pis_cofins: '49 - Outras Operacoes de Saida',
    em_promocao: false, preco_promocional: '', data_inicio_promocao: '', data_fim_promocao: ''
  })

  useEffect(() => {
    const s = localStorage.getItem('mlpdv_session')
    if (!s) { navigate('/' + cnpjParam); return }
    loadProdutos(cnpjParam?.replace(/\D/g, '') || '')
    loadGrupos(cnpjParam?.replace(/\D/g, '') || '')
  }, [navigate, cnpjParam])

  const loadProdutos = async (cnpj: string) => {
    setLoading(true)
    const { data } = await supabase.from('produtos').select('*').eq('cnpj', cnpj).eq('ativo', true).order('nome')
    setProdutos(data || [])
    setLoading(false)
  }

  const loadGrupos = async (cnpj: string) => {
    const { data } = await supabase.from('produtos').select('grupo, subgrupo').eq('cnpj', cnpj).eq('ativo', true)
    if (data) {
      const g = [...new Set(data.map(p => p.grupo).filter(Boolean))] as string[]
      const s = [...new Set(data.map(p => p.subgrupo).filter(Boolean))] as string[]
      setGrupos(g.sort())
      setSubgrupos(s.sort())
    }
  }

  const openModal = (p?: Produto) => {
    if (p) {
      setEditingProduto(p)
      setForm({
        codigo: p.codigo || '', codigo_barras: p.codigo_barras || '', nome: p.nome,
        grupo: p.grupo || '', subgrupo: p.subgrupo || '',
        preco_custo: String(p.preco_custo || ''), margem: String(p.margem || ''),
        preco_venda: String(p.preco_venda || ''), estoque_atual: String(p.estoque_atual || '0'),
        estoque_minimo: String(p.estoque_minimo || '0'), unidade: p.unidade || 'UN',
        ncm: p.ncm || '', cest: p.cest || '', csosn: p.csosn || '102',
        cfop: p.cfop || '', pis_cofins: p.pis_cofins || '49 - Outras Operacoes de Saida',
        em_promocao: p.em_promocao || false, preco_promocional: String(p.preco_promocional || ''),
        data_inicio_promocao: p.data_inicio_promocao || '', data_fim_promocao: p.data_fim_promocao || ''
      })
    } else {
      setEditingProduto(null)
      setForm({ codigo: '', codigo_barras: '', nome: '', grupo: '', subgrupo: '', preco_custo: '', margem: '', preco_venda: '', estoque_atual: '0', estoque_minimo: '0', unidade: 'UN', ncm: '', cest: '', csosn: '102', cfop: '', pis_cofins: '49 - Outras Operacoes de Saida', em_promocao: false, preco_promocional: '', data_inicio_promocao: '', data_fim_promocao: '' })
    }
    setActiveTab('geral')
    setShowModal(true)
  }

  const calcPreco = (custo: string, margem: string) => {
    const c = parseFloat(custo) || 0
    const m = parseFloat(margem) || 0
    return (c * (1 + m / 100)).toFixed(2)
  }

  const calcMargem = (custo: string, venda: string) => {
    const c = parseFloat(custo) || 0
    const v = parseFloat(venda) || 0
    if (c <= 0) return ''
    return (((v - c) / c) * 100).toFixed(2)
  }

  const handleCustoChange = (v: string) => {
    const newPreco = calcPreco(v, form.margem)
    setForm(f => ({ ...f, preco_custo: v, preco_venda: newPreco }))
  }

  const handleMargemChange = (v: string) => {
    const newPreco = calcPreco(form.preco_custo, v)
    setForm(f => ({ ...f, margem: v, preco_venda: newPreco }))
  }

  const handlePrecoChange = (v: string) => {
    const newMargem = calcMargem(form.preco_custo, v)
    setForm(f => ({ ...f, preco_venda: v, margem: newMargem }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const cnpj = cnpjParam?.replace(/\D/g, '') || ''
    setSaving(true)
    try {
      const d = {
        codigo: form.codigo || null, codigo_barras: form.codigo_barras || null,
        nome: form.nome.toUpperCase(), grupo: form.grupo?.toUpperCase() || null,
        subgrupo: form.subgrupo?.toUpperCase() || null,
        preco_custo: parseFloat(form.preco_custo) || 0, margem: parseFloat(form.margem) || 0,
        preco_venda: parseFloat(form.preco_venda) || 0, estoque_atual: parseFloat(form.estoque_atual) || 0,
        estoque_minimo: parseFloat(form.estoque_minimo) || 0, unidade: form.unidade,
        ncm: form.ncm || null, cest: form.cest || null, csosn: form.csosn || null,
        cfop: form.cfop || null, pis_cofins: form.pis_cofins || null,
        em_promocao: form.em_promocao, preco_promocional: form.em_promocao ? parseFloat(form.preco_promocional) || null : null,
        data_inicio_promocao: form.em_promocao ? form.data_inicio_promocao || null : null,
        data_fim_promocao: form.em_promocao ? form.data_fim_promocao || null : null,
        updated_at: new Date().toISOString()
      }
      if (editingProduto) await supabase.from('produtos').update(d).eq('id', editingProduto.id)
      else await supabase.from('produtos').insert({ cnpj, local_id: 'web_' + Date.now(), ativo: true, ...d })
      setShowModal(false)
      loadProdutos(cnpj)
      loadGrupos(cnpj)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleDelete = async (p: Produto) => {
    if (!confirm('Excluir "' + p.nome + '"?')) return
    await supabase.from('produtos').update({ ativo: false }).eq('id', p.id)
    loadProdutos(cnpjParam?.replace(/\D/g, '') || '')
  }

  const filtered = produtos.filter(p => p.nome?.toLowerCase().includes(search.toLowerCase()) || p.codigo?.includes(search) || p.codigo_barras?.includes(search))
  const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize)
  const paginatedProducts = pageSize === 0 ? filtered : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const inputClass = 'w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-[#00A5AB] outline-none'
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <header className="bg-gradient-to-r from-[#006669] to-[#00A5AB] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4"><div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-2"><Link to={'/' + cnpjParam + '/dashboard'} className="p-1 hover:bg-white/10 rounded"><ArrowLeft className="w-5 h-5" /></Link><h1 className="text-base font-semibold">Produtos</h1></div>
          <button onClick={() => openModal()} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded text-sm"><Plus className="w-4 h-4" />Novo</button>
        </div></div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Buscar..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#00A5AB] outline-none" /></div>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s === 0 ? 'Todos' : s + ' por pagina'}</option>)}
          </select>
        </div>
        {loading ? <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-[#00A5AB]" /></div>
        : filtered.length === 0 ? <div className="text-center py-8 text-gray-400"><Package className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Nenhum produto</p></div>
        : <>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border mb-3">
            <table className="w-full text-xs">
              <thead><tr className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 border-b">
                <th className="text-left px-3 py-2 font-medium">Codigo</th>
                <th className="text-left px-3 py-2 font-medium">Nome</th>
                <th className="text-left px-3 py-2 font-medium hidden lg:table-cell">Grupo</th>
                <th className="text-right px-3 py-2 font-medium hidden sm:table-cell">Estoque</th>
                <th className="text-right px-3 py-2 font-medium">Preco</th>
                <th className="text-center px-2 py-2 font-medium w-16">Acoes</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">{paginatedProducts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-3 py-1.5 text-gray-500 font-mono">{p.codigo || p.codigo_barras || '-'}</td>
                  <td className="px-3 py-1.5"><span className="font-medium text-gray-800 line-clamp-1">{p.nome}</span></td>
                  <td className="px-3 py-1.5 text-gray-500 hidden lg:table-cell">{p.grupo || '-'}</td>
                  <td className="px-3 py-1.5 text-right text-gray-600 hidden sm:table-cell">{p.estoque_atual ?? 0} {p.unidade || 'UN'}</td>
                  <td className="px-3 py-1.5 text-right font-medium text-gray-800">{fmt(p.preco_venda)}</td>
                  <td className="px-2 py-1.5 text-center"><button onClick={() => openModal(p)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Edit className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(p)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {totalPages > 1 && <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{filtered.length} produtos | Pagina {currentPage} de {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>}
        </>}
      </main>

      {showModal && <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-6 overflow-y-auto">
        <div className="bg-white rounded-xl w-full max-w-3xl shadow-xl my-4">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-white">
            <h2 className="font-semibold text-gray-800">{editingProduto ? 'Editar' : 'Novo'} Produto</h2>
            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
          </div>

          <div className="border-b">
            <div className="flex gap-1 px-4 pt-2">
              {['geral', 'fiscal', 'promocao'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={'px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition ' + (activeTab === tab ? 'border-[#006669] text-[#006669] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700')}>
                  {tab === 'geral' ? 'Geral' : tab === 'fiscal' ? 'Fiscal' : 'Promocao'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSave} className="p-4">
            {activeTab === 'geral' && <div className="space-y-4">
              <div><label className={labelClass}>Nome *</label><input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className={inputClass} required /></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div><label className={labelClass}>Codigo Interno</label><input type="text" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>EAN/GTIN</label><input type="text" value={form.codigo_barras} onChange={e => setForm({...form, codigo_barras: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Unidade</label><select value={form.unidade} onChange={e => setForm({...form, unidade: e.target.value})} className={inputClass}>{UNIDADES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Grupo</label><input type="text" list="grupos" value={form.grupo} onChange={e => setForm({...form, grupo: e.target.value})} className={inputClass} placeholder="Selecione ou digite" /><datalist id="grupos">{grupos.map(g => <option key={g} value={g} />)}</datalist></div>
                <div><label className={labelClass}>Subgrupo</label><input type="text" list="subgrupos" value={form.subgrupo} onChange={e => setForm({...form, subgrupo: e.target.value})} className={inputClass} placeholder="Selecione ou digite" /><datalist id="subgrupos">{subgrupos.map(s => <option key={s} value={s} />)}</datalist></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={labelClass}>Preco Custo</label><input type="number" step="0.01" value={form.preco_custo} onChange={e => handleCustoChange(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Margem %</label><input type="number" step="0.01" value={form.margem} onChange={e => handleMargemChange(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Preco Venda *</label><input type="number" step="0.01" value={form.preco_venda} onChange={e => handlePrecoChange(e.target.value)} className={inputClass + ' font-semibold text-green-700'} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Estoque Atual</label><input type="number" step="0.001" value={form.estoque_atual} onChange={e => setForm({...form, estoque_atual: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Estoque Minimo</label><input type="number" step="0.001" value={form.estoque_minimo} onChange={e => setForm({...form, estoque_minimo: e.target.value})} className={inputClass} /></div>
              </div>
            </div>}

            {activeTab === 'fiscal' && <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>NCM</label><input type="text" value={form.ncm} onChange={e => setForm({...form, ncm: e.target.value})} placeholder="00000000" className={inputClass + ' font-mono'} maxLength={8} /></div>
                <div><label className={labelClass}>CEST</label><input type="text" value={form.cest} onChange={e => setForm({...form, cest: e.target.value})} placeholder="0000000" className={inputClass + ' font-mono'} maxLength={7} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>CSOSN</label><select value={form.csosn} onChange={e => setForm({...form, csosn: e.target.value})} className={inputClass}>{CSOSN_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                <div><label className={labelClass}>CFOP (opcional)</label><input type="text" value={form.cfop} onChange={e => setForm({...form, cfop: e.target.value.replace(/\D/g, '')})} placeholder="Vazio = usa regra fiscal" className={inputClass + ' font-mono'} maxLength={4} /></div>
              </div>
              <div><label className={labelClass}>PIS/COFINS</label><select value={form.pis_cofins} onChange={e => setForm({...form, pis_cofins: e.target.value})} className={inputClass}>{PIS_COFINS_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            </div>}

            {activeTab === 'promocao' && <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.em_promocao} onChange={e => setForm({...form, em_promocao: e.target.checked})} className="w-4 h-4 text-[#006669] rounded" />
                <span className="text-sm font-medium text-gray-700">Produto em Promocao</span>
              </label>
              {form.em_promocao && <div className="grid grid-cols-3 gap-3">
                <div><label className={labelClass}>Preco Promocional *</label><input type="number" step="0.01" value={form.preco_promocional} onChange={e => setForm({...form, preco_promocional: e.target.value})} className={inputClass + ' font-semibold text-orange-600'} required={form.em_promocao} /></div>
                <div><label className={labelClass}>Data Inicio *</label><input type="date" value={form.data_inicio_promocao} onChange={e => setForm({...form, data_inicio_promocao: e.target.value})} className={inputClass} required={form.em_promocao} /></div>
                <div><label className={labelClass}>Data Fim *</label><input type="date" value={form.data_fim_promocao} onChange={e => setForm({...form, data_fim_promocao: e.target.value})} className={inputClass} required={form.em_promocao} /></div>
              </div>}
              {form.em_promocao && form.preco_promocional && form.preco_venda && <div className="bg-orange-50 p-3 rounded-lg text-sm">
                <p>De: <span className="line-through">R\$ {parseFloat(form.preco_venda).toFixed(2)}</span> Por: <span className="font-bold text-orange-600">R\$ {parseFloat(form.preco_promocional).toFixed(2)}</span></p>
                <p>Desconto: <span className="font-bold text-orange-600">{(((parseFloat(form.preco_venda) - parseFloat(form.preco_promocional)) / parseFloat(form.preco_venda)) * 100).toFixed(1)}%</span></p>
              </div>}
            </div>}

            <div className="flex gap-2 mt-6 pt-4 border-t">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Cancelar</button>
              <button type="submit" disabled={saving} className="flex-1 bg-[#006669] hover:bg-[#004d4f] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Salvar</>}
              </button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  )
}
