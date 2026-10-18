import React from 'react';
import { cn } from '@/lib/utils';

const ESTADO_MAP = {
  NUEVO: {
    label: 'Nuevo',
    classes: 'bg-[#F5E4E6] text-[#7B1E2B]',
  },
  REGISTRADO: {
    label: 'Nuevo',
    classes: 'bg-[#F5E4E6] text-[#7B1E2B]',
  },
  ASIGNADO: {
    label: 'Asignado',
    classes: 'bg-[#E3EEF9] text-[#1D5B9E]',
  },
  EN_PROCESO: {
    label: 'En proceso',
    classes: 'bg-[#FAF0D7] text-[#8D5811]',
  },
  EN_ATENCION: {
    label: 'En proceso',
    classes: 'bg-[#FAF0D7] text-[#8D5811]',
  },
  RESUELTO: {
    label: 'Resuelto',
    classes: 'bg-[#E6F2EC] text-[#1E6B47]',
  },
  CERRADO: {
    label: 'Cerrado',
    classes: 'bg-[#E6F2EC] text-[#1E6B47]',
  },
  RECHAZADO: {
    label: 'Rechazado',
    classes: 'bg-[#F7E6E6] text-[#A61C1C]',
  },
};

export function EstadoBadge({ estado, className }) {
  const key = (estado || 'NUEVO').toUpperCase();
  const cfg = ESTADO_MAP[key] || ESTADO_MAP.NUEVO;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg px-3.5 py-2 min-w-[136px] text-xs font-extrabold leading-none',
        cfg.classes,
        className
      )}
    >
      {cfg.label}
    </div>
  );
}

export default EstadoBadge;
