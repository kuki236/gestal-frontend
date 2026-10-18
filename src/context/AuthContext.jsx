'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  isTokenUsable,
  loginApi,
  onSessionExpired,
  saveAuthSession
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const storedToken = getStoredToken();
    // Un JWT real vencido no sirve: se descarta antes de llamar al backend.
    if (storedToken && storedToken.split('.').length === 3 && !isTokenUsable(storedToken)) {
      clearAuthSession();
      setSessionExpired(true);
    } else {
      setToken(storedToken);
      setUser(getStoredUser());
    }
    setHydrated(true);

    return onSessionExpired(() => {
      setToken(null);
      setUser(null);
      setSessionExpired(true);
    });
  }, []);

  async function login(correo, contrasena) {
    const response = await loginApi(correo, contrasena);
    saveAuthSession(response);
    setSessionExpired(false);
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
    sessionExpired,
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
