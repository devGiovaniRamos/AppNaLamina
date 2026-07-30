import { useState, useEffect } from 'react';
import { Copy, Check, Plus, Pencil } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const planoVazio = { nome: '', descricao: '', precoMensal: '' };

export default function Configuracoes() {
  const [barbearia, setBarbearia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [salvandoHorario, setSalvandoHorario] = useState(null);
  const [aplicando, setAplicando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [conectandoMP, setConectandoMP] = useState(false);
  const [desconectandoMP, setDesconectandoMP] = useState(false);

  const [perfil, setPerfil] = useState({ nome: '', email: '', telefone: '', cnpj: '', endereco: '', descricao: '' });
  const [template, setTemplate] = useState({ horaInicio1: '', horaFim1: '', horaInicio2: '', horaFim2: '' });

  const [planos, setPlanos] = useState([]);
  const [modalPlano, setModalPlano] = useState(false);
  const [editandoPlano, setEditandoPlano] = useState(null);
  const [formPlano, setFormPlano] = useState(planoVazio);
  const [salvandoPlano, setSalvandoPlano] = useState(false);
  const [erroPlano, setErroPlano] = useState('');

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
    api.listarPlanos().then(setPlanos).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resultado = params.get('mercadopago');
    if (!resultado) return;
    if (resultado === 'conectado') mostrarSucesso('Conta Mercado Pago conectada com sucesso!');
    else if (resultado === 'erro') setErro('Não foi possível conectar sua conta Mercado Pago. Tente novamente.');
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  async function handleConectarMercadoPago() {
    setConectandoMP(true);
    setErro('');
    try {
      const { url } = await api.conectarMercadoPago();
      window.location.href = url;
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao iniciar conexão com o Mercado Pago');
      setConectandoMP(false);
    }
  }

  async function handleDesconectarMercadoPago() {
    if (!confirm('Desconectar sua conta Mercado Pago? Não será possível gerar novos PIX até reconectar.')) return;
    setDesconectandoMP(true);
    try {
      await api.desconectarMercadoPago();
      setBarbearia(prev => ({ ...prev, mercadoPagoConectado: false }));
      mostrarSucesso('Conta Mercado Pago desconectada.');
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao desconectar o Mercado Pago');
    } finally { setDesconectandoMP(false); }
  }

  function mostrarSucesso(msg) {
    setSucesso(msg);
    setTimeout(() => setSucesso(''), 3000);
  }

  function abrirCriarPlano() {
    setEditandoPlano(null);
    setFormPlano(planoVazio);
    setErroPlano('');
    setModalPlano(true);
  }

  function abrirEditarPlano(p) {
    setEditandoPlano(p);
    setFormPlano({ nome: p.nome, descricao: p.descricao || '', precoMensal: p.precoMensal });
    setErroPlano('');
    setModalPlano(true);
  }

  async function handleSalvarPlano(e) {
    e.preventDefault();
    setSalvandoPlano(true);
    setErroPlano('');
    try {
      const payload = { ...formPlano, precoMensal: Number(formPlano.precoMensal) };
      if (editandoPlano) {
        const atualizado = await api.atualizarPlano(editandoPlano.id, payload);
        setPlanos(prev => prev.map(p => p.id === editandoPlano.id ? atualizado : p));
      } else {
        const novo = await api.criarPlano(payload);
        setPlanos(prev => [novo, ...prev]);
      }
      setModalPlano(false);
    } catch (err) {
      setErroPlano(err.response?.data?.message || 'Erro ao salvar plano');
    } finally { setSalvandoPlano(false); }
  }

  async function handleAlternarAtivoPlano(p) {
    try {
      const atualizado = await api.alternarAtivoPlano(p.id, !p.ativo);
      setPlanos(prev => prev.map(x => x.id === p.id ? atualizado : x));
    } catch { alert('Erro ao atualizar plano'); }
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
      {erro && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-4">{erro}</p>}

      {/* Recebimento via Mercado Pago */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-1">Recebimento via Mercado Pago</h2>
        <p className="text-xs text-slate-400 mb-4">
          Conecte sua própria conta Mercado Pago para receber diretamente os pagamentos PIX dos agendamentos.
        </p>
        {barbearia?.mercadoPagoConectado ? (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
              <Check size={15} /> Conta conectada
            </span>
            <button onClick={handleDesconectarMercadoPago} disabled={desconectandoMP}
              className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50">
              {desconectandoMP ? 'Desconectando...' : 'Desconectar'}
            </button>
          </div>
        ) : (
          <button onClick={handleConectarMercadoPago} disabled={conectandoMP} className="btn-primary disabled:opacity-50">
            {conectandoMP ? 'Redirecionando...' : 'Conectar Mercado Pago'}
          </button>
        )}
      </section>

      {/* Planos de assinatura */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-semibold text-slate-800">Planos de assinatura</h2>
          <button onClick={abrirCriarPlano} className="flex items-center gap-1.5 text-sm btn-primary">
            <Plus size={15} /> Novo plano
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Clientes veem os planos ativos na página pública de assinatura e podem assinar pagando via PIX.
        </p>
        <div className="divide-y divide-slate-50">
          {planos.map(p => (
            <div key={p.id} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">{p.nome}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${p.ativo ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">R$ {Number(p.precoMensal).toFixed(2)}/mês</p>
                {p.descricao && <p className="text-xs text-slate-400 mt-1 whitespace-pre-line">{p.descricao}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => abrirEditarPlano(p)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleAlternarAtivoPlano(p)}
                  className="px-2.5 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                  {p.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}
          {planos.length === 0 && (
            <p className="text-center py-8 text-slate-400 text-sm">Nenhum plano cadastrado ainda</p>
          )}
        </div>
      </section>

      <Modal open={modalPlano} onClose={() => setModalPlano(false)} title={editandoPlano ? 'Editar Plano' : 'Novo Plano'}>
        <form onSubmit={handleSalvarPlano} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nome *</label>
            <input className="input" required value={formPlano.nome} onChange={e => setFormPlano({ ...formPlano, nome: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Preço mensal (R$) *</label>
            <input type="number" className="input" required min={0.01} step={0.01}
              value={formPlano.precoMensal} onChange={e => setFormPlano({ ...formPlano, precoMensal: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Benefícios *</label>
            <textarea className="input" required rows={4} placeholder="Ex: 2 cortes por mês, 10% de desconto em produtos..."
              value={formPlano.descricao} onChange={e => setFormPlano({ ...formPlano, descricao: e.target.value })} />
          </div>
          {erroPlano && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{erroPlano}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModalPlano(false)} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={salvandoPlano} className="btn-primary">{salvandoPlano ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>

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
