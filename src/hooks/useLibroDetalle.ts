import { useEffect, useState } from 'react';
import { isDemoMode, MOCK_LIBROS } from '../lib/supabase';
import { getLibro } from '../microservicios/Libros';
import { getPublicaciones } from '../microservicios/Publicaciones';
import { Libro, User } from '../types';

export function useLibroDetalle(id?: string) {
  const [libro, setLibro] = useState<Libro | null>(null);
  const [publisher, setPublisher] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBook = async () => {
      const bookId = id?.trim();
      if (!bookId) {
        setLibro(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      if (isDemoMode) {
        const found = MOCK_LIBROS.find((l: any) => String(l.id_libro) === bookId);
        setLibro((found as unknown as Libro) ?? null);
        setLoading(false);
        return;
      }

      try {
        const bookData = await getLibro(bookId);
        setLibro(bookData);

        const publicaciones = await getPublicaciones();
        const propia = publicaciones.find((p) => p.id_libro === bookId);
        setPublisher(propia?.usuario ?? null);
      } catch (err) {
        console.error('Error al cargar el detalle del libro', err);
        setLibro(null);
        setPublisher(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  return { libro, publisher, loading, setLibro };
}
