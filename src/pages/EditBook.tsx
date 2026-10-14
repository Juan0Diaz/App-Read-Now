import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLibro, actualizarLibro } from '../microservicios/Libros';
import { useGeneros } from '../hooks/useGeneros';
import { useAuth } from '../context/AuthContext';
import { useLibroForm, createEmptyLibroForm } from '../hooks/useLibroForm';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Book, AlignLeft, Calendar, Tag, Building2, AlertCircle, BookOpen, Plus, X, Upload, ImagePlus } from 'lucide-react';

export const EditBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { generos } = useGeneros();
  const {
    formData,
    setFormData,
    selectedGeneros,
    setSelectedGeneros,
    imagenFile,
    setImagenFile,
    loading,
    error,
    setError,
    handleChange,
    handleImageChange,
    submitBook,
  } = useLibroForm();
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!id) {
      setFetching(false);
      return;
    }

    getLibro(id)
      .then((data) => {
        setFormData({
          titulo: data.titulo || '',
          autor: data.autor || '',
          editorial: data.editorial || '',
          fecha_publicacion: data.fecha_publicacion ? data.fecha_publicacion.substring(0, 10) : '',
          estado: data.estado || 'Nuevo',
          disponible: data.disponible,
          descripcion: data.descripcion || '',
          portada_url: data.portada_url || '',
        });

        const fetchedGeneros: string[] = [];
        if (data.id_genero) fetchedGeneros.push(data.id_genero);
        if (data.id_genero_1) fetchedGeneros.push(data.id_genero_1);
        if (data.id_genero_2) fetchedGeneros.push(data.id_genero_2);

        setSelectedGeneros(fetchedGeneros.length > 0 ? fetchedGeneros : ['']);
      })
      .catch(() => setError('Error cargando los detalles del libro.'))
      .finally(() => setFetching(false));
  }, [id, setFormData, setSelectedGeneros, setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Debes iniciar sesión.');
      return;
    }

    if (!id) {
      setError('No se ha especificado el ID del libro.');
      return;
    }

    try {
      await submitBook({
        userId: user.id_usuario,
        bookId: id,
        onCreate: async () => undefined,
        onUpdate: async (bookId, payload) => await actualizarLibro(bookId, payload),
      });
      alert('¡Libro actualizado con éxito!');
      navigate('/publicador/libros');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al actualizar el libro.');
    }
  };

  if (fetching) {
    return <div className="p-8 text-center text-text-muted font-semibold">Cargando...</div>;
  }

  return (
    <div className="flex h-full flex-col animate-in fade-in bg-bg-warm text-text-strong duration-500 dark:bg-surface-soft dark:text-text-strong">
      <header className="sticky top-0 z-10 flex h-20 w-full shrink-0 items-center gap-4 border-b border-border bg-surface px-8 dark:border-border dark:bg-surface">
        <button onClick={() => navigate('/publicador/libros')} className="-ml-2 rounded-full p-2 text-text-muted transition-colors hover:bg-surface-muted dark:text-text-body dark:hover:bg-surface-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-text-strong dark:text-text-strong">Editar Libro</h1>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 min-h-0 items-start overflow-y-auto p-8">
        <form onSubmit={handleSubmit} className="w-full overflow-hidden rounded-3xl border border-border-strong bg-surface p-8 shadow-md shadow-slate-200/60 dark:border-border dark:bg-surface">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-text-strong dark:text-text-strong">Detalles del Libro</h2>
            <p className="mt-1 text-text-muted dark:text-text-body">Actualiza la información del libro en el catálogo.</p>
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
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-body dark:text-text-body">
                  <Book className="h-4 w-4 text-primary" /> Título
                </label>
                <input 
                  type="text" 
                  name="titulo"
                  required
                  value={formData.titulo}
                  onChange={handleChange}
                  className="h-12 w-full rounded-xl border border-border bg-surface-soft px-4 text-text-strong transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-surface-muted dark:text-text-strong dark:focus:bg-surface-muted"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-body dark:text-text-body">
                  <AlignLeft className="h-4 w-4 text-primary" /> Autor
                </label>
                <input 
                  type="text" 
                  name="autor"
                  required
                  value={formData.autor}
                  onChange={handleChange}
                  className="h-12 w-full rounded-xl border border-border bg-surface-soft px-4 text-text-strong transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-surface-muted dark:text-text-strong dark:focus:bg-surface-muted"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-body dark:text-text-body">
                  <Building2 className="h-4 w-4 text-primary" /> Editorial
                </label>
                <input 
                  type="text" 
                  name="editorial"
                  required
                  value={formData.editorial}
                  onChange={handleChange}
                  className="h-12 w-full rounded-xl border border-border bg-surface-soft px-4 text-text-strong transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-surface-muted dark:text-text-strong dark:focus:bg-surface-muted"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-body dark:text-text-body">
                  <BookOpen className="h-4 w-4 text-primary" /> Descripción
                </label>
                <textarea 
                  name="descripcion"
                  required
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="h-[120px] w-full resize-none overflow-y-auto rounded-xl border border-border bg-surface-soft px-4 py-3 text-text-strong transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-surface-muted dark:text-text-strong dark:focus:bg-surface-muted"
                  placeholder="Sinopsis o información del libro..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-body dark:text-text-body">
                    <Calendar className="h-4 w-4 text-primary" /> Fecha Pub.
                  </label>
                  <input 
                    type="date" 
                    name="fecha_publicacion"
                    required
                    value={formData.fecha_publicacion}
                    onChange={handleChange}
                    className="h-12 w-full rounded-xl border border-border bg-surface-soft px-4 text-text-strong transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-surface-muted dark:text-text-strong dark:focus:bg-surface-muted"
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-body dark:text-text-body">
                    <Tag className="h-4 w-4 text-primary" /> Género(s)
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
                          className="flex-1 rounded-xl border border-border bg-surface-soft px-4 py-2 text-text-strong transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-surface-muted dark:text-text-strong dark:focus:bg-surface-muted"
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
                            className="rounded-xl p-2 text-rose-500 transition-colors hover:bg-rose-50"
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
                        className="flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                      >
                        <Plus className="h-4 w-4" /> Añadir otro género
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-body dark:text-text-body">
                    <Book className="h-4 w-4 text-primary" /> Estado
                  </label>
                  <input 
                    type="text" 
                    name="estado"
                    required
                    value={formData.estado}
                    onChange={handleChange}
                    className="h-12 w-full rounded-xl border border-border bg-surface-soft px-4 text-text-strong transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-surface-muted dark:text-text-strong"
                  />
                </div>
                <div className="flex items-center pt-8">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input 
                      type="checkbox" 
                      name="disponible"
                      checked={formData.disponible}
                      onChange={handleChange}
                      className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-bold text-text-body dark:text-text-body">Disponible</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-1">
              <div className="flex flex-col">
                <label className="mb-2 flex w-full items-center gap-2 text-sm font-bold text-text-body dark:text-text-body">
                  <Upload className="h-4 w-4 text-primary" /> Portada del Libro (Opcional)
                </label>
                <div className="group relative aspect-[3/4] max-h-[500px] cursor-pointer rounded-3xl border-2 border-dashed border-border bg-surface-soft p-8 text-center transition-colors hover:bg-surface-muted dark:border-border dark:bg-surface-muted dark:hover:bg-surface-soft">
                  {imagenFile ? (
                    <div className="absolute inset-0 h-full w-full p-2">
                      <img src={URL.createObjectURL(imagenFile)} alt="Preview" className="h-full w-full rounded-2xl bg-white object-contain shadow-sm" />
                      <button type="button" onClick={() => setImagenFile(null)} className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-rose-500 shadow-md transition-colors hover:bg-rose-50">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : formData.portada_url ? (
                    <div className="absolute inset-0 h-full w-full p-2">
                      <img src={formData.portada_url} alt="Current" className="h-full w-full rounded-2xl bg-white object-contain shadow-sm" />
                       <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                         <span className="rounded-lg bg-black/50 px-4 py-2 text-sm font-bold text-white">Cambiar Imagen</span>
                       </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 rounded-full bg-white p-4 shadow-sm ring-1 ring-border transition-transform duration-300 group-hover:scale-110 dark:bg-surface">
                        <ImagePlus className="h-8 w-8 text-text-strong" />
                      </div>
                      <p className="text-sm font-bold text-text-strong">Sube la portada del libro</p>
                      <p className="mt-2 text-xs font-medium text-text-body">Haz clic para buscar en tus archivos</p>
                      <p className="mt-1 text-[11px] text-text-muted">Formato JPG o PNG, máximo 5MB</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png" 
                    className="absolute inset-0 z-0 h-full w-full cursor-pointer opacity-0"
                    onChange={handleImageChange}
                    disabled={loading}
                    title={imagenFile || formData.portada_url ? "Cambiar imagen" : "Seleccionar imagen"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col-reverse gap-4 border-t border-border pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="h-12 w-full rounded-xl px-6 font-bold sm:w-auto" onClick={() => navigate('/publicador/libros')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-primary px-8 font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-hover sm:w-auto">
              {loading ? 'Actualizando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};