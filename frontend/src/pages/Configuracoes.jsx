import { useState, useEffect } from 'react';
import * as api from '../api';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function Configuracoes() {
  const [barbearia, setBarbearia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [salvandoHorario, setSalvandoHorario] = useState(null);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  const [perfil, setPerfil] = useState({ nome: '', email: '', telefone: '', cnpj: '', endereco: '', descricao: '' });

  useEffect(() => {
    api.getBarbearia().then(data => {
      setBarbearia(data);
      setPerfil({
        nome: data.nome || '',
        email: data.email || '',
        telefone: data.telefone || '',
        cnpj: data.cnpj || '',
        endereco: data.endereco || '',
        descricao: data.descricao || '',
      });
    }).finally(() => setLoading(false));
  }, []);

  async function handleSalvarPerfil(e) {
    e.preventDefault();
    setSalvandoPerfil(true);
    setErro('');
    setSucesso('');
    try {
      await api.atualizarPerfil(perfil);
      setSucesso('Perfil atualizado com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao salvar perfil');
    } finally { setSalvandoPerfil(false); }
  }

  async function handleSalvarHorario(horario) {
    setSalvandoHorario(horario.diaSemana);
    try {
      await api.atualizarHorario(horario);
      setBarbearia(prev => ({
        ...prev,
        horarios: prev.horarios.map(h => h.diaSemana === horario.diaSemana ? { ...h, ...horario } : h),
      }));
    } catch { alert('Erro ao salvar horário'); }
    finally { setSalvandoHorario(null); }
  }

  if (loading) return <div className="p-6 text-center text-slate-400 py-16">Carregando...</div>;

  const horarios = barbearia?.horarios || [];

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Configurações</h1>

      {/* Perfil */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Perfil da Barbearia</h2>
        <form onSubmit={handleSalvarPerfil} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome *</label>
              <input className="input" required value={perfil.nome} onChange={e => setPerfil({ ...perfil, nome: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
              <input type="email" className="input" required value={perfil.email} onChange={e => setPerfil({ ...perfil, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Telefone</label>
              <input className="input" value={perfil.telefone} onChange={e => setPerfil({ ...perfil, telefone: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">CNPJ</label>
              <input className="input" value={perfil.cnpj} onChange={e => setPerfil({ ...perfil, cnpj: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Endereço</label>
            <input className="input" value={perfil.endereco} onChange={e => setPerfil({ ...perfil, endereco: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Descrição</label>
            <textarea className="input" rows={3} value={perfil.descricao} onChange={e => setPerfil({ ...perfil, descricao: e.target.value })} />
          </div>
          {sucesso && <p className="text-green-600 text-sm bg-green-50 p-2 rounded-lg">{sucesso}</p>}
          {erro && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{erro}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={salvandoPerfil} className="btn-primary">
              {salvandoPerfil ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>
        </form>
      </section>

      {/* Horários */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Horário de Funcionamento</h2>
        <div className="space-y-3">
          {[0, 1, 2, 3, 4, 5, 6].map(dia => {
            const h = horarios.find(x => x.diaSemana === dia) || {
              diaSemana: dia, aberto: false,
              horaInicio1: '', horaFim1: '', horaInicio2: '', horaFim2: ''
            };
            return <HorarioDia key={dia} horario={h} diaNome={DIAS[dia]}
              onSalvar={handleSalvarHorario} saving={salvandoHorario === dia} />;
          })}
        </div>
      </section>
    </div>
  );
}

function HorarioDia({ horario, diaNome, onSalvar, saving }) {
  const [form, setForm] = useState({
    diaSemana: horario.diaSemana,
    aberto: horario.aberto ?? false,
    horaInicio1: horario.horaInicio1 || '',
    horaFim1: horario.horaFim1 || '',
    horaInicio2: horario.horaInicio2 || '',
    horaFim2: horario.horaFim2 || '',
  });

  return (
    <div className="flex items-start gap-4 py-3 border-b border-slate-50 last:border-0">
      <div className="w-24 flex items-center gap-2 pt-1">
        <input type="checkbox" checked={form.aberto} onChange={e => setForm({ ...form, aberto: e.target.checked })}
          className="rounded" />
        <span className="text-sm font-medium text-slate-700">{diaNome}</span>
      </div>
      {form.aberto ? (
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <input type="time" value={form.horaInicio1} onChange={e => setForm({ ...form, horaInicio1: e.target.value })}
            className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
          <span className="text-slate-400 text-sm">–</span>
          <input type="time" value={form.horaFim1} onChange={e => setForm({ ...form, horaFim1: e.target.value })}
            className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
          <span className="text-slate-300 text-sm mx-1">|</span>
          <input type="time" value={form.horaInicio2} onChange={e => setForm({ ...form, horaInicio2: e.target.value })}
            placeholder="2º turno"
            className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
          <span className="text-slate-400 text-sm">–</span>
          <input type="time" value={form.horaFim2} onChange={e => setForm({ ...form, horaFim2: e.target.value })}
            className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
          <button onClick={() => onSalvar(form)} disabled={saving}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors ml-auto">
            {saving ? '...' : 'Salvar'}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm text-slate-400">Fechado</span>
          <button onClick={() => onSalvar({ ...form, aberto: false })} disabled={saving}
            className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors ml-auto">
            {saving ? '...' : 'Salvar'}
          </button>
        </div>
      )}
    </div>
  );
}
