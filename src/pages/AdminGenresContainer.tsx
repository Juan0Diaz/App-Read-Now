import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { actualizarGenero, crearGenero, eliminarGenero, getGeneros } from '../microservicios/Generos';
import { Genero } from '../types';
import { AdminGenres } from './AdminGenres';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Ocurrió un error inesperado.';

export const AdminGenresContainer = () => {
  const { user, role } = useAuth();
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEdicion, setNombreEdicion] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (user && role === 'Administrador') {
      void cargarGeneros();
    }
  }, [user, role]);

  async function cargarGeneros() {
    setLoading(true);
    setError('');
    try {
      setGeneros(await getGeneros());
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const creado = await crearGenero({ nombre_genero: nombreNuevo });
      setGeneros((actuales) => [...actuales, creado].sort((a, b) => a.nombre_genero.localeCompare(b.nombre_genero)));
      setNombreNuevo('');
      setNotice('Género creado.');
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (genero: Genero) => {
    setEditandoId(genero.id_genero);
    setNombreEdicion(genero.nombre_genero);
    setError('');
    setNotice('');
  };

  const cancelEditing = () => {
    setEditandoId(null);
    setNombreEdicion('');
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editandoId) return;

    setSaving(true);
    setError('');
    setNotice('');
    try {
      const actualizado = await actualizarGenero(editandoId, { nombre_genero: nombreEdicion });
      setGeneros((actuales) => actuales
        .map((genero) => genero.id_genero === actualizado.id_genero ? actualizado : genero)
        .sort((a, b) => a.nombre_genero.localeCompare(b.nombre_genero)));
      cancelEditing();
      setNotice('Género actualizado.');
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (genero: Genero) => {
    if (!window.confirm(`¿Eliminar el género "${genero.nombre_genero}"?`)) return;

    setSaving(true);
    setError('');
    setNotice('');
    try {
      await eliminarGenero(genero.id_genero);
      setGeneros((actuales) => actuales.filter((item) => item.id_genero !== genero.id_genero));
      if (editandoId === genero.id_genero) cancelEditing();
      setNotice('Género eliminado.');
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  };

  if (!user || role !== 'Administrador') {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminGenres
      generos={generos}
      nombreNuevo={nombreNuevo}
      editandoId={editandoId}
      nombreEdicion={nombreEdicion}
      loading={loading}
      saving={saving}
      error={error}
      notice={notice}
      onCreate={handleCreate}
      onNewNameChange={(event: ChangeEvent<HTMLInputElement>) => setNombreNuevo(event.target.value)}
      onStartEditing={startEditing}
      onCancelEditing={cancelEditing}
      onUpdate={handleUpdate}
      onEditNameChange={(event: ChangeEvent<HTMLInputElement>) => setNombreEdicion(event.target.value)}
      onDelete={(genero) => void handleDelete(genero)}
    />
  );
};