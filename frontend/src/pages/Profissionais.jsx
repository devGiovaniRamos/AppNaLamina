import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';

const emptyForm = { nome: '', fotoUrl: '' };

export default function Profissionais() {
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listarProfissionais().then(setProfissionais).finally(() => setLoading(false));
  }, []);

  function abrirCriar() {
    setEditando(null);
    setForm(emptyForm);
    setError('');
    setModal(true);
  }

  function abrirEditar(p) {
    setEditando(p);
    setForm({ nome: p.nome, fotoUrl: p.fotoUrl || '' });
    setError('');
    setModal(true);
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { nome: form.nome, fotoUrl: form.fotoUrl || null };
      if (editando) {
        const atualizado = await api.atualizarProfissional(editando.id, payload);
        setProfissionais(prev => prev.map(p => p.id === editando.id ? atualizado : p));
      } else {
        const novo = await api.criarProfissional(payload);
        setProfissionais(prev => [...prev, novo]);
      }
      setModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  async function handleDesativar(id) {
    if (!confirm('Desativar este profissional?')) return;
    try {
      await api.desativarProfissional(id);
      setProfissionais(prev => prev.filter(p => p.id !== id));
    } catch { alert('Erro ao desativar'); }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Profissionais</h1>
          <p className="text-slate-500 text-sm mt-1">{profissionais.length} profissional(is) ativo(s)</p>
        </div>
        <button onClick={abrirCriar} className="flex items-center gap-2 btn-primary">
          <Plus size={16} /> Novo profissional
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profissionais.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {p.fotoUrl ? (
                  <img src={p.fotoUrl} alt={p.nome} className="w-10 h-10 rounded-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <User size={18} className="text-slate-400" />
                  </div>
                )}
                <p className="font-medium text-slate-800">{p.nome}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(p)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDesativar(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {profissionais.length === 0 && (
            <div className="col-span-3 text-center py-12 text-slate-400">Nenhum profissional cadastrado</div>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar Profissional' : 'Novo Profissional'}>
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nome *</label>
            <input className="input" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">URL da foto</label>
            <input className="input" type="url" placeholder="https://..." value={form.fotoUrl} onChange={e => setForm({ ...form, fotoUrl: e.target.value })} />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
