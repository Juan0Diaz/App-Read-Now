import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Libro, Genero } from '../types';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Loans = () => {
  const { user } = useAuth();
  const [libros, setLibros] = useState<(Libro & { Usuario_Prestamo_id: string | number, Genero: Genero | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, [user]);

  const fetchLoans = async () => {
    if (!user) return;
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('Usuario_Prestamo')
        .select(`
          id_libro,
          Libro (
            *,
            Genero!Libro_id_genero_fkey (*)
          )
        `)
        .eq('id_usuario', user.id_usuario);
        
      if (error) throw error;
      
      const formatted = (data || []).map((loan: any) => ({
        ...loan.Libro,
        Usuario_Prestamo_id: loan.id_libro,
        Genero: loan.Libro?.Genero || null
      }));
      setLibros(formatted);
    } catch (err: any) {
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-semibold">Cargando préstamos...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="h-8 w-8 text-indigo-500" /> Mis Préstamos
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Libros que has solicitado para leer.</p>
        </div>
      </div>

      {libros.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Aún no tienes préstamos</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Explora el catálogo y solicita préstamos de los libros que más te gusten.
          </p>
          <Link to="/">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100">
              <Search className="h-4 w-4 mr-2" /> Explorar Catálogo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {libros.map(libro => (
            <div key={`${libro.Usuario_Prestamo_id}-${libro.id_libro}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-200 transition-all duration-300 group flex flex-col">
              <Link to={`/libro/${libro.id_libro}`} className="relative aspect-[4/3] overflow-hidden bg-slate-100 block">
                {libro.portada_url ? (
                  <div className="w-full h-full p-2 transition-transform duration-500 group-hover:scale-105">
                    <img 
                      src={libro.portada_url} 
                      alt={libro.titulo} 
                      className="w-full h-full object-cover rounded-xl shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Sin+Imagen';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6 transition-transform duration-500 group-hover:scale-105">
                    <div className="text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {libro.Genero?.nombre_genero || 'GÉNERO'}
                      </div>
                      <div className="text-base font-serif italic text-slate-800 font-bold leading-tight line-clamp-3">{libro.titulo}</div>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white text-sm font-bold flex items-center gap-1.5 drop-shadow-md">
                    <BookOpen className="h-4 w-4" /> Ver detalles
                  </span>
                </div>
              </Link>
              
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1 line-clamp-1">{libro.titulo}</h3>
                <p className="text-slate-500 text-sm font-medium mb-4 line-clamp-1">{libro.autor}</p>
                <div className="mt-auto">
                   <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full">
                     Préstamo Activo
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
