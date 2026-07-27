import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Scissors, User, Calendar, Clock, CheckCircle2, ChevronLeft, MapPin, Phone } from 'lucide-react';
import * as api from '../../api/public';

const hoje = new Date().toISOString().split('T')[0];

export default function Agendar() {
  const { slug } = useParams();

  const [barbearia, setBarbearia] = useState(null);
  const [carregandoBarbearia, setCarregandoBarbearia] = useState(true);
  const [barbeariaNaoEncontrada, setBarbeariaNaoEncontrada] = useState(false);

  const [step, setStep] = useState(1);

  const [servicos, setServicos] = useState([]);
  const [servico, setServico] = useState(null);

  const [profissionais, setProfissionais] = useState([]);
  const [profissional, setProfissional] = useState(null);

  const [data, setData] = useState(hoje);
  const [slots, setSlots] = useState([]);
  const [carregandoSlots, setCarregandoSlots] = useState(false);
  const [slot, setSlot] = useState(null);

  const [clienteNome, setClienteNome] = useState('');
  const [clienteTel, setClienteTel] = useState('');
  const [observacao, setObservacao] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmado, setConfirmado] = useState(null);

  useEffect(() => {
    api.getBarbearia(slug)
      .then(setBarbearia)
      .catch(() => setBarbeariaNaoEncontrada(true))
      .finally(() => setCarregandoBarbearia(false));
    api.listarServicos(slug).then(setServicos).catch(() => {});
    api.listarProfissionais(slug).then(setProfissionais).catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!servico || !data) { setSlots([]); return; }
    setCarregandoSlots(true);
    setSlot(null);
    api.listarSlots(slug, data, servico.id)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setCarregandoSlots(false));
  }, [slug, servico, data]);

  function escolherServico(s) {
    setServico(s);
    setStep(2);
  }

  function escolherProfissional(p) {
    setProfissional(p);
    setStep(3);
  }

  function voltar() {
    setErro('');
    setStep(s => Math.max(1, s - 1));
  }

  async function confirmar(e) {
    e.preventDefault();
    setEnviando(true);
    setErro('');
    try {
      const agendamento = await api.criarAgendamento(slug, {
        clienteNome,
        clienteTel,
        servicoId: servico.id,
        profissionalId: profissional?.id || null,
        data,
        horaInicio: slot.horaInicio,
        horaFim: slot.horaFim,
        observacao: observacao || null,
      });
      setConfirmado(agendamento);
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível confirmar o agendamento. Tente novamente.');
    } finally { setEnviando(false); }
  }

  const fmt = (v) => `R$ ${Number(v || 0).toFixed(2)}`;
  const fmtHora = (h) => h ? h.slice(0, 5) : '';
  const fmtDataExibicao = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : '';

  if (carregandoBarbearia) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Carregando...</div>;
  }

  if (barbeariaNaoEncontrada) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Barbearia não encontrada</h1>
          <p className="text-slate-500 text-sm">Verifique se o link está correto.</p>
        </div>
      </div>
    );
  }

  if (confirmado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-slate-800 mb-1">Agendamento confirmado!</h1>
          <p className="text-slate-500 text-sm mb-6">Anote os detalhes abaixo.</p>
          <div className="text-left bg-slate-50 rounded-xl p-4 space-y-1.5 text-sm">
            <p><span className="text-slate-400">Barbearia:</span> <span className="font-medium text-slate-800">{barbearia.nome}</span></p>
            <p><span className="text-slate-400">Serviço:</span> <span className="font-medium text-slate-800">{servico.nome}</span></p>
            <p><span className="text-slate-400">Data:</span> <span className="font-medium text-slate-800 capitalize">{fmtDataExibicao(data)}</span></p>
            <p><span className="text-slate-400">Horário:</span> <span className="font-medium text-slate-800">{fmtHora(slot.horaInicio)} – {fmtHora(slot.horaFim)}</span></p>
            {profissional && <p><span className="text-slate-400">Profissional:</span> <span className="font-medium text-slate-800">{profissional.nome}</span></p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-5">
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Scissors size={20} /> {barbearia?.nome}
        </h1>
        {barbearia?.endereco && (
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin size={12} /> {barbearia.endereco}</p>
        )}
        {barbearia?.telefone && (
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Phone size={12} /> {barbearia.telefone}</p>
        )}
      </header>

      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center gap-1.5 mb-5 px-1">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className={`h-1 flex-1 rounded-full ${n <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
          ))}
        </div>

        {step > 1 && (
          <button onClick={voltar} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3">
            <ChevronLeft size={16} /> Voltar
          </button>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-800 mb-2">Escolha o serviço</h2>
            {servicos.map(s => (
              <button key={s.id} onClick={() => escolherServico(s)}
                className="w-full text-left bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{s.nome}</span>
                  <span className="font-semibold text-slate-800">{fmt(s.preco)}</span>
                </div>
                {s.descricao && <p className="text-xs text-slate-400 mt-1">{s.descricao}</p>}
                <p className="text-xs text-slate-400 mt-1">{s.duracaoMin} min</p>
              </button>
            ))}
            {servicos.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Nenhum serviço disponível no momento.</p>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><User size={16} /> Escolha o profissional</h2>
            <button onClick={() => escolherProfissional(null)}
              className="w-full text-left bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:border-blue-300 transition-colors font-medium text-slate-700">
              Sem preferência
            </button>
            {profissionais.map(p => (
              <button key={p.id} onClick={() => escolherProfissional(p)}
                className="w-full text-left bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:border-blue-300 transition-colors flex items-center gap-3">
                {p.fotoUrl ? (
                  <img src={p.fotoUrl} alt={p.nome} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User size={18} /></div>
                )}
                <span className="font-medium text-slate-800">{p.nome}</span>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Calendar size={16} /> Escolha data e horário</h2>
            <input type="date" min={hoje} value={data} onChange={e => setData(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

            {carregandoSlots ? (
              <p className="text-slate-400 text-sm text-center py-6">Buscando horários...</p>
            ) : slots.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">Nenhum horário disponível nesta data.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map(s => (
                  <button key={s.horaInicio}
                    onClick={() => setSlot(s)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      slot?.horaInicio === s.horaInicio
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                    }`}>
                    {fmtHora(s.horaInicio)}
                  </button>
                ))}
              </div>
            )}

            <button disabled={!slot} onClick={() => setStep(4)}
              className="btn-primary w-full disabled:opacity-50">
              Continuar
            </button>
          </div>
        )}

        {step === 4 && (
          <form onSubmit={confirmar} className="space-y-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Clock size={16} /> Seus dados</h2>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-sm space-y-1">
              <p><span className="text-slate-400">Serviço:</span> {servico.nome}</p>
              <p><span className="text-slate-400">Data:</span> <span className="capitalize">{fmtDataExibicao(data)}</span></p>
              <p><span className="text-slate-400">Horário:</span> {fmtHora(slot.horaInicio)} – {fmtHora(slot.horaFim)}</p>
              {profissional && <p><span className="text-slate-400">Profissional:</span> {profissional.nome}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome *</label>
              <input className="input" required value={clienteNome} onChange={e => setClienteNome(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Telefone *</label>
              <input className="input" required placeholder="(21) 99999-9999" value={clienteTel} onChange={e => setClienteTel(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Observação (opcional)</label>
              <textarea className="input" rows={2} value={observacao} onChange={e => setObservacao(e.target.value)} />
            </div>

            {erro && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{erro}</p>}

            <button type="submit" disabled={enviando} className="btn-primary w-full disabled:opacity-50">
              {enviando ? 'Confirmando...' : 'Confirmar agendamento'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
