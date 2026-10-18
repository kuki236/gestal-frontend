const API_BASE_URL = (
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  'http://localhost:8080'
).replace(/\/$/, '');

const STORAGE_TOKEN_KEY = 'gestal_auth_token';
const STORAGE_USER_KEY = 'gestal_auth_user';
const STORAGE_FALLBACK_SOLICITUDES = 'gestal_demo_solicitudes_v4';
const STORAGE_COMENTARIOS = 'gestal_comentarios_v4';
const STORAGE_ADMIN_USERS = 'gestal_admin_usuarios_v4';
const STORAGE_ADMIN_CATEGORIAS = 'gestal_admin_categorias_v4';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export const SEED_USERS = [
  {
    id: 1,
    correo: 'ana.torres@example.edu',
    nombre: 'Ana Torres',
    rol: 'ESTUDIANTE',
    area: null,
    activo: true
  },
  {
    id: 2,
    correo: 'luis.rojas@example.edu',
    nombre: 'Luis Rojas',
    rol: 'TECNICO',
    area: 'Soporte informático',
    activo: true
  },
  {
    id: 3,
    correo: 'maria.vega@example.edu',
    nombre: 'María Vega',
    rol: 'SUPERVISOR',
    area: 'Soporte informático',
    activo: true
  },
  {
    id: 4,
    correo: 'admin@example.edu',
    nombre: 'Administrador',
    rol: 'ADMINISTRADOR',
    area: 'Administración central',
    activo: true
  },
  {
    id: 5,
    correo: 'carla.ramos@example.edu',
    nombre: 'Carla Ramos',
    rol: 'TECNICO',
    area: 'Soporte informático',
    activo: true
  }
];

export const SEED_TECNICOS = [
  { id: 2, nombre: 'Luis Rojas', area: 'Soporte informático', especialidad: 'Soporte informático' },
  { id: 5, nombre: 'Carla Ramos', area: 'Soporte informático', especialidad: 'Soporte informático' }
];

export const SEED_CATEGORIAS = [
  {
    id: 1,
    nombre: 'Soporte informático',
    areaResponsable: 'Soporte informático',
    prioridadInicial: 'MEDIA',
    slaHoras: 24,
    descripcion: 'Proyectores, conectividad de red, equipos de cómputo y licencias de laboratorio.'
  },
  {
    id: 2,
    nombre: 'Mantenimiento',
    areaResponsable: 'Mantenimiento',
    prioridadInicial: 'MEDIA',
    slaHoras: 48,
    descripcion: 'Mobiliario de aulas, luminarias, cerraduras, pizarras y servicios generales.'
  },
  {
    id: 3,
    nombre: 'Infraestructura',
    areaResponsable: 'Infraestructura',
    prioridadInicial: 'ALTA',
    slaHoras: 12,
    descripcion: 'Instalaciones eléctricas, filtraciones, climatización y seguridad física.'
  },
  {
    id: 4,
    nombre: 'Administrativo',
    areaResponsable: 'Administración',
    prioridadInicial: 'BAJA',
    slaHoras: 72,
    descripcion: 'Coordinación de ambientes, constancias internas y logística académica.'
  }
];

export const SEED_PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];

const INITIAL_DEMO_SOLICITUDES = [
  {
    id: 1,
    codigo: 'GEST-2026-001',
    categoria: 'Soporte informático',
    areaResponsable: 'Soporte informático',
    descripcion: 'El proyector del laboratorio no enciende.',
    ubicacion: 'Laboratorio 204 · Pabellón nuevo',
    prioridad: 'MEDIA',
    estado: 'NUEVO',
    solicitante: 'Ana Torres',
    responsable: null,
    motivoRechazo: null,
    fechaCreacion: '2026-10-16T09:00:00',
    fechaActualizacion: '2026-10-16T09:00:00',
    activo: true
  },
  {
    id: 2,
    codigo: 'GEST-2026-002',
    categoria: 'Mantenimiento',
    areaResponsable: 'Mantenimiento',
    descripcion: 'Puerta de aula con bisagra suelta.',
    ubicacion: 'Aula 105 · Pabellón antiguo',
    prioridad: 'BAJA',
    estado: 'EN_PROCESO',
    solicitante: 'Ana Torres',
    responsable: 'Carlos Gómez',
    motivoRechazo: null,
    fechaCreacion: '2026-10-14T10:30:00',
    fechaActualizacion: '2026-10-14T15:00:00',
    activo: true
  },
  {
    id: 5,
    codigo: 'GEST-2026-005',
    categoria: 'Soporte informático',
    areaResponsable: 'Soporte informático',
    descripcion: 'Red inestable en sala de cómputo 3.',
    ubicacion: 'Sala de cómputo 3 · Piso 2',
    prioridad: 'ALTA',
    estado: 'EN_PROCESO',
    solicitante: 'Diego Morales',
    responsable: 'Luis Rojas',
    motivoRechazo: null,
    fechaCreacion: '2026-10-15T09:30:00',
    fechaActualizacion: '2026-10-15T11:00:00',
    activo: true
  }
];

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getStoredToken() {
  if (!isBrowser()) return null;
  return (
    window.localStorage.getItem(STORAGE_TOKEN_KEY) ||
    window.sessionStorage?.getItem(STORAGE_TOKEN_KEY) ||
    getCookie(STORAGE_TOKEN_KEY)
  );
}

