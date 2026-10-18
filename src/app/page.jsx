'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { hydrated, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    const target =
      user.rol === 'ADMINISTRADOR' || user.rol === 'ADMIN'
        ? '/administracion'
        : user.rol === 'SUPERVISOR'
        ? '/gestion'
        : '/solicitudes';
    router.replace(target);
  }, [hydrated, isAuthenticated, user, router]);

  return null;
}
