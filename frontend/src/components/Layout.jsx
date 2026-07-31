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

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-60 bg-slate-900 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-slate-700">
          <h1 className="text-white font-bold text-lg">✂️ NaLâmina</h1>
          <p className="text-slate-400 text-xs mt-1 truncate">{user?.nome}</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white w-full transition-colors"
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="flex items-center justify-end px-6 py-2.5 bg-white border-b border-slate-100 shrink-0">
          <NotificacaoSino />
        </header>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
