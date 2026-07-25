import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Flag } from 'lucide-react';
import * as api from '../api';

const TIPO_LABEL = { MENSAL: 'Mensal', BIMESTRAL: 'Bimestral', TRIMESTRAL: 'Trimestral' };

const formVazio = { tipo: 'MENSAL', valorPorPonto: '', premiacao: '' };

export default function Campeonato() {
  const [ativo, setAtivo] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(formVazio);
  const [iniciando, setIniciando] = useState(false);
  const [encerrando, setEncerrando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    try {
      const lista = await api.listarCampeonatos();
      setHistorico(lista);

      try {
        const campeonatoAtivo = await api.buscarCampeonatoAtivo();
        setAtivo(campeonatoAtivo);
        const rank = await api.rankingCampeonato(campeonatoAtivo.id);
        setRanking(rank);
      } catch {
        setAtivo(null);
        setRanking([]);
      }
    } finally { setLoading(false); }
  }

  function mostrarSucesso(msg) {
    setSucesso(msg);
    setTimeout(() => setSucesso(''), 3000);
  }

  async function handleIniciar(e) {
    e.preventDefault();
    setIniciando(true);
    setErro('');
    try {
      await api.iniciarCampeonato({
        tipo: form.tipo,
        valorPorPonto: Number(form.valorPorPonto),
        premiacao: form.premiacao || null,
      });
      setForm(formVazio);
      mostrarSucesso('Campeonato iniciado!');
      carregar();
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao iniciar campeonato');
    } finally { setIniciando(false); }
  }

  async function handleEncerrar() {
    if (!ativo || !confirm('Encerrar o campeonato atual? Essa ação não pode ser desfeita.')) return;
    setEncerrando(true);
    try {
      await api.encerrarCampeonato(ativo.id);
      mostrarSucesso('Campeonato encerrado');
      carregar();
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao encerrar campeonato');
    } finally { setEncerrando(false); }
  }

  const fmtData = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '';
  const fmt = (v) => `R$ ${Number(v || 0).toFixed(2)}`;

  if (loading) return <div className="p-6 text-center text-slate-400 py-16">Carregando...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
        <Trophy size={24} /> Campeonato
      </h1>
      <p className="text-slate-500 text-sm mb-6">
        Clientes ganham pontos a cada agendamento pago ou compra no PDV, vinculados pelo telefone.
      </p>

      {sucesso && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg mb-4">{sucesso}</p>}

      {!ativo ? (
        <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-1">Iniciar novo campeonato</h2>
          <p className="text-xs text-slate-400 mb-4">
            Defina de quanto em quanto tempo o campeonato dura, quantos reais gastos geram 1 ponto, e a premiação para o cliente.
          </p>
          <form onSubmit={handleIniciar} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Duração *</label>
                <select className="input" required value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  {Object.entries(TIPO_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">A cada quantos reais, 1 ponto? *</label>
                <input type="number" className="input" required min={0.01} step={0.01} placeholder="Ex: 50.00"
                  value={form.valorPorPonto} onChange={e => setForm({ ...form, valorPorPonto: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Premiação (exibida para o cliente)</label>
              <textarea className="input" rows={3} placeholder="Ex: 1º lugar ganha um corte grátis"
                value={form.premiacao} onChange={e => setForm({ ...form, premiacao: e.target.value })} />
            </div>
            {erro && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{erro}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={iniciando} className="btn-primary disabled:opacity-50">
                {iniciando ? 'Iniciando...' : 'Iniciar campeonato'}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Campeonato {TIPO_LABEL[ativo.tipo]} — em andamento</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {fmtData(ativo.dataInicio)} até {fmtData(ativo.dataFim)} · a cada {fmt(ativo.valorPorPonto)} = 1 ponto
              </p>
            </div>
            <button onClick={handleEncerrar} disabled={encerrando}
              className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors shrink-0">
              {encerrando ? '...' : 'Encerrar campeonato'}
            </button>
          </div>
          {ativo.premiacao && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 text-amber-800 text-sm rounded-lg px-4 py-3">
              <Award size={16} className="mt-0.5 shrink-0" />
              <span>{ativo.premiacao}</span>
            </div>
          )}
        </section>
      )}

      {ativo && (
        <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Ranking</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-medium w-16">Pos.</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Telefone</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ranking.map(r => (
                <tr key={r.clienteTel} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-600">
                    {r.posicao === 1 ? <Medal size={16} className="text-amber-500" /> :
                     r.posicao === 2 ? <Medal size={16} className="text-slate-400" /> :
                     r.posicao === 3 ? <Medal size={16} className="text-amber-700" /> : r.posicao}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{r.clienteNome}</td>
                  <td className="px-4 py-3 text-slate-500">{r.clienteTel}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.pontos}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ranking.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">Nenhum ponto gerado ainda neste campeonato</div>
          )}
        </section>
      )}

      {historico.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Flag size={15} /> Histórico
          </h2>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-50">
                {historico.map(c => (
                  <tr key={c.id}>
                    <td className="px-4 py-2.5 text-slate-700">{TIPO_LABEL[c.tipo]}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{fmtData(c.dataInicio)} – {fmtData(c.dataFim)}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">a cada {fmt(c.valorPorPonto)} = 1 ponto</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'ATIVO' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                        {c.status === 'ATIVO' ? 'Ativo' : 'Encerrado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
