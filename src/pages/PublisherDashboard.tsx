import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { BookPlus, List, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getMisPublicaciones, getPublicaciones, eliminarPublicacionConLibro } from '../lib/api';
import { Publicacion } from '../types';

export const PublisherDashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id_publicacion: string } | null>(null);

  useEffect(() => {
    fetchPublicaciones();
  }, [user, role]);

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

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-10 w-full">
        <h1 className="text-xl font-bold text-slate-900">{role === 'Administrador' ? 'Gestión de Catálogo' : 'Mis Publicaciones'}</h1>
        <Button onClick={() => navigate('/publicador/libros/nuevo')} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 rounded-lg">
          <BookPlus className="h-4 w-4 mr-2" />
          Publicar Libro
        </Button>
      </header>

      <div className="p-8 flex-1 overflow-y-auto max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{role === 'Administrador' ? 'Catálogo Completo' : 'Mis Publicaciones'}</h2>
          <p className="text-slate-500 mt-1">{role === 'Administrador' ? 'Gestiona todo el catálogo de la plataforma.' : 'Gestiona los libros que has agregado al catálogo.'}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <List className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-700">{role === 'Administrador' ? 'Todos los libros' : 'Tus libros recientes'}</h2>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Cargando publicaciones...</div>
            ) : publicaciones.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No tienes publicaciones aún.</div>
            ) : (
              <div className="flex flex-col">
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100">
                  <div className="col-span-5">Título</div>
                  <div className="col-span-3">Estado</div>
                  <div className="col-span-2">Fecha</div>
                  <div className="col-span-2 text-right">Acciones</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {publicaciones.map(pub => {
                    const libro = pub.libro;
                    if (!libro) return null;
                    return (
                      <div key={pub.id_publicacion} className="flex flex-col md:grid md:grid-cols-12 gap-4 p-4 md:px-6 hover:bg-slate-50 transition-colors items-start md:items-center">
                        <div className="col-span-5 w-full flex items-center justify-between md:justify-start">
                          <span className="font-bold text-slate-900 line-clamp-1">{libro.titulo}</span>
                          <span className={`md:hidden inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${libro.disponible ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                            {libro.estado}
                          </span>
                        </div>
                        <div className="col-span-3 hidden md:block">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${libro.disponible ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                            {libro.estado}
                          </span>
                        </div>
                        <div className="col-span-2 text-sm text-slate-500">
                          {pub.fecha_publicacion ? new Date(pub.fecha_publicacion).toLocaleDateString() : '—'}
                        </div>
                        <div className="col-span-2 flex items-center gap-2 justify-end w-full md:w-auto">
                          <Button onClick={() => navigate(`/publicador/libros/editar/${libro.id_libro}`)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 border border-slate-200 md:border-transparent">
                            <Edit className="h-4 w-4"/>
                          </Button>
                          <Button onClick={() => setDeleteConfirm({ id_publicacion: pub.id_publicacion })} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 border border-slate-200 md:border-transparent">
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