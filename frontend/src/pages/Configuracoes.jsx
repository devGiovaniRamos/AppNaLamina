import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import * as api from '../api';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function Configuracoes() {
  const [barbearia, setBarbearia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [salvandoHorario, setSalvandoHorario] = useState(null);
  const [salvandoSinal, setSalvandoSinal] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [erroSinal, setErroSinal] = useState('');
  const [linkCopiado, setLinkCopiado] = useState(false);

  const [perfil, setPerfil] = useState({ nome: '', email: '', telefone: '', cnpj: '', endereco: '', descricao: '', mensagemBoasVindas: '' });
  const [template, setTemplate] = useState({ horaInicio1: '', horaFim1: '', horaInicio2: '', horaFim2: '' });
  const [sinal, setSinal] = useState({ sinalObrigatorio: false, sinalPercentual: '', janelaCancelamentoHoras: 12 });

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
        mensagemBoasVindas: data.mensagemBoasVindas || '',
      });
      setSinal({
        sinalObrigatorio: data.sinalObrigatorio || false,
        sinalPercentual: data.sinalPercentual ?? '',
        janelaCancelamentoHoras: data.janelaCancelamentoHoras ?? 12,
      });
    }).finally(() => setLoading(false));
  }, []);

  function mostrarSucesso(msg) {
    setSucesso(msg);
    setTimeout(() => setSucesso(''), 3000);
  }

  async function handleSalvarPerfil(e) {
    e.preventDefault();
    setSalvandoPerfil(true);
    setErro('');
    setSucesso('');
    try {
      await api.atualizarPerfil(perfil);
      mostrarSucesso('Perfil atualizado com sucesso!');
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
        horarios: prev.horarios
          ? prev.horarios.map(h => h.diaSemana === horario.diaSemana ? { ...h, ...horario } : h)
          : [horario],
      }));
    } catch { alert('Erro ao salvar horário'); }
    finally { setSalvandoHorario(null); }
  }

  async function handleSalvarSinal(e) {
    e.preventDefault();
    setErroSinal('');
    if (sinal.sinalObrigatorio) {
      const pct = Number(sinal.sinalPercentual);
      if (!pct || pct <= 0 || pct > 100) {
        setErroSinal('Informe um percentual entre 1 e 100');
        return;
      }
    }
    setSalvandoSinal(true);
    try {
      const atualizado = await api.atualizarConfigSinal({
        sinalObrigatorio: sinal.sinalObrigatorio,
        sinalPercentual: sinal.sinalObrigatorio ? Number(sinal.sinalPercentual) : null,
        janelaCancelamentoHoras: Number(sinal.janelaCancelamentoHoras),
      });
      setBarbearia(atualizado);
      mostrarSucesso('Configuração de sinal salva com sucesso!');
    } catch (err) {
      setErroSinal(err.response?.data?.message || 'Erro ao salvar configuração de sinal');
    } finally { setSalvandoSinal(false); }
  }

  async function handleAplicarTemplate() {
    const horarios = barbearia?.horarios || [];
    const diasAbertos = horarios.filter(h => h.aberto);

    if (diasAbertos.length === 0) {
      alert('Nenhum dia está salvo como aberto. Marque e salve os dias desejados primeiro.');
      return;
    }
    if (!template.horaInicio1 || !template.horaFim1) {
      alert('Preencha ao menos o 1º turno (início e fim).');
      return;
    }

    setAplicando(true);
    try {
      await Promise.all(
        diasAbertos.map(h =>
          api.atualizarHorario({
            diaSemana: h.diaSemana,
            aberto: true,
            horaInicio1: template.horaInicio1 || null,
            horaFim1: template.horaFim1 || null,
            horaInicio2: template.horaInicio2 || null,
            horaFim2: template.horaFim2 || null,
          })
        )
      );
      const data = await api.getBarbearia();
      setBarbearia(data);
      mostrarSucesso(`Horário aplicado para ${diasAbertos.length} dia(s) aberto(s)!`);
    } catch { alert('Erro ao aplicar horário'); }
    finally { setAplicando(false); }
  }

  if (loading) return <div className="p-6 text-center text-slate-400 py-16">Carregando...</div>;

  const horarios = barbearia?.horarios || [];
  const linkPublico = barbearia?.slug ? `${window.location.origin}/agendar/${barbearia.slug}` : '';

  async function handleCopiarLink() {
    if (!linkPublico) return;
    try {
      await navigator.clipboard.writeText(linkPublico);
    } catch {
      // clipboard indisponível (ex: contexto não seguro) — o link ainda pode ser copiado manualmente do campo
    }
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2000);
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Configurações</h1>

      {sucesso && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg mb-4">{sucesso}</p>}

      {/* Link público de agendamento */}
      {linkPublico && (
        <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-1">Link público de agendamento</h2>
          <p className="text-xs text-slate-400 mb-4">
            Compartilhe esse link com seus clientes para eles agendarem sem precisar criar conta.
          </p>
          <div className="flex items-center gap-2">
            <input readOnly className="input flex-1 text-slate-600" value={linkPublico}
              onClick={e => e.target.select()} />
            <button onClick={handleCopiarLink}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors shrink-0">
              {linkCopiado ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
              {linkCopiado ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>
        </section>
      )}

      {/* Sinal e Cancelamento */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-1">Sinal e Cancelamento</h2>
        <p className="text-xs text-slate-400 mb-4">
          Exija um sinal (Pix ou Dinheiro) para confirmar agendamentos feitos pelo link público.
          O aceite do agendamento continua sendo manual: você pode aceitar mesmo sem o sinal pago.
        </p>
        <form onSubmit={handleSalvarSinal} className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sinal.sinalObrigatorio}
              onChange={e => setSinal({ ...sinal, sinalObrigatorio: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm font-medium text-slate-700">Exigir sinal no agendamento online</span>
          </label>

          {sinal.sinalObrigatorio && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Percentual do sinal (%)</label>
              <input
                type="number" min="1" max="100" step="1"
                className="input w-32"
                value={sinal.sinalPercentual}
                onChange={e => setSinal({ ...sinal, sinalPercentual: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Janela de cancelamento com reembolso (horas)
            </label>
            <input
              type="number" min="0" max="12" step="1"
              className="input w-32"
              value={sinal.janelaCancelamentoHoras}
              onChange={e => setSinal({ ...sinal, janelaCancelamentoHoras: e.target.value })}
            />
            <p className="text-xs text-slate-400 mt-1">
              Cliente cancelando com pelo menos esse número de horas de antecedência recebe o sinal de volta.
              Cancelando depois disso, o sinal fica retido. Cancelamento feito por você sempre devolve o sinal.
            </p>
          </div>

          {erroSinal && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{erroSinal}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={salvandoSinal} className="btn-primary">
              {salvandoSinal ? 'Salvando...' : 'Salvar configuração'}
            </button>
          </div>
        </form>
      </section>

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
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Mensagem personalizada (opcional)</label>
            <p className="text-xs text-slate-400 mb-1">Exibida para o cliente ao abrir o link de agendamento.</p>
            <textarea
              className="input" rows={2} placeholder="Ex: Seja bem-vindo! Chegue com 10 minutos de antecedência."
              value={perfil.mensagemBoasVindas}
              onChange={e => setPerfil({ ...perfil, mensagemBoasVindas: e.target.value })}
            />
          </div>
          {erro && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{erro}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={salvandoPerfil} className="btn-primary">
              {salvandoPerfil ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>
        </form>
      </section>

      {/* Horários por dia */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-1">Horário de Funcionamento</h2>
        <p className="text-xs text-slate-400 mb-4">Configure cada dia individualmente e clique em Salvar.</p>
        <div className="space-y-1">
          {[0, 1, 2, 3, 4, 5, 6].map(dia => {
            const h = horarios.find(x => x.diaSemana === dia) || {
              diaSemana: dia, aberto: false,
              horaInicio1: '', horaFim1: '', horaInicio2: '', horaFim2: ''
            };
            return (
              <HorarioDia
                key={dia}
                horario={h}
                diaNome={DIAS[dia]}
                onSalvar={handleSalvarHorario}
                saving={salvandoHorario === dia}
              />
            );
          })}
        </div>
      </section>

      {/* Template — clonar para dias abertos */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-1">Replicar horário para dias abertos</h2>
        <p className="text-xs text-slate-400 mb-4">
          Defina um horário aqui e aplique de uma vez a todos os dias que estão salvos como abertos.
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-medium text-slate-600 w-16">1º turno</span>
          <input type="time" value={template.horaInicio1} onChange={e => setTemplate({ ...template, horaInicio1: e.target.value })}
            className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
          <span className="text-slate-400 text-sm">–</span>
          <input type="time" value={template.horaFim1} onChange={e => setTemplate({ ...template, horaFim1: e.target.value })}
            className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-medium text-slate-600 w-16">2º turno</span>
          <input type="time" value={template.horaInicio2} onChange={e => setTemplate({ ...template, horaInicio2: e.target.value })}
            placeholder="opcional"
            className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
          <span className="text-slate-400 text-sm">–</span>
          <input type="time" value={template.horaFim2} onChange={e => setTemplate({ ...template, horaFim2: e.target.value })}
            className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Dias abertos salvos: {horarios.filter(h => h.aberto).map(h => DIAS[h.diaSemana]).join(', ') || 'nenhum'}
          </p>
          <button
            onClick={handleAplicarTemplate}
            disabled={aplicando}
            className="btn-primary disabled:opacity-50"
          >
            {aplicando ? 'Aplicando...' : 'Aplicar para dias abertos'}
          </button>
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
  const [erroHorario, setErroHorario] = useState('');

  useEffect(() => {
    setForm({
      diaSemana: horario.diaSemana,
      aberto: horario.aberto ?? false,
      horaInicio1: horario.horaInicio1 || '',
      horaFim1: horario.horaFim1 || '',
      horaInicio2: horario.horaInicio2 || '',
      horaFim2: horario.horaFim2 || '',
    });
  }, [horario.aberto, horario.horaInicio1, horario.horaFim1, horario.horaInicio2, horario.horaFim2]);

  function validar() {
    if (!form.aberto) { setErroHorario(''); return true; }
    if (form.horaInicio1 && form.horaFim1 && form.horaFim1 <= form.horaInicio1) {
      setErroHorario('Fim do 1º turno deve ser após o início');
      return false;
    }
    if (form.horaInicio2 && form.horaFim1 && form.horaInicio2 < form.horaFim1) {
      setErroHorario('Início do 2º turno deve ser após o fim do 1º turno');
      return false;
    }
    if (form.horaInicio2 && form.horaFim2 && form.horaFim2 <= form.horaInicio2) {
      setErroHorario('Fim do 2º turno deve ser após o início');
      return false;
    }
    setErroHorario('');
    return true;
  }

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErroHorario('');
  }

  return (
    <div className="py-3 border-b border-slate-50 last:border-0">
      <div className="flex items-start gap-4">
        <div className="w-24 flex items-center gap-2 pt-1 shrink-0">
          <input
            type="checkbox"
            checked={form.aberto}
            onChange={e => update('aberto', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium text-slate-700">{diaNome}</span>
        </div>

        {form.aberto ? (
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <input type="time" value={form.horaInicio1} onChange={e => update('horaInicio1', e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
            <span className="text-slate-400 text-sm">–</span>
            <input type="time" value={form.horaFim1} onChange={e => update('horaFim1', e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
            <span className="text-slate-300 text-sm mx-1">|</span>
            <input type="time" value={form.horaInicio2} onChange={e => update('horaInicio2', e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
            <span className="text-slate-400 text-sm">–</span>
            <input type="time" value={form.horaFim2} onChange={e => update('horaFim2', e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
            <button onClick={() => validar() && onSalvar(form)} disabled={saving}
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

      {erroHorario && (
        <p className="text-red-500 text-xs mt-1.5 ml-28">{erroHorario}</p>
      )}
    </div>
  );
}
