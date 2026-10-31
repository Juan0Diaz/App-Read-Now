import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibros } from '../hooks/useLibros';
import { useGeneros } from '../hooks/useGeneros';
import { useFavoritos } from '../hooks/useFavoritos';
import { useAuth } from '../context/AuthContext';
import { Search, Book, Heart, SlidersHorizontal, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { BookCover } from '../components/ui/BookCover';
import { Badge } from '../components/ui/Badge';

export const Home = () => {
  const { user, role } = useAuth();
  const { libros, loading } = useLibros();
  const { generos, loading: loadingGeneros } = useGeneros();
  const { toggleFavorito, isFavorito, loading: loadingFavoritos } = useFavoritos(user);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenero, setSelectedGenero] = useState<string | null>(null);
  const [filterDisponibilidad, setFilterDisponibilidad] = useState<string>('todos');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedAutor, setSelectedAutor] = useState<string | null>(null);
  const [showAllGeneros, setShowAllGeneros] = useState(false);
  const [showAllAutores, setShowAllAutores] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isFiltersOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !filtersRef.current?.contains(event.target)) {
        setIsFiltersOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFiltersOpen(false);
        filtersButtonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFiltersOpen]);

  const handleToggleFavorito = (e: React.MouseEvent, idLibro: string) => {
    e.preventDefault();
    toggleFavorito(idLibro);
  };

  const autores = Array.from(new Set(libros.map(l => l.autor))).filter(Boolean);
  const collapsedGeneros = generos.slice(0, 5);
  const visibleGeneros = showAllGeneros
    ? generos
    : [
        ...collapsedGeneros,
        ...generos.slice(5).filter(g => g.id_genero === selectedGenero),
      ];
  const collapsedAutores = autores.slice(0, 5);
  const visibleAutores = showAllAutores
    ? autores
    : [
        ...collapsedAutores,
        ...autores.slice(5).filter(autor => autor === selectedAutor),
      ];

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
      : 'bg-surface border border-border text-text-body hover:bg-surface-soft dark:bg-surface dark:text-text-body dark:hover:bg-surface-soft';
  const activeFilterCount = Number(selectedGenero !== null) +
    Number(selectedAutor !== null) +
    Number(filterDisponibilidad !== 'todos');

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedGenero(null);
    setSelectedAutor(null);
    setFilterDisponibilidad('todos');
  };

  if (loading || loadingGeneros || loadingFavoritos) {
    return (
      <div className="flex min-h-[40vh] flex-1 items-center justify-center gap-2 p-8 text-text-muted" role="status" aria-live="polite">
        <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
        <span>Cargando catálogo...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col animate-in fade-in duration-500 bg-bg-warm-strong dark:bg-surface-soft">
      <header className="sticky top-0 z-30 flex w-full flex-col gap-4 border-b border-border bg-surface px-4 py-4 shadow-sm dark:border-border dark:bg-surface sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:px-8">
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
        <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
          {role === 'Publicador' && (
            <Link to="/publicador/libros/nuevo" className="w-full sm:w-auto">
              <Button variant="primary" shimmer className="w-full whitespace-nowrap rounded-lg">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Publicación
              </Button>
            </Link>
          )}
        </div>
      </header>

      <section className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="relative z-20 mb-6" ref={filtersRef}>
          <Button
            ref={filtersButtonRef}
            type="button"
            variant="secondary"
            aria-expanded={isFiltersOpen}
            aria-controls="catalog-filters-panel"
            className="w-full justify-start sm:w-auto"
            onClick={() => setIsFiltersOpen(open => !open)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="primary" aria-label={`${activeFilterCount} filtros aplicados`} className="ml-2 px-2 py-0.5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {isFiltersOpen && (
            <div
              id="catalog-filters-panel"
              className="absolute left-0 top-full z-20 mt-2 max-h-[min(70vh,36rem)] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-border bg-surface p-4 shadow-sm dark:border-border dark:bg-surface"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-body">Filtros</h2>
                {activeFilterCount > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Eliminar todos los filtros"
                    className="h-auto min-h-0 px-2 py-1 text-xs text-primary focus-visible:ring-2"
                    onClick={handleClearFilters}
                  >
                    Eliminar filtros
                  </Button>
                )}
              </div>
              <div className="space-y-5">
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Géneros</h3>
                  <div id="catalog-genres-options" className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-pressed={selectedGenero === null}
                      onClick={() => setSelectedGenero(null)}
                      className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${chipClasses(selectedGenero === null)}`}
                    >
                      Todos
                    </button>
                    {visibleGeneros.map(g => (
                      <button
                        key={g.id_genero}
                        type="button"
                        aria-pressed={selectedGenero === g.id_genero}
                        onClick={() => setSelectedGenero(g.id_genero)}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${chipClasses(selectedGenero === g.id_genero)}`}
                      >
                        {g.nombre_genero}
                      </button>
                    ))}
                  </div>
                  {generos.length > 5 && (
                    <button
                      type="button"
                      aria-expanded={showAllGeneros}
                      aria-controls="catalog-genres-options"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => setShowAllGeneros(show => !show)}
                    >
                      {showAllGeneros ? 'Mostrar menos' : `Ver todos (${generos.length - visibleGeneros.length})`}
                      {showAllGeneros
                        ? <ChevronUp aria-hidden="true" className="h-3.5 w-3.5" />
                        : <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Autores</h3>
                  <div id="catalog-authors-options" className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-pressed={selectedAutor === null}
                      onClick={() => setSelectedAutor(null)}
                      className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${chipClasses(selectedAutor === null)}`}
                    >
                      Todos
                    </button>
                    {visibleAutores.map(autor => (
                      <button
                        key={autor}
                        type="button"
                        aria-pressed={selectedAutor === autor}
                        onClick={() => setSelectedAutor(autor)}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${chipClasses(selectedAutor === autor)}`}
                      >
                        {autor}
                      </button>
                    ))}
                  </div>
                  {autores.length > 5 && (
                    <button
                      type="button"
                      aria-expanded={showAllAutores}
                      aria-controls="catalog-authors-options"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => setShowAllAutores(show => !show)}
                    >
                      {showAllAutores ? 'Mostrar menos' : `Ver todos (${autores.length - visibleAutores.length})`}
                      {showAllAutores
                        ? <ChevronUp aria-hidden="true" className="h-3.5 w-3.5" />
                        : <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Estado</h3>
                  <div className="flex flex-wrap gap-2">
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
                        className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${chipClasses(filterDisponibilidad === opt.value)}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {filteredLibros.length === 0 ? (
          <Card className="border-dashed border-border bg-surface py-20 text-center">
            <Book className="mx-auto mb-3 h-10 w-10 text-text-muted" />
            <h3 className="text-lg font-medium text-text-strong">No se encontraron libros</h3>
            <p className="mx-auto mt-1 max-w-sm text-text-muted">Intenta ajustar tu búsqueda o seleccionar un filtro diferente.</p>
            <Button variant="secondary" className="mt-4" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {filteredLibros.map((libro, index) => (
              <Link to={`/libro/${libro.id_libro}`} key={libro.id_libro} className="group flex flex-col rounded-xl border border-border bg-surface p-2.5 shadow-sm transition-shadow hover:shadow-md sm:p-4">
                <div className="relative mb-2 overflow-hidden rounded-xl bg-surface-soft sm:mb-4">
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
                      <BookCover
                        src={libro.portada_url}
                        alt={libro.titulo}
                        loading={index < 4 ? 'eager' : 'lazy'}
                        fetchPriority={index < 4 ? 'high' : undefined}
                        className="w-full transition-transform duration-500 group-hover:scale-105"
                      />
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

                <h3 className="mb-1 truncate text-sm font-bold text-text-strong sm:text-base">{libro.titulo}</h3>
                <p className="truncate text-xs text-text-muted sm:text-sm">{libro.autor}</p>
                <div className="mt-auto flex flex-col items-start justify-between gap-2 pt-3 sm:flex-row sm:items-center">
                  <span className="max-w-full truncate text-xs font-semibold text-primary sm:text-sm">Libro {libro.estado}</span>
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