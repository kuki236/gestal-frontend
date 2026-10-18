const MESES_CORTOS = [
  'ene.',
  'feb.',
  'mar.',
  'abr.',
  'may.',
  'jun.',
  'jul.',
  'ago.',
  'sep.',
  'oct.',
  'nov.',
  'dic.',
];

export function formatShortDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return String(isoString);
  const dia = date.getDate();
  const mes = MESES_CORTOS[date.getMonth()];
  const anio = date.getFullYear();
  return `${dia} ${mes} ${anio}`;
}

export function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return String(isoString);
  const dia = date.getDate();
  const mes = MESES_CORTOS[date.getMonth()];
  const anio = date.getFullYear();
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  return `${dia} ${mes} ${anio} · ${horas}:${minutos}`;
}

export function formatShortDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return String(isoString);
  const dia = date.getDate();
  const mes = MESES_CORTOS[date.getMonth()];
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  return `${dia} ${mes} ${horas}:${minutos}`;
}
