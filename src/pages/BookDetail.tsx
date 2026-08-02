import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, isDemoMode, MOCK_LIBROS, MOCK_GENEROS } from '../lib/supabase';
import { Libro, Genero } from '../types';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Heart, Calendar, Bookmark, User, Tag } from 'lucide-react';
import { Button, buttonVariants } from '../components/ui/Button';

export const BookDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [libro, setLibro] = useState<Libro | null>(null);
  const [generosList, setGenerosList] = useState<Genero[]>([]);
  const [publisher, setPublisher] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      if (isDemoMode) {
        const found = MOCK_LIBROS.find(l => l.id_libro === Number(id));
        if (found) {
          setLibro(found as Libro);
          const gen = MOCK_GENEROS.find(g => g.id_genero === found.id_genero);
          if (gen) setGenerosList([gen]);
        }
        setLoading(false);
        return;
      }

      try {
        const { data: bookData } = await supabase
          .from('Libro')
          .select('*')
          .eq('id_libro', id)
          .single();
          
        if (bookData) {
          setLibro(bookData);
          
          let fetchedGens: Genero[] = [];
          
          const genIds = [bookData.id_genero, bookData.id_genero_1, bookData.id_genero_2].filter(id => id);
          
          if (genIds.length > 0) {
            const { data: genData } = await supabase
              .from('Genero')
              .select('*')
              .in('id_genero', genIds);
              
            if (genData) {
               fetchedGens = genData;
            }
          }
          
          setGenerosList(fetchedGens);
          
          // Obtener al publicador de forma segura
          const { data: pubDataList } = await supabase
            .from('Publicacion')
            .select('id_usuario')
            .eq('id_libro', bookData.id_libro)
            .limit(1);
            
          const pubData = pubDataList && pubDataList.length > 0 ? pubDataList[0] : null;
            
          if (pubData) {
            const { data: userList } = await supabase
              .from('Usuario')
              .select('id_usuario, nombre, correo')
              .eq('id_usuario', pubData.id_usuario)
              .limit(1);
            if (userList && userList.length > 0) setPublisher(userList[0]);
          }
        }
        
        if (user && id) {
          const { data: favData } = await supabase
            .from('Favoritos')
            .select('id_favorito')
            .match({ id_usuario: user.id_usuario, id_libro: id })
            .maybeSingle();
            
          if (favData) setIsFavorite(true);
        }
      } catch (err) {
        console.error('Error fetching book detail', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id, user]);

  const [requestingLoan, setRequestingLoan] = useState(false);

  const toggleFavorite = async () => {
    if (!user || !id) {
      alert("Debes iniciar sesión para agregar a favoritos.");
      return;
    }
    
    try {
      if (isFavorite) {
        setIsFavorite(false);
        await supabase.from('Favoritos').delete().match({ id_usuario: user.id_usuario, id_libro: id });
      } else {
        setIsFavorite(true);
        const { error } = await supabase.from('Favoritos').insert([{ id_usuario: user.id_usuario, id_libro: id }]);
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

  const handleRequestLoan = async () => {
    if (!user || !id || !libro) {
      alert("Debes iniciar sesión para solicitar un préstamo.");
      return;
    }

    setRequestingLoan(true);
    try {
      // Insertar en Usuario_Prestamo
      const { error: loanError } = await supabase.from('Usuario_Prestamo').insert([
        {
          id_usuario: user.id_usuario,
          id_libro: id,
          Disponible: true 
        }
      ]);
      
      if (loanError) throw loanError;

      
      const { error: bookError } = await supabase
        .from('Libro')
        .update({ disponible: false })
        .eq('id_libro', id);

      if (bookError) throw bookError;

      alert("Préstamo solicitado con éxito.");
      setLibro({ ...libro, disponible: false });

    } catch (err: any) {
      console.error(err);
      alert("Error al solicitar el préstamo: " + err.message);
    } finally {
      setRequestingLoan(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse max-w-4xl mx-auto flex flex-col md:flex-row gap-8 p-8">
        <div className="w-full md:w-1/3 aspect-[2/3] bg-slate-200 rounded-xl" />
        <div className="w-full md:w-2/3 space-y-4 pt-4">
          <div className="h-8 bg-slate-200 w-3/4 rounded" />
          <div className="h-4 bg-slate-200 w-1/2 rounded" />
          <div className="h-24 bg-slate-200 w-full rounded mt-8" />
        </div>
      </div>
    );
  }

  if (!libro) {
    return (
      <div className="text-center py-20 p-8">
        <h2 className="text-2xl font-bold text-slate-800">Libro no encontrado</h2>
        <Link to="/" className={`${buttonVariants({ variant: "link" })} mt-4 text-indigo-600`}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center shrink-0 sticky top-0 z-10 w-full">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al catálogo
        </Link>
      </header>

      <div className="p-4 md:p-8 flex-1 overflow-y-auto max-w-5xl mx-auto w-full">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
          
          {/* Cover side */}
          <div className="w-full md:w-2/5 lg:w-1/3 bg-gradient-to-br from-indigo-50 to-slate-100 p-6 md:p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
            {libro.portada_url ? (
              <img 
                src={libro.portada_url} 
                alt={`Portada de ${libro.titulo}`} 
                className="w-48 md:w-full max-w-[280px] h-auto rounded-xl shadow-xl object-cover"
              />
            ) : (
              <div className="w-48 md:w-full max-w-[280px] aspect-[2/3] bg-white rounded-xl shadow-xl flex items-center justify-center text-indigo-200 border border-slate-100 p-6 text-center">
                 <div>
                   <div className="text-[10px] md:text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
                     {generosList.length > 0 ? generosList.map(g => g.nombre_genero).join(', ') : 'GÉNERO'}
                   </div>
                   <div className="text-lg md:text-xl font-serif italic text-indigo-900 font-bold leading-tight line-clamp-3">{libro.titulo}</div>
                 </div>
              </div>
            )}
          </div>

          {/* Info side */}
          <div className="w-full md:w-3/5 lg:w-2/3 p-6 md:p-8 flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">{libro.titulo}</h1>
              <Button 
                onClick={toggleFavorite}
                variant="outline" 
                size="icon" 
                className={`shrink-0 transition-colors rounded-full ${isFavorite ? 'text-rose-500 border-rose-200 bg-rose-50' : 'text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50'}`}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>
            
            <div className="text-lg text-slate-600 font-medium mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-400" />
              {libro.autor}
            </div>
            
            {publisher && (
              <div className="mb-6">
                <span className="text-sm text-slate-500 mr-2">Publicado por:</span>
                <Link to={`/publicador/perfil/${publisher.id_usuario}`} className="inline-flex flex-col">
                  <span className="font-bold text-indigo-600 hover:underline">{publisher.nombre || publisher.correo.split('@')[0]}</span>
                </Link>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mb-8">
               <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full">
                 <Tag className="h-3.5 w-3.5" />
                 {generosList.length > 0 ? generosList.map(g => g.nombre_genero).join(', ') : 'Sin género'}
               </div>
               <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full">
                 <Bookmark className="h-3.5 w-3.5" />
                 {libro.estado}
               </div>
               <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full">
                 <Calendar className="h-3.5 w-3.5" />
                 {new Date(libro.fecha_publicacion).getFullYear()}
               </div>
            </div>

            {libro.descripcion && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-3">Sinopsis</h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {libro.descripcion}
                  </p>
                </div>
              </div>
            )}

            <div className="mb-8 flex-1">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-3">Detalles</h3>
              <ul className="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-4">
                <li className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <span className="text-slate-500">Editorial</span>
                  <span className="font-medium text-slate-900">{libro.editorial}</span>
                </li>
                <li className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <span className="text-slate-500">Disponibilidad</span>
                  <span className={`font-medium ${libro.disponible ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {libro.disponible ? 'Disponible ahora' : 'Reservado'}
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-auto flex flex-col sm:flex-row items-center gap-4">
              <Button 
                onClick={handleRequestLoan}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 rounded-lg text-white font-semibold px-8" 
                size="lg" 
                disabled={!libro.disponible || requestingLoan}
              >
                {requestingLoan ? 'Procesando...' : (libro.disponible ? 'Solicitar Préstamo' : 'No Disponible')}
              </Button>
              <p className="text-xs text-slate-500 text-center sm:text-left">
                Si solicitas este libro, tendrás un plazo de 14 días para leerlo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
