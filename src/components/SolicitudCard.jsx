'use client';

import { useRouter } from 'next/navigation';
import { EstadoBadge } from '@/components/EstadoBadge';
import { ESTADOS_CONFIG, PRIORIDAD_LABELS } from '@/utils/constants';
import { formatShortDate } from '@/utils/formatters';
import { cn } from '@/lib/utils';

export function SolicitudCard({
  solicitud,
  viewRole = 'ESTUDIANTE',
  onSelect = null,
  selected = false,
}) {
  const router = useRouter();

  const handleOpen = () => {
    if (onSelect) {
      onSelect(solicitud);
      return;
    }
    if (viewRole === 'ESTUDIANTE') {
      router.push(`/solicitudes/${solicitud.id}`);
    } else {
      router.push(`/gestion?id=${solicitud.id}`);
    }
  };

  const estadoLabel =
    ESTADOS_CONFIG[solicitud.estado]?.label || solicitud.estado || 'Nuevo';
  const prioridadLabel =
    PRIORIDAD_LABELS[solicitud.prioridad] || solicitud.prioridad || 'Media';
  const fechaTexto =
    formatShortDate(solicitud.fechaCreacion || solicitud.actualizadoEn) ||
    '16 oct. 2026';
  const categoriaTexto = solicitud.categoriaNombre || 'Soporte informático';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
      className={cn(
        'w-full rounded-xl border bg-white px-5 py-4 text-left transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B]/25',
        selected
          ? 'border-[#7B1E2B] ring-1 ring-[#7B1E2B]/20 bg-[#FDFCFB] shadow-xs'
          : 'border-[#D8D5CE] hover:border-[#B8B2A6] shadow-2xs'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="min-w-0">
          <div className="text-xs font-extrabold text-[#7B1E2B]">
            {solicitud.codigo} · {categoriaTexto}
          </div>
          <div className="mt-1 text-base font-extrabold text-[#1C242B] leading-snug">
            {solicitud.titulo}
          </div>
          <div className="mt-1 text-xs text-[#5A6570]">
            <span className="sm:hidden">{estadoLabel} · </span>
            Prioridad {prioridadLabel} · {fechaTexto}
            {solicitud.ubicacion && (
              <span className="hidden md:inline"> · {solicitud.ubicacion}</span>
            )}
          </div>
        </div>

        {/* Desktop right-aligned status badge */}
        <div className="hidden sm:flex shrink-0 items-center">
          <EstadoBadge estado={solicitud.estado} />
        </div>
      </div>
    </div>
  );
}

export default SolicitudCard;
