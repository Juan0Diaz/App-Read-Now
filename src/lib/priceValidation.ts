export function validatePrecio(precio: string | undefined) {
  const value = Number(precio);
  if (!precio?.trim() || !Number.isFinite(value) || value < 0) {
    throw new Error('El precio debe ser un número mayor o igual a cero.');
  }
  return value;
}
