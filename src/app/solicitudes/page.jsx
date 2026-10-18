'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { SolicitudCard } from '@/components/SolicitudCard';
import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { listarSolicitudes } from '@/services/solicitudesService';
import { PRIORIDAD_PESO } from '@/utils/constants';

export default function SolicitudesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <SolicitudesContent />
      </Layout>
    </ProtectedRoute>
  );
}

function SolicitudesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const rol = user?.rol || 'ESTUDIANTE';

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (rol === 'ADMIN' || rol === 'ADMINISTRADOR') {
      router.replace('/administracion');
    } else if (rol === 'SUPERVISOR') {
      router.replace('/gestion');
    }
  }, [rol, router]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listarSolicitudes({}, user);
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.message || 'No se pudieron cargar las solicitudes del servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rol !== 'SUPERVISOR' && rol !== 'ADMIN' && rol !== 'ADMINISTRADOR') {
      cargarDatos();
    }
  }, [rol]);

  const listaProcesada = useMemo(() => {
    const items = [...solicitudes];

    if (rol === 'TECNICO') {
      items.sort((a, b) => {
        const pesoA = PRIORIDAD_PESO[a.prioridad] || 0;
        const pesoB = PRIORIDAD_PESO[b.prioridad] || 0;
        if (pesoB !== pesoA) return pesoB - pesoA;
        const fechaA = new Date(a.fechaCreacion || 0).getTime();
        const fechaB = new Date(b.fechaCreacion || 0).getTime();
        return fechaA - fechaB;
      });
    } else {
      items.sort((a, b) => {
        const fechaA = new Date(a.fechaCreacion || 0).getTime();
        const fechaB = new Date(b.fechaCreacion || 0).getTime();
        return fechaB - fechaA;
      });
    }

    return items;
  }, [solicitudes, rol]);

  return (
    <div className="space-y-4">
      {/* Desktop: Horizontal header with right CTA | Mobile: Stacked header + full-width CTA */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7B1E2B]">
            GESTIÓN DE SERVICIOS
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#1C242B]">
            {rol === 'TECNICO' ? 'Mis asignaciones' : 'Mis solicitudes'}
          </h1>
          <p className="mt-2 text-xs text-[#5A6570]">
            {rol === 'TECNICO'
              ? `Solo solicitudes de ${user?.nombre || 'Luis Rojas'} · Prioridad de mayor a menor; a igual prioridad, las más antiguas primero.`
              : 'Consulta el estado y el seguimiento de tus servicios.'}
          </p>
        </div>

        {rol === 'ESTUDIANTE' && (
          <Button asChild className="w-full sm:w-auto sm:px-6 h-10 font-bold shrink-0">
            <Link href="/solicitudes/nueva">Registrar nueva solicitud</Link>
          </Button>
        )}
      </div>

      {error && <ErrorMessage message={error} onRetry={cargarDatos} />}

      {loading ? (
        <Loading text="Cargando solicitudes..." />
      ) : listaProcesada.length === 0 ? (
        <EmptyState
          title={
            rol === 'TECNICO'
              ? 'No tienes asignaciones pendientes'
              : 'Aún no tienes solicitudes registradas'
          }
          description={
            rol === 'TECNICO'
              ? 'Cuando el supervisor del área te asigne una solicitud, aparecerá listada aquí por prioridad.'
              : 'Crea tu primera solicitud para reportar un problema o pedir un servicio.'
          }
          action={
            rol === 'ESTUDIANTE' ? (
              <Button asChild className="w-full sm:w-auto sm:px-6 h-10 font-bold">
                <Link href="/solicitudes/nueva">Registrar nueva solicitud</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
          {listaProcesada.map((solicitud) => (
            <SolicitudCard
              key={solicitud.id}
              solicitud={solicitud}
              viewRole={rol}
            />
          ))}
        </div>
      )}
    </div>
  );
}
