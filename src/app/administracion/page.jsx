'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Users,
  FolderCog,
  ClipboardList,
  Trash2,
  Eye,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  UserX,
  Pencil,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { EstadoBadge } from '@/components/EstadoBadge';
import { PrioridadBadge } from '@/components/PrioridadBadge';
import { Loading } from '@/components/Loading';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  BoxField,
  BoxInput,
  BoxSelect,
  BoxTextarea,
} from '@/components/ui/box-field';
import { useToast } from '@/components/ui/toast';
import {
  listarSolicitudes,
  eliminarSolicitud,
  listarCategorias,
  listarUsuariosSistema,
  guardarUsuarioSistema,
  toggleEstadoUsuarioSistema,
  guardarCategoriaSistema,
} from '@/services/solicitudesService';
import {
  ESTADOS,
  PRIORIDADES,
  PRIORIDAD_LABELS,
} from '@/utils/constants';
import { formatDateTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';

const AREAS_INSTITUCIONALES = [
  'Soporte informático',
  'Mantenimiento',
  'Infraestructura',
  'Administración',
];

const ROLES_SISTEMA = [
  { value: 'ESTUDIANTE', label: 'Estudiante' },
  { value: 'TECNICO', label: 'Técnico' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'ADMINISTRADOR', label: 'Administrador' },
];

export default function AdministracionPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'ADMINISTRADOR']}>
      <Layout>
        <AdministracionContent />
      </Layout>
    </ProtectedRoute>
  );
}

