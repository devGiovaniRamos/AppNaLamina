import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import * as api from '../api';

const INTERVALO_POLLING_MS = 20000;

export default function NotificacaoSino() {
  const [naoLidas, setNaoLidas] = useState(0);
  const [notificacoes, setNotificacoes] = useState([]);
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    atualizarContagem();
    const intervalo = setInterval(atualizarContagem, INTERVALO_POLLING_MS);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    function aoClicarFora(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setAberto(false);
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, []);

  function atualizarContagem() {
    api.contarNotificacoesNaoLidas().then(d => setNaoLidas(d.naoLidas)).catch(() => {});
  }

  function abrir() {
    const novoEstado = !aberto;
    setAberto(novoEstado);
    if (novoEstado) {
      api.listarNotificacoes().then(setNotificacoes).catch(() => {});
    }
  }

  async function handleClicarNotificacao(n) {
    setAberto(false);
    if (!n.lida) {
      try {
        await api.marcarNotificacaoLida(n.id);
        setNaoLidas(prev => Math.max(0, prev - 1));
      } catch { /* ignora falha ao marcar, agendamento ainda é aberto normalmente */ }
    }
    if (n.agendamentoId) navigate(`/agendamentos?agendamentoId=${n.agendamentoId}`);
    else if (n.filaEsperaId) navigate('/fila');
    else navigate('/agendamentos');
  }

  async function handleMarcarTodas(e) {
    e.stopPropagation();
    try {
      await api.marcarTodasNotificacoesLidas();
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      setNaoLidas(0);
    } catch { /* mantém estado atual se a chamada falhar */ }
  }

  const fmt = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative" ref={containerRef}>
      <button onClick={abrir} className="relative p-2 rounded-lg hover:bg-stone-800 transition-colors">
        <Bell size={19} className="text-stone-300" />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-80 bg-stone-900 rounded-xl border border-stone-800 shadow-lg z-20 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800">
            <span className="font-semibold text-stone-50 text-sm">Notificações</span>
            {naoLidas > 0 && (
              <button onClick={handleMarcarTodas} className="text-xs text-gold-400 hover:underline">
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="text-center py-8 text-stone-500 text-sm">Nenhuma notificação ainda</div>
            ) : (
              notificacoes.map(n => (
                <button key={n.id} onClick={() => handleClicarNotificacao(n)}
                  className={`w-full text-left px-4 py-3 border-b border-stone-800 last:border-0 hover:bg-stone-800/60 transition-colors ${!n.lida ? 'bg-gold-500/10' : ''}`}>
                  <div className="flex items-start gap-2">
                    {!n.lida && <span className="w-2 h-2 rounded-full bg-gold-500 mt-1.5 shrink-0" />}
                    <div className={!n.lida ? '' : 'ml-4'}>
                      <p className="text-sm font-medium text-stone-50">{n.titulo}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{n.mensagem}</p>
                      <p className="text-xs text-stone-500 mt-1">{fmt(n.criadoEm)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
