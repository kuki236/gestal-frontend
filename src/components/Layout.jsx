'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Check, RotateCcw, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  isBackendOnline,
  onConnectionChange,
  resetDemoData,
} from '@/services/api';
import { cn } from '@/lib/utils';

const ROLE_UPPER = {
  ESTUDIANTE: 'ESTUDIANTE',
  TECNICO: 'TÉCNICO',
  SUPERVISOR: 'SUPERVISOR',
  ADMIN: 'ADMINISTRADOR',
  ADMINISTRADOR: 'ADMINISTRADOR',
};

const ROLE_MOBILE_TITLE = {
  ESTUDIANTE: 'Estudiante',
  TECNICO: 'Técnico',
  SUPERVISOR: 'Supervisor',
  ADMIN: 'Administrador',
  ADMINISTRADOR: 'Administrador',
};

const DEMO_USERS = [
  {
    rol: 'ESTUDIANTE',
    label: 'Ana Torres · Estudiante',
    correo: 'ana.torres@example.edu',
    target: '/solicitudes',
  },
  {
    rol: 'TECNICO',
    label: 'Luis Rojas · Técnico',
    correo: 'luis.rojas@example.edu',
    target: '/solicitudes',
  },
  {
    rol: 'SUPERVISOR',
    label: 'María Vega · Supervisor',
    correo: 'maria.vega@example.edu',
    target: '/gestion',
  },
  {
    rol: 'ADMINISTRADOR',
    label: 'Administrador · Sistema',
    correo: 'admin@example.edu',
    target: '/administracion',
  },
];

