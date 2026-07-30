import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Upload, Book, AlignLeft, Calendar, Tag, Building2, AlertCircle, BookOpen, Plus, X, ImagePlus } from 'lucide-react';

export const NewBook = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    editorial: '',
    fecha_publicacion: '',
    descripcion: ''
  });
  const [selectedGeneros, setSelectedGeneros] = useState<string[]>(['']);
  const [generos, setGeneros] = useState<{id_genero: string, nombre_genero: string}[]>([]);
  const [imagenFile, setImagenFile] = useState<File | null>(null);

  React.useEffect(() => {
    supabase.from('Genero').select('*').then(({data}) => {
      if (data) setGeneros(data);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen excede el límite de 5MB.');
        return;
      }
      setImagenFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!user) throw new Error('Debes iniciar sesión para publicar libros.');
      
      const tituloRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.,!?"¿?:()]+$/;
      if (!tituloRegex.test(formData.titulo)) {
        throw new Error('El título solo puede contener letras, números y signos de puntuación básicos, no caracteres especiales');
      }

      const autorRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
      if (!autorRegex.test(formData.autor)) {
        throw new Error('El autor solo puede contener letras, no caracteres especiales ni números');
      }

      const editorialRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.,!?"¿?:()]+$/;
      if (!editorialRegex.test(formData.editorial)) {
        throw new Error('La editorial solo puede contener letras, números y signos de puntuación básicos, no caracteres especiales');
      }

      const desc = formData.descripcion.trim();
      if (desc.length === 0) {
        throw new Error('La descripción del libro no puede estar vacía.');
      }
      if (desc.length > 1000) {
        throw new Error('La descripción excede el límite máximo permitido.');
      }
      const validDescRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.,!?"¿?:()]+$/;
      if (!validDescRegex.test(desc)) {
        throw new Error('La descripción solo puede contener letras, números y signos de puntuación básicos, no caracteres especiales de SQL.');
      }

      if (formData.fecha_publicacion) {
        const pubDate = new Date(formData.fecha_publicacion);
        if (pubDate > new Date()) {
          throw new Error('La fecha de publicación no puede ser una fecha futura.');
        }
      }

      let portada_url = null;
      if (imagenFile) {
        const fileExt = imagenFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id_usuario}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('Imagenes_Libros')
          .upload(filePath, imagenFile, {
             cacheControl: '3600',
             upsert: false
          });

        if (uploadError) {
          if (uploadError.message.includes('400') || uploadError.message.includes('Payload')) {
            throw new Error('Imagen muy pesada, solo se admiten imágenes de máximo 5MB.');
          }
          throw new Error('Error al subir la imagen: ' + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('Imagenes_Libros')
          .getPublicUrl(filePath);

        portada_url = publicUrlData.publicUrl;
      }

      // 1. Insert book first
      const primaryGenero = selectedGeneros[0] || null;
      const secondaryGenero = selectedGeneros[1] || null;
      const tertiaryGenero = selectedGeneros[2] || null;
      
      const { data: libroData, error: libroError } = await supabase.from('Libro').insert([{
        titulo: formData.titulo,
        autor: formData.autor,
        editorial: formData.editorial,
        fecha_publicacion: formData.fecha_publicacion,
        id_genero: primaryGenero,
        id_genero_1: secondaryGenero,
        id_genero_2: tertiaryGenero,
        descripcion: desc,
        disponible: true,
        portada_url,
        estado: 'Nuevo'
      }]).select().single();


      if (libroError) throw libroError;

      // 2. Insert publicacion
      const { error: pubError } = await supabase.from('Publicacion').insert([{
        id_usuario: user.id_usuario,
        id_libro: libroData.id_libro,
        precio: 0,
        descripcion: 'Agregado al catálogo',
        fecha_publicacion: new Date().toISOString()
      }]);

      if (pubError) throw pubError;

      alert('¡Libro publicado con éxito!');
      navigate('/publicador/libros');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al publicar el libro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center shrink-0 sticky top-0 z-10 w-full gap-4">
        <button onClick={() => navigate('/publicador/libros')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Añadir Nuevo Libro</h1>
      </header>

      <div className="p-8 flex-1 overflow-y-auto w-full max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Detalles del Libro</h2>
            <p className="text-slate-500 mt-1">Ingresa la información para agregar al catálogo general.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex gap-3 text-sm font-semibold">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6 lg:col-span-2">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <Book className="h-4 w-4 text-indigo-500" /> Título
                </label>
                <input 
                  type="text" 
                  name="titulo"
                  required
                  value={formData.titulo}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl h-12 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                  placeholder="Ej: El nombre del viento"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <AlignLeft className="h-4 w-4 text-indigo-500" /> Autor
                </label>
                <input 
                  type="text" 
                  name="autor"
                  required
                  value={formData.autor}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl h-12 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                  placeholder="Ej: Patrick Rothfuss"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <Building2 className="h-4 w-4 text-indigo-500" /> Editorial
                </label>
                <input 
                  type="text" 
                  name="editorial"
                  required
                  value={formData.editorial}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl h-12 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                  placeholder="Ej: Plaza & Janés"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <BookOpen className="h-4 w-4 text-indigo-500" /> Descripción
                </label>
                <textarea 
                  name="descripcion"
                  required
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors min-h-[120px] resize-y"
                  placeholder="Sinopsis o información del libro..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <Calendar className="h-4 w-4 text-indigo-500" /> Fecha Pub.
                  </label>
                  <input 
                    type="date" 
                    name="fecha_publicacion"
                    required
                    value={formData.fecha_publicacion}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl h-12 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <Tag className="h-4 w-4 text-indigo-500" /> Género(s)
                  </label>
                  <div className="space-y-3">
                    {selectedGeneros.map((val, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          required={index === 0}
                          value={val}
                          onChange={(e) => {
                            const newGeneros = [...selectedGeneros];
                            newGeneros[index] = e.target.value;
                            setSelectedGeneros(newGeneros);
                          }}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl h-12 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                        >
                          <option value="" disabled>Seleccione un género</option>
                          {generos.map((g) => (
                            <option key={g.id_genero} value={g.id_genero}>{g.nombre_genero}</option>
                          ))}
                        </select>
                        {index > 0 && (
                          <button 
                            type="button" 
                            onClick={() => {
                              const newGeneros = [...selectedGeneros];
                              newGeneros.splice(index, 1);
                              setSelectedGeneros(newGeneros);
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {selectedGeneros.length < 3 && (
                      <button
                        type="button"
                        onClick={() => setSelectedGeneros(prev => [...prev, ''])}
                        className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Añadir otro género
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6 lg:col-span-1">
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2 w-full">
                  <Upload className="h-4 w-4 text-indigo-500" /> Portada del Libro (Opcional)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer relative aspect-[3/4] max-h-[500px] bg-slate-50/50 group">
                  {imagenFile ? (
                    <div className="w-full h-full absolute inset-0 p-2">
                      <img src={URL.createObjectURL(imagenFile)} alt="Preview" className="w-full h-full object-contain rounded-2xl bg-white shadow-sm" />
                      <button type="button" onClick={() => setImagenFile(null)} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md text-rose-500 hover:bg-rose-50 z-10 transition-colors">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                        <ImagePlus className="h-8 w-8 text-indigo-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Sube la portada del libro</p>
                      <p className="text-xs text-slate-500 mt-2">Haz clic para buscar en tus archivos</p>
                      <p className="text-xs text-slate-400 mt-1">Formato JPG o PNG, máximo 5MB</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0"
                    onChange={handleImageChange}
                    disabled={loading}
                    title={imagenFile ? "Cambiar imagen" : "Seleccionar imagen"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-4">
            <Button type="button" variant="outline" className="rounded-xl h-12 px-6 font-bold w-full sm:w-auto" onClick={() => navigate('/publicador/libros')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 font-bold shadow-md shadow-indigo-200 w-full sm:w-auto">
              {loading ? 'Publicando...' : 'Publicar Libro'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