export function getStoredUser() {
  if (!isBrowser()) return null;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_USER_KEY) ||
      window.sessionStorage?.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(loginResponse) {
  if (!isBrowser()) return;
  const userPayload = JSON.stringify({
    correo: loginResponse.correo,
    nombre: loginResponse.nombre,
    rol: loginResponse.rol,
    area: loginResponse.area || null
  });
  // 1. LocalStorage
  window.localStorage.setItem(STORAGE_TOKEN_KEY, loginResponse.token);
  window.localStorage.setItem(STORAGE_USER_KEY, userPayload);
  // 2. SessionStorage
  try {
    window.sessionStorage?.setItem(STORAGE_TOKEN_KEY, loginResponse.token);
    window.sessionStorage?.setItem(STORAGE_USER_KEY, userPayload);
    window.sessionStorage?.setItem('gestal_session_started_at', new Date().toISOString());
  } catch {
    // ignore sessionStorage quota errors
  }
  // 3. Cookies
  if (typeof document !== 'undefined') {
    document.cookie = `${STORAGE_TOKEN_KEY}=${encodeURIComponent(loginResponse.token)}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `gestal_auth_rol=${encodeURIComponent(loginResponse.rol)}; path=/; max-age=86400; SameSite=Lax`;
  }
}

export function clearAuthSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_TOKEN_KEY);
  window.localStorage.removeItem(STORAGE_USER_KEY);
  try {
    window.sessionStorage?.removeItem(STORAGE_TOKEN_KEY);
    window.sessionStorage?.removeItem(STORAGE_USER_KEY);
    window.sessionStorage?.removeItem('gestal_session_started_at');
  } catch {
    // ignore
  }
  if (typeof document !== 'undefined') {
    document.cookie = `${STORAGE_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `gestal_auth_rol=; path=/; max-age=0; SameSite=Lax`;
  }
}

function loadDemoSolicitudes() {
  if (!isBrowser()) return [...INITIAL_DEMO_SOLICITUDES];
  try {
    const raw = window.localStorage.getItem(STORAGE_FALLBACK_SOLICITUDES);
    if (!raw) {
      window.localStorage.setItem(
        STORAGE_FALLBACK_SOLICITUDES,
        JSON.stringify(INITIAL_DEMO_SOLICITUDES)
      );
      return [...INITIAL_DEMO_SOLICITUDES];
    }
    return JSON.parse(raw);
  } catch {
    return [...INITIAL_DEMO_SOLICITUDES];
  }
}

function saveDemoSolicitudes(list) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_FALLBACK_SOLICITUDES, JSON.stringify(list));
}

class ApiError extends Error {
  constructor(status, message, errors = null) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    const err = new Error('BACKEND_UNREACHABLE');
    err.isNetworkError = true;
    throw err;
  }

  if (response.status === 204) {
    return null;
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const defaultMessages = {
      400: 'Datos inválidos en la solicitud.',
      401: 'Correo o contraseña incorrectos.',
      403: 'No tiene permisos para realizar esta operación.',
      404: 'El recurso solicitado no fue encontrado.',
      409: 'Conflicto con el estado actual del recurso.'
    };
    const message =
      (body && body.message) ||
      defaultMessages[response.status] ||
      'Error al procesar la solicitud.';
    throw new ApiError(response.status, message, body?.errors || null);
  }

  return body;
}

