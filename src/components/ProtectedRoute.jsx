'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ allowedRoles = null, children }) {
  const { hydrated, isAuthenticated, user } = useAuth();
  const router = useRouter();

  const normalizedAllowed = allowedRoles
    ? allowedRoles.flatMap((r) =>
        r === 'ADMIN' || r === 'ADMINISTRADOR'
          ? ['ADMIN', 'ADMINISTRADOR']
          : [r]
      )
    : null;

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (normalizedAllowed && !normalizedAllowed.includes(user.rol)) {
      const fallback =
        user.rol === 'ADMINISTRADOR' || user.rol === 'ADMIN'
          ? '/administracion'
          : user.rol === 'SUPERVISOR'
          ? '/gestion'
          : '/solicitudes';
      router.replace(fallback);
    }
  }, [hydrated, isAuthenticated, user, normalizedAllowed, router]);

  if (!hydrated || !isAuthenticated || !user) {
    return null;
  }

  if (normalizedAllowed && !normalizedAllowed.includes(user.rol)) {
    return null;
  }

  return children;
}

export default ProtectedRoute;
