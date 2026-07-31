import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Scissors, BadgeCheck, MapPin, Phone, CheckCircle2, ChevronLeft } from 'lucide-react';
import * as api from '../../api/public';

export default function Assinar() {
  const { slug } = useParams();

  const [barbearia, setBarbearia] = useState(null);
  const [carregandoBarbearia, setCarregandoBarbearia] = useState(true);
  const [barbeariaNaoEncontrada, setBarbeariaNaoEncontrada] = useState(false);

  const [step, setStep] = useState(1);

  const [clienteTel, setClienteTel] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [erro, setErro] = useState('');

  const [statusAssinante, setStatusAssinante] = useState(null);

  const [planos, setPlanos] = useState([]);
  const [plano, setPlano] = useState(null);

  const [assinando, setAssinando] = useState(false);
  const [assinatura, setAssinatura] = useState(null);

  useEffect(() => {
    api.getBarbearia(slug)
      .then(setBarbearia)
      .catch(() => setBarbeariaNaoEncontrada(true))
      .finally(() => setCarregandoBarbearia(false));
  }, [slug]);

  async function verificarTelefone(e) {
    e.preventDefault();
    setVerificando(true);
    setErro('');
    try {
      const status = await api.assinaturaStatus(slug, clienteTel);
      if (status.assinante) {
        setStatusAssinante(status);
        setStep(3);
        return;
      }
      const lista = await api.listarPlanos(slug);
      setPlanos(lista);
      setStep(2);
    } catch (err) {
      setErro(err.response?.data?.message || 'Telefone inválido. Confira e tente novamente.');
    } finally { setVerificando(false); }
  }

  function escolherPlano(p) {
    setPlano(p);
    setErro('');
  }

  async function confirmarAssinatura(e) {
    e.preventDefault();
    setAssinando(true);
    setErro('');
    try {
      const nova = await api.assinar(slug, { planoId: plano.id, clienteNome, clienteTel });
      setAssinatura(nova);
      setStep(3);
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível iniciar a assinatura. Tente novamente.');
    } finally { setAssinando(false); }
  }

  const fmt = (v) => `R$ ${Number(v || 0).toFixed(2)}`;

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
        {step === 1 && (
          <form onSubmit={verificarTelefone} className="space-y-4">
            <h2 className="font-semibold text-stone-50 flex items-center gap-2"><BadgeCheck size={16} /> Assinatura</h2>
            <p className="text-sm text-stone-400">Informe seu telefone para ver os planos disponíveis ou consultar sua assinatura.</p>
            <div>
              <label className="block text-xs font-medium text-stone-200 mb-1">Telefone *</label>
              <input className="input" required autoFocus placeholder="(21) 99999-9999"
                value={clienteTel} onChange={e => setClienteTel(e.target.value)} />
            </div>
            {erro && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{erro}</p>}
            <button type="submit" disabled={verificando} className="btn-primary w-full disabled:opacity-50">
              {verificando ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        )}

        {step === 2 && !plano && (
          <div className="space-y-3">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-stone-400 hover:text-stone-200 mb-1">
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="font-semibold text-stone-50 mb-2">Escolha um plano</h2>
            {planos.map(p => (
              <button key={p.id} onClick={() => escolherPlano(p)}
                className="w-full text-left bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-4 hover:border-gold-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-50">{p.nome}</span>
                  <span className="font-semibold text-stone-50">{fmt(p.precoMensal)}/mês</span>
                </div>
                {p.descricao && <p className="text-xs text-stone-400 mt-1.5 whitespace-pre-line">{p.descricao}</p>}
              </button>
            ))}
            {planos.length === 0 && (
              <p className="text-stone-500 text-sm text-center py-8">Nenhum plano de assinatura disponível no momento.</p>
            )}
          </div>
        )}

        {step === 2 && plano && (
          <form onSubmit={confirmarAssinatura} className="space-y-4">
            <button type="button" onClick={() => setPlano(null)} className="flex items-center gap-1 text-sm text-stone-400 hover:text-stone-200 mb-1">
              <ChevronLeft size={16} /> Voltar
            </button>
            <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-stone-50">{plano.nome}</span>
                <span className="font-semibold text-stone-50">{fmt(plano.precoMensal)}/mês</span>
              </div>
              {plano.descricao && <p className="text-xs text-stone-400 whitespace-pre-line">{plano.descricao}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-200 mb-1">Seu nome *</label>
              <input className="input" required value={clienteNome} onChange={e => setClienteNome(e.target.value)} />
            </div>
            {erro && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{erro}</p>}
            <button type="submit" disabled={assinando} className="btn-primary w-full disabled:opacity-50">
              {assinando ? 'Gerando pagamento...' : 'Assinar e pagar com PIX'}
            </button>
          </form>
        )}

        {step === 3 && statusAssinante && (
          <div className="bg-stone-900 rounded-2xl shadow-sm border border-stone-800 p-8 text-center">
            <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
            <h1 className="text-lg font-serif font-semibold text-stone-50 mb-1">Você já é assinante!</h1>
            <p className="text-stone-400 text-sm mb-4">Plano {statusAssinante.planoNome}</p>
            <p className="text-sm text-stone-300">
              {statusAssinante.diasRestantes != null && statusAssinante.diasRestantes >= 0
                ? `Faltam ${statusAssinante.diasRestantes} dia(s) para renovar.`
                : 'Sua assinatura está vencida — fale com a barbearia para renovar.'}
            </p>
          </div>
        )}

        {step === 3 && assinatura && (
          <div className="bg-stone-900 rounded-2xl shadow-sm border border-stone-800 p-6">
            <div className="text-center mb-4">
              <BadgeCheck size={40} className="text-gold-400 mx-auto mb-2" />
              <h1 className="text-lg font-serif font-semibold text-stone-50">PIX gerado!</h1>
              <p className="text-stone-400 text-sm mt-1">
                Sua assinatura do plano <span className="font-medium">{assinatura.planoNome}</span> será ativada
                automaticamente assim que o pagamento for confirmado.
              </p>
            </div>
            {assinatura.pixQrCodeBase64 && (
              <img
                src={`data:image/png;base64,${assinatura.pixQrCodeBase64}`}
                alt="QR Code PIX"
                className="mx-auto w-48 h-48 border border-stone-700 rounded-lg mb-4"
              />
            )}
            <label className="block text-xs font-medium text-stone-200 mb-1">Copia e Cola</label>
            <textarea readOnly className="input font-mono text-xs" rows={4} value={assinatura.pixCopiaECola} />
          </div>
        )}
      </div>
    </div>
  );
}
