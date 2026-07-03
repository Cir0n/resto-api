import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../api/authService';
import { decodeToken, isTokenExpired } from '../utils/jwt';

const AuthContext = createContext(null);

function userFromToken(token) {
  if (!token) return null;
  const decoded = decodeToken(token);
  if (!decoded || isTokenExpired(decoded)) return null;
  return { id: decoded.userId, role: decoded.role };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => userFromToken(localStorage.getItem('token')));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    setUser(userFromToken(token));
  }, [token]);

  async function login(email, password) {
    const { token: newToken } = await authService.login(email, password);
    setToken(newToken);
  }

  async function signup(formData) {
    await authService.signup(formData);
    await login(formData.email, formData.password);
  }

  function logout() {
    setToken(null);
  }

  const value = {
    token,
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