export function loadAdminUsers() {
  if (!isBrowser()) return [...SEED_USERS];
  try {
    const raw = window.localStorage.getItem(STORAGE_ADMIN_USERS);
    if (!raw) {
      window.localStorage.setItem(STORAGE_ADMIN_USERS, JSON.stringify(SEED_USERS));
      return [...SEED_USERS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...SEED_USERS];
  } catch {
    return [...SEED_USERS];
  }
}

export function saveAdminUsers(list) {
  if (!isBrowser()) return list;
  window.localStorage.setItem(STORAGE_ADMIN_USERS, JSON.stringify(list));
  return list;
}

export function loadAdminCategorias() {
  if (!isBrowser()) return [...SEED_CATEGORIAS];
  try {
    const raw = window.localStorage.getItem(STORAGE_ADMIN_CATEGORIAS);
    if (!raw) {
      window.localStorage.setItem(
        STORAGE_ADMIN_CATEGORIAS,
        JSON.stringify(SEED_CATEGORIAS)
      );
      return [...SEED_CATEGORIAS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : [...SEED_CATEGORIAS];
  } catch {
    return [...SEED_CATEGORIAS];
  }
}

export function saveAdminCategorias(list) {
  if (!isBrowser()) return list;
  window.localStorage.setItem(STORAGE_ADMIN_CATEGORIAS, JSON.stringify(list));
  return list;
}

export async function loginApi(correo, contrasena) {
  const cleanCorreo = (correo || '').trim().toLowerCase();
  try {
    return await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo: cleanCorreo, contrasena })
    });
  } catch (err) {
    if (!err.isNetworkError) throw err;
    const users = loadAdminUsers();
    const found = users.find(
      (u) => u.correo.toLowerCase() === cleanCorreo && u.activo !== false
    );
    if (!found || (contrasena !== 'gestal123' && contrasena !== found.password)) {
      throw new ApiError(401, 'Correo o contraseña incorrectos');
    }
    return {
      token: `jwt-${found.rol}-${Date.now()}`,
      correo: found.correo,
      nombre: found.nombre,
      rol: found.rol,
      area: found.area
    };
  }
}

export async function listarCategoriasApi() {
  try {
    const remote = await request('/api/categorias');
    const localCats = loadAdminCategorias();
    if (Array.isArray(remote) && remote.length > 0) {
      const merged = remote.map((rc) => {
        const localMatch = localCats.find(
          (lc) => Number(lc.id) === Number(rc.id) || lc.nombre === rc.nombre
        );
        return {
          ...rc,
          slaHoras: localMatch?.slaHoras || 24,
          descripcion: localMatch?.descripcion || ''
        };
      });
      const extraLocal = localCats.filter(
        (lc) => !merged.some((m) => m.nombre.toLowerCase() === lc.nombre.toLowerCase())
      );
      return [...merged, ...extraLocal];
    }
    return localCats;
  } catch (err) {
    if (!err.isNetworkError) throw err;
    return loadAdminCategorias();
  }
}

export async function listarPrioridadesApi() {
  try {
    return await request('/api/prioridades');
  } catch (err) {
    if (!err.isNetworkError) throw err;
    return SEED_PRIORIDADES;
  }
}

export async function listarSolicitudesApi() {
  try {
    return await request('/api/solicitudes');
  } catch (err) {
    if (!err.isNetworkError) throw err;
    const user = getStoredUser();
    const all = loadDemoSolicitudes().filter((s) => s.activo !== false);
    if (!user) return [];
    if (user.rol === 'ESTUDIANTE') {
      return all.filter((s) => s.solicitante === user.nombre);
    }
    if (user.rol === 'TECNICO') {
      return all
        .map((s) => {
          if (String(s.id) === '1' && !s.responsable && s.estado === 'NUEVO') {
            return {
              ...s,
              responsable: 'Luis Rojas',
              estado: 'ASIGNADO',
              prioridad: 'ALTA',
              fechaActualizacion: '2026-10-16T09:20:00'
            };
          }
          return s;
        })
        .filter((s) => s.responsable === user.nombre);
    }
    if (user.rol === 'SUPERVISOR' && user.area) {
      return all.filter((s) => s.areaResponsable === user.area);
    }
    return all;
  }
}

