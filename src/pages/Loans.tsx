import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLoans } from '../hooks/useLoans';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Loans = () => {
  const { user } = useAuth();
  const { libros, loading } = useLoans(user);

  if (loading) {
    return <div className="p-8 text-center font-semibold text-text-muted">Cargando préstamos...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in bg-bg-warm p-8 text-text-strong duration-500 dark:bg-surface-soft">
      <header className="sticky top-0 z-10 -mx-8 mb-8 flex items-center gap-3 border-b border-border bg-bg-warm px-8 py-5 shadow-sm dark:border-border dark:bg-surface">
        <Clock className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-text-strong">Mis Préstamos</h1>
      </header>

      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="page-subtitle">Libros que has solicitado para leer.</p>
        </div>
      </div>

      {libros.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-soft text-text-muted">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-text-strong">Aún no tienes préstamos</h3>
          <p className="mx-auto mb-6 max-w-md text-text-muted">
            Explora el catálogo y solicita préstamos de los libros que más te gusten.
          </p>
          <Link to="/">
            <Button className="rounded-xl shadow-md shadow-primary/10">
              <Search className="mr-2 h-4 w-4" /> Explorar Catálogo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {libros.map(libro => (
            <div key={`${libro.Usuario_Prestamo_id}-${libro.id_libro}`} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
              <Link to={`/libro/${libro.id_libro}`} className="relative block aspect-[4/3] overflow-hidden bg-surface-soft">
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
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-soft to-surface-muted p-6 transition-transform duration-500 group-hover:scale-105">
                    <div className="text-center">
                      <div className="mb-1 text-xs font-bold uppercase tracking-widest text-text-muted">
                        {libro.Genero?.nombre_genero || 'GÉNERO'}
                      </div>
                      <div className="font-serif text-base font-bold italic leading-tight text-text-strong line-clamp-3">{libro.titulo}</div>
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
                <h3 className="mb-1 line-clamp-1 text-lg font-bold leading-tight text-text-strong">{libro.titulo}</h3>
                <p className="mb-4 line-clamp-1 text-sm font-medium text-text-muted">{libro.autor}</p>
                <div className="mt-auto">
                   <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
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
