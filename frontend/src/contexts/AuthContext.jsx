import { createContext, useContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { login as loginApi } from '../api';

const AuthContext = createContext(null);

function getUserFromStorage() {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) return null;
    return { ...decoded, nome: localStorage.getItem('nome') || decoded.sub };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUserFromStorage);

  const setSession = ({ accessToken, refreshToken, nome }) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (nome) localStorage.setItem('nome', nome);
    const decoded = jwtDecode(accessToken);
    setUser({ ...decoded, nome: nome || decoded.sub });
  };

  const login = async (email, senha) => {
    const data = await loginApi({ email, senha });
    setSession(data);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, setSession, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
