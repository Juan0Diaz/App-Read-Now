import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { BookPlus, List, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getMisPublicaciones, getPublicaciones, eliminarPublicacionConLibro } from '../microservicios/Publicaciones';
import { Publicacion } from '../types';

export const PublisherDashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id_publicacion: string } | null>(null);
  const [selectedPublicacionId, setSelectedPublicacionId] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicaciones();
  }, [user, role]);

  useEffect(() => {
    if (!publicaciones.length) {
      setSelectedPublicacionId(null);
      return;
    }

    if (!selectedPublicacionId || !publicaciones.some(pub => pub.id_publicacion === selectedPublicacionId)) {
      setSelectedPublicacionId(publicaciones[0].id_publicacion);
    }
  }, [publicaciones, selectedPublicacionId]);

  const fetchPublicaciones = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // El Administrador ve el catálogo completo; el Publicador, solo lo suyo.
      const data = role === 'Administrador'
        ? await getPublicaciones()
        : await getMisPublicaciones();
      setPublicaciones(data);
    } catch (err) {
      console.error('Error fetching publications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id_publicacion: string) => {
    try {
      // Antes eran 3 llamadas sueltas a Supabase desde aquí; ahora es una sola
      // transacción atómica en el backend (ver PublicacionesController.DeleteConLibro).
      await eliminarPublicacionConLibro(id_publicacion);
      setPublicaciones(prev => prev.filter(p => p.id_publicacion !== id_publicacion));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error eliminando la publicación: ', err);
      setDeleteConfirm(null);
    }
  };

  if (!user || (role !== 'Publicador' && role !== 'Administrador')) {
    return <Navigate to="/" />;
  }

  const profileInitial = (user?.nombre || user?.correo || 'U').charAt(0).toUpperCase();

  return (
    <div className="flex h-full flex-col animate-in fade-in bg-bg-warm text-text-strong duration-500 dark:bg-surface-soft dark:text-text-strong">
      <header className="sticky top-0 z-10 flex w-full shrink-0 items-center justify-between gap-3 border-b border-border bg-bg-warm px-4 py-4 shadow-sm dark:border-border dark:bg-surface sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-text-strong dark:text-text-strong">{role === 'Administrador' ? 'Gestión de Catálogo' : 'Mis Publicaciones'}</h1>
        <Button onClick={() => navigate('/publicador/libros/nuevo')} className="rounded-lg shadow-md shadow-primary/20">
          <BookPlus className="h-4 w-4 mr-2" />
          Publicar Libro
        </Button>
      </header>

      <div className="flex w-full flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="w-full">
          <div className="mb-8 w-full">
            <p className="page-subtitle">{role === 'Administrador' ? 'Gestiona todo el catálogo de la plataforma.' : 'Gestiona los libros que has agregado al catálogo.'}</p>
          </div>

          <div className="grid w-full gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-sm dark:border-border dark:bg-surface">
              <div className="border-b border-border bg-surface-soft p-4 dark:border-border dark:bg-surface-muted">
                <h2 className="font-semibold text-text-strong dark:text-text-strong">Vista previa</h2>
              </div>

              {loading ? (
                <div className="p-6 text-center text-slate-500">Cargando publicaciones...</div>
              ) : !publicaciones.length ? (
                <div className="p-6 text-center text-slate-500">No tienes publicaciones aún.</div>
              ) : (() => {
                const selectedPublication = publicaciones.find(pub => pub.id_publicacion === selectedPublicacionId) ?? publicaciones[0];
                const selectedLibro = selectedPublication?.libro;

                if (!selectedPublication || !selectedLibro) {
                  return <div className="p-6 text-center text-slate-500">No hay libro seleccionado.</div>;
                }

                return (
                  <div className="p-5">
                    <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-surface-soft p-3 dark:border-border dark:bg-surface-muted">
                      {selectedLibro.portada_url ? (
                        <img src={selectedLibro.portada_url} alt={selectedLibro.titulo} className="h-56 w-full rounded-xl object-cover shadow-sm" />
                      ) : (
                        <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-border bg-surface text-center text-text-muted dark:border-border dark:bg-surface">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Libro</div>
                            <div className="mt-2 max-w-[12rem] text-sm font-semibold text-text-strong">{selectedLibro.titulo}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-lg font-bold text-text-strong dark:text-text-strong">{selectedLibro.titulo}</h3>
                          <p className="mt-1 text-sm text-gray-800 dark:text-slate-300">{selectedLibro.autor}</p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${selectedLibro.disponible ? 'bg-primary/10 text-gray-800 dark:bg-primary/20 dark:text-primary' : 'bg-surface-muted text-gray-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                          {selectedLibro.estado}
                        </span>
                      </div>

                      <div className="rounded-xl border border-border bg-surface-soft px-3 py-2 text-sm text-gray-800 dark:border-border dark:bg-surface-muted dark:text-slate-300">
                        {selectedPublication.fecha_publicacion ? new Date(selectedPublication.fecha_publicacion).toLocaleDateString() : 'Sin fecha'}
                      </div>

                      <p className="line-clamp-5 text-sm leading-relaxed text-gray-800 dark:text-slate-300">
                        {selectedLibro.descripcion || 'Sin descripción disponible para este libro.'}
                      </p>

                      <div className="flex gap-2 pt-2">
                        <Button onClick={() => navigate(`/publicador/libros/editar/${selectedLibro.id_libro}`)} className="flex-1 bg-primary text-white hover:bg-primary-hover">
                          Editar
                        </Button>
                        <Button onClick={() => setDeleteConfirm({ id_publicacion: selectedPublication.id_publicacion })} variant="outline" className="flex-1 border-error/20 text-error hover:bg-error/10 dark:border-error/30 dark:text-error">
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </aside>

            <div className="w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-sm dark:border-border dark:bg-surface">
              <div className="flex items-center gap-2 border-b border-border bg-surface-soft p-4 dark:border-border dark:bg-surface-muted">
                <List className="h-5 w-5 text-text-muted dark:text-text-body" />
                <h2 className="font-semibold text-text-strong dark:text-text-strong">{role === 'Administrador' ? 'Todos los libros' : 'Tus libros recientes'}</h2>
              </div>

              <div className="w-full overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center text-text-muted dark:text-text-body">Cargando publicaciones...</div>
                ) : publicaciones.length === 0 ? (
                  <div className="p-8 text-center text-text-muted dark:text-text-body">No tienes publicaciones aún.</div>
                ) : (
                  <div className="w-full">
                    <div className="hidden w-full min-w-0 md:grid md:grid-cols-[minmax(0,2.6fr)_minmax(110px,1fr)_minmax(120px,0.9fr)_110px] gap-4 border-b border-border bg-surface-soft/80 px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-muted dark:border-border dark:bg-surface-muted dark:text-text-body">
                      <div className="min-w-0">Título</div>
                      <div className="min-w-0">Estado</div>
                      <div className="min-w-0">Fecha</div>
                      <div className="min-w-0 text-right">Acciones</div>
                    </div>
                    <div className="divide-y divide-border dark:divide-border">
                      {publicaciones.map(pub => {
                        const libro = pub.libro;
                        if (!libro) return null;
                        const isSelected = selectedPublicacionId === pub.id_publicacion;
                        const estadoClasses = libro.disponible ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary' : 'bg-surface-muted text-text-muted dark:bg-slate-700 dark:text-slate-200';
                        return (
                          <div
                            key={pub.id_publicacion}
                            onClick={() => setSelectedPublicacionId(pub.id_publicacion)}
                            className={`grid w-full cursor-pointer gap-3 p-4 transition-colors md:grid-cols-[minmax(0,2.6fr)_minmax(110px,1fr)_minmax(120px,0.9fr)_110px] md:items-center md:gap-4 md:px-6 ${isSelected ? 'bg-primary/5 dark:bg-surface-muted' : 'hover:bg-surface-soft dark:hover:bg-surface-muted'}`}
                          >
                            <div className="min-w-0">
                              <span className="block min-w-0 truncate font-bold text-text-strong dark:text-text-strong">{libro.titulo}</span>
                            </div>
                            <div className="min-w-0">
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${estadoClasses}`}>
                                {libro.estado}
                              </span>
                            </div>
                            <div className="min-w-0 text-sm text-text-muted dark:text-text-body">
                              {pub.fecha_publicacion ? new Date(pub.fecha_publicacion).toLocaleDateString() : '—'}
                            </div>
                            <div className="flex min-w-0 items-center justify-end gap-2 md:justify-self-end" onClick={e => e.stopPropagation()}>
                              <Button onClick={() => navigate(`/publicador/libros/editar/${libro.id_libro}`)} variant="ghost" size="icon" className="h-8 w-8 border border-border text-text-muted hover:text-indigo-600 dark:border-border dark:text-text-body dark:hover:text-indigo-400 md:border-transparent">
                                <Edit className="h-4 w-4"/>
                              </Button>
                              <Button onClick={() => setDeleteConfirm({ id_publicacion: pub.id_publicacion })} variant="ghost" size="icon" className="h-8 w-8 border border-border text-text-muted hover:text-red-500 dark:border-border dark:text-text-body dark:hover:text-red-400 md:border-transparent">
                                <Trash2 className="h-4 w-4"/>
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Eliminar publicación?</h3>
            <p className="text-slate-600 text-sm mb-6">Esta acción es irreversible y eliminará el libro del catálogo.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => handleDelete(deleteConfirm.id_publicacion)}>Sí, Eliminar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};