import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Scissors } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';
import FotoUpload from '../components/FotoUpload';

const emptyForm = { nome: '', descricao: '', duracaoMin: '', preco: '', precoAgendamento: '', fotoUrl: '' };

export default function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listarServicos().then(setServicos).finally(() => setLoading(false));
  }, []);

  function abrirCriar() {
    setEditando(null);
    setForm(emptyForm);
    setError('');
    setModal(true);
  }

  function abrirEditar(s) {
    setEditando(s);
    setForm({
      nome: s.nome,
      descricao: s.descricao || '',
      duracaoMin: s.duracaoMin,
      preco: s.preco,
      precoAgendamento: s.precoAgendamento ?? '',
      fotoUrl: s.fotoUrl || '',
    });
    setError('');
    setModal(true);
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        duracaoMin: Number(form.duracaoMin),
        preco: Number(form.preco),
        precoAgendamento: form.precoAgendamento !== '' ? Number(form.precoAgendamento) : null,
        fotoUrl: form.fotoUrl || null,
      };
      if (editando) {
        const atualizado = await api.atualizarServico(editando.id, payload);
        setServicos(prev => prev.map(s => s.id === editando.id ? atualizado : s));
      } else {
        const novo = await api.criarServico(payload);
        setServicos(prev => [...prev, novo]);
      }
      setModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  async function handleDesativar(id) {
    if (!confirm('Desativar este serviço?')) return;
    try {
      await api.desativarServico(id);
      setServicos(prev => prev.filter(s => s.id !== id));
    } catch { alert('Erro ao desativar'); }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-stone-50">Serviços</h1>
          <p className="text-stone-400 text-sm mt-1">{servicos.length} serviço(s) ativo(s)</p>
        </div>
        <button onClick={abrirCriar} className="flex items-center gap-2 btn-primary">
          <Plus size={16} /> Novo serviço
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-stone-500">Carregando...</div>
      ) : (
        <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-800/60 border-b border-stone-800">
              <tr>
                <th className="text-left px-4 py-3 text-stone-400 font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-stone-400 font-medium">Duração</th>
                <th className="text-left px-4 py-3 text-stone-400 font-medium">Preço</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {servicos.map(s => (
                <tr key={s.id} className="hover:bg-stone-800/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {s.fotoUrl ? (
                        <img src={s.fotoUrl} alt={s.nome} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-stone-800 flex items-center justify-center shrink-0">
                          <Scissors size={14} className="text-stone-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-stone-50">{s.nome}</p>
                        {s.descricao && <p className="text-stone-500 text-xs mt-0.5">{s.descricao}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-300">{s.duracaoMin} min</td>
                  <td className="px-4 py-3 text-stone-300">
                    R$ {Number(s.preco).toFixed(2)}
                    {s.precoAgendamento != null && (
                      <p className="text-xs text-gold-400 mt-0.5">Agendamento: R$ {Number(s.precoAgendamento).toFixed(2)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => abrirEditar(s)} className="p-1.5 text-stone-500 hover:text-gold-400 hover:bg-gold-500/10 rounded-lg mr-1">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDesativar(s.id)} className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {servicos.length === 0 && (
            <div className="text-center py-12 text-stone-500">Nenhum serviço cadastrado</div>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar Serviço' : 'Novo Serviço'}>
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-200 mb-1">Foto</label>
            <FotoUpload value={form.fotoUrl} onChange={fotoUrl => setForm({ ...form, fotoUrl })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-200 mb-1">Nome *</label>
            <input className="input" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-200 mb-1">Descrição</label>
            <textarea className="input" rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-200 mb-1">Duração (min) *</label>
              <input type="number" className="input" required min={1} value={form.duracaoMin} onChange={e => setForm({ ...form, duracaoMin: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-200 mb-1">Preço (R$) *</label>
              <input type="number" className="input" required min={0} step={0.01} value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-200 mb-1">Preço para agendamento (R$)</label>
            <input type="number" className="input" min={0} step={0.01} placeholder="Deixe em branco para usar o preço normal"
              value={form.precoAgendamento} onChange={e => setForm({ ...form, precoAgendamento: e.target.value })} />
            <p className="text-xs text-stone-500 mt-1">Opcional — use se quiser cobrar diferente de quem reserva com hora marcada.</p>
          </div>
          {error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
