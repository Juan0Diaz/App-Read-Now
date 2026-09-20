import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMisPublicaciones, getPublicaciones, eliminarPublicacionConLibro } from '../microservicios/Publicaciones';
import { Publicacion } from '../types';

export function usePublisherDashboard() {
  const { user, role } = useAuth();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id_publicacion: string } | null>(null);

  const fetchPublicaciones = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = role === 'Administrador'
        ? await getPublicaciones()
        : await getMisPublicaciones();
      setPublicaciones(data);
    } catch (err) {
      console.error('Error fetching publications', err);
    } finally {
      setLoading(false);
    }
  }, [role, user]);

  const handleDelete = useCallback(async (id_publicacion: string) => {
    try {
      await eliminarPublicacionConLibro(id_publicacion);
      setPublicaciones((prev) => prev.filter((p) => p.id_publicacion !== id_publicacion));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error eliminando la publicación: ', err);
      setDeleteConfirm(null);
    }
  }, []);

  return {
    publicaciones,
    setPublicaciones,
    loading,
    deleteConfirm,
    setDeleteConfirm,
    fetchPublicaciones,
    handleDelete,
  };
}
