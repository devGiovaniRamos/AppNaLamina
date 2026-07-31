import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Scissors, User, Calendar, Clock, CheckCircle2, ChevronLeft, MapPin, Phone, BadgeCheck, Ticket } from 'lucide-react';
import * as api from '../../api/public';

const hoje = new Date().toISOString().split('T')[0];

export default function Agendar() {
  const { slug } = useParams();

  const [barbearia, setBarbearia] = useState(null);
  const [carregandoBarbearia, setCarregandoBarbearia] = useState(true);
  const [barbeariaNaoEncontrada, setBarbeariaNaoEncontrada] = useState(false);

  // modo: 'identificacao' -> 'decisao' -> 'agendamento' | 'assinatura'
  const [modo, setModo] = useState('identificacao');
  // identStep (só dentro de 'identificacao'): 'telefone' -> 'nome' (só se for telefone novo)
  const [identStep, setIdentStep] = useState('telefone');

  const [clienteNome, setClienteNome] = useState('');
  const [clienteTel, setClienteTel] = useState('');
  const [telefoneInput, setTelefoneInput] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [erroIdentificacao, setErroIdentificacao] = useState('');
  const [saudacao, setSaudacao] = useState('');
  const [statusAssinante, setStatusAssinante] = useState(null);
  const [planosAtivos, setPlanosAtivos] = useState([]);

  const [planoEscolhido, setPlanoEscolhido] = useState(null);
  const [assinando, setAssinando] = useState(false);
  const [erroAssinatura, setErroAssinatura] = useState('');
  const [assinaturaCriada, setAssinaturaCriada] = useState(null);

  const [filaAtiva, setFilaAtiva] = useState(null);
  const [filaConcluida, setFilaConcluida] = useState(false);
  const [entrandoFila, setEntrandoFila] = useState(false);
  const [erroFila, setErroFila] = useState('');

  const [step, setStep] = useState(1);

  const [servicos, setServicos] = useState([]);
  const [servico, setServico] = useState(null);

  const [profissionais, setProfissionais] = useState([]);
  const [profissional, setProfissional] = useState(null);

  const [data, setData] = useState(hoje);
  const [slots, setSlots] = useState([]);
  const [carregandoSlots, setCarregandoSlots] = useState(false);
  const [slot, setSlot] = useState(null);

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

  async function handleTelefoneSubmit(e) {
    e.preventDefault();
    setVerificando(true);
    setErroIdentificacao('');
    try {
      const cliente = await api.identificarCliente(slug, telefoneInput);
      setClienteTel(cliente.telefoneNormalizado);

      if (cliente.conhecido) {
        setClienteNome(cliente.nome);
        setSaudacao(`Bem-vindo de volta, ${cliente.nome}! 👋`);
        await continuarAposIdentificacao(cliente.telefoneNormalizado);
      } else {
        setIdentStep('nome');
      }
    } catch (err) {
      setErroIdentificacao(err.response?.data?.message || 'Telefone inválido. Confira e tente novamente.');
    } finally { setVerificando(false); }
  }

  async function handleNomeSubmit(e) {
    e.preventDefault();
    setVerificando(true);
    setErroIdentificacao('');
    try {
      setSaudacao(`Bem-vindo, ${clienteNome}! Prazer em te conhecer. 👋`);
      await continuarAposIdentificacao(clienteTel);
    } finally { setVerificando(false); }
  }

  async function continuarAposIdentificacao(telefoneNormalizado) {
    try {
      const ticket = await api.statusFila(slug, telefoneNormalizado);
      if (ticket) {
        setFilaAtiva(ticket);
        setModo('fila');
        return;
      }

      const status = await api.assinaturaStatus(slug, telefoneNormalizado);
      setStatusAssinante(status);

      const planos = await api.listarPlanos(slug);
      setPlanosAtivos(planos);

      setModo('decisao');
    } catch (err) {
      setErroIdentificacao(err.response?.data?.message || 'Não foi possível continuar. Tente novamente.');
    }
  }

  function iniciarAgendamento() {
    setModo('agendamento');
    setStep(1);
  }

  function voltarParaIdentificacao() {
    setModo('identificacao');
    setIdentStep('telefone');
    setSaudacao('');
    setErroIdentificacao('');
  }

  function iniciarAssinatura() {
    setPlanoEscolhido(null);
    setErroAssinatura('');
    setModo('assinatura');
  }

  function iniciarFila() {
    setFilaAtiva(null);
    setFilaConcluida(false);
    setErroFila('');
    setModo('fila');
  }

  async function handleEntrarNaFila(s) {
    setEntrandoFila(true);
    setErroFila('');
    try {
      const ticket = await api.entrarNaFila(slug, { servicoId: s.id, clienteNome, clienteTel });
      setFilaAtiva(ticket);
    } catch (err) {
      setErroFila(err.response?.data?.message || 'Não foi possível entrar na fila. Tente novamente.');
    } finally { setEntrandoFila(false); }
  }

  async function handleSairDaFila() {
    if (!confirm('Sair da fila de espera?')) return;
    try {
      await api.sairDaFila(slug, filaAtiva.id, clienteTel);
    } catch {
      // mesmo se der erro de rede aqui, tira o cliente da tela de espera — ele pediu pra sair
    }
    setFilaAtiva(null);
    setFilaConcluida(false);
    setModo('decisao');
  }

  useEffect(() => {
    if (modo !== 'fila' || !filaAtiva) return;
    const intervalo = setInterval(async () => {
      try {
        const atualizado = await api.statusFila(slug, clienteTel);
        if (!atualizado) setFilaConcluida(true);
        setFilaAtiva(atualizado);
      } catch {
        // se a rede falhar num ciclo, só tenta de novo no próximo poll
      }
    }, 20000);
    return () => clearInterval(intervalo);
  }, [modo, filaAtiva?.id, slug, clienteTel]);

  async function handleConfirmarAssinatura(e) {
    e.preventDefault();
    setAssinando(true);
    setErroAssinatura('');
    try {
      const nova = await api.assinar(slug, { planoId: planoEscolhido.id, clienteNome, clienteTel });
      setAssinaturaCriada(nova);
    } catch (err) {
      setErroAssinatura(err.response?.data?.message || 'Não foi possível iniciar a assinatura. Tente novamente.');
    } finally { setAssinando(false); }
  }

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
    if (step === 1) {
      setModo('decisao');
      return;
    }
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
    return <div className="min-h-screen flex items-center justify-center text-stone-500">Carregando...</div>;
  }

  if (barbeariaNaoEncontrada) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-xl font-serif font-semibold text-stone-50 mb-2">Barbearia não encontrada</h1>
          <p className="text-stone-400 text-sm">Verifique se o link está correto.</p>
        </div>
      </div>
    );
  }

  if (confirmado) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-stone-900 rounded-2xl shadow-sm border border-stone-800 p-8 text-center">
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
          <h1 className="text-lg font-serif font-semibold text-stone-50 mb-1">Agendamento confirmado!</h1>
          <p className="text-stone-400 text-sm mb-6">Anote os detalhes abaixo.</p>
          <div className="text-left bg-stone-800/60 rounded-xl p-4 space-y-1.5 text-sm">
            <p><span className="text-stone-500">Barbearia:</span> <span className="font-medium text-stone-50">{barbearia.nome}</span></p>
            <p><span className="text-stone-500">Serviço:</span> <span className="font-medium text-stone-50">{servico.nome}</span></p>
            <p><span className="text-stone-500">Data:</span> <span className="font-medium text-stone-50 capitalize">{fmtDataExibicao(data)}</span></p>
            <p><span className="text-stone-500">Horário:</span> <span className="font-medium text-stone-50">{fmtHora(slot.horaInicio)} – {fmtHora(slot.horaFim)}</span></p>
            {profissional && <p><span className="text-stone-500">Profissional:</span> <span className="font-medium text-stone-50">{profissional.nome}</span></p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">
      <header className="bg-stone-900 border-b border-stone-800 px-6 py-5">
        <h1 className="text-lg font-serif font-semibold text-stone-50 flex items-center gap-2">
          <Scissors size={20} /> {barbearia?.nome}
        </h1>
        {barbearia?.endereco && (
          <p className="text-xs text-stone-500 mt-1 flex items-center gap-1"><MapPin size={12} /> {barbearia.endereco}</p>
        )}
        {barbearia?.telefone && (
          <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1"><Phone size={12} /> {barbearia.telefone}</p>
        )}
      </header>

      <div className="max-w-md mx-auto p-4">
        {modo === 'identificacao' && identStep === 'telefone' && (
          <form onSubmit={handleTelefoneSubmit} className="space-y-4">
            <h2 className="font-semibold text-stone-50">Olá! 👋</h2>
            <p className="text-sm text-stone-400">Informe seu telefone para começar.</p>
            <div>
              <label className="block text-xs font-medium text-stone-200 mb-1">Telefone *</label>
              <input className="input" required autoFocus type="tel" placeholder="(21) 99999-9999"
                value={telefoneInput} onChange={e => setTelefoneInput(e.target.value)} />
            </div>
            {erroIdentificacao && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{erroIdentificacao}</p>}
            <button type="submit" disabled={verificando} className="btn-primary w-full disabled:opacity-50">
              {verificando ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        )}

        {modo === 'identificacao' && identStep === 'nome' && (
          <form onSubmit={handleNomeSubmit} className="space-y-4">
            <button type="button" onClick={() => setIdentStep('telefone')} className="flex items-center gap-1 text-sm text-stone-400 hover:text-stone-200 mb-1">
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="font-semibold text-stone-50">Prazer em te conhecer!</h2>
            <p className="text-sm text-stone-400">Não te encontramos por aqui ainda — como podemos te chamar?</p>
            <div>
              <label className="block text-xs font-medium text-stone-200 mb-1">Nome *</label>
              <input className="input" required autoFocus value={clienteNome} onChange={e => setClienteNome(e.target.value)} />
            </div>
            {erroIdentificacao && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{erroIdentificacao}</p>}
            <button type="submit" disabled={verificando} className="btn-primary w-full disabled:opacity-50">
              {verificando ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        )}

        {modo === 'decisao' && (
          <div className="space-y-4">
            <button onClick={voltarParaIdentificacao} className="flex items-center gap-1 text-sm text-stone-400 hover:text-stone-200 mb-1">
              <ChevronLeft size={16} /> Voltar
            </button>

            {saudacao && (
              <p className="text-sm text-stone-300 bg-gold-500/10 border border-gold-500/30 rounded-lg px-4 py-3">{saudacao}</p>
            )}

            {statusAssinante?.assinante ? (
              <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-5 text-center">
                <BadgeCheck size={32} className="text-emerald-400 mx-auto mb-2" />
                <p className="font-semibold text-stone-50">Você é assinante do plano {statusAssinante.planoNome}</p>
                <p className="text-sm text-stone-400 mt-1">
                  {statusAssinante.diasRestantes != null && statusAssinante.diasRestantes >= 0
                    ? `Faltam ${statusAssinante.diasRestantes} dia(s) para renovar.`
                    : 'Sua assinatura está vencida — fale com a barbearia para renovar.'}
                </p>
              </div>
            ) : planosAtivos.length > 0 && (
              <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-5">
                <p className="font-semibold text-stone-50 mb-1 flex items-center gap-2"><BadgeCheck size={18} /> Que tal assinar um plano?</p>
                <p className="text-sm text-stone-400">Esta barbearia tem planos de assinatura com benefícios exclusivos.</p>
              </div>
            )}

            <button onClick={iniciarAgendamento} className="btn-primary w-full">Agendar um horário</button>

            <button onClick={iniciarFila}
              className="w-full flex items-center justify-center gap-2 border border-stone-700 text-stone-200 rounded-xl py-2.5 text-sm font-medium hover:bg-stone-800/60 transition-colors">
              <Ticket size={16} /> Entrar na fila de espera
            </button>

            {!statusAssinante?.assinante && planosAtivos.length > 0 && (
              <button onClick={iniciarAssinatura}
                className="w-full text-center text-sm text-gold-400 hover:text-gold-400 py-2">
                Ver planos de assinatura
              </button>
            )}
          </div>
        )}

        {modo === 'assinatura' && !assinaturaCriada && (
          <div className="space-y-3">
            <button onClick={() => { setModo('decisao'); setPlanoEscolhido(null); }} className="flex items-center gap-1 text-sm text-stone-400 hover:text-stone-200 mb-1">
              <ChevronLeft size={16} /> Voltar
            </button>

            {!planoEscolhido ? (
              <>
                <h2 className="font-semibold text-stone-50 mb-2">Escolha um plano</h2>
                {planosAtivos.map(p => (
                  <button key={p.id} onClick={() => setPlanoEscolhido(p)}
                    className="w-full text-left bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-4 hover:border-gold-500/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-stone-50">{p.nome}</span>
                      <span className="font-semibold text-stone-50">{fmt(p.precoMensal)}/mês</span>
                    </div>
                    {p.descricao && <p className="text-xs text-stone-400 mt-1.5 whitespace-pre-line">{p.descricao}</p>}
                  </button>
                ))}
                {planosAtivos.length === 0 && (
                  <p className="text-stone-500 text-sm text-center py-8">Nenhum plano de assinatura disponível no momento.</p>
                )}
              </>
            ) : (
              <form onSubmit={handleConfirmarAssinatura} className="space-y-4">
                <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-stone-50">{planoEscolhido.nome}</span>
                    <span className="font-semibold text-stone-50">{fmt(planoEscolhido.precoMensal)}/mês</span>
                  </div>
                  {planoEscolhido.descricao && <p className="text-xs text-stone-400 whitespace-pre-line">{planoEscolhido.descricao}</p>}
                </div>
                {erroAssinatura && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{erroAssinatura}</p>}
                <button type="submit" disabled={assinando} className="btn-primary w-full disabled:opacity-50">
                  {assinando ? 'Gerando pagamento...' : 'Assinar e pagar com PIX'}
                </button>
              </form>
            )}
          </div>
        )}

        {modo === 'assinatura' && assinaturaCriada && (
          <div className="bg-stone-900 rounded-2xl shadow-sm border border-stone-800 p-6">
            <div className="text-center mb-4">
              <BadgeCheck size={40} className="text-gold-400 mx-auto mb-2" />
              <h1 className="text-lg font-serif font-semibold text-stone-50">PIX gerado!</h1>
              <p className="text-stone-400 text-sm mt-1">
                Sua assinatura do plano <span className="font-medium">{assinaturaCriada.planoNome}</span> será ativada
                automaticamente assim que o pagamento for confirmado.
              </p>
            </div>
            {assinaturaCriada.pixQrCodeBase64 && (
              <img
                src={`data:image/png;base64,${assinaturaCriada.pixQrCodeBase64}`}
                alt="QR Code PIX"
                className="mx-auto w-48 h-48 border border-stone-700 rounded-lg mb-4"
              />
            )}
            <label className="block text-xs font-medium text-stone-200 mb-1">Copia e Cola</label>
            <textarea readOnly className="input font-mono text-xs" rows={4} value={assinaturaCriada.pixCopiaECola} />
          </div>
        )}

        {modo === 'fila' && !filaAtiva && !filaConcluida && (
          <div className="space-y-3">
            <button onClick={() => setModo('decisao')} className="flex items-center gap-1 text-sm text-stone-400 hover:text-stone-200 mb-1">
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="font-semibold text-stone-50 mb-2 flex items-center gap-2"><Ticket size={16} /> Escolha o serviço</h2>
            {servicos.map(s => (
              <button key={s.id} onClick={() => handleEntrarNaFila(s)} disabled={entrandoFila}
                className="w-full text-left bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-4 hover:border-gold-500/40 transition-colors disabled:opacity-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-50">{s.nome}</span>
                  <span className="font-semibold text-stone-50">{fmt(s.preco)}</span>
                </div>
                {s.descricao && <p className="text-xs text-stone-500 mt-1">{s.descricao}</p>}
              </button>
            ))}
            {erroFila && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{erroFila}</p>}
            {servicos.length === 0 && <p className="text-stone-500 text-sm text-center py-8">Nenhum serviço disponível no momento.</p>}
          </div>
        )}

        {modo === 'fila' && filaAtiva && (
          <div className="bg-stone-900 rounded-2xl shadow-sm border border-stone-800 p-8 text-center">
            <div className="inline-flex items-center gap-1.5 bg-stone-800/60 text-stone-400 text-xs font-medium px-3 py-1 rounded-full mb-1">
              <Ticket size={13} /> Senha #{filaAtiva.numeroTicket}
            </div>

            {filaAtiva.status === 'EM_ATENDIMENTO' ? (
              <div className="my-6">
                <p className="text-3xl font-extrabold text-emerald-400 leading-tight">É a sua vez!</p>
                <p className="text-stone-400 text-sm mt-2">Dirija-se ao balcão 🎉</p>
              </div>
            ) : (
              <div className="my-5">
                <p className="text-7xl font-extrabold text-gold-400 leading-none tabular-nums">
                  {filaAtiva.pessoasNaFrente}
                </p>
                <p className="text-sm font-semibold text-stone-200 mt-3">
                  {filaAtiva.pessoasNaFrente === 0 ? 'Você é o próximo!' : 'pessoa(s) na sua frente'}
                </p>
              </div>
            )}

            <p className="text-xs text-stone-500">Serviço: {filaAtiva.servicoNome}</p>

            <button onClick={handleSairDaFila} className="mt-6 text-sm text-red-400 hover:text-red-400">
              Sair da fila
            </button>
          </div>
        )}

        {modo === 'fila' && filaConcluida && !filaAtiva && (
          <div className="bg-stone-900 rounded-2xl shadow-sm border border-stone-800 p-8 text-center">
            <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
            <p className="font-semibold text-stone-50">Atendimento concluído!</p>
            <p className="text-sm text-stone-400 mt-1">Obrigado por aguardar.</p>
          </div>
        )}

        {modo === 'agendamento' && (
          <>
            <div className="flex items-center gap-1.5 mb-5 px-1">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className={`h-1 flex-1 rounded-full ${n <= step ? 'bg-gold-500' : 'bg-stone-700'}`} />
              ))}
            </div>

            <button onClick={voltar} className="flex items-center gap-1 text-sm text-stone-400 hover:text-stone-200 mb-3">
              <ChevronLeft size={16} /> Voltar
            </button>

            {step === 1 && saudacao && (
              <p className="text-sm text-stone-300 bg-gold-500/10 border border-gold-500/30 rounded-lg px-4 py-3 mb-3">{saudacao}</p>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <h2 className="font-semibold text-stone-50 mb-2">Escolha o serviço</h2>
                {servicos.map(s => (
                  <button key={s.id} onClick={() => escolherServico(s)}
                    className="w-full text-left bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-4 hover:border-gold-500/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-stone-50">{s.nome}</span>
                      <span className="font-semibold text-stone-50">{fmt(s.precoAgendamento ?? s.preco)}</span>
                    </div>
                    {s.descricao && <p className="text-xs text-stone-500 mt-1">{s.descricao}</p>}
                    <p className="text-xs text-stone-500 mt-1">{s.duracaoMin} min</p>
                  </button>
                ))}
                {servicos.length === 0 && <p className="text-stone-500 text-sm text-center py-8">Nenhum serviço disponível no momento.</p>}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <h2 className="font-semibold text-stone-50 mb-2 flex items-center gap-2"><User size={16} /> Escolha o profissional</h2>
                <button onClick={() => escolherProfissional(null)}
                  className="w-full text-left bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-4 hover:border-gold-500/40 transition-colors font-medium text-stone-200">
                  Sem preferência
                </button>
                {profissionais.map(p => (
                  <button key={p.id} onClick={() => escolherProfissional(p)}
                    className="w-full text-left bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-4 hover:border-gold-500/40 transition-colors flex items-center gap-3">
                    {p.fotoUrl ? (
                      <img src={p.fotoUrl} alt={p.nome} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-500"><User size={18} /></div>
                    )}
                    <span className="font-medium text-stone-50">{p.nome}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-stone-50 flex items-center gap-2"><Calendar size={16} /> Escolha data e horário</h2>
                <input type="date" min={hoje} value={data} onChange={e => setData(e.target.value)}
                  className="w-full border border-stone-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" />

                {carregandoSlots ? (
                  <p className="text-stone-500 text-sm text-center py-6">Buscando horários...</p>
                ) : slots.length === 0 ? (
                  <p className="text-stone-500 text-sm text-center py-6">Nenhum horário disponível nesta data.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map(s => (
                      <button key={s.horaInicio}
                        onClick={() => setSlot(s)}
                        className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                          slot?.horaInicio === s.horaInicio
                            ? 'bg-gold-500 text-stone-900 border-gold-500'
                            : 'bg-stone-900 text-stone-200 border-stone-700 hover:border-gold-500/40'
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
                <h2 className="font-semibold text-stone-50 flex items-center gap-2"><Clock size={16} /> Confirme seu agendamento</h2>

                <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-4 text-sm space-y-1">
                  <p><span className="text-stone-500">Nome:</span> {clienteNome}</p>
                  <p><span className="text-stone-500">Telefone:</span> {clienteTel}</p>
                  <p><span className="text-stone-500">Serviço:</span> {servico.nome}</p>
                  <p><span className="text-stone-500">Data:</span> <span className="capitalize">{fmtDataExibicao(data)}</span></p>
                  <p><span className="text-stone-500">Horário:</span> {fmtHora(slot.horaInicio)} – {fmtHora(slot.horaFim)}</p>
                  {profissional && <p><span className="text-stone-500">Profissional:</span> {profissional.nome}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-200 mb-1">Observação (opcional)</label>
                  <textarea className="input" rows={2} value={observacao} onChange={e => setObservacao(e.target.value)} />
                </div>

                {erro && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{erro}</p>}

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
