export const PRECIO_MINIMO_COP = 10_000;
export const PRECIO_MAXIMO_COP = 5_000_000;

export function validatePrecio(precio: string | undefined) {
  const value = normalizePrecio(precio);
  if (
    !precio?.trim() ||
    !Number.isFinite(value) ||
    value < PRECIO_MINIMO_COP ||
    value > PRECIO_MAXIMO_COP
  ) {
    throw new Error('El precio debe estar entre $10.000 y $5.000.000 COP.');
  }
  return value;
}

export function normalizePrecio(precio: string | undefined) {
  if (!precio) return Number.NaN;
  return Number(precio.replace(/\./g, '').replace(',', '.').trim());
}

export function formatPrecioCOP(precio: string | number | undefined) {
  if (precio === undefined || precio === null || precio === '') return '';

  const raw = typeof precio === 'number'
    ? String(precio)
    : precio.replace(/[^\d]/g, '');

  if (!raw) return '';

  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
