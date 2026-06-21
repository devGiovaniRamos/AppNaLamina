import { useState, useEffect, useMemo } from 'react';
import { Plus, Calendar, CheckCircle2, XCircle, CreditCard, Clock, CheckCheck } from 'lucide-react';
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

// — helpers de slots —

function timeToMin(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minToTime(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

function gerarSlots(horarioDia, duracao) {
  if (!horarioDia?.aberto || !duracao) return [];
  const slots = [];
  const turnos = [
    { inicio: horarioDia.horaInicio1, fim: horarioDia.horaFim1 },
    { inicio: horarioDia.horaInicio2, fim: horarioDia.horaFim2 },
  ];
  for (const { inicio, fim } of turnos) {
    if (!inicio || !fim) continue;
    const fimMin = timeToMin(fim);
    let cur = timeToMin(inicio);
    while (cur + duracao <= fimMin) {
      slots.push({ inicio: minToTime(cur), fim: minToTime(cur + duracao) });
      cur += duracao;
    }
  }
  return slots;
}

function slotOcupado(slot, agendamentos, profissionalId) {
  return agendamentos.some(ag => {
    if (ag.status === 'CANCELADO') return false;
    if (profissionalId && ag.profissionalId !== profissionalId) return false;
    return ag.horaInicio < slot.fim && ag.horaFim > slot.inicio;
  });
}

// — grade de horários —

function SlotPicker({ slots, selected, agendamentos, profissionalId, onSelect }) {
  if (slots === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-50 rounded-lg p-3">
        <Clock size={14} />
        Selecione um serviço para ver os horários disponíveis
      </div>
    );
  }
  if (slots.length === 0) {
    return (
      <div className="text-sm text-slate-400 bg-slate-50 rounded-lg p-3">
        Este dia não possui horários disponíveis
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {slots.map(slot => {
        const ocupado = slotOcupado(slot, agendamentos, profissionalId);
        const ativo = selected === slot.inicio;
        return (
          <button
            key={slot.inicio}
            type="button"
            disabled={ocupado}
            onClick={() => onSelect(slot)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors
              ${ocupado
                ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                : ativo
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
              }`}
          >
            {slot.inicio}
          </button>
        );
      })}
    </div>
  );
}

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [pagamentosMap, setPagamentosMap] = useState({});
  const [servicos, setServicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [barbearia, setBarbearia] = useState(null);
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
    Promise.all([
      api.listarAgendamentos(),
      api.listarServicos(),
      api.listarProfissionais(),
      api.getBarbearia(),
      api.listarPagamentos(),
    ]).then(([ags, svcs, profs, barb, pags]) => {
      setAgendamentos(ags);
      setServicos(svcs);
      setProfissionais(profs);
      setBarbearia(barb);
      const map = {};
      pags.forEach(p => { map[p.agendamentoId] = p; });
      setPagamentosMap(map);
    }).finally(() => setLoading(false));
  }, []);

  const filtrados = agendamentos
    .filter(a => a.data === dataFiltro)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  // slots para o modal de novo agendamento
  const slots = useMemo(() => {
    if (!barbearia?.horarios || !form.servicoId) return null;
    const servico = servicos.find(s => s.id === form.servicoId);
    if (!servico) return null;
    const diaSemana = new Date(form.data + 'T12:00:00').getDay();
    const horarioDia = barbearia.horarios.find(h => h.diaSemana === diaSemana);
    return gerarSlots(horarioDia, servico.duracaoMin);
  }, [barbearia, form.servicoId, form.data, servicos]);

  const agendamentosDoDia = useMemo(
    () => agendamentos.filter(a => a.data === form.data),
    [agendamentos, form.data]
  );

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
    if (!form.horaInicio) { setError('Selecione um horário disponível'); return; }
    setSaving(true);
    setError('');
    try {
      const novo = await api.criarAgendamento({
        ...form,
        profissionalId: form.profissionalId || null,
        observacao: form.observacao || null,
      });
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
        setPagamentosMap(prev => ({ ...prev, [result.agendamentoId]: result }));
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
        <button
          onClick={() => { setForm(formVazio); setError(''); setModalNovo(true); }}
          className="flex items-center gap-2 btn-primary"
        >
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
          {filtrados.map(ag => {
            const pag = pagamentosMap[ag.id];
            const ativo = ag.status === 'PENDENTE' || ag.status === 'CONFIRMADO';
            return (
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
                  {/* status do serviço */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[ag.status]}`}>
                    {STATUS_LABEL[ag.status]}
                  </span>

                  {/* status do pagamento */}
                  {pag && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${pag.status === 'PAGO' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {pag.status === 'PAGO' ? 'Pago' : 'Pag. pendente'}
                    </span>
                  )}

                  {/* confirmar PENDENTE → CONFIRMADO */}
                  {ag.status === 'PENDENTE' && (
                    <button onClick={() => handleStatus(ag.id, 'CONFIRMADO')} title="Confirmar"
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                      <CheckCircle2 size={18} />
                    </button>
                  )}

                  {/* concluir serviço */}
                  {ativo && (
                    <button onClick={() => handleStatus(ag.id, 'CONCLUIDO')} title="Concluir serviço"
                      className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors">
                      <CheckCheck size={18} />
                    </button>
                  )}

                  {/* registrar pagamento (só se ainda não tem pagamento) */}
                  {ativo && !pag && (
                    <button
                      onClick={() => { setModalPagamento(ag); setPixData(null); setMetodo('DINHEIRO'); }}
                      title="Registrar pagamento"
                      className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <CreditCard size={18} />
                    </button>
                  )}

                  {/* cancelar */}
                  {ativo && (
                    <button onClick={() => handleCancelar(ag.id)} title="Cancelar"
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Telefone *</label>
              <input
                className="input"
                required
                value={form.clienteTel}
                onChange={e => setForm({ ...form, clienteTel: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Serviço *</label>
              <select
                className="input"
                required
                value={form.servicoId}
                onChange={e => setForm({ ...form, servicoId: e.target.value, horaInicio: '', horaFim: '' })}
              >
                <option value="">Selecione...</option>
                {servicos.map(s => <option key={s.id} value={s.id}>{s.nome} ({s.duracaoMin} min)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Profissional</label>
              <select
                className="input"
                value={form.profissionalId}
                onChange={e => setForm({ ...form, profissionalId: e.target.value, horaInicio: '', horaFim: '' })}
              >
                <option value="">Qualquer</option>
                {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Data *</label>
            <input
              type="date"
              className="input w-40"
              required
              value={form.data}
              onChange={e => setForm({ ...form, data: e.target.value, horaInicio: '', horaFim: '' })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Horário disponível *
              {form.horaInicio && (
                <span className="ml-2 text-blue-600 font-semibold">{form.horaInicio} – {form.horaFim}</span>
              )}
            </label>
            <SlotPicker
              slots={slots}
              selected={form.horaInicio}
              agendamentos={agendamentosDoDia}
              profissionalId={form.profissionalId || null}
              onSelect={slot => setForm(prev => ({ ...prev, horaInicio: slot.inicio, horaFim: slot.fim }))}
            />
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
