import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginAPI, getCurrentUser } from '../api';

const AuthContext = createContext(null);

const defaultPermissions = {
  viewEventos: true,
  viewAgenda: true,
  viewFornecedores: true,
  viewFinanceiro: false,
  viewRelatorios: false,
  viewSincronizacao: false,
  viewAdmin: false,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState(defaultPermissions);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setPermissions(parsed.permissions || defaultPermissions);
      } catch {}
    }
    if (token) {
      getCurrentUser()
        .then(data => {
          const u = data.user;
          const perms = u.permissions || defaultPermissions;
          setUser(u);
          setPermissions(perms);
          localStorage.setItem('user', JSON.stringify(u));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setPermissions(defaultPermissions);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await loginAPI(email, password);
    const u = data.user;
    const perms = u.permissions || defaultPermissions;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    setPermissions(perms);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPermissions(defaultPermissions);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, permissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
