'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
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
import { useToast } from '@/components/ui/toast';
import {
  crearSolicitud,
  listarCategorias,
} from '@/services/solicitudesService';
import { PRIORIDAD_LABELS } from '@/utils/constants';
import { formatDateTime } from '@/utils/formatters';

export default function NuevaSolicitudPage() {
  return (
    <ProtectedRoute allowedRoles={['ESTUDIANTE']}>
      <Layout>
        <NuevaSolicitudContent />
      </Layout>
    </ProtectedRoute>
  );
}

function NuevaSolicitudContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [solicitudCreada, setSolicitudCreada] = useState(null);

  useEffect(() => {
    let active = true;
    listarCategorias().then((cats) => {
      if (active) {
        setCategorias(cats);
        if (cats.length > 0) {
          setCategoriaId(String(cats[0].id));
        }
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const validate = () => {
    const errors = {};
    if (!categoriaId) {
      errors.categoriaId = 'Selecciona una categoría';
    }
    if (!ubicacion.trim()) {
      errors.ubicacion = 'Indica la ubicación';
    }
    if (!descripcion.trim()) {
      errors.descripcion = 'Describe el problema o requerimiento';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    try {
      setSubmitting(true);
      const selectedCat = categorias.find(
        (c) => String(c.id) === String(categoriaId)
      );
      const created = await crearSolicitud({
        descripcion: descripcion.trim(),
        ubicacion: ubicacion.trim(),
        categoriaId: Number(categoriaId),
        categoriaNombre: selectedCat?.nombre,
        areaNombre: selectedCat?.areaNombre,
      });

      setSolicitudCreada(created);
      toast({
        variant: 'success',
        title: 'Solicitud registrada',
        description: `Código ${created.codigo} generado con estado Nuevo.`,
      });
    } catch (err) {
      setApiError(
        err?.message || 'No se pudo registrar la solicitud. Verifica los datos.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategoriaObj = categorias.find(
    (c) => String(c.id) === String(categoriaId)
  );
  const prioridadInicialLabel =
    PRIORIDAD_LABELS[selectedCategoriaObj?.prioridadInicial || 'MEDIA'] ||
    'Media';

  // Confirmation View: "Solicitud registrada"
  if (solicitudCreada) {
    const prioLabel =
      PRIORIDAD_LABELS[solicitudCreada.prioridad] ||
      solicitudCreada.prioridad ||
      'Media';
    const fechaConfirmada =
      formatDateTime(solicitudCreada.fechaCreacion)?.replace(' · ', ', ') ||
      '16 oct. 2026, 09:00';

    return (
      <div className="space-y-4 max-w-[780px]">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7B1E2B]">
            GESTIÓN DE SERVICIOS
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#1C242B]">
            Solicitud registrada
          </h1>
        </div>

        {/* Green Confirmation Banner */}
        <Alert variant="success" className="rounded-xl px-5 py-4">
          <AlertTitle>Registro confirmado</AlertTitle>
          <AlertDescription>
            Código {solicitudCreada.codigo} · {fechaConfirmada}. Estado Nuevo ·
            Prioridad {prioLabel}.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <Button
            type="button"
            onClick={() => router.push(`/solicitudes/${solicitudCreada.id}`)}
            className="w-full sm:w-auto sm:px-7 h-10 font-bold"
          >
            Ver detalle y seguimiento
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/solicitudes')}
            className="w-full sm:w-auto sm:px-7 h-10 font-bold"
          >
            Volver a mis solicitudes
          </Button>
        </div>
      </div>
    );
  }

  // Form View: "Nueva solicitud" (Desktop 2-col Categoría + Ubicación, horizontal buttons | Mobile stacked)
  return (
    <div className="space-y-4 max-w-[840px]">
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7B1E2B]">
          GESTIÓN DE SERVICIOS
        </div>
        <h1 className="mt-1.5 text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#1C242B]">
          Nueva solicitud
        </h1>
        <p className="mt-2 text-xs text-[#5A6570]">
          Describe el servicio que necesitas. Los tres campos son obligatorios.
        </p>
      </div>

      {/* Main White Card: "Datos de la solicitud" */}
      <Card className="p-5 sm:p-6">
        <h2 className="text-base font-extrabold text-[#1C242B] mb-4">
          Datos de la solicitud
        </h2>

        {apiError && <ErrorMessage message={apiError} />}

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          {/* Desktop: 2-column grid for Categoría + Ubicación | Mobile: 1-column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
            <BoxField
              label="Categoría"
              required
              error={fieldErrors.categoriaId}
            >
              <BoxSelect
                value={categoriaId}
                onChange={(e) => {
                  setCategoriaId(e.target.value);
                  if (fieldErrors.categoriaId) {
                    setFieldErrors((prev) => ({ ...prev, categoriaId: '' }));
                  }
                }}
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </BoxSelect>
            </BoxField>

            <BoxField label="Ubicación" required error={fieldErrors.ubicacion}>
              <BoxInput
                type="text"
                placeholder="Laboratorio 204 · Pabellón nuevo"
                value={ubicacion}
                onChange={(e) => {
                  setUbicacion(e.target.value);
                  if (fieldErrors.ubicacion) {
                    setFieldErrors((prev) => ({ ...prev, ubicacion: '' }));
                  }
                }}
              />
            </BoxField>
          </div>

          <BoxField
            label="Descripción"
            required
            error={fieldErrors.descripcion}
          >
            <BoxTextarea
              rows={3}
              placeholder="El proyector del laboratorio no enciende."
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                if (fieldErrors.descripcion) {
                  setFieldErrors((prev) => ({ ...prev, descripcion: '' }));
                }
              }}
            />
          </BoxField>

          <p className="pt-0.5 pb-1 text-[11px] text-[#5A6570]">
            La prioridad inicial se asigna según la categoría. Para este
            ejemplo: {prioridadInicialLabel}. El código, la fecha y el estado
            Nuevo se generan al registrar.
          </p>

          {/* Desktop: Horizontal button bar | Mobile: Full-width stacked buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto sm:px-8 h-10 font-bold"
            >
              {submitting ? 'Registrando solicitud...' : 'Registrar solicitud'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/solicitudes')}
              disabled={submitting}
              className="w-full sm:w-auto sm:px-7 h-10 font-bold"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
