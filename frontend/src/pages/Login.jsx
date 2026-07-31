import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', senha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.senha);
      navigate('/agendamentos');
    } catch {
      setError('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      <div className="bg-stone-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-stone-800">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-gold-500 flex items-center justify-center mx-auto">
            <Scissors size={24} className="text-stone-900" />
          </div>
          <h1 className="text-2xl font-serif font-semibold text-stone-50 mt-4">NaLâmina</h1>
          <p className="text-stone-400 text-sm mt-1">Painel de Administração</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-200 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              className="input"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-200 mb-1">Senha</label>
            <input
              type="password"
              value={form.senha}
              onChange={e => setForm({ ...form, senha: e.target.value })}
              required
              className="input"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-center text-sm text-stone-400 mt-6">
          Não tem uma conta?{' '}
          <Link to="/cadastro" className="text-gold-400 hover:underline font-medium">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
