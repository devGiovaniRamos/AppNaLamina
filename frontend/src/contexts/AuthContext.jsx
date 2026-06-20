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
    return { ...decoded, nome: localStorage.getItem('nome') };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUserFromStorage);

  const login = async (email, senha, accessToken, refreshToken) => {
    let data;
    if (accessToken) {
      data = { accessToken, refreshToken, nome: null };
    } else {
      data = await loginApi({ email, senha });
    }
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    if (data.nome) localStorage.setItem('nome', data.nome);
    const decoded = jwtDecode(data.accessToken);
    setUser({ ...decoded, nome: data.nome || decoded.sub });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
