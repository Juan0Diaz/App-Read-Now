import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Phone, Book, ArrowLeft } from 'lucide-react';

export const PublicProfile = () => {
  const { id } = useParams();
  const [publisher, setPublisher] = useState<any | null>(null);
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase
          .from('Usuario')
          .select('*')
          .eq('id_usuario', id)
          .single();
          
        if (userData) {
          setPublisher(userData);
          
          const { data: pubData } = await supabase
            .from('Publicacion')
            .select(`
              id_publicacion,
              fecha_publicacion,
              Libro (*)
            `)
            .eq('id_usuario', id);
            
          if (pubData) {
            setPublications(pubData.filter(p => p.Libro && p.Libro.disponible !== false));
          }
        }
      } catch(err) {
        console.error('Error fetching profile', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-semibold">Cargando perfil...</div>;
  }

  if (!publisher) {
    return (
      <div className="text-center py-20 p-8">
        <h2 className="text-2xl font-bold text-slate-800">Perfil no encontrado</h2>
        <Link to="/" className="inline-flex items-center mt-4 text-indigo-600 font-bold hover:underline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center shrink-0 sticky top-0 z-10 w-full">
        <button onClick={() => window.history.back()} className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </button>
      </header>

      <div className="p-8 flex-1 overflow-y-auto max-w-5xl mx-auto w-full">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32 w-full"></div>
          <div className="p-8 pt-0 relative">
            <div className="-mt-16 mb-4">
              <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg inline-block">
                <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center text-4xl font-bold text-indigo-700">
                  {publisher.correo.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 mb-6">
              {publisher.nombre || publisher.correo.split('@')[0]}
            </h1>
            
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4 uppercase">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-slate-600 font-medium">
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Mail className="h-5 w-5 text-indigo-400" />
                <a href={`mailto:${publisher.correo}`} className="hover:text-indigo-600 hover:underline">{publisher.correo}</a>
              </div>
              {publisher.numero_tel && (
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Phone className="h-5 w-5 text-indigo-400" />
                  <a href={`tel:${publisher.numero_tel}`} className="hover:text-indigo-600 hover:underline">{publisher.numero_tel}</a>
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Book className="h-6 w-6 text-indigo-500" /> Libros Publicados
        </h2>
        
        {publications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
            Este usuario no ha publicado libros aún.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publications.map((pub: any) => {
              const libro = pub.Libro;
              return (
                <div key={libro.id_libro} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-center aspect-[4/3]">
                    {libro.portada_url ? (
                      <img src={libro.portada_url} alt={libro.titulo} className="h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-24 h-36 bg-white shadow-sm border border-slate-200 rounded flex items-center justify-center text-indigo-200">
                        <Book className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 truncate mb-1" title={libro.titulo}>{libro.titulo}</h3>
                    <p className="text-sm text-slate-500 truncate mb-4">{libro.autor}</p>
                    <div className="mt-auto flex gap-2">
                      <Link to={`/libro/${libro.id_libro}`} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg text-center transition-colors text-sm">
                        Ver Detalles
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
