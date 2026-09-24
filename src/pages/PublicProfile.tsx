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
      <div className="bg-surface-soft p-8 py-20 text-center text-text-strong dark:bg-surface-soft">
        <h2 className="text-2xl font-bold text-text-strong">Perfil no encontrado</h2>
        <Link to="/" className="mt-4 inline-flex items-center font-bold text-primary hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col animate-in fade-in bg-surface-soft text-text-strong duration-500 dark:bg-surface-soft">
      <header className="sticky top-0 z-10 flex h-20 w-full shrink-0 items-center border-b border-border bg-surface px-8 dark:border-border dark:bg-surface">
        <button onClick={() => window.history.back()} className="inline-flex items-center text-sm font-bold text-text-muted transition-colors hover:text-text-strong">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 overflow-y-auto p-8">
        <div className="mb-8 w-full overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
          <div className="h-32 w-full bg-gradient-to-r from-primary to-secondary"></div>
          <div className="relative p-8 pt-0">
            <div className="-mt-16 mb-4">
              <div className="inline-block h-32 w-32 rounded-full bg-surface p-2 shadow-lg">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary">
                  {publisher.correo.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            <h1 className="mb-6 text-3xl font-extrabold text-text-strong">
              {publisher.nombre || publisher.correo.split('@')[0]}
            </h1>
            
            <h3 className="mb-4 text-sm font-bold uppercase tracking-tight text-text-strong">Información de Contacto</h3>
            <div className="mb-8 grid grid-cols-1 gap-4 text-text-body font-medium md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-soft p-4">
                <Mail className="h-5 w-5 text-primary" />
                <a href={`mailto:${publisher.correo}`} className="hover:text-primary hover:underline">{publisher.correo}</a>
              </div>
              {publisher.numero_tel && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-soft p-4">
                  <Phone className="h-5 w-5 text-primary" />
                  <a href={`tel:${publisher.numero_tel}`} className="hover:text-primary hover:underline">{publisher.numero_tel}</a>
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-text-strong">
          <Book className="h-6 w-6 text-primary" /> Libros Publicados
        </h2>
        
        {publications.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center text-text-muted">
            Este usuario no ha publicado libros aún.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publications.map((pub: any) => {
              const libro = pub.Libro;
              return (
                <div key={libro.id_libro} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:shadow-lg">
                  <div className="flex aspect-[4/3] items-center justify-center border-b border-border bg-surface-soft p-6">
                    {libro.portada_url ? (
                      <img src={libro.portada_url} alt={libro.titulo} className="h-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-36 w-24 items-center justify-center rounded border border-border bg-surface text-indigo-200 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <Book className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="mb-1 truncate font-bold text-text-strong dark:text-white" title={libro.titulo}>{libro.titulo}</h3>
                    <p className="mb-4 truncate text-sm text-text-muted dark:text-slate-400">{libro.autor}</p>
                    <div className="mt-auto flex gap-2">
                      <Link to={`/libro/${libro.id_libro}`} className="w-full rounded-lg bg-surface-soft px-4 py-2 text-center text-sm font-semibold text-text-strong transition-colors hover:bg-surface-muted dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
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
