import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isDemoMode, MOCK_LIBROS, MOCK_GENEROS } from '../lib/supabase';
import { Libro, Genero } from '../types';
import { useAuth } from '../context/AuthContext';
import { Search, Book, Heart, SlidersHorizontal, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Home = () => {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenero, setSelectedGenero] = useState<number | null>(null);
  const [filterDisponibilidad, setFilterDisponibilidad] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { user, role } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]); 

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (isDemoMode) {
        setLibros(MOCK_LIBROS);
        setGeneros(MOCK_GENEROS);
        setLoading(false);
        return;
      }

      try {
        const { data: gData } = await supabase.from('Genero').select('*');
        if (gData) setGeneros(gData);

        const { data: lData } = await supabase.from('Libro').select('*');
        if (lData) setLibros(lData);
        
        if (user) {
          // Obtener favoritos del usuario
          const { data: fData } = await supabase.from('Favoritos').select('id_libro, id_favorito').eq('id_usuario', user.id_usuario);
          if (fData) {
            setFavorites(fData.map(f => f.id_libro));
          }
        }
      } catch (error) {
        console.error('Error fetching data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const toggleFavorite = async (e: React.MouseEvent, id_libro: string) => {
    e.preventDefault();
    if (!user) {
      alert("Debes iniciar sesión para agregar a favoritos.");
      return;
    }
    
    try {
      const isFav = favorites.includes(id_libro);
      if (isFav) {
        setFavorites(favorites.filter(id => id !== id_libro));
        await supabase.from('Favoritos').delete().match({ id_usuario: user.id_usuario, id_libro: id_libro });
      } else {
        setFavorites([...favorites, id_libro]);
        const { error } = await supabase.from('Favoritos').insert([{ id_usuario: user.id_usuario, id_libro: id_libro }]);
        if (error) {
          if (error.code === '42703') {
             alert('Nota Técnica: Debes agregar la columna "id_usuario" en tu tabla "Favoritos" en Supabase para que funcione correctamente.');
          } else {
             throw error;
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      alert("Error al actualizar favoritos: " + err.message);
    }
  };

  const autores = Array.from(new Set(libros.map(l => l.autor))).filter(Boolean);
  const [selectedAutor, setSelectedAutor] = useState<string | null>(null);
  
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

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      
      {/* Header / Toolbar */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between shrink-0 sticky top-0 z-20 w-full gap-4">
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input 
            type="text" 
            placeholder="Buscar por título, autor o género..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="sm:hidden w-full bg-white text-slate-600 border-slate-200"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          {role === 'Publicador' && (
            <Link to="/publicador/libros/nuevo" className="w-full sm:w-auto">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 rounded-lg whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Publicación
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <section className="p-4 md:p-8 flex-1 overflow-y-auto">
        <div className={`mb-6 space-y-4 transition-all duration-300 ${isFiltersOpen ? 'block' : 'hidden sm:block'}`}>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Géneros</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => setSelectedGenero(null)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedGenero === null 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Todos
              </button>
              {generos.map(g => (
                <button 
                  key={g.id_genero}
                  onClick={() => setSelectedGenero(g.id_genero)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedGenero === g.id_genero 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {g.nombre_genero}
                </button>
              ))}
            </div>
          </div>
          
          <div>
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Autores</h3>
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => setSelectedAutor(null)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedAutor === null 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Todos
              </button>
              {autores.map(autor => (
                <button 
                  key={autor}
                  onClick={() => setSelectedAutor(autor)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedAutor === autor 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {autor}
                </button>
              ))}
            </div>
          </div>

          <div>
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estado</h3>
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { value: 'todos', label: 'Todos' },
                { value: 'disponible', label: 'Disponibles' },
                { value: 'reservado', label: 'Reservados' }
              ].map(opt => (
                <button 
                  key={opt.value}
                  onClick={() => setFilterDisponibilidad(opt.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filterDisponibilidad === opt.value 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="animate-pulse bg-white border border-slate-100 rounded-2xl p-4 h-80 flex flex-col">
                <div className="bg-slate-200 h-64 rounded-xl mb-4" />
                <div className="bg-slate-200 h-4 w-2/3 rounded mb-2" />
                <div className="bg-slate-200 h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : filteredLibros.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 border-dashed rounded-2xl">
            <Book className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No se encontraron libros</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-1">Intenta ajustar tu búsqueda o seleccionar un filtro diferente.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearchTerm(''); setSelectedGenero(null); setSelectedAutor(null); setFilterDisponibilidad('todos'); }}>Limpiar filtros</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLibros.map(libro => (
              <Link to={`/libro/${libro.id_libro}`} key={libro.id_libro} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group flex flex-col">
                <div className="relative aspect-[3/4] bg-slate-200 rounded-xl mb-4 overflow-hidden">
                  <div className="absolute top-2 right-2 z-10">
                    <button 
                      className={`p-2 backdrop-blur rounded-full shadow-sm transition-colors ${favorites.includes(libro.id_libro) ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-400 hover:text-rose-500'}`} 
                      aria-label="Add to favorites" 
                      onClick={(e) => toggleFavorite(e, libro.id_libro)}
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(libro.id_libro) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  
                  {libro.portada_url ? (
                    <div className="w-full h-full relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-0"></div>
                      <img src={libro.portada_url} alt={libro.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
                          {/* If we have a cover we can just let it show, but to keep the aesthetic we can overlay some text if we wanted, let's keep it simple */}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center p-6 transition-transform duration-500 group-hover:scale-105">
                       <div className="text-center">
                         <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
                           {generos.find(g => g.id_genero === libro.id_genero)?.nombre_genero || 'GÉNERO'}
                         </div>
                         <div className="text-base font-serif italic text-indigo-900 font-bold leading-tight line-clamp-3">{libro.titulo}</div>
                       </div>
                    </div>
                  )}
                  
                </div>
                
                <h3 className="font-bold text-slate-900 truncate mb-1">{libro.titulo}</h3>
                <p className="text-sm text-slate-500 truncate">{libro.autor}</p>
                <div className="mt-3 mt-auto pt-2 flex items-center justify-between">
                  <span className="text-indigo-600 font-bold text-sm">Libro {libro.estado}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${libro.disponible ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {libro.disponible ? 'Available' : 'Reserved'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
