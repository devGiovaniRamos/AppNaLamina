import { useState, useEffect } from 'react';
import { TrendingUp, CreditCard, DollarSign, Hash, RefreshCw } from 'lucide-react';
import * as api from '../api';

const METODO_LABEL = { PIX: 'PIX', DINHEIRO: 'Dinheiro', CARTAO_CREDITO: 'Crédito', CARTAO_DEBITO: 'Débito' };
const STATUS_COLOR = {
  PAGO: 'bg-green-100 text-green-800',
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  CANCELADO: 'bg-gray-100 text-gray-500',
  EXPIRADO: 'bg-gray-100 text-gray-500',
};

const hoje = new Date().toISOString().split('T')[0];
const primeiroDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

export default function Pagamentos() {
  const [pagamentos, setPagamentos] = useState([]);
  const [relatorio, setRelatorio] = useState(null);
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes);
  const [dataFim, setDataFim] = useState(hoje);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregar();
  }, [dataInicio, dataFim]);

  async function carregar() {
    setLoading(true);
    try {
      const params = { dataInicio, dataFim };
      const [pags, rel] = await Promise.all([
        api.listarPagamentos(params),
        api.relatorioPagamentos(params),
      ]);
      setPagamentos(pags);
      setRelatorio(rel);
    } finally { setLoading(false); }
  }

  const fmt = (v) => `R$ ${Number(v || 0).toFixed(2)}`;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pagamentos</h1>
          <p className="text-slate-500 text-sm mt-1">Histórico e relatório financeiro · filtrado pela data de registro do pagamento</p>
        </div>
        <button onClick={carregar} disabled={loading} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Filtro de data */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-slate-500">Período:</span>
        <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <span className="text-slate-400">–</span>
        <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Cards de relatório */}
      {relatorio && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <DollarSign size={14} /> Total faturado
            </div>
            <p className="text-xl font-bold text-slate-800">{fmt(relatorio.totalFaturado)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <Hash size={14} /> Qtd. pagamentos
            </div>
            <p className="text-xl font-bold text-slate-800">{relatorio.quantidadePagamentos}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <TrendingUp size={14} /> Ticket médio
            </div>
            <p className="text-xl font-bold text-slate-800">{fmt(relatorio.ticketMedio)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <CreditCard size={14} /> Por método
            </div>
            <div className="space-y-0.5 mt-1">
              {relatorio.porMetodo && Object.entries(relatorio.porMetodo).map(([metodo, valor]) => (
                <p key={metodo} className="text-xs text-slate-600">
                  <span className="font-medium">{METODO_LABEL[metodo] || metodo}:</span> {fmt(valor)}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabela de pagamentos */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Carregando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Serviço</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Agendado</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Método</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Valor</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Pago em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagamentos.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.clienteNome}</td>
                  <td className="px-4 py-3 text-slate-600">{p.servicoNome}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{p.agendamentoData ? new Date(p.agendamentoData + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{METODO_LABEL[p.metodo] || p.metodo}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{fmt(p.valorTotal)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[p.status] || ''}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {p.pagoEm ? new Date(p.pagoEm).toLocaleString('pt-BR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagamentos.length === 0 && (
            <div className="text-center py-12 text-slate-400">Nenhum pagamento no período</div>
          )}
        </div>
      )}
    </div>
  );
}
