import { useState, useEffect } from 'react';
import { BadgeCheck } from 'lucide-react';
import * as api from '../api';

const STATUS_LABEL = {
  PENDENTE_PAGAMENTO: { label: 'Aguardando pagamento', className: 'bg-amber-50 text-amber-600' },
  EXPIRADA: { label: 'PIX não pago', className: 'bg-stone-700/60 text-stone-400' },
  ATIVA: { label: 'Ativa', className: 'bg-emerald-500/10 text-emerald-400' },
  CANCELADA: { label: 'Cancelada', className: 'bg-stone-800 text-stone-400' },
  INADIMPLENTE: { label: 'Vencida', className: 'bg-red-500/10 text-red-400' },
  TRIAL: { label: 'Trial', className: 'bg-gold-500/10 text-gold-400' },
};

export default function Assinaturas() {
  const [assinaturas, setAssinaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renovandoId, setRenovandoId] = useState(null);

  useEffect(() => { carregar(); }, []);

  function carregar() {
    setLoading(true);
    api.listarAssinaturas().then(setAssinaturas).finally(() => setLoading(false));
  }

  async function handleRenovar(id) {
    if (!confirm('Ativar/renovar essa assinatura por mais 30 dias? Use isso só quando o pagamento foi feito por fora (dinheiro/outro meio), fora do PIX.')) return;
    setRenovandoId(id);
    try {
      const atualizada = await api.renovarAssinatura(id);
      setAssinaturas(prev => prev.map(a => a.id === id ? atualizada : a));
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao renovar assinatura');
    } finally { setRenovandoId(null); }
  }

  const fmtData = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

  function diasRestantesLabel(a) {
    if (a.status === 'PENDENTE_PAGAMENTO') return '—';
    if (a.diasRestantes == null) return '—';
    if (a.diasRestantes < 0) return `Expirou há ${Math.abs(a.diasRestantes)} dia(s)`;
    if (a.diasRestantes === 0) return 'Expira hoje';
    return `${a.diasRestantes} dia(s)`;
  }

  if (loading) return <div className="p-6 text-center text-stone-500 py-16">Carregando...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-semibold text-stone-50 flex items-center gap-2">
          <BadgeCheck size={24} /> Assinaturas
        </h1>
        <p className="text-stone-400 text-sm mt-1">{assinaturas.length} assinante(s)</p>
      </div>

      <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-800/60 border-b border-stone-800">
            <tr>
              <th className="text-left px-4 py-3 text-stone-400 font-medium">Cliente</th>
              <th className="text-left px-4 py-3 text-stone-400 font-medium">Plano</th>
              <th className="text-left px-4 py-3 text-stone-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-stone-400 font-medium">Expira em</th>
              <th className="text-left px-4 py-3 text-stone-400 font-medium">Faltam</th>
              <th className="px-4 py-3 w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {assinaturas.map(a => {
              const status = STATUS_LABEL[a.status] || { label: a.status, className: 'bg-stone-800 text-stone-400' };
              return (
                <tr key={a.id} className="hover:bg-stone-800/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-50">{a.clienteNome}</p>
                    <p className="text-stone-500 text-xs">{a.clienteTel}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-300">{a.planoNome}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                  </td>
                  <td className="px-4 py-3 text-stone-300">{fmtData(a.expiraEm)}</td>
                  <td className="px-4 py-3 text-stone-300">{diasRestantesLabel(a)}</td>
                  <td className="px-4 py-3 text-right">
                    {a.status !== 'CANCELADA' && (() => {
                      const precisaAtivar = a.status === 'PENDENTE_PAGAMENTO' || a.status === 'EXPIRADA';
                      return (
                        <button onClick={() => handleRenovar(a.id)} disabled={renovandoId === a.id}
                          title={precisaAtivar ? 'Ativar manualmente (ex: pago em dinheiro)' : 'Renovar por mais 30 dias'}
                          className="px-2.5 py-1 text-xs bg-stone-800 text-stone-200 rounded-lg hover:bg-stone-700 disabled:opacity-50">
                          {renovandoId === a.id ? '...' : (precisaAtivar ? 'Ativar' : 'Renovar')}
                        </button>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {assinaturas.length === 0 && (
          <div className="text-center py-12 text-stone-500">Nenhuma assinatura ainda</div>
        )}
      </div>
    </div>
  );
}
