import { useState, useEffect } from 'react';
import { TrendingUp, CreditCard, DollarSign, Hash, RefreshCw, Layers } from 'lucide-react';
import * as api from '../api';

const METODO_LABEL = { PIX: 'PIX', DINHEIRO: 'Dinheiro', CARTAO_CREDITO: 'Crédito', CARTAO_DEBITO: 'Débito' };

const TIPO_LABEL = { AGENDAMENTO: 'Agendamento', VENDA: 'Venda (PDV)', ASSINATURA: 'Mensalidade' };
const TIPO_COLOR = {
  AGENDAMENTO: 'bg-blue-100 text-blue-700',
  VENDA: 'bg-purple-100 text-purple-700',
  ASSINATURA: 'bg-teal-100 text-teal-700',
};

const STATUS_LABEL = {
  PAGO: 'Pago', PENDENTE: 'Pendente', CANCELADO: 'Cancelado', EXPIRADO: 'Expirado',
  CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada',
  ATIVA: 'Ativa', PENDENTE_PAGAMENTO: 'Pendente', EXPIRADA: 'Expirada', INADIMPLENTE: 'Inadimplente', TRIAL: 'Trial',
};
const STATUS_COLOR = {
  PAGO: 'bg-green-100 text-green-800',
  CONCLUIDA: 'bg-green-100 text-green-800',
  ATIVA: 'bg-green-100 text-green-800',
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  PENDENTE_PAGAMENTO: 'bg-yellow-100 text-yellow-800',
  CANCELADO: 'bg-gray-100 text-gray-500',
  CANCELADA: 'bg-gray-100 text-gray-500',
  EXPIRADO: 'bg-gray-100 text-gray-500',
  EXPIRADA: 'bg-gray-100 text-gray-500',
  INADIMPLENTE: 'bg-red-100 text-red-700',
  TRIAL: 'bg-blue-100 text-blue-700',
};

const hoje = new Date().toISOString().split('T')[0];
const primeiroDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

export default function Financeiro() {
  const [movimentos, setMovimentos] = useState([]);
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
      const [movs, rel] = await Promise.all([
        api.listarFinanceiro(params),
        api.relatorioFinanceiro(params),
      ]);
      setMovimentos(movs);
      setRelatorio(rel);
    } finally { setLoading(false); }
  }

  const fmt = (v) => `R$ ${Number(v || 0).toFixed(2)}`;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financeiro</h1>
          <p className="text-slate-500 text-sm mt-1">Toda a movimentação financeira · agendamentos, vendas do PDV e mensalidades</p>
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <DollarSign size={14} /> Total faturado
            </div>
            <p className="text-xl font-bold text-slate-800">{fmt(relatorio.totalFaturado)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <Hash size={14} /> Qtd. movimentações
            </div>
            <p className="text-xl font-bold text-slate-800">{relatorio.quantidadeMovimentos}</p>
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
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <Layers size={14} /> Por origem
            </div>
            <div className="space-y-0.5 mt-1">
              {relatorio.porTipo && Object.entries(relatorio.porTipo).map(([tipo, valor]) => (
                <p key={tipo} className="text-xs text-slate-600">
                  <span className="font-medium">{TIPO_LABEL[tipo] || tipo}:</span> {fmt(valor)}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabela de movimentações */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Carregando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Origem</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Descrição</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Método</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Valor</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {movimentos.map(m => (
                <tr key={`${m.tipo}-${m.id}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_COLOR[m.tipo] || 'bg-slate-100 text-slate-600'}`}>
                      {TIPO_LABEL[m.tipo] || m.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.clienteNome}</td>
                  <td className="px-4 py-3 text-slate-600">{m.descricao}</td>
                  <td className="px-4 py-3 text-slate-600">{m.metodo ? (METODO_LABEL[m.metodo] || m.metodo) : '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{fmt(m.valor)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[m.status] || ''}`}>{STATUS_LABEL[m.status] || m.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {m.data ? new Date(m.data).toLocaleString('pt-BR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {movimentos.length === 0 && (
            <div className="text-center py-12 text-slate-400">Nenhuma movimentação no período</div>
          )}
        </div>
      )}
    </div>
  );
}
