import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibros } from '../hooks/useLibros';
import { useGeneros } from '../hooks/useGeneros';
import { useFavoritos } from '../hooks/useFavoritos';
import { useAuth } from '../context/AuthContext';
import { Search, Book, Heart, SlidersHorizontal, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { BookCover } from '../components/ui/BookCover';
import { Badge } from '../components/ui/Badge';

export const Home = () => {
  const { user, role } = useAuth();
  const { libros, loading } = useLibros();
  const { generos } = useGeneros();
  const { toggleFavorito, isFavorito } = useFavoritos(user);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenero, setSelectedGenero] = useState<string | null>(null);
  const [filterDisponibilidad, setFilterDisponibilidad] = useState<string>('todos');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedAutor, setSelectedAutor] = useState<string | null>(null);

  const handleToggleFavorito = (e: React.MouseEvent, idLibro: string) => {
    e.preventDefault();
    toggleFavorito(idLibro);
  };

  const autores = Array.from(new Set(libros.map(l => l.autor))).filter(Boolean);

  const filteredLibros = libros.filter(libro => {
    const matchesSearch = libro.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      libro.autor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenero = selectedGenero
      ? (libro.id_genero === selectedGenero || libro.id_genero_1 === selectedGenero || libro.id_genero_2 === selectedGenero)
      : true;
    const matchesAutor = selectedAutor ? libro.autor === selectedAutor : true;
    let matchesDisp = true;
    if (filterDisponibilidad === 'disponible') matchesDisp = libro.disponible === true;
    if (filterDisponibilidad === 'reservado') matchesDisp = libro.disponible === false;

    return matchesSearch && matchesGenero && matchesAutor && matchesDisp;
  });

  const chipClasses = (selected: boolean) =>
    selected
      ? 'bg-primary text-white shadow-md shadow-primary/20'
      : 'bg-surface border border-border text-text-body hover:bg-surface-soft';

  return (
    <div className="flex h-full flex-col animate-in fade-in duration-500">
      <header className="sticky top-0 z-20 w-full border-b border-border bg-surface px-4 py-4 shadow-sm dark:border-border dark:bg-surface sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-text-muted">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            aria-label="Buscar libros"
            placeholder="Buscar por título, autor o género..."
            className="w-full rounded-xl border border-transparent bg-surface-soft pl-10 pr-4 py-2.5 text-sm text-text-strong outline-none transition-all focus:border-primary focus:bg-surface"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="mt-3 flex w-full items-center gap-2 sm:mt-0 sm:w-auto">
          <Button
            variant="secondary"
            className="sm:hidden w-full"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          {role === 'Publicador' && (
            <Link to="/publicador/libros/nuevo" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full whitespace-nowrap rounded-lg">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Publicación
              </Button>
            </Link>
          )}
        </div>
      </header>

      <section className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className={`mb-6 space-y-4 transition-all duration-300 ${isFiltersOpen ? 'block' : 'hidden sm:block'}`}>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Géneros</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                aria-pressed={selectedGenero === null}
                onClick={() => setSelectedGenero(null)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${chipClasses(selectedGenero === null)}`}
              >
                Todos
              </button>
              {generos.map(g => (
                <button
                  key={g.id_genero}
                  type="button"
                  aria-pressed={selectedGenero === g.id_genero}
                  onClick={() => setSelectedGenero(g.id_genero)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${chipClasses(selectedGenero === g.id_genero)}`}
                >
                  {g.nombre_genero}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Autores</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                aria-pressed={selectedAutor === null}
                onClick={() => setSelectedAutor(null)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${chipClasses(selectedAutor === null)}`}
              >
                Todos
              </button>
              {autores.map(autor => (
                <button
                  key={autor}
                  type="button"
                  aria-pressed={selectedAutor === autor}
                  onClick={() => setSelectedAutor(autor)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${chipClasses(selectedAutor === autor)}`}
                >
                  {autor}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Estado</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { value: 'todos', label: 'Todos' },
                { value: 'disponible', label: 'Disponibles' },
                { value: 'reservado', label: 'Reservados' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={filterDisponibilidad === opt.value}
                  onClick={() => setFilterDisponibilidad(opt.value)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${chipClasses(filterDisponibilidad === opt.value)}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-surface p-4">
                <div className="mb-4 h-64 rounded-xl bg-surface-soft" />
                <div className="mb-2 h-4 w-2/3 rounded bg-surface-soft" />
                <div className="h-3 w-1/2 rounded bg-surface-soft" />
              </div>
            ))}
          </div>
        ) : filteredLibros.length === 0 ? (
          <Card className="border-dashed border-border bg-surface py-20 text-center">
            <Book className="mx-auto mb-3 h-10 w-10 text-text-muted" />
            <h3 className="text-lg font-medium text-text-strong">No se encontraron libros</h3>
            <p className="mx-auto mt-1 max-w-sm text-text-muted">Intenta ajustar tu búsqueda o seleccionar un filtro diferente.</p>
            <Button variant="secondary" className="mt-4" onClick={() => { setSearchTerm(''); setSelectedGenero(null); setSelectedAutor(null); setFilterDisponibilidad('todos'); }}>
              Limpiar filtros
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredLibros.map(libro => (
              <Link to={`/libro/${libro.id_libro}`} key={libro.id_libro} className="group flex flex-col rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="relative mb-4 overflow-hidden rounded-xl bg-surface-soft">
                  <div className="absolute right-2 top-2 z-10">
                    <button
                      type="button"
                      aria-label={isFavorito(libro.id_libro) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      aria-pressed={isFavorito(libro.id_libro)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-colors ${isFavorito(libro.id_libro) ? 'bg-error text-white' : 'bg-surface/90 text-text-muted hover:text-error'}`}
                      onClick={(e) => handleToggleFavorito(e, libro.id_libro)}
                    >
                      <Heart className={`h-4 w-4 ${isFavorito(libro.id_libro) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-xl">
                    {libro.portada_url ? (
                      <BookCover src={libro.portada_url} alt={libro.titulo} className="w-full transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex aspect-[2/3] w-full items-center justify-center bg-gradient-to-br from-primary/10 to-surface-soft p-6 text-center transition-transform duration-500 group-hover:scale-105">
                        <div>
                          <div className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                            {generos.find(g => g.id_genero === libro.id_genero)?.nombre_genero || 'GÉNERO'}
                          </div>
                          <div className="font-serif text-base font-bold italic leading-tight text-text-strong">{libro.titulo}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="mb-1 truncate font-bold text-text-strong">{libro.titulo}</h3>
                <p className="truncate text-sm text-text-muted">{libro.autor}</p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-sm font-semibold text-primary">Libro {libro.estado}</span>
                  <Badge variant={libro.disponible ? 'success' : 'secondary'}>
                    {libro.disponible ? 'Disponible' : 'Reservado'}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};