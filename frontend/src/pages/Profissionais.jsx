import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';
import FotoUpload from '../components/FotoUpload';

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
          <h1 className="text-2xl font-serif font-semibold text-stone-50">Profissionais</h1>
          <p className="text-stone-400 text-sm mt-1">{profissionais.length} profissional(is) ativo(s)</p>
        </div>
        <button onClick={abrirCriar} className="flex items-center gap-2 btn-primary">
          <Plus size={16} /> Novo profissional
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-stone-500">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profissionais.map(p => (
            <div key={p.id} className="bg-stone-900 rounded-xl border border-stone-800 shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {p.fotoUrl ? (
                  <img src={p.fotoUrl} alt={p.nome} className="w-10 h-10 rounded-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center">
                    <User size={18} className="text-stone-500" />
                  </div>
                )}
                <p className="font-medium text-stone-50">{p.nome}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(p)} className="p-1.5 text-stone-500 hover:text-gold-400 hover:bg-gold-500/10 rounded-lg">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDesativar(p.id)} className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {profissionais.length === 0 && (
            <div className="col-span-3 text-center py-12 text-stone-500">Nenhum profissional cadastrado</div>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar Profissional' : 'Novo Profissional'}>
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-200 mb-1">Nome *</label>
            <input className="input" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-200 mb-1">Foto</label>
            <FotoUpload shape="circle" value={form.fotoUrl} onChange={fotoUrl => setForm({ ...form, fotoUrl })} />
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
