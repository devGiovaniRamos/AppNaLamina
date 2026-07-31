import { useState, useEffect } from 'react';
import { TrendingUp, CreditCard, DollarSign, Hash, RefreshCw, Layers } from 'lucide-react';
import * as api from '../api';

const METODO_LABEL = { PIX: 'PIX', DINHEIRO: 'Dinheiro', CARTAO_CREDITO: 'Crédito', CARTAO_DEBITO: 'Débito' };

const TIPO_LABEL = { AGENDAMENTO: 'Agendamento', VENDA: 'Venda (PDV)', ASSINATURA: 'Mensalidade' };
const TIPO_COLOR = {
  AGENDAMENTO: 'bg-gold-500/15 text-gold-400',
  VENDA: 'bg-purple-500/15 text-purple-400',
  ASSINATURA: 'bg-teal-500/15 text-teal-400',
};

const STATUS_LABEL = {
  PAGO: 'Pago', PENDENTE: 'Pendente', CANCELADO: 'Cancelado', EXPIRADO: 'Expirado',
  CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada',
  ATIVA: 'Ativa', PENDENTE_PAGAMENTO: 'Pendente', EXPIRADA: 'Expirada', INADIMPLENTE: 'Inadimplente', TRIAL: 'Trial',
};
const STATUS_COLOR = {
  PAGO: 'bg-emerald-500/15 text-emerald-400',
  CONCLUIDA: 'bg-emerald-500/15 text-emerald-400',
  ATIVA: 'bg-emerald-500/15 text-emerald-400',
  PENDENTE: 'bg-amber-500/15 text-amber-400',
  PENDENTE_PAGAMENTO: 'bg-amber-500/15 text-amber-400',
  CANCELADO: 'bg-stone-700/60 text-stone-400',
  CANCELADA: 'bg-stone-700/60 text-stone-400',
  EXPIRADO: 'bg-stone-700/60 text-stone-400',
  EXPIRADA: 'bg-stone-700/60 text-stone-400',
  INADIMPLENTE: 'bg-red-500/15 text-red-400',
  TRIAL: 'bg-gold-500/15 text-gold-400',
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
          <h1 className="text-2xl font-serif font-semibold text-stone-50">Financeiro</h1>
          <p className="text-stone-400 text-sm mt-1">Toda a movimentação financeira · agendamentos, vendas do PDV e mensalidades</p>
        </div>
        <button onClick={carregar} disabled={loading} className="flex items-center gap-2 px-3 py-2 text-sm text-stone-300 bg-stone-900 border border-stone-700 rounded-lg hover:bg-stone-800/60 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Filtro de data */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-stone-400">Período:</span>
        <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
          className="border border-stone-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" />
        <span className="text-stone-500">–</span>
        <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
          className="border border-stone-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" />
      </div>

      {/* Cards de relatório */}
      {relatorio && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-4">
            <div className="flex items-center gap-2 label-caps mb-2">
              <DollarSign size={14} /> Total faturado
            </div>
            <p className="text-xl font-bold text-stone-50">{fmt(relatorio.totalFaturado)}</p>
          </div>
          <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-4">
            <div className="flex items-center gap-2 label-caps mb-2">
              <Hash size={14} /> Qtd. movimentações
            </div>
            <p className="text-xl font-bold text-stone-50">{relatorio.quantidadeMovimentos}</p>
          </div>
          <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-4">
            <div className="flex items-center gap-2 label-caps mb-2">
              <TrendingUp size={14} /> Ticket médio
            </div>
            <p className="text-xl font-bold text-stone-50">{fmt(relatorio.ticketMedio)}</p>
          </div>
          <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-4">
            <div className="flex items-center gap-2 label-caps mb-2">
              <CreditCard size={14} /> Por método
            </div>
            <div className="space-y-0.5 mt-1">
              {relatorio.porMetodo && Object.entries(relatorio.porMetodo).map(([metodo, valor]) => (
                <p key={metodo} className="text-xs text-stone-300">
                  <span className="font-medium">{METODO_LABEL[metodo] || metodo}:</span> {fmt(valor)}
                </p>
              ))}
            </div>
          </div>
          <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-4">
            <div className="flex items-center gap-2 label-caps mb-2">
              <Layers size={14} /> Por origem
            </div>
            <div className="space-y-0.5 mt-1">
              {relatorio.porTipo && Object.entries(relatorio.porTipo).map(([tipo, valor]) => (
                <p key={tipo} className="text-xs text-stone-300">
                  <span className="font-medium">{TIPO_LABEL[tipo] || tipo}:</span> {fmt(valor)}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabela de movimentações */}
      {loading ? (
        <div className="text-center py-16 text-stone-500">Carregando...</div>
      ) : (
        <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-800/60 border-b border-stone-800">
              <tr>
                <th className="text-left px-4 py-3 text-stone-400 font-medium">Origem</th>
                <th className="text-left px-4 py-3 text-stone-400 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 text-stone-400 font-medium">Descrição</th>
                <th className="text-left px-4 py-3 text-stone-400 font-medium">Método</th>
                <th className="text-left px-4 py-3 text-stone-400 font-medium">Valor</th>
                <th className="text-left px-4 py-3 text-stone-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-stone-400 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {movimentos.map(m => (
                <tr key={`${m.tipo}-${m.id}`} className="hover:bg-stone-800/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_COLOR[m.tipo] || 'bg-stone-800 text-stone-300'}`}>
                      {TIPO_LABEL[m.tipo] || m.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-50">{m.clienteNome}</td>
                  <td className="px-4 py-3 text-stone-300">{m.descricao}</td>
                  <td className="px-4 py-3 text-stone-300">{m.metodo ? (METODO_LABEL[m.metodo] || m.metodo) : '—'}</td>
                  <td className="px-4 py-3 font-medium text-stone-50">{fmt(m.valor)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[m.status] || ''}`}>{STATUS_LABEL[m.status] || m.status}</span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">
                    {m.data ? new Date(m.data).toLocaleString('pt-BR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {movimentos.length === 0 && (
            <div className="text-center py-12 text-stone-500">Nenhuma movimentação no período</div>
          )}
        </div>
      )}
    </div>
  );
}
