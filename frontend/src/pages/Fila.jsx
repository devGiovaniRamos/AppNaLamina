import { useState, useEffect, useCallback } from 'react';
import { Ticket, Plus } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';

const INTERVALO_POLLING_MS = 20000;

const STATUS_LABEL = {
  AGUARDANDO: { label: 'Aguardando', className: 'bg-amber-50 text-amber-600' },
  EM_ATENDIMENTO: { label: 'Em atendimento', className: 'bg-gold-500/10 text-gold-400' },
};

const formVazio = { clienteNome: '', clienteTel: '', servicoId: '' };

export default function Fila() {
  const [fila, setFila] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState(null);

  const [servicos, setServicos] = useState([]);
  const [modalNovo, setModalNovo] = useState(false);
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(() => {
    api.listarFila().then(setFila).catch(() => {});
  }, []);

  useEffect(() => {
    carregar();
    api.listarServicos().then(setServicos).catch(() => {});
    setLoading(false);
    const intervalo = setInterval(carregar, INTERVALO_POLLING_MS);
    return () => clearInterval(intervalo);
  }, [carregar]);

  function abrirNovo() {
    setForm(formVazio);
    setErro('');
    setModalNovo(true);
  }

  async function handleSalvarNovo(e) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      const novo = await api.entrarNaFilaAdmin(form);
      setFila(prev => [...prev, novo]);
      setModalNovo(false);
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao incluir na fila');
    } finally { setSalvando(false); }
  }

  async function handleChamar(id) {
    setProcessandoId(id);
    try {
      const atualizado = await api.chamarDaFila(id);
      setFila(prev => prev.map(t => t.id === id ? atualizado : t));
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao chamar cliente');
    } finally { setProcessandoId(null); }
  }

  async function handleFinalizar(id) {
    setProcessandoId(id);
    try {
      await api.finalizarFila(id);
      setFila(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao finalizar atendimento');
    } finally { setProcessandoId(null); }
  }

  async function handleRemover(id) {
    if (!confirm('Remover esse ticket da fila? Use se o cliente desistiu ou não apareceu.')) return;
    setProcessandoId(id);
    try {
      await api.removerDaFila(id);
      setFila(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao remover da fila');
    } finally { setProcessandoId(null); }
  }

  const fmtHora = (d) => d ? new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

  if (loading) return <div className="p-6 text-center text-stone-500 py-16">Carregando...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-stone-50 flex items-center gap-2">
            <Ticket size={24} /> Fila de Espera
          </h1>
          <p className="text-stone-400 text-sm mt-1">{fila.length} na fila agora</p>
        </div>
        <button onClick={abrirNovo} className="flex items-center gap-2 btn-primary">
          <Plus size={16} /> Incluir na fila
        </button>
      </div>

      <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-800/60 border-b border-stone-800">
            <tr>
              <th className="text-left px-4 py-3 text-stone-400 font-medium w-20">Senha</th>
              <th className="text-left px-4 py-3 text-stone-400 font-medium">Cliente</th>
              <th className="text-left px-4 py-3 text-stone-400 font-medium">Serviço</th>
              <th className="text-left px-4 py-3 text-stone-400 font-medium">Entrou às</th>
              <th className="text-left px-4 py-3 text-stone-400 font-medium">Status</th>
              <th className="px-4 py-3 w-56"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {fila.map(t => {
              const status = STATUS_LABEL[t.status] || { label: t.status, className: 'bg-stone-800 text-stone-400' };
              const processando = processandoId === t.id;
              return (
                <tr key={t.id} className="hover:bg-stone-800/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-stone-50">#{t.numeroTicket}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-50">{t.clienteNome}</p>
                    <p className="text-stone-500 text-xs">{t.clienteTel}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-300">{t.servicoNome}</td>
                  <td className="px-4 py-3 text-stone-400">{fmtHora(t.criadoEm)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5">
                    {t.status === 'AGUARDANDO' && (
                      <button onClick={() => handleChamar(t.id)} disabled={processando}
                        className="px-2.5 py-1 text-xs bg-gold-500/10 text-gold-400 rounded-lg hover:bg-gold-500/15 disabled:opacity-50">
                        Chamar
                      </button>
                    )}
                    <button onClick={() => handleFinalizar(t.id)} disabled={processando}
                      className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/15 disabled:opacity-50">
                      Finalizar
                    </button>
                    <button onClick={() => handleRemover(t.id)} disabled={processando}
                      className="px-2.5 py-1 text-xs bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/15 disabled:opacity-50">
                      Remover
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {fila.length === 0 && (
          <div className="text-center py-12 text-stone-500">Ninguém na fila no momento</div>
        )}
      </div>

      <Modal open={modalNovo} onClose={() => setModalNovo(false)} title="Incluir na fila">
        <form onSubmit={handleSalvarNovo} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-200 mb-1">Nome *</label>
            <input className="input" required value={form.clienteNome} onChange={e => setForm({ ...form, clienteNome: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-200 mb-1">Telefone *</label>
            <input className="input" required placeholder="(21) 99999-9999" value={form.clienteTel} onChange={e => setForm({ ...form, clienteTel: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-200 mb-1">Serviço *</label>
            <select className="input" required value={form.servicoId} onChange={e => setForm({ ...form, servicoId: e.target.value })}>
              <option value="">Selecione...</option>
              {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          {erro && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">{erro}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModalNovo(false)} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={salvando} className="btn-primary">{salvando ? 'Salvando...' : 'Incluir'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