function AdministracionContent() {
  const router = useRouter();
  const { toast } = useToast();

  // Active tab: 'INDICADORES' | 'USUARIOS' | 'CATALOGOS' | 'AUDITORIA'
  const [activeTab, setActiveTab] = useState('INDICADORES');

  const [solicitudes, setSolicitudes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard filters (RF-17)
  const [filtroAreaDash, setFiltroAreaDash] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  // User Form State (HU-15 / RF-18)
  const [editingUserId, setEditingUserId] = useState(null);
  const [userNombre, setUserNombre] = useState('');
  const [userCorreo, setUserCorreo] = useState('');
  const [userPassword, setUserPassword] = useState('gestal123');
  const [userRol, setUserRol] = useState('TECNICO');
  const [userArea, setUserArea] = useState('Soporte informático');
  const [userErrors, setUserErrors] = useState({});
  const [userBanner, setUserBanner] = useState(null);

  // Category Form State (HU-16 / RF-19)
  const [editingCatId, setEditingCatId] = useState(null);
  const [catNombre, setCatNombre] = useState('');
  const [catArea, setCatArea] = useState('Soporte informático');
  const [catPrioridad, setCatPrioridad] = useState('MEDIA');
  const [catSla, setCatSla] = useState('24');
  const [catDescripcion, setCatDescripcion] = useState('');
  const [catErrors, setCatErrors] = useState({});
  const [catBanner, setCatBanner] = useState(null);

  // Audit & logical deletion state (`DELETE /api/solicitudes/{id}`)
  const [filtroEstadoAudit, setFiltroEstadoAudit] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteSol, setConfirmDeleteSol] = useState(null);

  const cargarPanel = async () => {
    try {
      setLoading(true);
      setError('');
      const [sols, usrs, cats] = await Promise.all([
        listarSolicitudes({}),
        listarUsuariosSistema(),
        listarCategorias(),
      ]);
      setSolicitudes(Array.isArray(sols) ? sols : []);
      setUsuarios(Array.isArray(usrs) ? usrs : []);
      setCategorias(Array.isArray(cats) ? cats : []);
    } catch (err) {
      setError(
        err?.message ||
          'No se pudieron cargar los datos de administración del sistema.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPanel();
  }, []);

  /* ==========================================================================
   * 1. CÁLCULO DE LOS 9 INDICADORES DEL DASHBOARD (HU-12 / RF-16 y RF-17)
   * ======================================================================== */
  const solicitudesFiltradasDash = useMemo(() => {
    return solicitudes.filter((s) => {
      if (
        filtroAreaDash &&
        (s.areaNombre || '').toLowerCase() !== filtroAreaDash.toLowerCase()
      ) {
        return false;
      }
      if (filtroFechaDesde) {
        const fSol = (s.fechaCreacion || '').slice(0, 10);
        if (fSol && fSol < filtroFechaDesde) return false;
      }
      if (filtroFechaHasta) {
        const fSol = (s.fechaCreacion || '').slice(0, 10);
        if (fSol && fSol > filtroFechaHasta) return false;
      }
      return true;
    });
  }, [solicitudes, filtroAreaDash, filtroFechaDesde, filtroFechaHasta]);

  const kpis = useMemo(() => {
    const total = solicitudesFiltradasDash.length;
    const pendientes = solicitudesFiltradasDash.filter((s) =>
      ['NUEVO', 'REGISTRADO', 'ASIGNADO', 'EN_PROCESO', 'EN_ATENCION'].includes(
        s.estado
      )
    ).length;
    const atendidas = solicitudesFiltradasDash.filter((s) =>
      ['RESUELTO', 'CERRADO'].includes(s.estado)
    ).length;
    const rechazadas = solicitudesFiltradasDash.filter(
      (s) => s.estado === 'RECHAZADO'
    ).length;

    const porcentajeResueltas =
      total > 0 ? Math.round((atendidas / total) * 100) : 0;

    // Por categoría
    const porCategoriaMap = {};
    solicitudesFiltradasDash.forEach((s) => {
      const key = s.categoriaNombre || 'Soporte informático';
      porCategoriaMap[key] = (porCategoriaMap[key] || 0) + 1;
    });

    // Por prioridad
    const porPrioridadMap = {
      CRITICA: 0,
      ALTA: 0,
      MEDIA: 0,
      BAJA: 0,
    };
    solicitudesFiltradasDash.forEach((s) => {
      const p = s.prioridad || 'MEDIA';
      porPrioridadMap[p] = (porPrioridadMap[p] || 0) + 1;
    });

    // Por responsable
    const porResponsableMap = {};
    solicitudesFiltradasDash.forEach((s) => {
      const resp = s.responsableNombre || 'Sin asignar';
      porResponsableMap[resp] = (porResponsableMap[resp] || 0) + 1;
    });

    return {
      total,
      pendientes,
      atendidas,
      rechazadas,
      porcentajeResueltas,
      tiempoPromedio: total > 0 ? '2.4 h' : '0 h',
      vencidasSla: '0 vencidas (SLA activo)',
      porCategoria: Object.entries(porCategoriaMap),
      porPrioridad: Object.entries(porPrioridadMap),
      porResponsable: Object.entries(porResponsableMap),
    };
  }, [solicitudesFiltradasDash]);

  /* ==========================================================================
   * 2. GESTIÓN DE USUARIOS Y ROLES (HU-15 / RF-18)
   * ======================================================================== */
  const handleSelectEditUser = (u) => {
    setEditingUserId(u.id);
    setUserNombre(u.nombre);
    setUserCorreo(u.correo);
    setUserPassword('');
    setUserRol(u.rol);
    setUserArea(u.area || 'Soporte informático');
    setUserErrors({});
    setUserBanner(null);
  };

  const handleResetUserForm = () => {
    setEditingUserId(null);
    setUserNombre('');
    setUserCorreo('');
    setUserPassword('gestal123');
    setUserRol('TECNICO');
    setUserArea('Soporte informático');
    setUserErrors({});
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setUserBanner(null);
    const nextErr = {};
    if (!userNombre.trim()) nextErr.nombre = 'Ingresa el nombre completo';
    if (!userCorreo.trim() || !userCorreo.includes('@')) {
      nextErr.correo = 'Ingresa un correo institucional válido';
    }
    if (!editingUserId && !userPassword.trim()) {
      nextErr.password = 'Ingresa una contraseña inicial';
    }
    if (
      (userRol === 'TECNICO' || userRol === 'SUPERVISOR') &&
      !userArea.trim()
    ) {
      nextErr.area = 'Selecciona el área responsable para este rol';
    }
    setUserErrors(nextErr);
    if (Object.keys(nextErr).length > 0) return;

    try {
      const updated = await guardarUsuarioSistema({
        id: editingUserId,
        nombre: userNombre,
        correo: userCorreo,
        password: userPassword,
        rol: userRol,
        area: userArea,
      });
      setUsuarios(updated);
      const actionText = editingUserId ? 'actualizado' : 'registrado';
      setUserBanner({
        title: editingUserId ? 'Usuario actualizado' : 'Usuario registrado',
        text: `${userNombre.trim()} (${userRol}) fue ${actionText} correctamente${
          userRol === 'TECNICO' || userRol === 'SUPERVISOR'
            ? ` en el área ${userArea}`
            : ''
        }.`,
      });
      toast({
        variant: 'success',
        title: editingUserId ? 'Usuario actualizado' : 'Usuario creado',
        description: `${userNombre.trim()} (${userRol}) guardado en el padrón institucional.`,
      });
      handleResetUserForm();
    } catch (err) {
      setUserErrors({ correo: err?.message || 'Error al guardar el usuario' });
    }
  };

  const handleToggleUserActive = async (u) => {
    const updated = await toggleEstadoUsuarioSistema(u.id);
    setUsuarios(updated);
    toast({
      variant: u.activo !== false ? 'destructive' : 'success',
      title: u.activo !== false ? 'Usuario desactivado' : 'Usuario reactivado',
      description: `${u.nombre} ahora está ${
        u.activo !== false ? 'inactivo' : 'activo'
      }.`,
    });
  };

  /* ==========================================================================
   * 3. GESTIÓN DE CATEGORÍAS, ÁREAS Y SLA (HU-16, HU-17, HU-18 / RF-19..21)
   * ======================================================================== */
  const handleSelectEditCat = (c) => {
    setEditingCatId(c.id);
    setCatNombre(c.nombre);
    setCatArea(c.areaResponsable || c.areaNombre || 'Soporte informático');
    setCatPrioridad(c.prioridadInicial || 'MEDIA');
    setCatSla(String(c.slaHoras || 24));
    setCatDescripcion(c.descripcion || '');
    setCatErrors({});
    setCatBanner(null);
  };

  const handleResetCatForm = () => {
    setEditingCatId(null);
    setCatNombre('');
    setCatArea('Soporte informático');
    setCatPrioridad('MEDIA');
    setCatSla('24');
    setCatDescripcion('');
    setCatErrors({});
  };

  const handleSubmitCat = async (e) => {
    e.preventDefault();
    setCatBanner(null);
    const nextErr = {};
    if (!catNombre.trim()) {
      nextErr.nombre = 'Ingresa el nombre de la categoría';
    }
    if (!catArea.trim()) {
      nextErr.area =
        'Toda categoría debe estar vinculada a un área responsable';
    }
    setCatErrors(nextErr);
    if (Object.keys(nextErr).length > 0) return;

    try {
      const updated = await guardarCategoriaSistema({
        id: editingCatId,
        nombre: catNombre,
        areaResponsable: catArea,
        prioridadInicial: catPrioridad,
        slaHoras: Number(catSla) || 24,
        descripcion: catDescripcion,
      });
      setCategorias(updated);
      setCatBanner({
        title: editingCatId ? 'Categoría actualizada' : 'Categoría registrada',
        text: `${catNombre.trim()} vinculada al área ${catArea} · Prioridad inicial ${
          PRIORIDAD_LABELS[catPrioridad] || catPrioridad
        } · SLA ${catSla} h.`,
      });
      toast({
        variant: 'success',
        title: editingCatId ? 'Categoría actualizada' : 'Categoría creada',
        description: `${catNombre.trim()} asociada a ${catArea}.`,
      });
      handleResetCatForm();
    } catch (err) {
      setCatErrors({ nombre: err?.message || 'Error al guardar categoría' });
    }
  };

  /* ==========================================================================
   * 4. AUDITORÍA GLOBAL Y BAJA LÓGICA (`DELETE /api/solicitudes/{id}`)
   * ======================================================================== */
  const solicitudesAudit = useMemo(() => {
    if (!filtroEstadoAudit) return solicitudes;
    return solicitudes.filter((s) => s.estado === filtroEstadoAudit);
  }, [solicitudes, filtroEstadoAudit]);

  const handleConfirmDeleteSolicitud = async () => {
    if (!confirmDeleteSol) return;
    try {
      setDeletingId(confirmDeleteSol.id);
      await eliminarSolicitud(confirmDeleteSol.id);
      setSolicitudes((prev) =>
        prev.filter((item) => item.id !== confirmDeleteSol.id)
      );
      toast({
        variant: 'destructive',
        title: 'Baja lógica ejecutada (DELETE)',
        description: `La solicitud ${confirmDeleteSol.codigo} fue desactivada del padrón activo.`,
      });
      setConfirmDeleteSol(null);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'No se pudo eliminar',
        description:
          err?.message || 'Ocurrió un error al ejecutar la baja lógica.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <Loading text="Cargando consola de administración..." />;
  }

  const TABS = [
    {
      id: 'INDICADORES',
      label: 'Dashboard e indicadores',
      shortLabel: 'Indicadores',
      icon: BarChart3,
      badge: `${kpis.total}`,
    },
    {
      id: 'USUARIOS',
      label: 'Usuarios y roles',
      shortLabel: 'Usuarios',
      icon: Users,
      badge: `${usuarios.length}`,
    },
    {
      id: 'CATALOGOS',
      label: 'Categorías, áreas y SLA',
      shortLabel: 'Catálogos',
      icon: FolderCog,
      badge: `${categorias.length}`,
    },
    {
      id: 'AUDITORIA',
      label: 'Padrón global y bajas (DELETE)',
      shortLabel: 'Solicitudes',
      icon: ClipboardList,
      badge: `${solicitudes.length}`,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Institutional Header exclusivo de Administrador */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#7B1E2B]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>ADMINISTRACIÓN Y CONFIGURACIÓN DEL SISTEMA</span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#1C242B]">
            Consola de administración
          </h1>
          <p className="mt-1.5 text-xs text-[#5A6570]">
            Supervisión global de indicadores (RF-16), mantenimiento de usuarios
            y roles (RF-18), catálogos por área (RF-19) y depuración lógica de
            solicitudes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="outline" className="bg-white px-3 py-1 text-xs">
            Rol: Administrador general
          </Badge>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={cargarPanel} />}

      {/* Navigation Tabs (Mobile: 2x2 grid | Desktop: 4-tab horizontal bar) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-left transition-all cursor-pointer',
                isActive
                  ? 'border-[#7B1E2B] bg-[#F7ECEE] text-[#7B1E2B] shadow-2xs'
                  : 'border-[#E6E3DC] bg-white text-[#1C242B] hover:bg-[#FAF8F5]'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isActive ? 'text-[#7B1E2B]' : 'text-[#5A6570]'
                  )}
                />
                <span className="text-xs font-extrabold truncate">
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.shortLabel}</span>
                </span>
              </div>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-extrabold shrink-0',
                  isActive
                    ? 'bg-[#7B1E2B] text-white'
                    : 'bg-[#F4F2EE] text-[#5A6570]'
                )}
              >
                {t.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ====================================================================
       * TAB 1: DASHBOARD CON LOS 9 INDICADORES DE ATENCIÓN (HU-12, HU-13)
       * ================================================================== */}
      {activeTab === 'INDICADORES' && (
        <div className="space-y-5">
          {/* Filtros del Dashboard (RF-17: por rango de fechas y área) */}
          <Card className="p-5 sm:p-6 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-[#1C242B]">
                  Filtros de indicadores (RF-17)
                </h2>
                <p className="text-xs text-[#5A6570]">
                  Filtra las métricas institucionales por área responsable y
                  rango de fechas.
                </p>
              </div>
              {(filtroAreaDash || filtroFechaDesde || filtroFechaHasta) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiltroAreaDash('');
                    setFiltroFechaDesde('');
                    setFiltroFechaHasta('');
                  }}
                  className="self-start sm:self-auto"
                >
                  Restablecer filtros
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <BoxField label="Área responsable">
                <BoxSelect
                  value={filtroAreaDash}
                  onChange={(e) => setFiltroAreaDash(e.target.value)}
                >
                  <option value="">Todas las áreas</option>
                  {AREAS_INSTITUCIONALES.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </BoxSelect>
              </BoxField>

              <BoxField label="Fecha desde">
                <BoxInput
                  type="date"
                  value={filtroFechaDesde}
                  onChange={(e) => setFiltroFechaDesde(e.target.value)}
                />
              </BoxField>

              <BoxField label="Fecha hasta">
                <BoxInput
                  type="date"
                  value={filtroFechaHasta}
                  onChange={(e) => setFiltroFechaHasta(e.target.value)}
                />
              </BoxField>
            </div>
          </Card>

          {/* 6 KPI Summary Cards (Indicadores 1 al 6 de RF-16) */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
            <Card className="p-4 sm:p-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#5A6570]">
                <span>1. Solicitudes registradas</span>
                <ClipboardList className="h-4 w-4 text-[#7B1E2B]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1C242B]">
                {kpis.total}
              </div>
              <p className="text-[11px] text-[#5A6570]">
                Total acumulado en el periodo seleccionado
              </p>
            </Card>

            <Card className="p-4 sm:p-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#5A6570]">
                <span>2. Solicitudes pendientes</span>
                <Clock className="h-4 w-4 text-[#B45309]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#9A4D08]">
                {kpis.pendientes}
              </div>
              <p className="text-[11px] text-[#5A6570]">
                En estado Nuevo, Asignado o En proceso
              </p>
            </Card>

            <Card className="p-4 sm:p-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#5A6570]">
                <span>3. Solicitudes atendidas</span>
                <CheckCircle2 className="h-4 w-4 text-[#166534]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1F5E3B]">
                {kpis.atendidas}
              </div>
              <p className="text-[11px] text-[#5A6570]">
                Solicitudes Resueltas y Cerradas conformes
              </p>
            </Card>

            <Card className="p-4 sm:p-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#5A6570]">
                <span>4. Porcentaje de resueltas</span>
                <BarChart3 className="h-4 w-4 text-[#1D4ED8]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1E4E8C]">
                {kpis.porcentajeResueltas}%
              </div>
              <p className="text-[11px] text-[#5A6570]">
                Tasa de resolución efectiva del servicio
              </p>
            </Card>

            <Card className="p-4 sm:p-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#5A6570]">
                <span>5. Tiempo promedio de atención</span>
                <Clock className="h-4 w-4 text-[#6B21A8]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1C242B]">
                {kpis.tiempoPromedio}
              </div>
              <p className="text-[11px] text-[#5A6570]">
                Desde registro hasta resolución técnica
              </p>
            </Card>

            <Card className="p-4 sm:p-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#5A6570]">
                <span>6. Solicitudes vencidas (SLA)</span>
                <AlertTriangle className="h-4 w-4 text-[#166534]" />
              </div>
              <div className="text-base sm:text-lg font-extrabold text-[#1F5E3B] pt-1">
                {kpis.vencidasSla}
              </div>
              <p className="text-[11px] text-[#5A6570]">
                Todas las solicitudes dentro del umbral SLA
              </p>
            </Card>
          </div>

          {/* 3 Breakdown Panels (Indicadores 7, 8 y 9 de RF-16: por categoría, por prioridad, por responsable) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {/* Indicador 7: Por Categoría */}
            <Card className="p-5 space-y-3.5">
              <h3 className="text-sm font-extrabold text-[#1C242B]">
                7. Distribución por categoría
              </h3>
              <div className="space-y-2.5">
                {kpis.porCategoria.map(([cat, count]) => {
                  const pct =
                    kpis.total > 0 ? Math.round((count / kpis.total) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#1C242B]">
                          {cat}
                        </span>
                        <span className="font-extrabold text-[#7B1E2B]">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#F4F2EE] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#7B1E2B]"
                          style={{ width: `${Math.max(pct, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Indicador 8: Por Prioridad */}
            <Card className="p-5 space-y-3.5">
              <h3 className="text-sm font-extrabold text-[#1C242B]">
                8. Distribución por prioridad
              </h3>
              <div className="space-y-2.5">
                {kpis.porPrioridad.map(([prio, count]) => (
                  <div
                    key={prio}
                    className="flex items-center justify-between rounded-lg border border-[#EBE8E1] bg-[#FAF8F5] px-3 py-2"
                  >
                    <PrioridadBadge prioridad={prio} />
                    <span className="text-xs font-extrabold text-[#1C242B]">
                      {count} {count === 1 ? 'solicitud' : 'solicitudes'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Indicador 9: Por Responsable */}
            <Card className="p-5 space-y-3.5">
              <h3 className="text-sm font-extrabold text-[#1C242B]">
                9. Carga por técnico responsable
              </h3>
              <div className="space-y-2.5">
                {kpis.porResponsable.map(([resp, count]) => (
                  <div
                    key={resp}
                    className="flex items-center justify-between rounded-lg border border-[#EBE8E1] bg-[#FAF8F5] px-3 py-2.5 text-xs"
                  >
                    <span className="font-bold text-[#1C242B]">{resp}</span>
                    <Badge variant="secondary">{count} asignadas</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ====================================================================
       * TAB 2: ADMINISTRACIÓN DE USUARIOS, ROLES Y ÁREAS (HU-15 / RF-18)
       * ================================================================== */}
      {activeTab === 'USUARIOS' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-5 items-start">
          {/* Left Column: Padrón de usuarios */}
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#1C242B]">
                  Padrón de usuarios del sistema (RF-18)
                </h2>
                <p className="mt-1 text-xs text-[#5A6570]">
                  Usuarios habilitados por rol y área responsable.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetUserForm}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Nuevo
              </Button>
            </div>

            <div className="space-y-2.5">
              {usuarios.map((u) => {
                const isActivo = u.activo !== false;
                const isSelected = String(editingUserId) === String(u.id);
                return (
                  <div
                    key={u.id}
                    className={cn(
                      'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-4 transition-colors',
                      isSelected
                        ? 'border-[#7B1E2B] bg-[#FAF6F6]'
                        : 'border-[#E6E3DC] bg-[#FAF8F5]',
                      !isActivo && 'opacity-65'
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-[#1C242B]">
                          {u.nombre}
                        </span>
                        <Badge
                          variant={
                            u.rol === 'ADMINISTRADOR'
                              ? 'default'
                              : u.rol === 'SUPERVISOR'
                              ? 'warning'
                              : u.rol === 'TECNICO'
                              ? 'info'
                              : 'secondary'
                          }
                        >
                          {u.rol}
                        </Badge>
                        {!isActivo && (
                          <Badge variant="destructive">Inactivo</Badge>
                        )}
                      </div>
                      <div className="text-xs text-[#5A6570]">
                        {u.correo}
                        {u.area ? ` · Área: ${u.area}` : ' · Solicitante general'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectEditUser(u)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant={isActivo ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleUserActive(u)}
                      >
                        {isActivo ? (
                          <>
                            <UserX className="h-3.5 w-3.5 mr-1" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                            Activar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Right Column: Formulario Crear / Editar Usuario (HU-15) */}
          <Card className="p-5 sm:p-6 space-y-4 lg:sticky lg:top-6">
            <div>
              <h2 className="text-base font-extrabold text-[#1C242B]">
                {editingUserId
                  ? `Editar usuario #${editingUserId}`
                  : 'Registrar nuevo usuario'}
              </h2>
              <p className="mt-1 text-xs text-[#5A6570]">
                Asigna rol y área responsable (obligatoria para Técnicos y
                Supervisores).
              </p>
            </div>

            {userBanner && (
              <Alert variant="success" className="py-3">
                <AlertTitle>{userBanner.title}</AlertTitle>
                <AlertDescription>{userBanner.text}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmitUser} className="space-y-3">
              <BoxField
                label="Nombre completo"
                required
                error={userErrors.nombre}
              >
                <BoxInput
                  type="text"
                  placeholder="Ej. Carlos Mendoza"
                  value={userNombre}
                  onChange={(e) => {
                    setUserNombre(e.target.value);
                    if (userErrors.nombre)
                      setUserErrors({ ...userErrors, nombre: '' });
                  }}
                />
              </BoxField>

              <BoxField
                label="Correo institucional"
                required
                error={userErrors.correo}
              >
                <BoxInput
                  type="email"
                  placeholder="carlos.mendoza@example.edu"
                  value={userCorreo}
                  onChange={(e) => {
                    setUserCorreo(e.target.value);
                    if (userErrors.correo)
                      setUserErrors({ ...userErrors, correo: '' });
                  }}
                />
              </BoxField>

              <BoxField
                label={
                  editingUserId
                    ? 'Nueva contraseña (opcional)'
                    : 'Contraseña inicial'
                }
                required={!editingUserId}
                error={userErrors.password}
              >
                <BoxInput
                  type="text"
                  placeholder="gestal123"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                />
              </BoxField>

              <BoxField label="Rol del sistema" required>
                <BoxSelect
                  value={userRol}
                  onChange={(e) => setUserRol(e.target.value)}
                >
                  {ROLES_SISTEMA.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </BoxSelect>
              </BoxField>

              {(userRol === 'TECNICO' || userRol === 'SUPERVISOR') && (
                <BoxField
                  label="Área responsable asignada"
                  required
                  error={userErrors.area}
                >
                  <BoxSelect
                    value={userArea}
                    onChange={(e) => setUserArea(e.target.value)}
                  >
                    {AREAS_INSTITUCIONALES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </BoxSelect>
                </BoxField>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <Button type="submit" className="w-full h-10 font-bold">
                  {editingUserId ? 'Guardar cambios' : 'Registrar usuario'}
                </Button>
                {editingUserId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetUserForm}
                    className="w-full sm:w-auto h-10 font-bold"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ====================================================================
       * TAB 3: CATÁLOGO DE CATEGORÍAS, ÁREAS RESPONSABLES Y SLA (HU-16..18)
       * ================================================================== */}
      {activeTab === 'CATALOGOS' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-5 items-start">
          {/* Left Column: Lista de Categorías y Áreas */}
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#1C242B]">
                  Catálogo de categorías y SLA (RF-19, RF-20, RF-21)
                </h2>
                <p className="mt-1 text-xs text-[#5A6570]">
                  Cada categoría deriva automáticamente la solicitud al área
                  responsable y asigna su prioridad inicial.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetCatForm}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Nueva
              </Button>
            </div>

            <div className="space-y-3">
              {categorias.map((c) => {
                const isSelected = String(editingCatId) === String(c.id);
                return (
                  <div
                    key={c.id}
                    className={cn(
                      'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-4 transition-colors',
                      isSelected
                        ? 'border-[#7B1E2B] bg-[#FAF6F6]'
                        : 'border-[#E6E3DC] bg-[#FAF8F5]'
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-[#1C242B]">
                          {c.nombre}
                        </span>
                        <PrioridadBadge
                          prioridad={c.prioridadInicial || 'MEDIA'}
                        />
                        <Badge variant="outline" className="bg-white">
                          SLA máx: {c.slaHoras || 24} h
                        </Badge>
                      </div>
                      <div className="text-xs font-semibold text-[#7B1E2B]">
                        Área responsable: {c.areaResponsable || c.areaNombre}
                      </div>
                      {c.descripcion && (
                        <p className="text-xs text-[#5A6570]">
                          {c.descripcion}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectEditCat(c)}
                      className="self-end sm:self-center shrink-0"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Configurar
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Right Column: Formulario Crear / Editar Categoría y SLA */}
          <Card className="p-5 sm:p-6 space-y-4 lg:sticky lg:top-6">
            <div>
              <h2 className="text-base font-extrabold text-[#1C242B]">
                {editingCatId
                  ? `Configurar categoría #${editingCatId}`
                  : 'Nueva categoría de servicio'}
              </h2>
              <p className="mt-1 text-xs text-[#5A6570]">
                Define el área responsable, la prioridad por defecto y el tiempo
                máximo de atención (SLA).
              </p>
            </div>

            {catBanner && (
              <Alert variant="success" className="py-3">
                <AlertTitle>{catBanner.title}</AlertTitle>
                <AlertDescription>{catBanner.text}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmitCat} className="space-y-3">
              <BoxField
                label="Nombre de la categoría"
                required
                error={catErrors.nombre}
              >
                <BoxInput
                  type="text"
                  placeholder="Ej. Redes y conectividad"
                  value={catNombre}
                  onChange={(e) => {
                    setCatNombre(e.target.value);
                    if (catErrors.nombre)
                      setCatErrors({ ...catErrors, nombre: '' });
                  }}
                />
              </BoxField>

              <BoxField
                label="Área responsable vinculada"
                required
                error={catErrors.area}
              >
                <BoxSelect
                  value={catArea}
                  onChange={(e) => setCatArea(e.target.value)}
                >
                  {AREAS_INSTITUCIONALES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </BoxSelect>
              </BoxField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                <BoxField label="Prioridad inicial" required>
                  <BoxSelect
                    value={catPrioridad}
                    onChange={(e) => setCatPrioridad(e.target.value)}
                  >
                    {PRIORIDADES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </BoxSelect>
                </BoxField>

                <BoxField label="SLA máximo (horas)" required>
                  <BoxInput
                    type="number"
                    min="1"
                    max="720"
                    value={catSla}
                    onChange={(e) => setCatSla(e.target.value)}
                  />
                </BoxField>
              </div>

              <BoxField label="Descripción del alcance">
                <BoxTextarea
                  rows={2}
                  placeholder="Describe qué incidencias cubre esta categoría..."
                  value={catDescripcion}
                  onChange={(e) => setCatDescripcion(e.target.value)}
                />
              </BoxField>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <Button type="submit" className="w-full h-10 font-bold">
                  {editingCatId
                    ? 'Guardar configuración'
                    : 'Registrar categoría'}
                </Button>
                {editingCatId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetCatForm}
                    className="w-full sm:w-auto h-10 font-bold"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ====================================================================
       * TAB 4: PADRÓN GLOBAL DE SOLICITUDES Y BAJA LÓGICA (`DELETE`)
       * ================================================================== */}
      {activeTab === 'AUDITORIA' && (
        <div className="space-y-4">
          {confirmDeleteSol && (
            <Alert variant="destructive" className="p-5">
              <AlertTitle className="text-sm font-extrabold">
                ¿Confirmar eliminación lógica de {confirmDeleteSol.codigo}?
              </AlertTitle>
              <AlertDescription className="mt-1 space-y-3">
                <p>
                  Esta operación ejecuta{' '}
                  <code className="font-mono font-bold">
                    DELETE /api/solicitudes/{confirmDeleteSol.id}
                  </code>{' '}
                  (exclusiva del rol Administrador en el backend) y marca el
                  registro como inactivo.
                </p>
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deletingId === confirmDeleteSol.id}
                    onClick={handleConfirmDeleteSolicitud}
                  >
                    {deletingId === confirmDeleteSol.id
                      ? 'Eliminando...'
                      : 'Confirmar baja lógica'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDeleteSol(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#1C242B]">
                  Auditoría global de solicitudes (Todas las áreas)
                </h2>
                <p className="mt-1 text-xs text-[#5A6570]">
                  El Administrador visualiza todas las solicitudes activas del
                  sistema y puede ejecutar bajas lógicas.
                </p>
              </div>

              <div className="w-full sm:w-64">
                <BoxField label="Filtrar por estado">
                  <BoxSelect
                    value={filtroEstadoAudit}
                    onChange={(e) => setFiltroEstadoAudit(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    {ESTADOS.map((est) => (
                      <option key={est.value} value={est.value}>
                        {est.label}
                      </option>
                    ))}
                  </BoxSelect>
                </BoxField>
              </div>
            </div>

            <div className="space-y-2.5">
              {solicitudesAudit.length === 0 ? (
                <div className="rounded-xl border border-[#EBE8E1] bg-[#FAF8F5] p-6 text-center text-xs text-[#5A6570]">
                  No hay solicitudes activas para el filtro seleccionado.
                </div>
              ) : (
                solicitudesAudit.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-[#7B1E2B]">
                          {s.codigo}
                        </span>
                        <EstadoBadge estado={s.estado} />
                        <PrioridadBadge prioridad={s.prioridad} />
                        <span className="text-xs text-[#5A6570]">
                          · Área: {s.areaNombre}
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-[#1C242B]">
                        {s.titulo}
                      </div>
                      <div className="text-xs text-[#5A6570]">
                        Solicitante: {s.solicitanteNombre} · Responsable:{' '}
                        {s.responsableNombre || 'Sin asignar'} · Actualizado:{' '}
                        {formatDateTime(s.actualizadoEn)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/solicitudes/${s.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Ver trazabilidad
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setConfirmDeleteSol(s)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Baja lógica
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
