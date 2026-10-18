'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { SolicitudCard } from '@/components/SolicitudCard';
import { EstadoBadge } from '@/components/EstadoBadge';
import { Loading } from '@/components/Loading';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  BoxField,
  BoxSelect,
  BoxTextarea,
} from '@/components/ui/box-field';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';
import {
  listarSolicitudes,
  obtenerSolicitudPorId,
  cambiarEstadoSolicitud,
  asignarSolicitud,
  listarCategorias,
  listarTecnicos,
} from '@/services/solicitudesService';
import {
  ESTADOS,
  ESTADOS_CONFIG,
  PRIORIDADES,
  PRIORIDAD_LABELS,
} from '@/utils/constants';
import { formatDateTime, formatShortDateTime } from '@/utils/formatters';

export default function GestionPage() {
  return (
    <ProtectedRoute
      allowedRoles={['TECNICO', 'SUPERVISOR', 'ADMIN', 'ADMINISTRADOR']}
    >
      <Layout>
        <Suspense fallback={<Loading text="Cargando módulo de gestión..." />}>
          <GestionRouter />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}

function GestionRouter() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketId = searchParams.get('id');
  const rol = user?.rol || 'TECNICO';

  useEffect(() => {
    if (rol === 'TECNICO' && !ticketId) {
      router.replace('/solicitudes');
    }
  }, [rol, ticketId, router]);

  if (rol === 'TECNICO') {
    if (!ticketId) return <Loading text="Redirigiendo a mis asignaciones..." />;
    return <TecnicoAtencionView id={ticketId} user={user} />;
  }

  return <SupervisorGestionAreaView initialTicketId={ticketId} user={user} />;
}

/* ============================================================================
 * 1. VISTA TÉCNICO: Atención de solicitud
 *    (Exact Figma d-gestion-tecnico, d-gestion-proceso, d-gestion-resuelto)
 * ========================================================================== */
