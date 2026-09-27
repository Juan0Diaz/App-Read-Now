import { useEffect, useState } from 'react';
import { isDemoMode, MOCK_GENEROS } from '../lib/supabase';
import { getGeneros } from '../microservicios/Generos';
import { Genero } from '../types';

const fallbackGeneros: Genero[] = [
  { id_genero: 'default-ficcion', nombre_genero: 'Ficción' },
  { id_genero: 'default-ciencia', nombre_genero: 'Ciencia' },
  { id_genero: 'default-historia', nombre_genero: 'Historia' },
  { id_genero: 'default-romance', nombre_genero: 'Romance' },
  { id_genero: 'default-tecnologia', nombre_genero: 'Tecnología' },
  { id_genero: 'default-biografia', nombre_genero: 'Biografía' },
];

/**
 * Antes esta llamada (supabase.from('Genero').select('*')) estaba repetida en
 * Home.tsx, NewBook.tsx y EditBook.tsx por separado. Ahora es un solo hook.
 */
export function useGeneros() {
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (isDemoMode) {
        setGeneros(MOCK_GENEROS as unknown as Genero[]);
        setLoading(false);
        return;
      }
      try {
        const data = await getGeneros();
        setGeneros(data.length > 0 ? data : fallbackGeneros);
      } catch (err) {
        console.error('Error al cargar géneros', err);
        setGeneros(fallbackGeneros);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { generos, loading };
}