import { useState, useEffect, useRef } from 'react';
import { Search, Trash2, ShoppingCart, ScanBarcode } from 'lucide-react';
import * as api from '../api';

const METODO_LABEL = { DINHEIRO: 'Dinheiro', PIX: 'PIX', CARTAO_CREDITO: 'Crédito', CARTAO_DEBITO: 'Débito' };
const UNIDADE_LABEL = { UN: 'un', ML: 'ml', G: 'g', KG: 'kg', L: 'l' };

export default function Venda() {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [carrinho, setCarrinho] = useState([]);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTel, setClienteTel] = useState('');
  const [metodo, setMetodo] = useState('DINHEIRO');
  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [vendasRecentes, setVendasRecentes] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => { carregarVendasRecentes(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResultados([]); return; }
    setBuscando(true);
    const timer = setTimeout(() => {
      api.listarProdutos(query.trim())
        .then(setResultados)
        .finally(() => setBuscando(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  function carregarVendasRecentes() {
    api.listarVendas({}).then(vendas => setVendasRecentes(vendas.slice(0, 8))).catch(() => {});
  }

  function adicionarAoCarrinho(produto) {
    if (produto.precoVenda == null) {
      setErro(`"${produto.nome}" não tem preço de venda cadastrado`);
      return;
    }
    setErro('');
    setCarrinho(prev => {
      const existente = prev.find(i => i.produto.id === produto.id);
      if (existente) {
        return prev.map(i => i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { produto, quantidade: 1 }];
    });
    setQuery('');
    setResultados([]);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (resultados.length === 0) return;
    // bipagem (leitor de código de barras): se o texto digitado bate exatamente
    // com o SKU ou EAN de um resultado, adiciona direto — senão usa o primeiro resultado
    const digitado = query.trim().toLowerCase();
    const exato = resultados.find(p => p.sku?.toLowerCase() === digitado || p.ean === query.trim());
    adicionarAoCarrinho(exato || resultados[0]);
  }

  function atualizarQuantidade(produtoId, quantidade) {
    if (quantidade <= 0) {
      setCarrinho(prev => prev.filter(i => i.produto.id !== produtoId));
      return;
    }
    setCarrinho(prev => prev.map(i => i.produto.id === produtoId ? { ...i, quantidade } : i));
  }

  function removerDoCarrinho(produtoId) {
    setCarrinho(prev => prev.filter(i => i.produto.id !== produtoId));
  }

  const total = carrinho.reduce((soma, i) => soma + Number(i.produto.precoVenda) * i.quantidade, 0);

  async function handleFinalizar() {
    if (carrinho.length === 0) return;
    setFinalizando(true);
    setErro('');
    setSucesso('');
    try {
      const venda = await api.criarVenda({
        clienteNome: clienteNome || null,
        clienteTel: clienteTel || null,
        metodo,
        itens: carrinho.map(i => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
      });
      setSucesso(`Venda finalizada! Total: R$ ${Number(venda.valorTotal).toFixed(2)}`);
      setCarrinho([]);
      setClienteNome('');
      setClienteTel('');
      setMetodo('DINHEIRO');
      carregarVendasRecentes();
      setTimeout(() => setSucesso(''), 5000);
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao finalizar venda');
    } finally { setFinalizando(false); }
  }

  const fmt = (v) => `R$ ${Number(v || 0).toFixed(2)}`;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShoppingCart size={24} /> Venda de Produtos
        </h1>
        <p className="text-slate-500 text-sm mt-1">Digite o nome, bipe o código de barras ou digite o SKU do produto</p>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <div className="relative">
          <ScanBarcode size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nome, SKU ou código de barras..."
            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {query.trim() && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
            {buscando ? (
              <div className="px-4 py-3 text-sm text-slate-400">Buscando...</div>
            ) : resultados.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400">Nenhum produto encontrado</div>
            ) : (
              resultados.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => adicionarAoCarrinho(p)}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-50 last:border-0 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{p.nome}</p>
                    <p className="text-xs text-slate-400">
                      SKU: {p.sku}{p.ean ? ` · EAN: ${p.ean}` : ''} · Estoque: {Number(p.estoqueAtual).toFixed(2)} {UNIDADE_LABEL[p.unidadeMedida] || p.unidadeMedida}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 shrink-0">
                    {p.precoVenda != null ? fmt(p.precoVenda) : 'sem preço'}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {erro && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-4">{erro}</p>}
      {sucesso && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg mb-4">{sucesso}</p>}

      {/* Carrinho */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Produto</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium w-32">Qtd.</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Preço unit.</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Subtotal</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {carrinho.map(i => (
              <tr key={i.produto.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{i.produto.nome}</td>
                <td className="px-4 py-3">
                  <input
                    type="number" min={0.01} step={0.01} value={i.quantidade}
                    onChange={e => atualizarQuantidade(i.produto.id, Number(e.target.value))}
                    className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3 text-slate-600">{fmt(i.produto.precoVenda)}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{fmt(i.produto.precoVenda * i.quantidade)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => removerDoCarrinho(i.produto.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {carrinho.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">Carrinho vazio — busque um produto acima</div>
        )}
      </div>

      {/* Checkout */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-8">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Cliente (opcional)</label>
            <input className="input" value={clienteNome} onChange={e => setClienteNome(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Telefone (opcional)</label>
            <input className="input" placeholder="Para pontuar no campeonato" value={clienteTel} onChange={e => setClienteTel(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Forma de pagamento</label>
            <select className="input" value={metodo} onChange={e => setMetodo(e.target.value)}>
              {Object.entries(METODO_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <p className="text-lg font-bold text-slate-800">Total: {fmt(total)}</p>
          <button
            onClick={handleFinalizar}
            disabled={carrinho.length === 0 || finalizando}
            className="btn-primary px-6 disabled:opacity-50"
          >
            {finalizando ? 'Finalizando...' : 'Finalizar venda'}
          </button>
        </div>
      </div>

      {/* Vendas recentes */}
      {vendasRecentes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Vendas recentes</h2>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-50">
                {vendasRecentes.map(v => (
                  <tr key={v.id} className={v.status === 'CANCELADA' ? 'opacity-50' : ''}>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{new Date(v.criadoEm).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-2.5 text-slate-700">{v.clienteNome || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{v.itens.length} item(ns)</td>
                    <td className="px-4 py-2.5 text-slate-600">{METODO_LABEL[v.metodo] || v.metodo}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{fmt(v.valorTotal)}</td>
                    <td className="px-4 py-2.5">
                      {v.status === 'CANCELADA' && <span className="text-xs text-red-500">Cancelada</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