function TecnicoAtencionView({ id, user }) {
  const router = useRouter();
  const { toast } = useToast();
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cargarSolicitud = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await obtenerSolicitudPorId(id);
      setSolicitud(data);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar la solicitud asignada.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitud();
  }, [id]);

  const handleTransicionTecnico = async (nuevoEstado) => {
    setError('');
    try {
      setSubmitting(true);
      const comentarioAccion =
        nuevoEstado === 'EN_ATENCION'
          ? 'Atención técnica iniciada.'
          : 'Resolución técnica registrada.';

      await cambiarEstadoSolicitud(
        solicitud.id,
        nuevoEstado,
        comentarioAccion,
        user?.nombre
      );
      await cargarSolicitud();
      toast({
        variant: 'success',
        title:
          nuevoEstado === 'EN_ATENCION'
            ? 'Atención iniciada'
            : 'Resolución registrada',
        description:
          nuevoEstado === 'EN_ATENCION'
            ? `${solicitud.codigo} pasó al estado En proceso.`
            : `${solicitud.codigo} pasó al estado Resuelto.`,
      });
    } catch (err) {
      setError(
        err?.message || 'No se pudo actualizar el estado de la solicitud.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading text="Cargando atención de solicitud..." />;

  if (!solicitud) {
    return (
      <div className="space-y-4">
        <ErrorMessage
          message={error || 'Solicitud no encontrada.'}
          onRetry={cargarSolicitud}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/solicitudes')}
          className="w-full h-10 font-bold"
        >
          Volver a mis asignaciones
        </Button>
      </div>
    );
  }

  const prioridadLabel =
    PRIORIDAD_LABELS[solicitud.prioridad] || solicitud.prioridad || 'Alta';
  const fechaActualizacion = formatDateTime(
    solicitud.actualizadoEn || solicitud.fechaCreacion
  );
  const horaCorta = formatShortDateTime(
    solicitud.actualizadoEn || solicitud.fechaCreacion
  );

  const isAsignado = solicitud.estado === 'ASIGNADO';
  const isRechazado = solicitud.estado === 'RECHAZADO';
  const isEnProceso =
    solicitud.estado === 'EN_PROCESO' || solicitud.estado === 'EN_ATENCION';
  const isResuelto =
    solicitud.estado === 'RESUELTO' || solicitud.estado === 'CERRADO';

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[820px]">
      {/* Header (Exact Figma d-gestion-tecnico) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7B1E2B]">
            GESTIÓN DE SERVICIOS
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#1C242B]">
            Atención de solicitud
          </h1>
          <p className="mt-2 text-xs text-[#5A6570]">
            {solicitud.codigo}
            {solicitud.categoriaNombre ? ` · ${solicitud.categoriaNombre}` : ''} ·
            Prioridad {prioridadLabel}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/solicitudes')}
          className="hidden sm:inline-flex h-10 px-4 font-bold shrink-0"
        >
          Volver a mis asignaciones
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Main White Card */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5">
          <h2 className="text-base sm:text-lg font-extrabold text-[#1C242B]">
            {solicitud.titulo}
          </h2>

          <div className="shrink-0">
            <EstadoBadge estado={solicitud.estado} />
          </div>
        </div>

        {/* Mobile: vertical stack | Desktop: 2-column metadata grid */}
        <div className="space-y-1 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2.5 sm:rounded-lg sm:bg-[#FAF8F5] sm:border sm:border-[#EBE8E1] sm:p-3.5 text-xs text-[#2E3842] leading-relaxed">
          <div>
            <span className="font-semibold text-[#5A6570]">Solicitante:</span>{' '}
            {solicitud.solicitanteNombre || '—'}
          </div>
          <div>
            <span className="font-semibold text-[#5A6570]">Ubicación:</span>{' '}
            {solicitud.ubicacion || '—'}
          </div>
          <div>
            <span className="font-semibold text-[#5A6570]">
              Técnico responsable:
            </span>{' '}
            {solicitud.responsableNombre || user?.nombre}
          </div>
          <div>
            <span className="font-semibold text-[#5A6570]">
              Última actualización:
            </span>{' '}
            {fechaActualizacion || '—'}
          </div>
        </div>

        {/* Estado Asignado (d-gestion-tecnico) */}
        {isAsignado && (
          <>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              <Button
                type="button"
                onClick={() => handleTransicionTecnico('EN_ATENCION')}
                disabled={submitting}
                className="w-full sm:w-auto sm:px-6 h-10 font-bold"
              >
                {submitting ? 'Iniciando atención...' : 'Iniciar atención'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/solicitudes/${solicitud.id}`)}
                className="w-full sm:w-auto sm:px-6 h-10 font-bold"
              >
                Ver detalle y comentarios
              </Button>
            </div>

            <p className="text-[11px] text-[#5A6570]">
              Transición disponible: Asignado → En proceso.
            </p>
          </>
        )}

        {/* Estado En proceso (d-gestion-proceso) */}
        {isEnProceso && (
          <>
            <Alert variant="success" className="py-3.5">
              <AlertTitle>Atención iniciada</AlertTitle>
              <AlertDescription>
                Asignado → En proceso · {horaCorta} · {user?.nombre}.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <Button
                type="button"
                onClick={() => handleTransicionTecnico('RESUELTO')}
                disabled={submitting}
                className="w-full sm:w-auto sm:px-6 h-10 font-bold"
              >
                {submitting
                  ? 'Registrando resolución...'
                  : 'Marcar como resuelto'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/solicitudes/${solicitud.id}`)}
                className="w-full sm:w-auto sm:px-6 h-10 font-bold"
              >
                Ver detalle y comentarios
              </Button>
            </div>

            <p className="text-[11px] text-[#5A6570]">
              El cierre y el rechazo corresponden al supervisor del área.
            </p>
          </>
        )}

        {isRechazado && (
          <Alert variant="destructive" className="py-3.5">
            <AlertTitle>Solicitud rechazada</AlertTitle>
            <AlertDescription>
              {solicitud.motivoRechazo
                ? `Motivo: ${solicitud.motivoRechazo}`
                : 'El supervisor rechazó esta solicitud.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Estado Resuelto (d-gestion-resuelto) */}
        {isResuelto && (
          <>
            <Alert variant="success" className="py-3.5">
              <AlertTitle>
                {solicitud.estado === 'CERRADO'
                  ? 'Solicitud cerrada'
                  : 'Resolución registrada'}
              </AlertTitle>
              <AlertDescription>
                {solicitud.estado === 'CERRADO'
                  ? `El supervisor confirmó la atención · ${horaCorta}.`
                  : `En proceso → Resuelto · ${horaCorta} · ${user?.nombre}. El supervisor revisará la atención antes del cierre.`}
              </AlertDescription>
            </Alert>

            {solicitud.estado !== 'CERRADO' && (
              <p className="text-[11px] text-[#5A6570]">
                El cierre y el rechazo corresponden al supervisor del área.
              </p>
            )}
          </>
        )}
      </Card>

      {/* Bottom Button outside card (Mobile view) */}
      <div className="sm:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/solicitudes')}
          className="w-full h-10 font-bold"
        >
          Volver a mis asignaciones
        </Button>
      </div>
    </div>
  );
}

/* ============================================================================
 * 2. VISTA SUPERVISOR: Gestión de área + Gestionar solicitud + Rechazar + Cerrar
 *    (Exact Figma d-gestion, d-gestion-filtrada, d-gestion-sin-resultados,
 *     d-asignacion-error, d-gestion-asignada, d-gestion-reasignada,
 *     d-gestion-resuelta, d-gestion-cerrada, d-gestion-rechazada,
 *     d-rechazo, d-rechazo-error, d-confirmar-cierre)
 * ========================================================================== */
function SupervisorGestionAreaView({ initialTicketId, user }) {
  const router = useRouter();
  const { toast } = useToast();
  // El backend solo deja asignar, cerrar y rechazar al supervisor: el
  // administrador ve las áreas en modo consulta.
  const isAdmin = user?.rol === 'ADMINISTRADOR' || user?.rol === 'ADMIN';

  const [solicitudes, setSolicitudes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter controls
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');

  // Currently selected ticket for "Gestionar GEST-2026-XXX" card
  const [selectedId, setSelectedId] = useState(initialTicketId || null);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);

  // Sub-screen mode: 'MAIN' | 'RECHAZAR' | 'CONFIRMAR_CIERRE'
  const [viewMode, setViewMode] = useState('MAIN');

  // Management form fields
  const [responsableId, setResponsableId] = useState('');
  const [prioridad, setPrioridad] = useState('MEDIA');
  const [assignError, setAssignError] = useState('');
  const [savingAssign, setSavingAssign] = useState(false);
  const [assignBanner, setAssignBanner] = useState(null);

  // Reject form fields
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Close confirmation state
  const [submittingClose, setSubmittingClose] = useState(false);

  const sincronizarSeleccion = (sol) => {
    setSelectedSolicitud(sol);
    if (sol) {
      setSelectedId(sol.id);
      setResponsableId(sol.responsableId ? String(sol.responsableId) : '');
      setPrioridad(sol.prioridad || 'MEDIA');
    }
  };

  const cargarTodo = async (
    filtros = { categoriaId: '', estado: '', prioridad: '' },
    preferId = selectedId || initialTicketId
  ) => {
    try {
      setLoading(true);
      setError('');
      const [sols, cats, tecs] = await Promise.all([
        listarSolicitudes(filtros, user),
        listarCategorias(),
        listarTecnicos(isAdmin ? null : user?.area),
      ]);

      const lista = Array.isArray(sols) ? sols : [];
      setSolicitudes(lista);
      setCategorias(Array.isArray(cats) ? cats : []);
      setTecnicos(Array.isArray(tecs) ? tecs : []);

      if (preferId) {
        const found = lista.find((s) => String(s.id) === String(preferId));
        if (found) {
          sincronizarSeleccion(found);
          return;
        }
        try {
          const single = await obtenerSolicitudPorId(preferId);
          if (single) {
            sincronizarSeleccion(single);
            return;
          }
        } catch {
          // fallback to first in list
        }
      }

      if (lista.length > 0) {
        sincronizarSeleccion(lista[0]);
      } else {
        setSelectedSolicitud(null);
      }
    } catch (err) {
      setError(
        err?.message || 'No se pudieron cargar las solicitudes del área.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo(
      { categoriaId: '', estado: '', prioridad: '' },
      initialTicketId
    );
  }, [initialTicketId]);

  const handleAplicarFiltros = (e) => {
    e.preventDefault();
    setAssignBanner(null);
    cargarTodo({
      categoriaId: filtroCategoria,
      estado: filtroEstado,
      prioridad: filtroPrioridad,
    });
  };

  const handleLimpiarFiltros = () => {
    setFiltroCategoria('');
    setFiltroEstado('');
    setFiltroPrioridad('');
    setAssignBanner(null);
    cargarTodo({ categoriaId: '', estado: '', prioridad: '' });
  };

  const handleSelectTicket = (sol) => {
    setAssignError('');
    setAssignBanner(null);
    sincronizarSeleccion(sol);
  };

  const handleGuardarAsignacion = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssignBanner(null);
    setError('');

    if (!responsableId) {
      setAssignError('Selecciona un técnico válido');
      return;
    }

    try {
      setSavingAssign(true);
      const prevEstado = selectedSolicitud.estado;
      const prevResponsable = selectedSolicitud.responsableNombre;
      const tecnicoObj = tecnicos.find(
        (t) => String(t.id) === String(responsableId)
      );
      const nombreTecnico = tecnicoObj?.nombre || 'el técnico seleccionado';
      const prioLabel = PRIORIDAD_LABELS[prioridad] || prioridad || 'Alta';

      await asignarSolicitud(
        selectedSolicitud.id,
        Number(responsableId),
        nombreTecnico,
        user?.nombre,
        prioridad
      );

      const updated = await obtenerSolicitudPorId(selectedSolicitud.id);
      sincronizarSeleccion(updated);

      // Update list item as well
      setSolicitudes((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );

      const horaCorta = formatShortDateTime(updated.actualizadoEn);

      if (prevEstado === 'NUEVO' || prevEstado === 'REGISTRADO') {
        // Exact Figma d-gestion-asignada
        setAssignBanner({
          title: 'Asignación guardada',
          text: `${nombreTecnico} · Prioridad ${prioLabel}. Nuevo → Asignado · ${horaCorta} · ${user?.nombre}.`,
        });
      } else if (prevResponsable && prevResponsable !== nombreTecnico) {
        // Exact Figma d-gestion-reasignada
        setAssignBanner({
          title: 'Asignación guardada',
          text: `Se reasignó a ${nombreTecnico}. Se conserva el estado ${ESTADOS_CONFIG[updated.estado]?.label || 'Asignado'} y la prioridad ${prioLabel}.`,
        });
      } else {
        setAssignBanner({
          title: 'Asignación guardada',
          text: `${nombreTecnico} · Prioridad ${prioLabel} actualizada correctamente.`,
        });
      }

      toast({
        variant: 'success',
        title: 'Asignación guardada',
        description: `${selectedSolicitud.codigo} asignada a ${nombreTecnico} (Prioridad ${prioLabel}).`,
      });
    } catch (err) {
      setError(err?.message || 'No se pudo guardar la asignación.');
    } finally {
      setSavingAssign(false);
    }
  };

  const handleConfirmarRechazo = async (e) => {
    e.preventDefault();
    setRejectError('');
    if (!motivoRechazo.trim()) {
      setRejectError('El motivo de rechazo es obligatorio');
      return;
    }

    try {
      setSubmittingReject(true);
      await cambiarEstadoSolicitud(
        selectedSolicitud.id,
        'RECHAZADO',
        motivoRechazo.trim(),
        user?.nombre
      );
      const updated = await obtenerSolicitudPorId(selectedSolicitud.id);
      sincronizarSeleccion(updated);
      setSolicitudes((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setMotivoRechazo('');
      setViewMode('MAIN');
      toast({
        variant: 'destructive',
        title: 'Rechazo confirmado',
        description: `${selectedSolicitud.codigo} cambió al estado Rechazado.`,
      });
    } catch (err) {
      setRejectError(err?.message || 'No se pudo rechazar la solicitud.');
    } finally {
      setSubmittingReject(false);
    }
  };

  const handleConfirmarCierre = async () => {
    try {
      setSubmittingClose(true);
      await cambiarEstadoSolicitud(
        selectedSolicitud.id,
        'CERRADO',
        'Atención verificada.',
        user?.nombre
      );
      const updated = await obtenerSolicitudPorId(selectedSolicitud.id);
      sincronizarSeleccion(updated);
      setSolicitudes((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setViewMode('MAIN');
      toast({
        variant: 'success',
        title: 'Cierre confirmado',
        description: `${selectedSolicitud.codigo} cambió al estado Cerrado.`,
      });
    } catch (err) {
      setError(err?.message || 'No se pudo cerrar la solicitud.');
      setViewMode('MAIN');
    } finally {
      setSubmittingClose(false);
    }
  };

  /* ------------------------------------------------------------------------
   * SUB-VISTA A: Rechazar solicitud (Exact Figma d-rechazo & d-rechazo-error)
   * ---------------------------------------------------------------------- */
  if (viewMode === 'RECHAZAR' && selectedSolicitud) {
    const estadoActualLabel =
      ESTADOS_CONFIG[selectedSolicitud.estado]?.label ||
      selectedSolicitud.estado ||
      'Nuevo';

    return (
      <div className="space-y-4 max-w-[680px]">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7B1E2B]">
            GESTIÓN DE SERVICIOS
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#1C242B]">
            Rechazar solicitud
          </h1>
          <p className="mt-2 text-xs text-[#5A6570]">
            {selectedSolicitud.codigo} · Estado actual {estadoActualLabel}
          </p>
        </div>

        <Card className="p-5 sm:p-6 space-y-3.5">
          <div>
            <h2 className="text-base font-extrabold text-[#1C242B]">
              Motivo del rechazo
            </h2>
            <p className="mt-1.5 text-xs text-[#5A6570]">
              Explica por qué esta solicitud no debe continuar. El motivo será
              visible para el solicitante.
            </p>
          </div>

          <form onSubmit={handleConfirmarRechazo} className="space-y-3">
            <BoxField label="Motivo" required error={rejectError}>
              <BoxTextarea
                rows={3}
                placeholder="La incidencia ya fue registrada en GEST-2026-000."
                value={motivoRechazo}
                onChange={(e) => {
                  setMotivoRechazo(e.target.value);
                  if (rejectError) setRejectError('');
                }}
              />
            </BoxField>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              <Button
                type="submit"
                variant="destructive"
                disabled={submittingReject}
                className="w-full sm:w-auto sm:px-6 h-10 font-bold"
              >
                {submittingReject ? 'Confirmando rechazo...' : 'Confirmar rechazo'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRejectError('');
                  setViewMode('MAIN');
                }}
                disabled={submittingReject}
                className="w-full sm:w-auto sm:px-6 h-10 font-bold"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------------------
   * SUB-VISTA B: Confirmar cierre (Exact Figma d-confirmar-cierre)
   * ---------------------------------------------------------------------- */
  if (viewMode === 'CONFIRMAR_CIERRE' && selectedSolicitud) {
    const estadoActualLabel =
      ESTADOS_CONFIG[selectedSolicitud.estado]?.label || 'Resuelto';

    return (
      <div className="space-y-4 max-w-[680px]">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7B1E2B]">
            GESTIÓN DE SERVICIOS
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#1C242B]">
            Confirmar cierre
          </h1>
          <p className="mt-2 text-xs text-[#5A6570]">
            {selectedSolicitud.codigo} · Estado actual {estadoActualLabel}
          </p>
        </div>

        <Card className="p-5 sm:p-6 space-y-3.5">
          <div>
            <h2 className="text-base font-extrabold text-[#1C242B]">
              ¿Confirmas que la atención es conforme?
            </h2>
            <p className="mt-1.5 text-xs text-[#5A6570]">
              Se registrará el estado Cerrado con tu usuario y fecha. La
              solicitud quedará disponible para consulta y no admitirá nuevas
              ediciones.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <Button
              type="button"
              onClick={handleConfirmarCierre}
              disabled={submittingClose}
              className="w-full sm:w-auto sm:px-6 h-10 font-bold"
            >
              {submittingClose ? 'Cerrando solicitud...' : 'Confirmar cierre'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setViewMode('MAIN')}
              disabled={submittingClose}
              className="w-full sm:w-auto sm:px-6 h-10 font-bold"
            >
              Cancelar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------------------
   * VISTA PRINCIPAL: Gestión de área (Exact Figma d-gestion)
   * - Mobile (< md / < lg): Vertical stack (Filtros -> Listado -> Gestionar)
   * - Desktop (md+ / lg+):
   *   1. Filtros del área in 3-column horizontal grid (md:grid-cols-3 items-start)
   *      with horizontal action buttons on the right
   *   2. 2-column Master-Detail split (lg:grid-cols-[1.15fr_0.85fr] items-start):
   *      Left column = Listado de solicitudes | Right column = Sticky Gestionar card
   * ---------------------------------------------------------------------- */
  const categoriasDelArea =
    !isAdmin && user?.area
      ? categorias.filter(
          (c) => (c.areaNombre || '').toLowerCase() === user.area.toLowerCase()
        )
      : categorias;

  const isSelectedNuevo =
    selectedSolicitud?.estado === 'NUEVO' ||
    selectedSolicitud?.estado === 'REGISTRADO';
  const isSelectedResuelto = selectedSolicitud?.estado === 'RESUELTO';
  const isSelectedCerrado = selectedSolicitud?.estado === 'CERRADO';
  const isSelectedRechazado = selectedSolicitud?.estado === 'RECHAZADO';

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header (Exact Figma d-gestion) */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7B1E2B]">
            GESTIÓN DE SERVICIOS
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#1C242B]">
            {isAdmin ? 'Supervisión de áreas' : 'Gestión de área'}
          </h1>
          <p className="mt-2 text-xs text-[#5A6570]">
            {isAdmin
              ? 'Todas las áreas · Vista de consulta. La asignación y los cambios de estado los realiza el supervisor de cada área.'
              : user?.area
              ? `${user.area} · Solicitudes dirigidas a tu área.`
              : 'Solicitudes de todas las áreas.'}
          </p>
        </div>

        {!loading && (
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white border border-[#EBE8E1] px-3 py-1 text-xs font-semibold text-[#5A6570]">
            <span>Total en vista:</span>
            <span className="font-extrabold text-[#1C242B]">
              {solicitudes.length}
            </span>
          </div>
        )}
      </div>

      {/* Card 1: Filtros del área (Mobile: stacked | Desktop: 3-column grid + horizontal buttons) */}
      <Card className="p-5 sm:p-6 space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#1C242B]">
            Filtros del área
          </h2>
          {(filtroCategoria || filtroEstado || filtroPrioridad) && (
            <span className="text-[11px] font-bold text-[#7B1E2B]">
              Filtros activos
            </span>
          )}
        </div>

        <form onSubmit={handleAplicarFiltros} className="space-y-3.5">
          {/* items-start ensures expanding one BoxSelect inline does not stretch the other 2 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
            <BoxField label="Categoría">
              <BoxSelect
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="">Todas</option>
                {categoriasDelArea.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </BoxSelect>
            </BoxField>

            <BoxField label="Estado">
              <BoxSelect
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos</option>
                {ESTADOS.map((est) => (
                  <option key={est.value} value={est.value}>
                    {est.label}
                  </option>
                ))}
              </BoxSelect>
            </BoxField>

            <BoxField label="Prioridad">
              <BoxSelect
                value={filtroPrioridad}
                onChange={(e) => setFiltroPrioridad(e.target.value)}
              >
                <option value="">Todas</option>
                {PRIORIDADES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </BoxSelect>
            </BoxField>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center gap-2.5 pt-0.5">
            <Button
              type="submit"
              className="w-full sm:w-auto sm:min-w-[150px] h-10 font-bold"
            >
              Aplicar filtros
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleLimpiarFiltros}
              className="w-full sm:w-auto sm:min-w-[150px] h-10 font-bold"
            >
              Limpiar filtros
            </Button>
          </div>
        </form>
      </Card>

      {error && <ErrorMessage message={error} />}

      {/* Section 2 + 3:
       * - Mobile (< lg): Stacked list followed by Gestionar card below
       * - Desktop (lg+): 2-column Master-Detail split (List on Left, Sticky Gestionar panel on Right)
       */}
      {loading ? (
        <Loading text="Consultando solicitudes del área..." />
      ) : solicitudes.length === 0 ? (
        <Alert variant="success" className="rounded-xl px-5 py-4">
          <AlertTitle>No hay solicitudes con estos filtros</AlertTitle>
          <AlertDescription>
            Modifica o limpia los filtros para ver las solicitudes del área.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4 lg:gap-5 items-start">
          {/* Left Column: Listado de solicitudes */}
          <div className="space-y-3">
            {solicitudes.map((sol) => (
              <SolicitudCard
                key={sol.id}
                solicitud={sol}
                viewRole="SUPERVISOR"
                selected={selectedSolicitud?.id === sol.id}
                onSelect={handleSelectTicket}
              />
            ))}
          </div>

          {/* Right Column: Gestionar GEST-2026-XXX (Sticky on Desktop, below list on Mobile) */}
          {selectedSolicitud && (
            <Card className="p-5 sm:p-6 space-y-3.5 lg:sticky lg:top-6">
              <div className="flex items-start justify-between gap-2.5">
                <h2 className="text-base font-extrabold text-[#1C242B]">
                  {isAdmin ? 'Solicitud' : 'Gestionar'} {selectedSolicitud.codigo}
                </h2>
                <EstadoBadge estado={selectedSolicitud.estado} />
              </div>

              <div className="space-y-1 rounded-lg bg-[#FAF8F5] border border-[#EBE8E1] p-3 text-xs text-[#2E3842] leading-relaxed">
                <div>
                  <span className="font-semibold text-[#5A6570]">
                    Solicitante:
                  </span>{' '}
                  {selectedSolicitud.solicitanteNombre || '—'}
                </div>
                <div>
                  <span className="font-semibold text-[#5A6570]">
                    Ubicación:
                  </span>{' '}
                  {selectedSolicitud.ubicacion || '—'}
                </div>
                <div>
                  <span className="font-semibold text-[#5A6570]">
                    Responsable:
                  </span>{' '}
                  {selectedSolicitud.responsableNombre || 'Sin asignar'}
                </div>
              </div>

              {/* Variante CERRADO (Exact Figma d-gestion-cerrada) */}
              {isSelectedCerrado ? (
                <>
                  <Alert variant="success" className="py-3.5">
                    <AlertTitle>Cierre confirmado</AlertTitle>
                    <AlertDescription>
                      {formatDateTime(selectedSolicitud.actualizadoEn)}. Atención
                      verificada por el supervisor del área.
                    </AlertDescription>
                  </Alert>

                  <p className="text-xs text-[#5A6570]">
                    Solicitud finalizada. No admite cambios de estado, prioridad
                    ni responsable.
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      router.push(`/solicitudes/${selectedSolicitud.id}`)
                    }
                    className="w-full h-10 font-bold"
                  >
                    Ver detalle y seguimiento
                  </Button>
                </>
              ) : isSelectedRechazado ? (
                /* Variante RECHAZADO (Exact Figma d-gestion-rechazada) */
                <>
                  <Alert variant="destructive" className="py-3.5">
                    <AlertTitle>Rechazo confirmado</AlertTitle>
                    <AlertDescription>
                      Motivo:{' '}
                      {selectedSolicitud.motivoRechazo?.replace(
                        /^Motivo de rechazo:\s*/i,
                        ''
                      ) || 'sin detalle.'}
                    </AlertDescription>
                  </Alert>

                  <p className="text-xs text-[#5A6570]">
                    Solicitud finalizada. No admite cambios de estado, prioridad
                    ni responsable.
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      router.push(`/solicitudes/${selectedSolicitud.id}`)
                    }
                    className="w-full h-10 font-bold"
                  >
                    Ver detalle y seguimiento
                  </Button>
                </>
              ) : isAdmin ? (
                <>
                  <p className="text-xs text-[#5A6570]">
                    Prioridad{' '}
                    {PRIORIDAD_LABELS[selectedSolicitud.prioridad] ||
                      selectedSolicitud.prioridad}
                    . La asignación, el cierre y el rechazo los realiza el
                    supervisor del área.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      router.push(`/solicitudes/${selectedSolicitud.id}`)
                    }
                    className="w-full h-10 font-bold"
                  >
                    Ver detalle y seguimiento
                  </Button>
                </>
              ) : (
                /* Variantes Activas: NUEVO, ASIGNADO, EN_PROCESO, RESUELTO */
                <form onSubmit={handleGuardarAsignacion} className="space-y-3">
                  <BoxField
                    label="Técnico del área"
                    required
                    error={assignError}
                  >
                    <BoxSelect
                      value={responsableId}
                      onChange={(e) => {
                        setResponsableId(e.target.value);
                        if (assignError) setAssignError('');
                      }}
                    >
                      <option value="">Sin técnico seleccionado</option>
                      {tecnicos.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre}
                          {t.area ? ` · ${t.area}` : ''}
                        </option>
                      ))}
                    </BoxSelect>
                  </BoxField>

                  <BoxField label="Prioridad">
                    <BoxSelect
                      value={prioridad}
                      onChange={(e) => setPrioridad(e.target.value)}
                    >
                      {PRIORIDADES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </BoxSelect>
                  </BoxField>

                  <div className="space-y-2.5 pt-1">
                    <Button
                      type="submit"
                      disabled={savingAssign}
                      className="w-full h-10 font-bold"
                    >
                      {savingAssign
                        ? 'Guardando...'
                        : isSelectedNuevo
                        ? 'Asignar responsable'
                        : 'Guardar responsable y prioridad'}
                    </Button>

                    {/* Green banner when assignment saved (Exact Figma d-gestion-asignada / d-gestion-reasignada) */}
                    {assignBanner && (
                      <Alert variant="success" className="py-3.5">
                        <AlertTitle>{assignBanner.title}</AlertTitle>
                        <AlertDescription>{assignBanner.text}</AlertDescription>
                      </Alert>
                    )}

                    {/* When RESUELTO, show "Cerrar solicitud" primary button (Exact Figma d-gestion-resuelta) */}
                    {isSelectedResuelto && (
                      <Button
                        type="button"
                        onClick={() => setViewMode('CONFIRMAR_CIERRE')}
                        className="w-full h-10 font-bold"
                      >
                        Cerrar solicitud
                      </Button>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          setRejectError('');
                          setViewMode('RECHAZAR');
                        }}
                        className="w-full h-10 font-bold"
                      >
                        Rechazar solicitud
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          router.push(`/solicitudes/${selectedSolicitud.id}`)
                        }
                        className="w-full h-10 font-bold"
                      >
                        Ver detalle y seguimiento
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
