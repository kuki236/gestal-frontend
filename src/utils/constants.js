export const ESTADOS_CONFIG = {
  NUEVO: {
    value: 'NUEVO',
    label: 'Nuevo',
    variant: 'nuevo',
  },
  REGISTRADO: {
    value: 'NUEVO',
    label: 'Nuevo',
    variant: 'nuevo',
  },
  ASIGNADO: {
    value: 'ASIGNADO',
    label: 'Asignado',
    variant: 'asignado',
  },
  EN_PROCESO: {
    value: 'EN_PROCESO',
    label: 'En proceso',
    variant: 'en_proceso',
  },
  EN_ATENCION: {
    value: 'EN_PROCESO',
    label: 'En proceso',
    variant: 'en_proceso',
  },
  RESUELTO: {
    value: 'RESUELTO',
    label: 'Resuelto',
    variant: 'resuelto',
  },
  CERRADO: {
    value: 'CERRADO',
    label: 'Cerrado',
    variant: 'cerrado',
  },
  RECHAZADO: {
    value: 'RECHAZADO',
    label: 'Rechazado',
    variant: 'rechazado',
  },
};

export const ESTADOS = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'ASIGNADO', label: 'Asignado' },
  { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'RESUELTO', label: 'Resuelto' },
  { value: 'CERRADO', label: 'Cerrado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
];

export const PRIORIDADES = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' },
];

export const PRIORIDAD_LABELS = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export const PRIORIDAD_PESO = {
  CRITICA: 4,
  ALTA: 3,
  MEDIA: 2,
  BAJA: 1,
};
