import React from 'react';
import { Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIORIDAD_MAP = {
  BAJA: {
    label: 'Baja',
    classes: 'border-slate-200 bg-slate-100/90 text-slate-700',
  },
  MEDIA: {
    label: 'Media',
    classes: 'border-blue-200/90 bg-blue-50/90 text-blue-700',
  },
  ALTA: {
    label: 'Alta',
    classes: 'border-amber-200/90 bg-amber-50/90 text-amber-800',
  },
  CRITICA: {
    label: 'Crítica',
    classes: 'border-red-200/90 bg-red-50/90 text-red-700',
  },
};

export function PrioridadBadge({ prioridad, showPrefix = false, className }) {
  const key = (prioridad || 'MEDIA').toUpperCase();
  const cfg = PRIORIDAD_MAP[key] || PRIORIDAD_MAP.MEDIA;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11.5px] font-semibold leading-tight',
        cfg.classes,
        className
      )}
    >
      <Flag className="h-3 w-3 shrink-0 opacity-75" />
      <span>{showPrefix ? `Prioridad ${cfg.label}` : cfg.label}</span>
    </span>
  );
}

export default PrioridadBadge;
