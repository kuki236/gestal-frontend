'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { EstadoBadge } from '@/components/EstadoBadge';
import { Loading } from '@/components/Loading';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  BoxField,
  BoxInput,
  BoxSelect,
  BoxTextarea,
} from '@/components/ui/box-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';
import {
  obtenerSolicitudPorId,
  agregarComentario,
  actualizarSolicitud,
  eliminarSolicitud,
  listarCategorias,
} from '@/services/solicitudesService';
import { ESTADOS_CONFIG, PRIORIDAD_LABELS } from '@/utils/constants';
import { formatDateTime, formatShortDateTime } from '@/utils/formatters';

export default function DetalleSolicitudPage({ params }) {
  return (
    <ProtectedRoute>
      <Layout>
        <DetalleSolicitudContent id={params?.id} />
      </Layout>
    </ProtectedRoute>
  );
}

function DetalleSolicitudContent({ id }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const rol = user?.rol || 'ESTUDIANTE';

  const [solicitud, setSolicitud] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Inline PUT edit mode
  const [editing, setEditing] = useState(false);
  const [editCategoriaId, setEditCategoriaId] = useState('1');
  const [editUbicacion, setEditUbicacion] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editErrors, setEditErrors] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [nuevoComentario, setNuevoComentario] = useState('');
  const [commentError, setCommentError] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const cargarDetalle = async () => {
    try {
      setLoading(true);
      setError('');
      const [data, cats] = await Promise.all([
        obtenerSolicitudPorId(id),
        listarCategorias(),
      ]);
      setSolicitud(data);
      setCategorias(Array.isArray(cats) ? cats : []);
      if (data) {
        const matchedCat = (Array.isArray(cats) ? cats : []).find(
          (c) =>
            c.nombre?.toLowerCase() === data.categoriaNombre?.toLowerCase()
        );
        setEditCategoriaId(matchedCat ? String(matchedCat.id) : '1');
        setEditUbicacion(data.ubicacion || '');
        setEditDescripcion(data.descripcion || data.titulo || '');
      }
    } catch (err) {
      setError(
        err?.message || 'No se pudo cargar el detalle de la solicitud.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      cargarDetalle();
    }
  }, [id]);

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!editCategoriaId) errs.categoriaId = 'Selecciona una categoría';
    if (!editUbicacion.trim()) errs.ubicacion = 'Indica la ubicación';
    if (!editDescripcion.trim())
      errs.descripcion = 'Describe el problema o requerimiento';
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setSavingEdit(true);
      await actualizarSolicitud(solicitud.id, {
        categoriaId: Number(editCategoriaId),
        ubicacion: editUbicacion.trim(),
        descripcion: editDescripcion.trim(),
      });
      setEditing(false);
      await cargarDetalle();
      toast({
        variant: 'success',
        title: 'Solicitud actualizada',
        description: `Se actualizaron los datos de ${solicitud.codigo}.`,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'No se pudo editar la solicitud',
        description: err?.message || 'Verifica los permisos y el estado actual.',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEliminarSolicitud = async () => {
    try {
      setDeleting(true);
      await eliminarSolicitud(solicitud.id);
      toast({
        variant: 'default',
        title: 'Solicitud eliminada',
        description: `${solicitud.codigo} fue dada de baja lógicamente.`,
      });
      setConfirmDelete(false);
      handleVolverListado();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: err?.message || 'Solo el administrador puede eliminar solicitudes.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handlePublicarComentario = async (e) => {
    e.preventDefault();
    setCommentError('');
    if (!nuevoComentario.trim()) {
      setCommentError('Escribe un comentario antes de enviar');
      return;
    }

    try {
      setSubmittingComment(true);
      await agregarComentario(
        solicitud.id,
        nuevoComentario.trim()
      );
      setNuevoComentario('');
      await cargarDetalle();
      toast({
        variant: 'success',
        title: 'Comentario publicado',
        description: 'Tu comentario fue añadido al seguimiento de la solicitud.',
      });
    } catch (err) {
      setCommentError(
        err?.message || 'No se pudo registrar el comentario.'
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleVolverListado = () => {
    if (rol === 'SUPERVISOR' || rol === 'ADMIN' || rol === 'ADMINISTRADOR') {
      router.push('/gestion');
    } else if (rol === 'TECNICO' && solicitud) {
      router.push(`/gestion?id=${solicitud.id}`);
    } else {
      router.push('/solicitudes');
    }
  };

  if (loading) {
    return <Loading text="Cargando detalle de la solicitud..." />;
  }

  if (error || !solicitud) {
    return (
      <div className="space-y-4">
        <ErrorMessage
          message={error || 'No se encontró la solicitud solicitada.'}
          onRetry={cargarDetalle}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleVolverListado}
          className="w-full sm:w-auto sm:px-7 h-10 font-bold"
        >
          Volver al listado
        </Button>
      </div>
    );
  }

  const historial = Array.isArray(solicitud.historial)
    ? solicitud.historial
    : [];
  const comentarios = Array.isArray(solicitud.comentarios)
    ? solicitud.comentarios
    : [];

  const isTerminal =
    solicitud.estado === 'CERRADO' || solicitud.estado === 'RECHAZADO';
  const isNuevo =
    solicitud.estado === 'NUEVO' || solicitud.estado === 'REGISTRADO';
  const canEditPut =
    !isTerminal &&
    ((rol === 'ESTUDIANTE' && isNuevo) ||
      rol === 'SUPERVISOR' ||
      rol === 'ADMIN' ||
      rol === 'ADMINISTRADOR');
  const canDelete = rol === 'ADMIN' || rol === 'ADMINISTRADOR';
  const prioridadLabel =
    PRIORIDAD_LABELS[solicitud.prioridad] || solicitud.prioridad || 'Media';

  return (
    <div className="space-y-5">
      {/* Header: Desktop has right-aligned "Volver al listado" button */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7B1E2B]">
            GESTIÓN DE SERVICIOS
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#1C242B]">
            Detalle y seguimiento
          </h1>
          <p className="mt-2 text-xs text-[#5A6570]">
            {rol === 'ESTUDIANTE'
              ? 'Información y avances de tu solicitud.'
              : rol === 'TECNICO'
              ? `${solicitud.codigo} · Solicitud asignada a ti`
              : rol === 'SUPERVISOR'
              ? `${solicitud.codigo} · Solicitud de tu área`
              : solicitud.codigo}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleVolverListado}
          className="hidden sm:inline-flex h-10 px-6 font-bold shrink-0"
        >
          {rol === 'TECNICO' ? 'Volver a la atención' : 'Volver al listado'}
        </Button>
      </div>

      {/* Desktop 2-Column Split: Left (Datos + Comentarios) | Right (Historial de estados) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.85fr] gap-5 items-start">
        {/* Left Column: Datos de la solicitud + Comentarios */}
        <div className="space-y-5">
          {/* Card 1: Datos de la solicitud */}
          <Card className="group/card relative p-5 sm:p-6 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="text-base font-extrabold text-[#1C242B]">
                  {solicitud.codigo}
                </div>
                <EstadoBadge estado={solicitud.estado} />
              </div>

              {(canEditPut || canDelete) && !editing && (
                <div className="flex items-center gap-1.5">
                  {canEditPut && (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#D8D5CE] bg-[#FAF9F6] px-2.5 py-1 text-[11px] font-bold text-[#7B1E2B] hover:bg-[#F5E4E6] cursor-pointer"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Editar</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#E9B8B8] bg-[#F7E6E6] px-2.5 py-1 text-[11px] font-bold text-[#A61C1C] hover:bg-[#F1D4D4] cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleGuardarEdicion} className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  <BoxField
                    label="Categoría"
                    required
                    error={editErrors.categoriaId}
                  >
                    <BoxSelect
                      value={editCategoriaId}
                      onChange={(e) => setEditCategoriaId(e.target.value)}
                    >
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </BoxSelect>
                  </BoxField>

                  <BoxField
                    label="Ubicación"
                    required
                    error={editErrors.ubicacion}
                  >
                    <BoxInput
                      type="text"
                      value={editUbicacion}
                      onChange={(e) => setEditUbicacion(e.target.value)}
                    />
                  </BoxField>
                </div>

                <BoxField
                  label="Descripción"
                  required
                  error={editErrors.descripcion}
                >
                  <BoxTextarea
                    rows={2}
                    value={editDescripcion}
                    onChange={(e) => setEditDescripcion(e.target.value)}
                  />
                </BoxField>

                {rol !== 'ESTUDIANTE' && (
                  <p className="text-[11px] text-[#5A6570]">
                    Al guardar, la prioridad vuelve a la inicial de la categoría
                    elegida.
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <Button
                    type="submit"
                    disabled={savingEdit}
                    className="w-full sm:w-auto sm:px-6 h-10 font-bold"
                  >
                    {savingEdit ? 'Guardando cambios...' : 'Guardar cambios'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                    disabled={savingEdit}
                    className="w-full sm:w-auto sm:px-6 h-10 font-bold"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <h2 className="text-base font-extrabold text-[#1C242B] pt-0.5">
                  {solicitud.titulo}
                </h2>

                {/* Mobile: simple stacked text | Desktop: structured 2-column metadata grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-1 text-xs text-[#2E3842]">
                  <div>
                    <span className="font-semibold text-[#5A6570]">Categoría: </span>
                    {solicitud.categoriaNombre || '—'}
                  </div>
                  <div>
                    <span className="font-semibold text-[#5A6570]">Área responsable: </span>
                    {solicitud.areaNombre || '—'}
                  </div>
                  <div>
                    <span className="font-semibold text-[#5A6570]">Ubicación: </span>
                    {solicitud.ubicacion || '—'}
                  </div>
                  <div>
                    <span className="font-semibold text-[#5A6570]">Solicitante: </span>
                    {solicitud.solicitanteNombre || '—'}
                  </div>
                  <div>
                    <span className="font-semibold text-[#5A6570]">Fecha: </span>
                    {formatDateTime(solicitud.fechaCreacion) || '—'}
                  </div>
                  <div>
                    <span className="font-semibold text-[#5A6570]">Prioridad: </span>
                    {prioridadLabel}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-[#5A6570]">Responsable: </span>
                    {solicitud.responsableNombre || 'Sin asignar'}
                  </div>
                </div>
              </>
            )}

            {/* Rejected Banner inside Card 1 when RECHAZADO */}
            {solicitud.estado === 'RECHAZADO' && (
              <Alert variant="destructive" className="mt-3">
                <AlertTitle>Solicitud rechazada</AlertTitle>
                <AlertDescription>
                  Motivo:{' '}
                  {solicitud.motivoRechazo?.replace(
                    /^Motivo de rechazo:\s*/i,
                    ''
                  ) || 'sin detalle.'}
                </AlertDescription>
              </Alert>
            )}
          </Card>

          {/* Card 3: Comentarios */}
          <Card className="p-5 sm:p-6 space-y-3.5">
            <h3 className="text-base font-extrabold text-[#1C242B]">
              Comentarios
            </h3>

            {comentarios.length > 0 && (
              <div className="space-y-2.5">
                {comentarios.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-[#D8D5CE] bg-white px-4 py-3"
                  >
                    <div className="text-xs font-extrabold text-[#1C242B]">
                      {c.autorNombre}
                      {c.rol ? ` · ${c.rol}` : ''} ·{' '}
                      {formatShortDateTime(c.fecha)}
                    </div>
                    <div className="mt-1 text-xs text-[#3E4852]">{c.texto}</div>
                  </div>
                ))}
              </div>
            )}

            {isTerminal ? (
              <p className="pt-1 text-xs text-[#5A6570]">
                Solicitud finalizada. El seguimiento permanece disponible para
                consulta.
              </p>
            ) : (
              <form
                onSubmit={handlePublicarComentario}
                className="space-y-3 pt-1"
              >
                <BoxField label="Nuevo comentario" error={commentError}>
                  <BoxTextarea
                    rows={2}
                    placeholder="El laboratorio está disponible a partir de las 10:00."
                    value={nuevoComentario}
                    onChange={(e) => {
                      setNuevoComentario(e.target.value);
                      if (commentError) setCommentError('');
                    }}
                  />
                </BoxField>

                <p className="text-[11px] text-[#5A6570]">
                  Los comentarios se guardan en este navegador; el servidor aún
                  no los almacena.
                </p>

                <div>
                  <Button
                    type="submit"
                    disabled={submittingComment}
                    className="w-full sm:w-auto sm:px-7 h-10 font-bold"
                  >
                    {submittingComment
                      ? 'Publicando...'
                      : 'Publicar comentario'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Right Column: Historial de estados */}
        <Card className="p-5 sm:p-6 space-y-3 lg:sticky lg:top-6">
          <h3 className="text-base font-extrabold text-[#1C242B]">
            Historial de estados
          </h3>

          <div className="space-y-2.5">
            {historial.map((item, idx) => {
              const estadoLabel =
                ESTADOS_CONFIG[item.estadoNuevo]?.label || item.estadoNuevo;
              const actionLabel =
                idx === 0 &&
                (item.estadoNuevo === 'NUEVO' ||
                  item.estadoNuevo === 'REGISTRADO')
                  ? 'Solicitud registrada'
                  : item.estadoNuevo === 'RECHAZADO'
                  ? 'Solicitud rechazada'
                  : 'Cambio de estado';
              const cleanUser = (item.usuarioNombre || '').replace(
                /\s*\(.*?\)/g,
                ''
              );
              const fechaTexto = formatDateTime(item.fecha);

              return (
                <div
                  key={item.id || idx}
                  className="rounded-lg border border-[#D8D5CE] bg-white px-4 py-3"
                >
                  <div className="text-xs font-extrabold text-[#1C242B]">
                    {estadoLabel} · {actionLabel}
                  </div>
                  <div className="mt-1 text-[11px] text-[#5A6570]">
                    {[fechaTexto, cleanUser].filter(Boolean).join(' · ')}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Dialog open={confirmDelete} onOpenChange={(open) => !deleting && setConfirmDelete(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar {solicitud.codigo}?</DialogTitle>
            <DialogDescription>
              La solicitud se dará de baja lógica: dejará de aparecer en los
              listados, pero se conserva en la base de datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="h-10 px-5 font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleEliminarSolicitud}
              disabled={deleting}
              className="h-10 px-5 font-bold"
            >
              {deleting ? 'Eliminando...' : 'Eliminar solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Button: Volver al listado */}
      <div className="sm:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={handleVolverListado}
          className="w-full h-10 font-bold"
        >
          Volver al listado
        </Button>
      </div>
    </div>
  );
}
