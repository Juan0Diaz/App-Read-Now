import { useEffect, useState } from 'react';
import { isDemoMode, MOCK_GENEROS } from '../lib/supabase';
import { getGeneros } from '../lib/api';
import { Genero } from '../types';

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
        setGeneros(data);
      } catch (err) {
        console.error('Error al cargar géneros', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { generos, loading };
}