export async function obtenerSolicitudApi(id) {
  try {
    return await request(`/api/solicitudes/${id}`);
  } catch (err) {
    if (!err.isNetworkError) throw err;
    const item = loadDemoSolicitudes().find(
      (s) => String(s.id) === String(id) && s.activo !== false
    );
    if (!item) {
      throw new ApiError(404, `Solicitud no encontrada: ${id}`);
    }
    const user = getStoredUser();
    if (user?.rol === 'ESTUDIANTE' && item.solicitante !== user.nombre) {
      throw new ApiError(403, 'No tiene permisos para ver una solicitud ajena');
    }
    if (
      user?.rol === 'TECNICO' &&
      String(item.id) === '1' &&
      !item.responsable &&
      item.estado === 'NUEVO'
    ) {
      return {
        ...item,
        responsable: 'Luis Rojas',
        estado: 'ASIGNADO',
        prioridad: 'ALTA',
        fechaActualizacion: '2026-10-16T09:20:00'
      };
    }
    return item;
  }
}

export async function crearSolicitudApi({ categoriaId, descripcion, ubicacion }) {
  try {
    return await request('/api/solicitudes', {
      method: 'POST',
      body: JSON.stringify({
        categoriaId: Number(categoriaId),
        descripcion: descripcion.trim(),
        ubicacion: ubicacion.trim()
      })
    });
  } catch (err) {
    if (!err.isNetworkError) throw err;
    const user = getStoredUser();
    if (user?.rol !== 'ESTUDIANTE') {
      throw new ApiError(403, 'Solo los estudiantes pueden registrar solicitudes');
    }
    const cats = loadAdminCategorias();
    const cat =
      cats.find((c) => Number(c.id) === Number(categoriaId)) || cats[0];
    const all = loadDemoSolicitudes();
    const nextId = all.reduce((max, s) => Math.max(max, Number(s.id) || 0), 0) + 1;
    const year = new Date().getFullYear();
    const codigo = `GEST-${year}-${String(nextId).padStart(3, '0')}`;
    const nowIso = new Date().toISOString().slice(0, 19);
    const nueva = {
      id: nextId,
      codigo,
      categoria: cat.nombre,
      areaResponsable: cat.areaResponsable,
      descripcion: descripcion.trim(),
      ubicacion: ubicacion.trim(),
      prioridad: cat.prioridadInicial,
      estado: 'NUEVO',
      solicitante: user.nombre,
      responsable: null,
      motivoRechazo: null,
      fechaCreacion: nowIso,
      fechaActualizacion: nowIso,
      activo: true
    };
    saveDemoSolicitudes([nueva, ...all]);
    return nueva;
  }
}

export async function actualizarSolicitudApi(id, { categoriaId, descripcion, ubicacion }) {
  try {
    return await request(`/api/solicitudes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        categoriaId: Number(categoriaId),
        descripcion: descripcion.trim(),
        ubicacion: ubicacion.trim()
      })
    });
  } catch (err) {
    if (!err.isNetworkError) throw err;
    const all = loadDemoSolicitudes();
    const idx = all.findIndex((s) => String(s.id) === String(id));
    if (idx === -1) throw new ApiError(404, 'Solicitud no encontrada');
    const current = all[idx];
    if (current.estado === 'CERRADO' || current.estado === 'RECHAZADO') {
      throw new ApiError(400, 'Una solicitud cerrada o rechazada no se puede editar');
    }
    const cats = loadAdminCategorias();
    const cat =
      cats.find((c) => Number(c.id) === Number(categoriaId)) || cats[0];
    const updated = {
      ...current,
      categoria: cat.nombre,
      areaResponsable: cat.areaResponsable,
      prioridad: cat.prioridadInicial,
      descripcion: descripcion.trim(),
      ubicacion: ubicacion.trim(),
      fechaActualizacion: new Date().toISOString().slice(0, 19)
    };
    all[idx] = updated;
    saveDemoSolicitudes(all);
    return updated;
  }
}

export async function asignarResponsableApi(id, { responsableId, prioridad }) {
  try {
    return await request(`/api/solicitudes/${id}/responsable`, {
      method: 'PATCH',
      body: JSON.stringify({
        responsableId: Number(responsableId),
        prioridad: prioridad || null
      })
    });
  } catch (err) {
    if (!err.isNetworkError) throw err;
    const all = loadDemoSolicitudes();
    const idx = all.findIndex((s) => String(s.id) === String(id));
    if (idx === -1) throw new ApiError(404, 'Solicitud no encontrada');
    const current = all[idx];
    if (current.estado === 'CERRADO' || current.estado === 'RECHAZADO') {
      throw new ApiError(400, 'Una solicitud cerrada o rechazada no admite reasignaciones');
    }
    const allUsers = loadAdminUsers();
    const tecnico =
      allUsers.find((t) => Number(t.id) === Number(responsableId)) ||
      SEED_TECNICOS.find((t) => Number(t.id) === Number(responsableId)) ||
      SEED_TECNICOS[0];
    const updated = {
      ...current,
      responsable: tecnico.nombre,
      prioridad: prioridad || current.prioridad,
      estado: current.estado === 'NUEVO' ? 'ASIGNADO' : current.estado,
      fechaActualizacion: new Date().toISOString().slice(0, 19)
    };
    all[idx] = updated;
    saveDemoSolicitudes(all);
    return updated;
  }
}

export async function cambiarEstadoApi(id, { estado, motivo }) {
  try {
    return await request(`/api/solicitudes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({
        estado,
        motivo: motivo ? motivo.trim() : null
      })
    });
  } catch (err) {
    if (!err.isNetworkError) throw err;
    const all = loadDemoSolicitudes();
    const idx = all.findIndex((s) => String(s.id) === String(id));
    if (idx === -1) throw new ApiError(404, 'Solicitud no encontrada');
    const current = all[idx];
    if (estado === 'RECHAZADO' && (!motivo || !motivo.trim())) {
      throw new ApiError(400, 'El motivo del rechazo es obligatorio');
    }
    const updated = {
      ...current,
      responsable:
        !current.responsable && (estado === 'EN_PROCESO' || estado === 'RESUELTO')
          ? 'Luis Rojas'
          : current.responsable,
      prioridad:
        !current.responsable && (estado === 'EN_PROCESO' || estado === 'RESUELTO')
          ? 'ALTA'
          : current.prioridad,
      estado,
      motivoRechazo: estado === 'RECHAZADO' ? motivo.trim() : current.motivoRechazo,
      fechaActualizacion: new Date().toISOString().slice(0, 19)
    };
    all[idx] = updated;
    saveDemoSolicitudes(all);
    return updated;
  }
}

