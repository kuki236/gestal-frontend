import {
  listarSolicitudesApi,
  obtenerSolicitudApi,
  crearSolicitudApi,
  actualizarSolicitudApi,
  eliminarSolicitudApi,
  asignarResponsableApi,
  cambiarEstadoApi,
  listarCategoriasApi,
  SEED_TECNICOS,
  loadAdminUsers,
  saveAdminUsers,
  loadAdminCategorias,
  saveAdminCategorias,
  obtenerComentariosSolicitud,
  agregarComentarioSolicitud,
  getStoredUser,
} from './api';

const STORAGE_HISTORIAL_KEY = 'gestal_historial_v4';

function isBrowser() {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

function readHistorialMap() {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_HISTORIAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// El backend aún no expone el historial de estados. Se arma con lo que sí es
// real: el registro (fechaCreacion), los cambios hechos desde este navegador y,
// si el estado actual no coincide con el último evento conocido, el último
// cambio informado por el servidor (fechaActualizacion).
function loadLocalHistorial(solicitud) {
  const historial = [
    {
      id: `h-${solicitud.id}-registro`,
      estadoNuevo: 'NUEVO',
      fecha: solicitud.fechaCreacion,
      usuarioNombre: solicitud.solicitante || null,
      comentario: 'Solicitud registrada en el sistema.',
    },
  ];

  const locales = readHistorialMap()[String(solicitud.id)];
  if (Array.isArray(locales)) {
    historial.push(...locales.filter((e) => e.estadoNuevo && e.estadoNuevo !== 'NUEVO'));
  }

  const ultimo = historial[historial.length - 1];
  if (solicitud.estado && ultimo.estadoNuevo !== solicitud.estado) {
    historial.push({
      id: `h-${solicitud.id}-actual`,
      estadoNuevo: solicitud.estado,
      fecha: solicitud.fechaActualizacion,
      usuarioNombre: null,
      comentario: 'Último cambio registrado en el servidor.',
    });
  }

  return historial;
}

function appendLocalHistorial(solicitudId, event) {
  if (!isBrowser()) return;
  try {
    const map = readHistorialMap();
    const existing = Array.isArray(map[String(solicitudId)])
      ? map[String(solicitudId)]
      : [];
    const ultimo = existing[existing.length - 1];
    if (ultimo && ultimo.estadoNuevo === event.estadoNuevo && event.estadoNuevo !== 'ASIGNADO') {
      return;
    }
    map[String(solicitudId)] = [
      ...existing,
      {
        id: `h-${Date.now()}`,
        fecha: new Date().toISOString().slice(0, 19),
        ...event,
      },
    ];
    window.localStorage.setItem(STORAGE_HISTORIAL_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

function normalizeSolicitud(raw) {
  if (!raw) return null;
  const comentariosRaw = obtenerComentariosSolicitud(raw.id);
  const comentarios = comentariosRaw.map((c) => ({
    id: c.id,
    autorNombre: c.autor || c.autorNombre || 'Usuario',
    rol: c.rol || '',
    fecha: c.fecha,
    texto: c.texto,
  }));

  const rawDesc = (raw.descripcion || '').trim();
  const firstLine = rawDesc.split('\n')[0]?.trim() || rawDesc;
  const titulo =
    raw.titulo ||
    (firstLine.length > 80 ? `${firstLine.slice(0, 80)}...` : firstLine) ||
    `Solicitud ${raw.codigo}`;

  const responsableNombre = raw.responsable || raw.responsableNombre || null;
  const tecMatch = SEED_TECNICOS.find((t) => t.nombre === responsableNombre);

  return {
    ...raw,
    titulo,
    descripcion: rawDesc,
    categoriaNombre: raw.categoria || raw.categoriaNombre || '',
    areaNombre: raw.areaResponsable || raw.areaNombre || '',
    solicitanteNombre: raw.solicitante || raw.solicitanteNombre || '',
    responsableNombre,
    responsableId: raw.responsableId || tecMatch?.id || null,
    actualizadoEn: raw.fechaActualizacion || raw.fechaCreacion,
    historial: loadLocalHistorial(raw),
    comentarios,
  };
}

export async function listarSolicitudes(filtros = {}) {
  const rawList = await listarSolicitudesApi();
  const normalized = (Array.isArray(rawList) ? rawList : []).map(
    normalizeSolicitud
  );

  const cats = await listarCategorias();

  return normalized.filter((item) => {
    if (filtros.categoriaId) {
      const targetCat = cats.find(
        (c) => String(c.id) === String(filtros.categoriaId)
      );
      if (
        targetCat &&
        item.categoriaNombre?.toLowerCase() !== targetCat.nombre?.toLowerCase()
      ) {
        return false;
      }
    }
    if (filtros.estado) {
      const targetEstado =
        filtros.estado === 'REGISTRADO'
          ? 'NUEVO'
          : filtros.estado === 'EN_ATENCION'
          ? 'EN_PROCESO'
          : filtros.estado;
      if (item.estado !== targetEstado && item.estado !== filtros.estado) {
        return false;
      }
    }
    if (filtros.prioridad && item.prioridad !== filtros.prioridad) {
      return false;
    }
    return true;
  });
}

export async function obtenerSolicitudPorId(id) {
  const raw = await obtenerSolicitudApi(id);
  return normalizeSolicitud(raw);
}

export async function crearSolicitud({
  titulo,
  descripcion,
  ubicacion,
  categoriaId,
}) {
  const fullDescripcion =
    titulo && !descripcion.startsWith(titulo)
      ? `${titulo}. ${descripcion}`
      : descripcion;

  const created = await crearSolicitudApi({
    categoriaId,
    descripcion: fullDescripcion,
    ubicacion: ubicacion || 'Campus Universitario UNMSM',
  });

  return normalizeSolicitud(created);
}

export async function cambiarEstadoSolicitud(
  id,
  nuevoEstadoUI,
  comentario,
  usuarioNombre
) {
  const backendEstado =
    nuevoEstadoUI === 'EN_ATENCION'
      ? 'EN_PROCESO'
      : nuevoEstadoUI === 'REGISTRADO'
      ? 'NUEVO'
      : nuevoEstadoUI;

  const updated = await cambiarEstadoApi(id, {
    estado: backendEstado,
    motivo: comentario,
  });

  appendLocalHistorial(id, {
    estadoNuevo: backendEstado,
    usuarioNombre: usuarioNombre || getStoredUser()?.nombre || 'Usuario',
    comentario,
  });

  return normalizeSolicitud(updated);
}

export async function asignarSolicitud(
  id,
  responsableId,
  responsableNombre,
  usuarioNombre,
  prioridad = null
) {
  const updated = await asignarResponsableApi(id, {
    responsableId: Number(responsableId),
    prioridad,
  });

  appendLocalHistorial(id, {
    estadoNuevo: updated.estado || 'ASIGNADO',
    usuarioNombre: usuarioNombre || getStoredUser()?.nombre || 'Supervisor',
    comentario: responsableNombre
      ? `Responsable asignado: ${responsableNombre}.`
      : 'Responsable asignado.',
  });

  return normalizeSolicitud(updated);
}

export async function actualizarSolicitud(
  id,
  { categoriaId, descripcion, ubicacion }
) {
  const updated = await actualizarSolicitudApi(id, {
    categoriaId: Number(categoriaId),
    descripcion,
    ubicacion,
  });
  return normalizeSolicitud(updated);
}

export async function eliminarSolicitud(id) {
  return eliminarSolicitudApi(id);
}

export async function agregarComentario(id, texto) {
  const user = getStoredUser();
  return agregarComentarioSolicitud(id, texto, user);
}

export async function listarCategorias() {
  const raw = await listarCategoriasApi();
  return (Array.isArray(raw) ? raw : []).map((c) => ({
    ...c,
    areaNombre: c.areaResponsable || c.areaNombre || 'Soporte informático',
  }));
}

// El backend no expone un endpoint de usuarios: la lista sale del padrón local
// (mismos ids que db/gestal.sql). Con area se devuelven solo los técnicos de esa área.
export async function listarTecnicos(area = null) {
  const users = loadAdminUsers();
  const tecnicosActivos = users
    .filter((u) => u.rol === 'TECNICO' && u.activo !== false)
    .map((u) => ({
      id: u.id,
      nombre: u.nombre,
      area: u.area || '',
      especialidad: u.area || '',
    }));
  const base = tecnicosActivos.length > 0 ? tecnicosActivos : SEED_TECNICOS;
  if (!area) return base;
  const delArea = base.filter(
    (t) => (t.area || '').toLowerCase() === area.toLowerCase()
  );
  return delArea.length > 0 ? delArea : base;
}

export async function listarUsuariosSistema() {
  return loadAdminUsers();
}

export async function guardarUsuarioSistema({
  id = null,
  nombre,
  correo,
  password,
  rol,
  area,
  activo = true,
}) {
  const list = loadAdminUsers();
  const cleanCorreo = (correo || '').trim().toLowerCase();

  const duplicate = list.find(
    (u) =>
      u.correo.toLowerCase() === cleanCorreo &&
      String(u.id) !== String(id || '')
  );
  if (duplicate) {
    throw new Error('Ya existe un usuario registrado con ese correo institucional.');
  }

  const normalizedArea =
    rol === 'TECNICO' || rol === 'SUPERVISOR'
      ? (area || 'Soporte informático').trim()
      : null;

  if (id) {
    const updated = list.map((u) =>
      String(u.id) === String(id)
        ? {
            ...u,
            nombre: nombre.trim(),
            correo: cleanCorreo,
            rol,
            area: normalizedArea,
            activo,
            ...(password ? { password } : {}),
          }
        : u
    );
    saveAdminUsers(updated);
    return updated;
  }

  const nextId =
    list.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1;
  const nuevo = {
    id: nextId,
    nombre: nombre.trim(),
    correo: cleanCorreo,
    password: password || 'gestal123',
    rol,
    area: normalizedArea,
    activo: true,
  };
  const updated = [...list, nuevo];
  saveAdminUsers(updated);
  return updated;
}

export async function toggleEstadoUsuarioSistema(id) {
  const list = loadAdminUsers();
  const updated = list.map((u) =>
    String(u.id) === String(id) ? { ...u, activo: u.activo === false } : u
  );
  saveAdminUsers(updated);
  return updated;
}

export async function guardarCategoriaSistema({
  id = null,
  nombre,
  areaResponsable,
  prioridadInicial = 'MEDIA',
  slaHoras = 24,
  descripcion = '',
}) {
  const list = loadAdminCategorias();
  const cleanNombre = (nombre || '').trim();
  const cleanArea = (areaResponsable || '').trim();

  if (!cleanNombre) {
    throw new Error('Ingresa el nombre de la categoría.');
  }
  if (!cleanArea) {
    throw new Error('Toda categoría debe estar vinculada a un área responsable.');
  }

  if (id) {
    const updated = list.map((c) =>
      String(c.id) === String(id)
        ? {
            ...c,
            nombre: cleanNombre,
            areaResponsable: cleanArea,
            prioridadInicial,
            slaHoras: Number(slaHoras) || 24,
            descripcion: descripcion.trim(),
          }
        : c
    );
    saveAdminCategorias(updated);
    return updated;
  }

  const nextId =
    list.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0) + 1;
  const nueva = {
    id: nextId,
    nombre: cleanNombre,
    areaResponsable: cleanArea,
    prioridadInicial,
    slaHoras: Number(slaHoras) || 24,
    descripcion: descripcion.trim(),
  };
  const updated = [...list, nueva];
  saveAdminCategorias(updated);
  return updated;
}
