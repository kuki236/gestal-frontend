# Gestal — Frontend (Primera Versión Funcional / MVP Fase II)

Frontend del sistema **Gestal — Sistema Web Inteligente para la Gestión Integral de Servicios Universitarios**.

Proyecto del curso *Taller de Construcción de Software Web* — Grupo 3, Facultad de Ingeniería de Sistemas e Informática, UNMSM (2026-II).
- **Responsable Frontend (P6):** Gianpierre Rodrigo Dulanto Romero

---

## 1. Cobertura de Fase II (Primera Versión Funcional)

Cumple el alcance de **Fase II — Construcción Full Stack** hasta **Primera versión funcional** especificado en el documento del curso:

### Construcción del Frontend en React
- **Componentes, Props y State:** Arquitectura modular en `src/components/` y páginas por ruta en `src/app/` con `useState`, `useEffect`, `useMemo` y `useContext`.
- **Eventos y Validaciones:** Validación en cliente y servidor en formularios de inicio de sesión, registro de solicitud, comentarios, asignación de técnico y rechazo con motivo obligatorio.
- **Listas y Renderizado Condicional:** Bandejas dinámicas por rol (`ESTUDIANTE`, `TECNICO`, `SUPERVISOR`), estados de carga (`Loading` con `Skeleton`), estado vacío (`EmptyState`) y alertas contextuales (`Alert`).
- **Componentes Reutilizables y Librerías UI (`shadcn/ui` + Radix UI + `lucide-react`):**
  - `Layout`, `ProtectedRoute`, `SolicitudCard`, `EstadoBadge`, `PrioridadBadge`, `EmptyState`, `ErrorMessage`, `Loading`.
  - Primitivos `shadcn/ui` en `src/components/ui/`: `BoxField` / `BoxSelect`, `DropdownMenu`, `Tooltip` (`@radix-ui/react-tooltip`), `ToastProvider` / `useToast`, `Card`, `Alert`, `Badge`, `Button`, `Skeleton`.

### Persistencia, Estado e Integración End-to-End (`React ↕ REST API ↕ Spring Boot ↕ MySQL`)
- **CRUD Completo y Fetch (`src/services/api.js` y `src/services/solicitudesService.js`):**
  - `POST /api/auth/login` — Autenticación con JWT (`Bearer <token>`).
  - `GET /api/solicitudes` y `GET /api/solicitudes/{id}` — Consulta filtrada por rol.
  - `POST /api/solicitudes` — Registro de solicitud con código único `GEST-YYYY-NNN`, prioridad inicial por categoría y estado `NUEVO`.
  - `PUT /api/solicitudes/{id}` — Edición de datos de solicitud.
  - `PATCH /api/solicitudes/{id}/responsable` — Asignación/reasignación de técnico y cambio de prioridad (`NUEVO → ASIGNADO`).
  - `PATCH /api/solicitudes/{id}/estado` — Transiciones de estado por rol (`ASIGNADO → EN_PROCESO → RESUELTO → CERRADO` y `RECHAZADO`).
  - `DELETE /api/solicitudes/{id}` — Baja lógica para rol `ADMINISTRADOR`.
  - `GET /api/categorias` y `GET /api/prioridades` — Catálogos de servicio.
- **Manejo de sesión en cliente (`Cookies`, `LocalStorage` y `SessionStorage`):**
  - `LocalStorage`: `gestal_auth_token`, `gestal_auth_user`.
  - `SessionStorage`: `gestal_auth_token`, `gestal_auth_user`, `gestal_session_started_at`.
  - `Cookies`: `gestal_auth_token`, `gestal_auth_rol` (`SameSite=Lax`).
- **Modo Resiliente:** Conecta en tiempo real a `gestal-backend` (`http://localhost:8080`) con MySQL, e incluye respaldo automático con datos semilla idénticos al prototipo Figma si el backend está apagado.

---

## 2. Requisitos e Instalación

- **Node.js 18+**
- **Backend `gestal-backend`** en ejecución sobre `http://localhost:8080` con **MySQL 8** (opcional para pruebas de UI gracias al respaldo semilla integrado).

```bash
# 1. Configurar variables de entorno
cp .env.example .env.local

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo en http://localhost:5173
npm run dev
```

Variables en `.env.example`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 3. Credenciales Semilla para Demostración End-to-End

| Rol | Nombre | Correo | Contraseña | Ruta inicial |
| --- | --- | --- | --- | --- |
| **Estudiante** | Ana Torres | `ana.torres@example.edu` | `gestal123` | `/solicitudes` |
| **Técnico** | Luis Rojas | `luis.rojas@example.edu` | `gestal123` | `/solicitudes` |
| **Técnico (2)** | Carla Ramos | `carla.ramos@example.edu` | `gestal123` | `/solicitudes` |
| **Supervisor** | María Vega | `maria.vega@example.edu` | `gestal123` | `/gestion` |
| **Administrador** | Administrador | `admin@example.edu` | `gestal123` | `/administracion` |

---

## 4. Secuencia de Demostración (Primera Versión Funcional)

1. **Login (`POST /api/auth/login`):** Ingresar como **Estudiante** (`ana.torres@example.edu` / `gestal123`).
2. **Registrar solicitud (`POST /api/solicitudes`):** Ir a **Nueva solicitud** (`/solicitudes/nueva`), elegir categoría, ubicación y descripción. Se confirma el registro con código único `GEST-2026-NNN`, prioridad inicial y estado `Nuevo`.
3. **Consultar solicitud (`GET /api/solicitudes` y `GET /api/solicitudes/{id}`):** Verificar la solicitud en **Mis solicitudes** y abrir **Detalle y seguimiento** (permite publicar comentarios o editar datos con `PUT` mientras está en `Nuevo`).
4. **Asignar responsable y prioridad (`PATCH /api/solicitudes/{id}/responsable`):** Cambiar a **Supervisor** (`maria.vega@example.edu`), seleccionar la solicitud en **Gestión de área** (`/gestion`), asignar a `Luis Rojas` con prioridad `Alta` (`Nuevo → Asignado`).
5. **Atender y resolver (`PATCH /api/solicitudes/{id}/estado`):** Cambiar a **Técnico** (`luis.rojas@example.edu`), abrir la solicitud en **Mis asignaciones**, pulsar **Iniciar atención** (`Asignado → En proceso`) y luego **Marcar como resuelto** (`En proceso → Resuelto`).
6. **Confirmar cierre o rechazo (`PATCH /api/solicitudes/{id}/estado`):** Como **Supervisor**, pulsar **Cerrar solicitud** (`Resuelto → Cerrado`) o **Rechazar solicitud** indicando el motivo obligatorio.
7. **Consola de Administración (`/administracion`):** Ingresar como **Administrador** (`admin@example.edu` / `gestal123`) para consultar el **Dashboard con los 9 indicadores clave (RF-16/17)**, administrar **Usuarios y roles (RF-18)**, configurar **Categorías, áreas y SLA (RF-19/20/21)** y ejecutar **bajas lógicas (`DELETE /api/solicitudes/{id}`)**.