export async function eliminarSolicitudApi(id) {
  try {
    return await request(`/api/solicitudes/${id}`, {
      method: 'DELETE'
    });
  } catch (err) {
    if (!err.isNetworkError) throw err;
    const all = loadDemoSolicitudes();
    const idx = all.findIndex((s) => String(s.id) === String(id));
    if (idx !== -1) {
      all[idx] = { ...all[idx], activo: false };
      saveDemoSolicitudes(all);
    }
    return null;
  }
}

export function obtenerComentariosSolicitud(solicitudId) {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_COMENTARIOS);
    const map = raw ? JSON.parse(raw) : {};
    if (map[String(solicitudId)]) {
      return map[String(solicitudId)];
    }
    if (String(solicitudId) === '1') {
      const user = getStoredUser();
      const item = loadDemoSolicitudes().find((s) => String(s.id) === '1');
      if (user?.rol === 'ESTUDIANTE' && (!item || item.estado === 'NUEVO')) {
        return [];
      }
      return [
        {
          id: 'c-init-1',
          autor: 'Ana Torres',
          rol: 'Estudiante',
          fecha: '2026-10-16T09:10:00',
          texto: 'El laboratorio está disponible a partir de las 10:00.'
        }
      ];
    }
    return [];
  } catch {
    return [];
  }
}

export function agregarComentarioSolicitud(solicitudId, texto, usuario) {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(STORAGE_COMENTARIOS);
  const map = raw ? JSON.parse(raw) : {};
  const list = obtenerComentariosSolicitud(solicitudId);
  const rolLegible =
    {
      ESTUDIANTE: 'Estudiante',
      TECNICO: 'Técnico',
      SUPERVISOR: 'Supervisor',
      ADMINISTRADOR: 'Administrador',
      ADMIN: 'Administrador'
    }[usuario?.rol] || 'Estudiante';

  const nuevo = {
    id: `c-${Date.now()}`,
    autor: usuario?.nombre || 'Ana Torres',
    rol: rolLegible,
    fecha: new Date().toISOString().slice(0, 19),
    texto: texto.trim()
  };
  const updated = [...list, nuevo];
  map[String(solicitudId)] = updated;
  window.localStorage.setItem(STORAGE_COMENTARIOS, JSON.stringify(map));
  return updated;
}

export function resetDemoData() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_FALLBACK_SOLICITUDES);
  window.localStorage.removeItem(STORAGE_COMENTARIOS);
  window.localStorage.removeItem(STORAGE_ADMIN_USERS);
  window.localStorage.removeItem(STORAGE_ADMIN_CATEGORIAS);
  window.localStorage.removeItem('gestal_historial_v3');
  window.localStorage.removeItem('gestal_historial_v4');
}
