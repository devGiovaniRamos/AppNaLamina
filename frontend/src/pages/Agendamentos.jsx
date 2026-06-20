import { useState, useEffect } from 'react';
import { Plus, Calendar, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';

const STATUS_LABEL = { PENDENTE: 'Pendente', CONFIRMADO: 'Confirmado', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado' };
const STATUS_COLOR = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  CONFIRMADO: 'bg-blue-100 text-blue-800',
  CONCLUIDO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-gray-100 text-gray-500',
};

const hoje = new Date().toISOString().split('T')[0];

const formVazio = { clienteNome: '', clienteTel: '', servicoId: '', profissionalId: '', data: hoje, horaInicio: '', horaFim: '', observacao: '' };

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [dataFiltro, setDataFiltro] = useState(hoje);
  const [loading, setLoading] = useState(true);
  const [modalNovo, setModalNovo] = useState(false);
  const [modalPagamento, setModalPagamento] = useState(null);
  const [form, setForm] = useState(formVazio);
  const [metodo, setMetodo] = useState('DINHEIRO');
  const [pixData, setPixData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.listarAgendamentos(), api.listarServicos(), api.listarProfissionais()])
      .then(([ags, svcs, profs]) => { setAgendamentos(ags); setServicos(svcs); setProfissionais(profs); })
      .finally(() => setLoading(false));
  }, []);

  const filtrados = agendamentos
    .filter(a => a.data === dataFiltro)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  async function handleStatus(id, status) {
    try {
      await api.atualizarStatus(id, status);
      setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch { alert('Erro ao atualizar status'); }
  }

  async function handleCancelar(id) {
    if (!confirm('Cancelar este agendamento?')) return;
    try {
      await api.cancelarAgendamento(id);
      setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status: 'CANCELADO' } : a));
    } catch { alert('Erro ao cancelar'); }
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const novo = await api.criarAgendamento({ ...form, profissionalId: form.profissionalId || null, observacao: form.observacao || null });
      setAgendamentos(prev => [...prev, novo]);
      setModalNovo(false);
      setForm(formVazio);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar agendamento');
    } finally { setSaving(false); }
  }

  async function handlePagamento() {
    setSaving(true);
    setPixData(null);
    try {
      const result = await api.registrarPagamento(modalPagamento.id, { metodo });
      if (metodo === 'PIX' && result.pixCopiaECola) {
        setPixData(result);
      } else {
        setAgendamentos(prev => prev.map(a => a.id === modalPagamento.id ? { ...a, status: 'CONCLUIDO' } : a));
        setModalPagamento(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao registrar pagamento');
    } finally { setSaving(false); }
  }

  function fecharPagamento() {
    setModalPagamento(null);
    setPixData(null);
    setMetodo('DINHEIRO');
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agendamentos</h1>
          <p className="text-slate-500 text-sm mt-1">{filtrados.length} agendamento(s) no dia</p>
        </div>
        <button onClick={() => { setForm(formVazio); setError(''); setModalNovo(true); }} className="flex items-center gap-2 btn-primary">
          <Plus size={16} /> Novo agendamento
        </button>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <Calendar size={16} className="text-slate-400" />
        <input type="date" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Nenhum agendamento neste dia</div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(ag => (
            <div key={ag.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="text-center w-14">
                  <p className="font-semibold text-slate-800 text-sm">{ag.horaInicio}</p>
                  <p className="text-xs text-slate-400">{ag.horaFim}</p>
                </div>
                <div className="h-10 w-px bg-slate-100" />
                <div>
                  <p className="font-medium text-slate-800">{ag.clienteNome}</p>
                  <p className="text-sm text-slate-500">
                    {ag.servicoNome}{ag.profissionalNome ? ` · ${ag.profissionalNome}` : ''}
                  </p>
                  {ag.clienteTel && <p className="text-xs text-slate-400 mt-0.5">{ag.clienteTel}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[ag.status]}`}>
                  {STATUS_LABEL[ag.status]}
                </span>
                {ag.status === 'PENDENTE' && (
                  <button onClick={() => handleStatus(ag.id, 'CONFIRMADO')} title="Confirmar"
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                    <CheckCircle2 size={18} />
                  </button>
                )}
                {(ag.status === 'PENDENTE' || ag.status === 'CONFIRMADO') && (
                  <>
                    <button onClick={() => { setModalPagamento(ag); setPixData(null); setMetodo('DINHEIRO'); }} title="Registrar pagamento"
                      className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                      <CreditCard size={18} />
                    </button>
                    <button onClick={() => handleCancelar(ag.id)} title="Cancelar"
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <XCircle size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal novo agendamento */}
      <Modal open={modalNovo} onClose={() => setModalNovo(false)} title="Novo Agendamento">
        <form onSubmit={handleSalvar} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome do cliente *</label>
              <input className="input" required value={form.clienteNome} onChange={e => setForm({ ...form, clienteNome: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Telefone</label>
              <input className="input" value={form.clienteTel} onChange={e => setForm({ ...form, clienteTel: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Serviço *</label>
              <select className="input" required value={form.servicoId} onChange={e => setForm({ ...form, servicoId: e.target.value })}>
                <option value="">Selecione...</option>
                {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Profissional</label>
              <select className="input" value={form.profissionalId} onChange={e => setForm({ ...form, profissionalId: e.target.value })}>
                <option value="">Qualquer</option>
                {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Data *</label>
              <input type="date" className="input" required value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Início *</label>
              <input type="time" className="input" required value={form.horaInicio} onChange={e => setForm({ ...form, horaInicio: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fim *</label>
              <input type="time" className="input" required value={form.horaFim} onChange={e => setForm({ ...form, horaFim: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Observação</label>
            <textarea className="input" rows={2} value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModalNovo(false)} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Criar agendamento'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal pagamento */}
      <Modal open={!!modalPagamento} onClose={fecharPagamento} title="Registrar Pagamento">
        {modalPagamento && !pixData && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
              <p><span className="font-medium">Cliente:</span> {modalPagamento.clienteNome}</p>
              <p><span className="font-medium">Serviço:</span> {modalPagamento.servicoNome}</p>
              <p><span className="font-medium">Horário:</span> {modalPagamento.horaInicio} – {modalPagamento.horaFim}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Método de pagamento</label>
              <select className="input" value={metodo} onChange={e => setMetodo(e.target.value)}>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="PIX">PIX (via Pagar.me)</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={fecharPagamento} className="btn-ghost">Cancelar</button>
              <button onClick={handlePagamento} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {saving ? 'Processando...' : 'Confirmar pagamento'}
              </button>
            </div>
          </div>
        )}
        {pixData && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              PIX gerado! O agendamento será concluído automaticamente quando o pagamento for confirmado.
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Copia e Cola</label>
              <textarea readOnly className="input font-mono text-xs" rows={4} value={pixData.pixCopiaECola} />
            </div>
            {pixData.pixExpiraEm && (
              <p className="text-xs text-slate-400">Expira em: {new Date(pixData.pixExpiraEm).toLocaleString('pt-BR')}</p>
            )}
            <div className="flex justify-end">
              <button onClick={fecharPagamento} className="btn-primary">Fechar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
