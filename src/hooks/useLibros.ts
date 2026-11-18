import { useEffect, useState, useCallback } from 'react';
import { isDemoMode, MOCK_LIBROS } from '../lib/supabase';
import { getLibros } from '../microservicios/Libros';
import { getPublicaciones } from '../microservicios/Publicaciones';
import { LibroWithDetails } from '../types';

/**
 * Hook centralizado para obtener el catálogo de libros desde el backend en C#.
 * Antes esta misma llamada estaba duplicada en Home.tsx (y variantes en otras
 * páginas); ahora vive en un solo lugar.
 */
export function useLibros() {
  const [libros, setLibros] = useState<LibroWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isDemoMode) {
      setLibros(MOCK_LIBROS as unknown as LibroWithDetails[]);
      setLoading(false);
      return;
    }

    try {
      const [data, publicaciones] = await Promise.all([getLibros(), getPublicaciones()]);
      const publicacionesPorLibro = new Map(
        publicaciones
          .filter(publicacion => publicacion.id_libro)
          .map(publicacion => [publicacion.id_libro!, publicacion]),
      );
      setLibros(data.map(libro => ({
        ...libro,
        publicacion: publicacionesPorLibro.get(libro.id_libro),
      })));
    } catch (err: any) {
      console.error('Error al cargar libros', err);
      setError(err.message ?? 'Error al cargar libros');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { libros, loading, error, reload };
}