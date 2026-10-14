import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { solicitarPrestamo } from '../microservicios/prestamos';
import { Genero } from '../types';
import { useAuth } from '../context/AuthContext';
import { useFavoritos } from '../hooks/useFavoritos';
import { useLibroDetalle } from '../hooks/useLibroDetalle';
import { ArrowLeft, Heart, Calendar, Bookmark, User as UserIcon, Tag } from 'lucide-react';
import { Button, buttonVariants } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { BookCover } from '../components/ui/BookCover';

export const BookDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { isFavorito, toggleFavorito } = useFavoritos(user);
  const { libro, publisher, loading, setLibro } = useLibroDetalle(id);
  const [requestingLoan, setRequestingLoan] = useState(false);

  const generosList: Genero[] = libro
    ? [libro.genero, libro.genero_1, libro.genero_2].filter((g): g is Genero => !!g)
    : [];

  const handleRequestLoan = async () => {
    if (!user || !id || !libro) {
      alert('Debes iniciar sesión para solicitar un préstamo.');
      return;
    }

    setRequestingLoan(true);
    try {
      await solicitarPrestamo(id);
      alert('Préstamo solicitado con éxito.');
      setLibro({ ...libro, disponible: false });
    } catch (err: any) {
      console.error(err);
      alert('Error al solicitar el préstamo: ' + err.message);
    } finally {
      setRequestingLoan(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl animate-pulse flex-col gap-8 p-8 md:flex-row">
        <div className="aspect-[2/3] w-full rounded-xl bg-surface-soft md:w-1/3" />
        <div className="w-full space-y-4 pt-4 md:w-2/3">
          <div className="h-8 w-3/4 rounded bg-surface-soft" />
          <div className="h-4 w-1/2 rounded bg-surface-soft" />
          <div className="mt-8 h-24 w-full rounded bg-surface-soft" />
        </div>
      </div>
    );
  }

  if (!libro) {
    return (
      <div className="p-8 py-20 text-center">
        <h2 className="text-2xl font-bold text-text-strong">Libro no encontrado</h2>
        <Link to="/" className={`${buttonVariants({ variant: 'link' })} mt-4`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al catálogo
        </Link>
      </div>
    );
  }

  const favorito = isFavorito(libro.id_libro);

  return (
    <div className="flex h-full flex-col animate-in fade-in duration-500">
      <header className="sticky top-0 z-10 flex h-20 w-full shrink-0 items-center border-b border-border bg-surface px-8 dark:border-border dark:bg-surface">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-text-muted transition-colors hover:text-text-strong">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al catálogo
        </Link>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto p-4 md:p-8">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm md:flex-row">
          <div className="flex w-full items-center justify-center border-b border-border bg-gradient-to-br from-primary/10 to-surface-soft p-6 md:w-2/5 md:border-b-0 md:border-r lg:w-1/3 md:p-8">
            {libro.portada_url ? (
              <BookCover src={libro.portada_url} alt={`Portada de ${libro.titulo}`} size="lg" className="w-48 max-w-[280px] shadow-xl md:w-full" />
            ) : (
              <div className="flex aspect-[2/3] w-48 max-w-[280px] items-center justify-center rounded-xl border border-border bg-surface p-6 text-center shadow-xl md:w-full">
                <div>
                  <div className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    {generosList.length > 0 ? generosList.map(g => g.nombre_genero).join(', ') : 'GÉNERO'}
                  </div>
                  <div className="font-serif text-lg font-bold italic leading-tight text-text-strong md:text-xl">{libro.titulo}</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex w-full flex-col p-6 md:w-3/5 md:p-8 lg:w-2/3">
            <div className="mb-2 flex items-start justify-between gap-4">
              <h1 className="text-2xl font-extrabold tracking-tight text-text-strong md:text-3xl">{libro.titulo}</h1>
              <Button
                aria-label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                onClick={() => toggleFavorito(libro.id_libro)}
                variant="outline"
                size="icon"
                className={`shrink-0 rounded-full ${favorito ? 'border-error/20 bg-error/10 text-error' : 'border-border text-text-muted hover:border-error/20 hover:bg-error/10 hover:text-error'}`}
              >
                <Heart className={`h-5 w-5 ${favorito ? 'fill-current' : ''}`} />
              </Button>
            </div>

            <div className="mb-4 flex items-center gap-2 text-lg font-medium text-text-body">
              <UserIcon className="h-5 w-5 text-primary" />
              {libro.autor}
            </div>

            {publisher && (
              <div className="mb-6">
                <span className="mr-2 text-sm text-text-muted">Publicado por:</span>
                <Link to={`/publicador/perfil/${publisher.id_usuario}`} className="inline-flex flex-col">
                  <span className="font-bold text-primary hover:underline">{publisher.nombre || publisher.correo.split('@')[0]}</span>
                </Link>
              </div>
            )}

            <div className="mb-8 flex flex-wrap gap-4">
              <Badge variant="primary" className="gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                {generosList.length > 0 ? generosList.map(g => g.nombre_genero).join(', ') : 'Sin género'}
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <Bookmark className="h-3.5 w-3.5" />
                {libro.estado}
              </Badge>
              {libro.fecha_publicacion && (
                <Badge variant="secondary" className="gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(libro.fecha_publicacion).getFullYear()}
                </Badge>
              )}
            </div>

            {libro.descripcion && (
              <div className="mb-8">
                <h3 className="mb-3 text-xl font-semibold text-text-strong">Sinopsis</h3>
                <div className="rounded-xl border border-border bg-surface-soft p-4">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-text-body">
                    {libro.descripcion}
                  </p>
                </div>
              </div>
            )}

            <div className="mb-8 flex-1">
              <h3 className="mb-3 text-xl font-semibold text-text-strong">Detalles</h3>
              <ul className="space-y-3 border-t border-border pt-4 text-sm text-text-body">
                <li className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Editorial</span>
                  <span className="font-medium text-text-strong">{libro.editorial}</span>
                </li>
                <li className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Disponibilidad</span>
                  <span className={`font-medium ${libro.disponible ? 'text-secondary' : 'text-text-muted'}`}>
                    {libro.disponible ? 'Disponible ahora' : 'Reservado'}
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-auto flex flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row">
              <Button
                onClick={handleRequestLoan}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
                disabled={!libro.disponible || requestingLoan}
              >
                {requestingLoan ? 'Procesando...' : (libro.disponible ? 'Solicitar Préstamo' : 'No Disponible')}
              </Button>
              <p className="text-center text-xs text-text-muted sm:text-left">
                Si solicitas este libro, tendrás un plazo de 14 días para leerlo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
