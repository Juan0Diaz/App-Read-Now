import { useEffect, useState, useCallback } from 'react';
import { isDemoMode } from '../lib/supabase';
import { getFavoritos, agregarFavorito, quitarFavorito } from '../lib/api';
import { User } from '../types';

/**
 * Centraliza el estado y las acciones de favoritos. Antes, agregar/quitar un
 * favorito estaba duplicado casi textualmente en Home.tsx y BookDetail.tsx,
 * cada uno con su propia llamada a Supabase.
 */
export function useFavoritos(user: User | null) {
  const [favoritos, setFavoritos] = useState<string[]>([]); // ids de libro favoritos

  const cargarFavoritos = useCallback(async () => {
    if (!user || isDemoMode) {
      setFavoritos([]);
      return;
    }
    try {
      const data = await getFavoritos();
      setFavoritos(data.map(f => f.id_libro));
    } catch (err) {
      console.error('Error al cargar favoritos', err);
    }
  }, [user]);

  useEffect(() => {
    cargarFavoritos();
  }, [cargarFavoritos]);

  const toggleFavorito = async (idLibro: string) => {
    if (!user) {
      alert('Debes iniciar sesión para agregar a favoritos.');
      return;
    }

    const yaEsFavorito = favoritos.includes(idLibro);

    // Actualización optimista: refleja el cambio de inmediato en la UI.
    setFavoritos(prev =>
      yaEsFavorito ? prev.filter(id => id !== idLibro) : [...prev, idLibro]
    );

    try {
      if (yaEsFavorito) {
        await quitarFavorito(idLibro);
      } else {
        await agregarFavorito(idLibro);
      }
    } catch (err: any) {
      console.error(err);
      // Si falla la llamada al backend, revertimos el cambio optimista.
      setFavoritos(prev =>
        yaEsFavorito ? [...prev, idLibro] : prev.filter(id => id !== idLibro)
      );
      alert('Error al actualizar favoritos: ' + err.message);
    }
  };

  return { favoritos, toggleFavorito, isFavorito: (id: string) => favoritos.includes(id) };
}