export function validatePrecio(precio: string | undefined) {
  const value = normalizePrecio(precio);
  if (!precio?.trim() || !Number.isFinite(value) || value < 0) {
    throw new Error('El precio debe ser un número mayor o igual a cero.');
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
