import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Scissors, User, Calendar, Clock, CheckCircle2, ChevronLeft, MapPin, Phone, Copy, Check, Search, XCircle } from 'lucide-react';
import * as api from '../../api/public';

const hoje = new Date().toISOString().split('T')[0];

const fmt = (v) => `R$ ${Number(v || 0).toFixed(2)}`;
const fmtHora = (h) => h ? h.slice(0, 5) : '';
const fmtDataExibicao = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : '';

function TermosDeUso({ percentual, janela }) {
  return (
    <details className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-xs text-slate-600">
      <summary className="cursor-pointer font-medium text-slate-700">Termos de uso e política de cancelamento</summary>
      <div className="mt-2 space-y-1.5">
        <p>Ao confirmar este agendamento, você concorda que:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Será cobrado um sinal de {percentual}% do valor do serviço para garantir seu horário.</li>
          <li>Cancelando com pelo menos {janela} hora(s) de antecedência, o sinal é devolvido integralmente.</li>
          <li>Cancelando com menos de {janela} hora(s) de antecedência, o sinal não é devolvido.</li>
          <li>Se a barbearia cancelar o agendamento, o sinal é sempre devolvido integralmente.</li>
          <li>Não comparecer sem cancelar previamente (no-show) também resulta na retenção do sinal.</li>
        </ul>
      </div>
    </details>
  );
}

