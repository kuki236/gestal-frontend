'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { BoxField, BoxInput } from '@/components/ui/box-field';
import { useToast } from '@/components/ui/toast';

const DEMO_ACCOUNTS = [
  {
    rol: 'Estudiante',
    correo: 'ana.torres@example.edu',
    password: 'gestal123',
  },
  {
    rol: 'Técnico',
    correo: 'luis.rojas@example.edu',
    password: 'gestal123',
  },
  {
    rol: 'Supervisor',
    correo: 'maria.vega@example.edu',
    password: 'gestal123',
  },
  {
    rol: 'Administrador',
    correo: 'admin@example.edu',
    password: 'gestal123',
  },
];

export default function LoginPage() {
  const { login, isAuthenticated, user, hydrated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [correo, setCorreo] = useState('ana.torres@example.edu');
  const [password, setPassword] = useState('gestal123');
  const [rolDemo, setRolDemo] = useState('Estudiante');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && isAuthenticated && user) {
      const target =
        user.rol === 'ADMIN' || user.rol === 'ADMINISTRADOR'
          ? '/administracion'
          : user.rol === 'SUPERVISOR'
          ? '/gestion'
          : '/solicitudes';
      router.replace(target);
    }
  }, [hydrated, isAuthenticated, user, router]);

  const validate = () => {
    const nextErrors = {};
    if (!correo.trim()) {
      nextErrors.correo = 'Ingresa tu correo';
    } else if (!correo.includes('@')) {
      nextErrors.correo = 'Ingresa un correo institucional válido';
    }
    if (!password) {
      nextErrors.password = 'Ingresa tu contraseña';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    try {
      setSubmitting(true);
      const loggedUser = await login(correo.trim(), password);
      toast({
        variant: 'success',
        title: `Bienvenido(a), ${loggedUser.nombre}`,
        description: `Sesión iniciada como ${rolDemo}.`,
      });
      const target =
        loggedUser.rol === 'ADMIN' || loggedUser.rol === 'ADMINISTRADOR'
          ? '/administracion'
          : loggedUser.rol === 'SUPERVISOR'
          ? '/gestion'
          : '/solicitudes';
      router.push(target);
    } catch (err) {
      setError(err?.message || 'Correo o contraseña incorrectos');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectRole = (acc) => {
    setRolDemo(acc.rol);
    setCorreo(acc.correo);
    setPassword(acc.password);
    setError('');
    setFieldErrors({});
  };

  return (
    <div className="min-h-screen bg-[#F4F2EE] text-[#1C242B] px-4 py-8 sm:px-10 sm:py-12">
      <div className="mx-auto max-w-[960px]">
        {/* Top-left Institutional Heading outside the white card (Exact Figma d-login-estudiante) */}
        <header className="mb-5">
          <div className="text-2xl font-extrabold tracking-tight text-[#7B1E2B]">
            Gestal
          </div>
          <div className="mt-2 text-base font-extrabold text-[#1C242B]">
            Servicios universitarios
          </div>
        </header>

        {/* Large White Card Container */}
        <Card className="px-5 py-10 sm:px-12 sm:py-16">
          <div className="mx-auto max-w-[340px]">
            <h1 className="text-xl font-extrabold text-[#1C242B]">
              Inicia sesión
            </h1>

            <p className="mt-2 text-xs text-[#5A6570]">
              Recorrido de demostración · {rolDemo}
            </p>

            {/* Quick Role Switcher Pills for Demo/Evaluation */}
            <div className="mt-3 mb-4 flex items-center gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const active = correo === acc.correo;
                return (
                  <button
                    key={acc.rol}
                    type="button"
                    onClick={() => handleSelectRole(acc)}
                    className={`flex-1 rounded-md px-2.5 py-1.5 text-[11px] transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#F5E4E6] font-bold text-[#7B1E2B]'
                        : 'border border-[#E5E2DC] bg-[#FAF9F6] font-medium text-[#5A6570] hover:text-[#1C242B]'
                    }`}
                  >
                    {acc.rol}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <BoxField
                label="Correo institucional"
                error={fieldErrors.correo}
              >
                <BoxInput
                  type="email"
                  name="correo"
                  autoComplete="email"
                  placeholder="ana.torres@example.edu"
                  value={correo}
                  onChange={(e) => {
                    setCorreo(e.target.value);
                    if (fieldErrors.correo) {
                      setFieldErrors((prev) => ({ ...prev, correo: '' }));
                    }
                  }}
                />
              </BoxField>

              <BoxField label="Contraseña" error={fieldErrors.password}>
                <BoxInput
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }
                  }}
                />
              </BoxField>

              {/* Invalid Credentials Box (Exact Figma d-login-invalido) */}
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>No se pudo iniciar sesión</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-10 font-bold"
              >
                {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
