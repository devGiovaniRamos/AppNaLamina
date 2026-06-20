import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../api';

export default function Cadastro() {
  const [form, setForm] = useState({ nome: '', nomeBarbearia: '', email: '', senha: '', confirmarSenha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.senha !== form.confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }
    if (form.senha.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { accessToken, refreshToken } = await api.registro({
        nome: form.nome,
        nomeBarbearia: form.nomeBarbearia,
        email: form.email,
        senha: form.senha,
      });
      login(null, null, accessToken, refreshToken);
      navigate('/agendamentos');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-5xl">✂️</span>
          <h1 className="text-2xl font-bold text-slate-800 mt-3">NaLâmina</h1>
          <p className="text-slate-500 text-sm mt-1">Criar nova conta</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Seu nome *</label>
            <input type="text" className="input" required placeholder="João Silva"
              value={form.nome} onChange={set('nome')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome da barbearia *</label>
            <input type="text" className="input" required placeholder="Barbearia do João"
              value={form.nomeBarbearia} onChange={set('nomeBarbearia')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input type="email" className="input" required placeholder="seu@email.com"
              value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha *</label>
            <input type="password" className="input" required placeholder="Mínimo 8 caracteres"
              value={form.senha} onChange={set('senha')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar senha *</label>
            <input type="password" className="input" required placeholder="••••••••"
              value={form.confirmarSenha} onChange={set('confirmarSenha')} />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading} className="w-full btn-primary py-2.5">
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