function BuscaAgendamentos({ slug, onVoltar }) {
  const [telefone, setTelefone] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [buscou, setBuscou] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [erroBusca, setErroBusca] = useState('');
  const [modalCancelar, setModalCancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [erroCancelar, setErroCancelar] = useState('');

  async function buscar(e) {
    e.preventDefault();
    setBuscando(true);
    setErroBusca('');
    try {
      const dados = await api.buscarAgendamentosPorTelefone(slug, telefone);
      setResultados(dados);
      setBuscou(true);
    } catch {
      setErroBusca('Não foi possível buscar. Tente novamente.');
    } finally { setBuscando(false); }
  }

  async function confirmarCancelamento() {
    setCancelando(true);
    setErroCancelar('');
    try {
      await api.cancelarAgendamentoPublico(slug, modalCancelar.agendamento.id, telefone);
      setResultados(prev => prev.filter(r => r.agendamento.id !== modalCancelar.agendamento.id));
      setModalCancelar(null);
    } catch {
      setErroCancelar('Não foi possível cancelar. Tente novamente ou entre em contato com a barbearia.');
    } finally { setCancelando(false); }
  }

  return (
    <div className="space-y-4">
      <button onClick={onVoltar} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft size={16} /> Voltar
      </button>

      <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Search size={16} /> Consultar agendamento</h2>

      <form onSubmit={buscar} className="flex gap-2">
        <input
          className="input flex-1" required placeholder="(21) 99999-9999"
          value={telefone} onChange={e => setTelefone(e.target.value)}
        />
        <button type="submit" disabled={buscando} className="btn-primary shrink-0 disabled:opacity-50">
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {erroBusca && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{erroBusca}</p>}

      {buscou && resultados.length === 0 && !erroBusca && (
        <p className="text-slate-400 text-sm text-center py-8">Nenhum agendamento futuro encontrado para esse telefone.</p>
      )}

      <div className="space-y-3">
        {resultados.map(r => {
          const ag = r.agendamento;
          return (
            <div key={ag.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <p className="font-medium text-slate-800">{ag.servicoNome}</p>
              <p className="text-sm text-slate-500 capitalize">{fmtDataExibicao(ag.data)} · {fmtHora(ag.horaInicio)} – {fmtHora(ag.horaFim)}</p>
              {ag.profissionalNome && <p className="text-xs text-slate-400 mt-0.5">Profissional: {ag.profissionalNome}</p>}
              <p className="text-xs text-slate-400 mt-1">Status: {ag.status === 'PENDENTE' ? 'Aguardando confirmação' : 'Confirmado'}</p>
              <button
                onClick={() => setModalCancelar(r)}
                className="mt-3 flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium"
              >
                <XCircle size={16} /> Cancelar
              </button>
            </div>
          );
        })}
      </div>

      {modalCancelar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h3 className="font-bold text-slate-800 mb-2">Cancelar agendamento?</h3>
            <p className="text-sm text-slate-600 mb-4">
              {modalCancelar.reembolsavelSeCancelado
                ? 'O sinal pago será devolvido integralmente.'
                : 'Está muito próximo do horário marcado — o sinal pago não será devolvido.'}
            </p>
            {erroCancelar && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg mb-3">{erroCancelar}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setModalCancelar(null)} className="btn-ghost">Voltar</button>
              <button
                onClick={confirmarCancelamento}
                disabled={cancelando}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancelando ? 'Cancelando...' : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Agendar() {
  const { slug } = useParams();

  const [barbearia, setBarbearia] = useState(null);
  const [carregandoBarbearia, setCarregandoBarbearia] = useState(true);
  const [barbeariaNaoEncontrada, setBarbeariaNaoEncontrada] = useState(false);

  const [modo, setModo] = useState('agendar');
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
  const [metodoSinal, setMetodoSinal] = useState('PIX');
  const [termosAceitos, setTermosAceitos] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmado, setConfirmado] = useState(null);
  const [sinalResultado, setSinalResultado] = useState(null);

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

  const valorSinal = useMemo(() => {
    if (!servico || !barbearia?.sinalPercentual) return 0;
    return (servico.preco * barbearia.sinalPercentual) / 100;
  }, [servico, barbearia]);

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
    if (barbearia?.sinalObrigatorio && !termosAceitos) {
      setErro('Você precisa aceitar os termos de uso para continuar.');
      return;
    }
    setEnviando(true);
    setErro('');
    try {
      const resultado = await api.criarAgendamento(slug, {
        clienteNome,
        clienteTel,
        servicoId: servico.id,
        profissionalId: profissional?.id || null,
        data,
        horaInicio: slot.horaInicio,
        horaFim: slot.horaFim,
        observacao: observacao || null,
        metodoSinal: barbearia?.sinalObrigatorio ? metodoSinal : null,
      });
      setConfirmado(resultado.agendamento);
      setSinalResultado(resultado.sinal);
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível confirmar o agendamento. Tente novamente.');
    } finally { setEnviando(false); }
  }

  async function handleCopiarPix() {
    if (!sinalResultado?.pixCopiaECola) return;
    try {
      await navigator.clipboard.writeText(sinalResultado.pixCopiaECola);
    } catch {
      // clipboard indisponível — o código ainda pode ser copiado manualmente do campo
    }
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2000);
  }

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

          {sinalResultado && (
            <div className="text-left bg-blue-50 rounded-xl p-4 mt-4 space-y-2">
              <p className="text-sm font-semibold text-slate-800">Sinal: {fmt(sinalResultado.valorTotal)}</p>
              {sinalResultado.metodo === 'PIX' ? (
                <>
                  {sinalResultado.pixQrCodeBase64 && (
                    <img
                      src={`data:image/png;base64,${sinalResultado.pixQrCodeBase64}`}
                      alt="QR Code Pix"
                      className="w-40 h-40 mx-auto"
                    />
                  )}
                  <textarea readOnly className="input font-mono text-xs" rows={3} value={sinalResultado.pixCopiaECola || ''} />
                  <button
                    onClick={handleCopiarPix}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    {linkCopiado ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                    {linkCopiado ? 'Copiado!' : 'Copiar código Pix'}
                  </button>
                  <p className="text-xs text-slate-500">
                    Assim que o pagamento for identificado, o sinal será registrado automaticamente.
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-600">
                  Leve {fmt(sinalResultado.valorTotal)} em dinheiro no dia do atendimento como sinal.
                </p>
              )}
            </div>
          )}
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
        {modo === 'buscar' ? (
          <BuscaAgendamentos slug={slug} onVoltar={() => setModo('agendar')} />
        ) : (
          <>
            <div className="flex items-center gap-1.5 mb-3 px-1">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className={`h-1 flex-1 rounded-full ${n <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
              ))}
            </div>

            {step === 1 && (
              <button
                onClick={() => setModo('buscar')}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mb-3"
              >
                <Search size={14} /> Já tem um agendamento? Consultar ou cancelar
              </button>
            )}

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

                {barbearia?.sinalObrigatorio && (
                  <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Sinal para confirmar: {fmt(valorSinal)}
                    </p>
                    <div className="flex gap-2">
                      {['PIX', 'DINHEIRO'].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMetodoSinal(m)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            metodoSinal === m
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {m === 'PIX' ? 'Pix' : 'Dinheiro'}
                        </button>
                      ))}
                    </div>
                    <TermosDeUso percentual={barbearia.sinalPercentual} janela={barbearia.janelaCancelamentoHoras} />
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termosAceitos}
                        onChange={e => setTermosAceitos(e.target.checked)}
                        className="rounded mt-0.5"
                      />
                      <span className="text-xs text-slate-600">Li e concordo com os termos de uso e a política de cancelamento.</span>
                    </label>
                  </div>
                )}

                {erro && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{erro}</p>}

                <button type="submit" disabled={enviando} className="btn-primary w-full disabled:opacity-50">
                  {enviando ? 'Confirmando...' : 'Confirmar agendamento'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
