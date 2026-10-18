'use client';

export function EmptyState({
  title = 'Aún no tienes solicitudes registradas',
  description = 'Crea tu primera solicitud para reportar un problema o pedir un servicio.',
  action = null,
}) {
  return (
    <div className="rounded-xl border border-[#D8D5CE] bg-white p-6 shadow-2xs">
      <h3 className="text-lg font-extrabold text-[#1C242B]">{title}</h3>
      <p className="mt-1.5 text-xs text-[#5A6570] leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
