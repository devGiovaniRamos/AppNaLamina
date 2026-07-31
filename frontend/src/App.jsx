import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Agendamentos from './pages/Agendamentos';
import Servicos from './pages/Servicos';
import Profissionais from './pages/Profissionais';
import Financeiro from './pages/Financeiro';
import Estoque from './pages/Estoque';
import Venda from './pages/Venda';
import Campeonato from './pages/Campeonato';
import Assinaturas from './pages/Assinaturas';
import Fila from './pages/Fila';
import Configuracoes from './pages/Configuracoes';
import Cadastro from './pages/Cadastro';
import Agendar from './pages/public/Agendar';
import Assinar from './pages/public/Assinar';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/agendar/:slug" element={<Agendar />} />
          <Route path="/assinar/:slug" element={<Assinar />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/agendamentos" replace />} />
            <Route path="agendamentos" element={<Agendamentos />} />
            <Route path="servicos" element={<Servicos />} />
            <Route path="profissionais" element={<Profissionais />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="estoque" element={<Estoque />} />
            <Route path="venda" element={<Venda />} />
            <Route path="campeonato" element={<Campeonato />} />
            <Route path="assinaturas" element={<Assinaturas />} />
            <Route path="fila" element={<Fila />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
