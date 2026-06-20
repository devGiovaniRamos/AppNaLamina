import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';

const emptyForm = { nome: '', descricao: '', duracaoMin: '', preco: '' };

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
    setForm({ nome: s.nome, descricao: s.descricao || '', duracaoMin: s.duracaoMin, preco: s.preco });
    setError('');
    setModal(true);
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, duracaoMin: Number(form.duracaoMin), preco: Number(form.preco) };
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
          <h1 className="text-2xl font-bold text-slate-800">Serviços</h1>
          <p className="text-slate-500 text-sm mt-1">{servicos.length} serviço(s) ativo(s)</p>
        </div>
        <button onClick={abrirCriar} className="flex items-center gap-2 btn-primary">
          <Plus size={16} /> Novo serviço
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Carregando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Duração</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Preço</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {servicos.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{s.nome}</p>
                    {s.descricao && <p className="text-slate-400 text-xs mt-0.5">{s.descricao}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.duracaoMin} min</td>
                  <td className="px-4 py-3 text-slate-600">R$ {Number(s.preco).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => abrirEditar(s)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg mr-1">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDesativar(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {servicos.length === 0 && (
            <div className="text-center py-12 text-slate-400">Nenhum serviço cadastrado</div>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar Serviço' : 'Novo Serviço'}>
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nome *</label>
            <input className="input" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Descrição</label>
            <textarea className="input" rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Duração (min) *</label>
              <input type="number" className="input" required min={1} value={form.duracaoMin} onChange={e => setForm({ ...form, duracaoMin: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Preço (R$) *</label>
              <input type="number" className="input" required min={0} step={0.01} value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} />
            </div>
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
