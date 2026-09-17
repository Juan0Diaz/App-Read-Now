import { useEffect, useState, useCallback } from 'react';
import { getMisPrestamos, solicitarPrestamo as solicitarPrestamoApi } from '../microservicios/prestamos';
import { User, Libro, Genero } from '../types';

type LibroPrestamo = Libro & {
  Usuario_Prestamo_id: string | number;
  Genero: Genero | null;
};

export function useLoans(user: User | null) {
  const [libros, setLibros] = useState<LibroPrestamo[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarPrestamos = useCallback(async () => {
    if (!user) {
      setLibros([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const prestamos = await getMisPrestamos();

      setLibros(
        prestamos
          .filter(prestamo => prestamo.libro)
          .map(prestamo => ({
            ...prestamo.libro!,
            Usuario_Prestamo_id: prestamo.id_libro,
            Genero: prestamo.libro!.genero || null,
          }))
      );
    } catch (err: any) {
      console.error('Error al cargar préstamos:', err);
      alert('Error al cargar préstamos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    cargarPrestamos();
  }, [cargarPrestamos]);

  const solicitar = async (idLibro: string) => {
    if (!user) {
      alert('Debes iniciar sesión para solicitar un préstamo.');
      return;
    }

    try {
      await solicitarPrestamoApi(idLibro);
      await cargarPrestamos();
    } catch (err: any) {
      console.error('Error al solicitar préstamo:', err);
      alert('Error al solicitar préstamo: ' + err.message);
    }
  };

  return { libros, loading, cargarPrestamos, solicitar };
}