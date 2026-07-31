import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Scissors, Users, CreditCard, Boxes, ShoppingCart, Trophy, BadgeCheck, Ticket, Settings, LogOut } from 'lucide-react';
import NotificacaoSino from './NotificacaoSino';

const navItems = [
  { to: '/agendamentos', icon: Calendar, label: 'Agendamentos' },
  { to: '/fila', icon: Ticket, label: 'Fila de Espera' },
  { to: '/servicos', icon: Scissors, label: 'Serviços' },
  { to: '/profissionais', icon: Users, label: 'Profissionais' },
  { to: '/financeiro', icon: CreditCard, label: 'Financeiro' },
  { to: '/estoque', icon: Boxes, label: 'Estoque' },
  { to: '/venda', icon: ShoppingCart, label: 'Venda' },
  { to: '/campeonato', icon: Trophy, label: 'Campeonato' },
  { to: '/assinaturas', icon: BadgeCheck, label: 'Assinaturas' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
];

const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const iniciais = (user?.nome || '?').trim().split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();

  return (
    <div className="flex h-screen bg-stone-950 font-sans">
      <aside className="w-64 bg-stone-950 border-r border-stone-800 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-stone-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold-500 flex items-center justify-center shrink-0">
            <Scissors size={17} className="text-stone-900" />
          </div>
          <h1 className="text-stone-50 font-serif font-semibold text-lg tracking-tight">NaLâmina</h1>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-gold-500 text-stone-900 font-medium'
                    : 'text-stone-400 hover:bg-stone-900 hover:text-stone-100'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-stone-800 space-y-1">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-xs font-mono font-medium text-gold-400 shrink-0">
              {iniciais}
            </div>
            <div className="min-w-0">
              <p className="text-stone-100 text-sm font-medium truncate">{user?.nome}</p>
              <p className="text-stone-500 text-xs truncate">Proprietário</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-stone-400 hover:bg-stone-900 hover:text-stone-100 w-full transition-colors"
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="flex items-center justify-between px-6 py-3 bg-stone-950 border-b border-stone-800 shrink-0">
          <p className="font-mono text-xs text-stone-500 capitalize">{dataHoje}</p>
          <NotificacaoSino />
        </header>
        <div className="flex-1 overflow-auto bg-stone-900/40">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
