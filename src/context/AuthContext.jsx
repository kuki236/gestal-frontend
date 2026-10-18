'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  loginApi,
  saveAuthSession
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setToken(getStoredToken());
    setUser(getStoredUser());
    setHydrated(true);
  }, []);

  async function login(correo, contrasena) {
    const response = await loginApi(correo, contrasena);
    saveAuthSession(response);
    setToken(response.token);
    const nextUser = {
      correo: response.correo,
      nombre: response.nombre,
      rol: response.rol,
      area: response.area || null
    };
    setUser(nextUser);
    return nextUser;
  }

  function logout() {
    clearAuthSession();
    setToken(null);
    setUser(null);
  }

  const value = {
    token,
    user,
    hydrated,
    isAuthenticated: Boolean(token && user),
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  }
  return ctx;
}