export function Layout({ children }) {
  const { user, login, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(isBackendOnline());
    return onConnectionChange(setOnline);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSwitchDemoRole = async (demo) => {
    try {
      await login(demo.correo, 'gestal123');
      toast({
        variant: 'default',
        title: `Rol activo: ${demo.label}`,
        description: 'Vista actualizada según el perfil seleccionado.',
      });
      router.push(demo.target);
    } catch {
      // ignore
    }
  };

  const handleResetDemo = () => {
    resetDemoData();
    toast({
      variant: 'success',
      title: 'Datos de demostración restaurados',
      description: 'Se restablecieron las solicitudes al estado inicial de Figma.',
    });
    window.location.reload();
  };

  const rol = user?.rol || 'ESTUDIANTE';

  const isMisSolicitudesActive =
    pathname === '/solicitudes' ||
    (pathname.startsWith('/solicitudes/') && pathname !== '/solicitudes/nueva');
  const isNuevaSolicitudActive = pathname === '/solicitudes/nueva';
  const isMisAsignacionesActive =
    rol === 'TECNICO' &&
    (pathname === '/solicitudes' ||
      pathname.startsWith('/gestion') ||
      pathname.startsWith('/solicitudes/'));
  const isGestionAreaActive =
    rol === 'SUPERVISOR'
      ? pathname.startsWith('/gestion') || pathname.startsWith('/solicitudes')
      : pathname.startsWith('/gestion');
  const isAdministracionActive = pathname.startsWith('/administracion');

  const navItems = [];

  if (rol === 'ESTUDIANTE') {
    navItems.push(
      {
        href: '/solicitudes',
        label: 'Mis solicitudes',
        active: isMisSolicitudesActive,
      },
      {
        href: '/solicitudes/nueva',
        label: 'Nueva solicitud',
        active: isNuevaSolicitudActive,
      }
    );
  } else if (rol === 'TECNICO') {
    navItems.push({
      href: '/solicitudes',
      label: 'Mis asignaciones',
      active: isMisAsignacionesActive,
    });
  } else if (rol === 'ADMIN' || rol === 'ADMINISTRADOR') {
    navItems.push(
      {
        href: '/administracion',
        label: 'Administración',
        active: isAdministracionActive,
      },
      {
        href: '/gestion',
        label: 'Supervisión de áreas',
        active: isGestionAreaActive,
      }
    );
  } else {
    navItems.push({
      href: '/gestion',
      label: 'Gestión de área',
      active: isGestionAreaActive,
    });
  }

  const homeHref =
    rol === 'ADMIN' || rol === 'ADMINISTRADOR'
      ? '/administracion'
      : rol === 'SUPERVISOR'
      ? '/gestion'
      : '/solicitudes';

  return (
    <div className="min-h-screen bg-[#F4F2EE] text-[#1C242B]">
      <div className="mx-auto max-w-[1240px] px-4 py-4 sm:px-8 sm:py-6">
        {/* Top Floating White Header Card */}
        <header className="mb-5 sm:mb-7 flex items-center justify-between rounded-xl border border-[#E6E3DC] bg-white px-5 py-3.5 sm:px-7 sm:py-4 shadow-2xs">
          <div className="flex items-center">
            <Link
              href={homeHref}
              className="text-xl font-extrabold tracking-tight text-[#7B1E2B] focus:outline-none"
            >
              Gestal
            </Link>
            <span className="hidden sm:inline-block ml-12 text-xs font-semibold text-[#1C242B]">
              Servicios universitarios
            </span>

            {/* Mobile role indicator with Radix DropdownMenu switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="sm:hidden ml-5 text-xs font-semibold text-[#1C242B] cursor-pointer focus:outline-none"
                >
                  {ROLE_MOBILE_TITLE[rol] || 'Estudiante'}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Cambiar rol (Demo)</DropdownMenuLabel>
                {DEMO_USERS.map((d) => (
                  <DropdownMenuItem
                    key={d.rol}
                    onSelect={() => handleSwitchDemoRole(d)}
                    className={cn(
                      'justify-between',
                      rol === d.rol && 'bg-[#F5E4E6] font-bold text-[#7B1E2B]'
                    )}
                  >
                    <span>{d.label}</span>
                    {rol === d.rol && <Check className="h-3.5 w-3.5 text-[#7B1E2B]" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleResetDemo}>
                  <RotateCcw className="h-3.5 w-3.5 text-[#5A6570]" />
                  <span>Reiniciar datos de demo</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            className="h-9 px-5 text-xs font-bold text-[#7B1E2B]"
          >
            Salir
          </Button>
        </header>

        {/* Mobile Nav Pills */}
        <nav
          className="mb-5 flex flex-wrap items-center gap-2.5 md:hidden"
          aria-label="Navegación móvil"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-lg px-4 py-2.5 text-xs transition-colors',
                item.active
                  ? 'bg-[#F5E4E6] font-bold text-[#7B1E2B]'
                  : 'bg-white font-semibold text-[#1C242B]'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop 2-Column Layout: Left Sidebar + Full-Width Desktop Main Area */}
        <div className="grid grid-cols-1 md:grid-cols-[190px_1fr] gap-7 lg:gap-9 items-start">
          <aside className="hidden md:block md:sticky md:top-6">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-full text-left space-y-1 rounded-lg p-1.5 -ml-1.5 transition-colors hover:bg-black/[0.03] cursor-pointer focus:outline-none"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#5A6570]">
                        {ROLE_UPPER[rol] || rol}
                      </div>
                      <div className="text-xs font-extrabold text-[#1C242B]">
                        {user?.nombre}
                      </div>
                      <div className="text-[11px] text-[#5A6570] pb-2">
                        {rol === 'ESTUDIANTE'
                          ? 'Solicitante'
                          : user?.area
                          ? `Área: ${user.area}`
                          : rol === 'ADMINISTRADOR' || rol === 'ADMIN'
                          ? 'Todas las áreas'
                          : 'Sin área asignada'}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Clic para cambiar rol o reiniciar demo
                </TooltipContent>
              </Tooltip>

              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#7B1E2B]" />
                  <span>Recorrido de demostración</span>
                </DropdownMenuLabel>
                {DEMO_USERS.map((d) => (
                  <DropdownMenuItem
                    key={d.rol}
                    onSelect={() => handleSwitchDemoRole(d)}
                    className={cn(
                      'justify-between',
                      rol === d.rol && 'bg-[#F5E4E6] font-bold text-[#7B1E2B]'
                    )}
                  >
                    <span>{d.label}</span>
                    {rol === d.rol && (
                      <Check className="h-3.5 w-3.5 text-[#7B1E2B]" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleResetDemo}>
                  <RotateCcw className="h-3.5 w-3.5 text-[#5A6570]" />
                  <span>Reiniciar datos de demo</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <nav className="mt-2 space-y-2" aria-label="Navegación principal">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'block w-full rounded-lg px-3.5 py-2.5 text-xs transition-colors',
                    item.active
                      ? 'bg-[#F5E4E6] font-bold text-[#7B1E2B]'
                      : 'bg-white font-semibold text-[#1C242B] hover:bg-white/80'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 w-full">
            {!online && (
              <Alert variant="warning" className="mb-4">
                <AlertTitle>Sin conexión con el servidor</AlertTitle>
                <AlertDescription>
                  Estás viendo datos de demostración guardados en este navegador.
                  Los cambios no llegan a la base de datos hasta que el backend
                  vuelva a responder.
                </AlertDescription>
              </Alert>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Layout;
