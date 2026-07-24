import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, PackagePlus, PackageMinus, AlertTriangle, Boxes, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';

const CATEGORIA_LABEL = { HIGIENE: 'Higiene', COSMETICO: 'Cosmético', EQUIPAMENTO: 'Equipamento', CONSUMIVEL: 'Consumível', ACESSORIO: 'Acessório' };
const TIPO_USO_LABEL = { REVENDA: 'Revenda', USO_INTERNO: 'Uso interno', AMBOS: 'Ambos' };
const UNIDADE_LABEL = { UN: 'un', ML: 'ml', G: 'g', KG: 'kg', L: 'l' };

const emptyForm = { nome: '', ean: '', categoria: 'CONSUMIVEL', tipoUso: 'USO_INTERNO', unidadeMedida: 'UN', estoqueAtual: '', estoqueMinimo: '', precoVenda: '' };

const hoje = new Date().toISOString().split('T')[0];
const primeiroDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [relatorio, setRelatorio] = useState(null);
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes);
  const [dataFim, setDataFim] = useState(hoje);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [modalAjuste, setModalAjuste] = useState(null);
  const [tipoAjuste, setTipoAjuste] = useState('ENTRADA');
  const [quantidadeAjuste, setQuantidadeAjuste] = useState('');
  const [observacaoAjuste, setObservacaoAjuste] = useState('');
  const [ajustando, setAjustando] = useState(false);
  const [erroAjuste, setErroAjuste] = useState('');

  useEffect(() => { carregar(); }, [dataInicio, dataFim]);

  async function carregar() {
    setLoading(true);
    try {
      const [prods, rel] = await Promise.all([
        api.listarProdutos(),
        api.relatorioEstoque({ dataInicio, dataFim }),
      ]);
      setProdutos(prods);
      setRelatorio(rel);
    } finally { setLoading(false); }
  }

  function abrirCriar() {
    setEditando(null);
    setForm(emptyForm);
    setError('');
    setModal(true);
  }

  function abrirEditar(p) {
    setEditando(p);
    setForm({
      nome: p.nome,
      ean: p.ean ?? '',
      categoria: p.categoria,
      tipoUso: p.tipoUso,
      unidadeMedida: p.unidadeMedida,
      estoqueAtual: p.estoqueAtual,
      estoqueMinimo: p.estoqueMinimo,
      precoVenda: p.precoVenda ?? '',
    });
    setError('');
    setModal(true);
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        ean: form.ean === '' ? null : form.ean,
        estoqueAtual: Number(form.estoqueAtual),
        estoqueMinimo: Number(form.estoqueMinimo),
        precoVenda: form.precoVenda === '' ? null : Number(form.precoVenda),
      };
      if (editando) {
        const atualizado = await api.atualizarProduto(editando.id, payload);
        setProdutos(prev => prev.map(p => p.id === editando.id ? atualizado : p));
      } else {
        const novo = await api.criarProduto(payload);
        setProdutos(prev => [...prev, novo]);
      }
      setModal(false);
      carregar();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  async function handleDesativar(id) {
    if (!confirm('Desativar este produto?')) return;
    try {
      await api.desativarProduto(id);
      setProdutos(prev => prev.filter(p => p.id !== id));
    } catch { alert('Erro ao desativar'); }
  }

  function abrirAjuste(p, tipo) {
    setModalAjuste(p);
    setTipoAjuste(tipo);
    setQuantidadeAjuste('');
    setObservacaoAjuste('');
    setErroAjuste('');
  }

  function fecharAjuste() {
    setModalAjuste(null);
    setQuantidadeAjuste('');
    setObservacaoAjuste('');
    setErroAjuste('');
  }

  async function handleAjustar(e) {
    e.preventDefault();
    if (!quantidadeAjuste || Number(quantidadeAjuste) <= 0) { setErroAjuste('Informe uma quantidade válida'); return; }
    setAjustando(true);
    setErroAjuste('');
    try {
      const atualizado = await api.ajustarEstoque(modalAjuste.id, {
        tipo: tipoAjuste,
        quantidade: Number(quantidadeAjuste),
        observacao: observacaoAjuste || null,
      });
      setProdutos(prev => prev.map(p => p.id === atualizado.id ? atualizado : p));
      fecharAjuste();
      carregar();
    } catch (err) {
      setErroAjuste(err.response?.data?.message || 'Erro ao ajustar estoque');
    } finally { setAjustando(false); }
  }

  const fmt = (v) => `R$ ${Number(v || 0).toFixed(2)}`;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Estoque</h1>
          <p className="text-slate-500 text-sm mt-1">{produtos.length} produto(s) ativo(s)</p>
        </div>
        <button onClick={abrirCriar} className="flex items-center gap-2 btn-primary">
          <Plus size={16} /> Novo produto
        </button>
      </div>

      {/* Filtro de data (para entradas/saídas do período) */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-slate-500">Período das movimentações:</span>
        <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <span className="text-slate-400">–</span>
        <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Cards de relatório */}
      {relatorio && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <Boxes size={14} /> Produtos ativos
            </div>
            <p className="text-xl font-bold text-slate-800">{relatorio.totalProdutosAtivos}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <AlertTriangle size={14} /> Estoque baixo
            </div>
            <p className={`text-xl font-bold ${relatorio.produtosComEstoqueBaixo > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {relatorio.produtosComEstoqueBaixo}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <DollarSign size={14} /> Valor em estoque
            </div>
            <p className="text-xl font-bold text-slate-800">{fmt(relatorio.valorTotalEstoque)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <TrendingUp size={14} /> Entradas no período
            </div>
            <p className="text-xl font-bold text-slate-800">{Number(relatorio.totalEntradas || 0).toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <TrendingDown size={14} /> Saídas no período
            </div>
            <p className="text-xl font-bold text-slate-800">{Number(relatorio.totalSaidas || 0).toFixed(2)}</p>
          </div>
        </div>
      )}

      {relatorio?.produtosBaixoEstoque?.length > 0 && (
        <div className="flex items-start gap-2 mb-6 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            <span className="font-medium">Estoque baixo:</span>{' '}
            {relatorio.produtosBaixoEstoque.map(p => p.nome).join(', ')}
          </span>
        </div>
      )}

      {/* Tabela de produtos */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Carregando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Categoria</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Uso</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Estoque</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Preço venda</th>
                <th className="px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {produtos.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{p.nome}</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      SKU: {p.sku}{p.ean ? ` · EAN: ${p.ean}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{CATEGORIA_LABEL[p.categoria] || p.categoria}</td>
                  <td className="px-4 py-3 text-slate-600">{TIPO_USO_LABEL[p.tipoUso] || p.tipoUso}</td>
                  <td className="px-4 py-3">
                    <span className={p.estoqueBaixo ? 'text-red-600 font-medium' : 'text-slate-600'}>
                      {Number(p.estoqueAtual).toFixed(2)} {UNIDADE_LABEL[p.unidadeMedida] || p.unidadeMedida}
                    </span>
                    <span className="text-slate-400 text-xs"> (mín. {Number(p.estoqueMinimo).toFixed(2)})</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.precoVenda != null ? fmt(p.precoVenda) : '—'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => abrirAjuste(p, 'ENTRADA')} title="Entrada de estoque"
                      className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg mr-1">
                      <PackagePlus size={15} />
                    </button>
                    <button onClick={() => abrirAjuste(p, 'SAIDA')} title="Saída de estoque"
                      className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg mr-1">
                      <PackageMinus size={15} />
                    </button>
                    <button onClick={() => abrirEditar(p)} title="Editar"
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg mr-1">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDesativar(p.id)} title="Desativar"
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {produtos.length === 0 && (
            <div className="text-center py-12 text-slate-400">Nenhum produto cadastrado</div>
          )}
        </div>
      )}

      {/* Modal produto */}
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar Produto' : 'Novo Produto'}>
        <form onSubmit={handleSalvar} className="space-y-4">
          {editando && (
            <p className="text-xs text-slate-400">SKU: <span className="font-mono">{editando.sku}</span> (gerado automaticamente)</p>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nome *</label>
            <input className="input" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">EAN (código de barras)</label>
            <input className="input" placeholder="8, 12, 13 ou 14 dígitos" inputMode="numeric"
              value={form.ean} onChange={e => setForm({ ...form, ean: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Categoria *</label>
              <select className="input" required value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                {Object.entries(CATEGORIA_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de uso *</label>
              <select className="input" required value={form.tipoUso} onChange={e => setForm({ ...form, tipoUso: e.target.value })}>
                {Object.entries(TIPO_USO_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Unidade *</label>
              <select className="input" required value={form.unidadeMedida} onChange={e => setForm({ ...form, unidadeMedida: e.target.value })}>
                {Object.entries(UNIDADE_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Estoque atual *</label>
              <input type="number" className="input" required min={0} step={0.01} value={form.estoqueAtual}
                onChange={e => setForm({ ...form, estoqueAtual: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Estoque mínimo *</label>
              <input type="number" className="input" required min={0} step={0.01} value={form.estoqueMinimo}
                onChange={e => setForm({ ...form, estoqueMinimo: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Preço de venda (R$)</label>
            <input type="number" className="input" min={0} step={0.01} placeholder="Deixe em branco se não for para revenda"
              value={form.precoVenda} onChange={e => setForm({ ...form, precoVenda: e.target.value })} />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal ajuste de estoque */}
      <Modal open={!!modalAjuste} onClose={fecharAjuste} title={tipoAjuste === 'ENTRADA' ? 'Entrada de Estoque' : 'Saída de Estoque'}>
        {modalAjuste && (
          <form onSubmit={handleAjustar} className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
              <p><span className="font-medium">Produto:</span> {modalAjuste.nome}</p>
              <p><span className="font-medium">Estoque atual:</span> {Number(modalAjuste.estoqueAtual).toFixed(2)} {UNIDADE_LABEL[modalAjuste.unidadeMedida] || modalAjuste.unidadeMedida}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Quantidade *</label>
              <input type="number" className="input" required min={0.01} step={0.01} autoFocus
                value={quantidadeAjuste} onChange={e => setQuantidadeAjuste(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Observação</label>
              <textarea className="input" rows={2} placeholder="Ex: compra fornecedor X, uso em atendimento, perda..."
                value={observacaoAjuste} onChange={e => setObservacaoAjuste(e.target.value)} />
            </div>
            {erroAjuste && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{erroAjuste}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={fecharAjuste} className="btn-ghost">Cancelar</button>
              <button type="submit" disabled={ajustando}
                className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${tipoAjuste === 'ENTRADA' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                {ajustando ? 'Salvando...' : (tipoAjuste === 'ENTRADA' ? 'Confirmar entrada' : 'Confirmar saída')}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
