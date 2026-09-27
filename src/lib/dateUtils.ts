import { Publicacion } from '../types';

export function normalizeDateOnly(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDisplayDate(value?: string | null): string {
  const date = normalizeDateOnly(value);
  if (!date) {
    return '—';
  }

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getDisplayPublicationDate(publicacion?: Partial<Publicacion> | null): string | undefined {
  return publicacion?.libro?.fecha_publicacion ?? publicacion?.fecha_publicacion ?? undefined;
}
