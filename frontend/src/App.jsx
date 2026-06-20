import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Agendamentos from './pages/Agendamentos';
import Servicos from './pages/Servicos';
import Profissionais from './pages/Profissionais';
import Pagamentos from './pages/Pagamentos';
import Configuracoes from './pages/Configuracoes';
import Cadastro from './pages/Cadastro';

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
            <Route path="pagamentos" element={<Pagamentos />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
