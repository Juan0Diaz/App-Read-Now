import React from 'react';
import { useNavigate } from 'react-router-dom';
import { crearLibroConPublicacion } from '../microservicios/Libros';
import { useGeneros } from '../hooks/useGeneros';
import { useAuth } from '../context/AuthContext';
import { useLibroForm } from '../hooks/useLibroForm';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Upload, Book, AlignLeft, Calendar, Tag, Building2, AlertCircle, BookOpen, Plus, X, ImagePlus } from 'lucide-react';

export const NewBook = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { generos } = useGeneros();
  const {
    formData,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Debes iniciar sesión para publicar libros.');
      return;
    }

    try {
      await submitBook({
        userId: user.id_usuario,
        onCreate: async (payload) => await crearLibroConPublicacion(payload),
        onUpdate: async () => undefined,
      });
      alert('¡Libro publicado con éxito!');
      navigate('/publicador/libros');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al publicar el libro.');
    }
  };

  return (
    <div className="page-shell flex h-full min-h-0 flex-col animate-in fade-in duration-500">
      <header className="page-header-surface sticky top-0 z-10 flex h-20 w-full shrink-0 items-center gap-4 px-8 shadow-sm">
        <button onClick={() => navigate('/publicador/libros')} className="-ml-2 rounded-full p-2 text-text-muted transition-colors hover:bg-surface-soft hover:text-text-strong">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-text-strong">Añadir Nuevo Libro</h1>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 min-h-0 items-start overflow-y-auto p-8">
        <form onSubmit={handleSubmit} className="w-full overflow-visible rounded-3xl border border-border-strong bg-surface p-8 shadow-md shadow-slate-200/60">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-text-strong">Detalles del Libro</h2>
            <p className="mt-1 text-text-muted">Ingresa la información para agregar al catálogo general.</p>
          </div>

          {error && (
            <div className="mb-6 flex gap-3 rounded-2xl border border-error/30 bg-error-soft p-4 text-sm font-semibold text-error">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6 lg:col-span-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-body">
                  <Book className="h-4 w-4 text-primary" /> Título
                </label>
                <input 
                  type="text" 
                  name="titulo"
                  required
                  value={formData.titulo}
                  onChange={handleChange}
                  className="theme-input"
                  placeholder="Ej: El nombre del viento"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-body">
                  <AlignLeft className="h-4 w-4 text-primary" /> Autor
                </label>
                <input 
                  type="text" 
                  name="autor"
                  required
                  value={formData.autor}
                  onChange={handleChange}
                  className="theme-input"
                  placeholder="Ej: Patrick Rothfuss"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-body">
                  <Building2 className="h-4 w-4 text-primary" /> Editorial
                </label>
                <input 
                  type="text" 
                  name="editorial"
                  required
                  value={formData.editorial}
                  onChange={handleChange}
                  className="theme-input"
                  placeholder="Ej: Plaza & Janés"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-body">
                  <BookOpen className="h-4 w-4 text-primary" /> Descripción
                </label>
                <textarea 
                  name="descripcion"
                  required
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="h-[120px] w-full resize-none overflow-y-auto rounded-xl border border-border bg-surface-soft px-4 py-3 text-text-strong placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Sinopsis o información del libro..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-body">
                    <Calendar className="h-4 w-4 text-primary" /> Fecha Pub.
                  </label>
                  <input 
                    type="date" 
                    name="fecha_publicacion"
                    required
                    value={formData.fecha_publicacion}
                    onChange={handleChange}
                    className="theme-input"
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-body">
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
                          className="flex-1 rounded-xl border border-border bg-surface-soft px-4 py-2 text-text-strong transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                        className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
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
                    <Tag className="h-4 w-4 text-primary" /> Estado
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
                <label className="mb-2 flex w-full items-center gap-2 text-sm font-bold text-text-body">
                  <Upload className="h-4 w-4 text-primary" /> Portada del Libro (Opcional)
                </label>
                <div className="group relative aspect-[3/4] max-h-[500px] cursor-pointer rounded-3xl border-2 border-dashed border-border bg-surface-soft p-8 text-center transition-colors hover:bg-surface-muted">
                  {imagenFile ? (
                    <div className="absolute inset-0 h-full w-full p-2">
                      <img src={URL.createObjectURL(imagenFile)} alt="Preview" className="h-full w-full rounded-2xl bg-surface object-contain shadow-sm" />
                      <button type="button" onClick={() => setImagenFile(null)} className="absolute right-4 top-4 z-10 rounded-full bg-surface p-2 text-error shadow-md transition-colors hover:bg-error-soft">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 rounded-full bg-surface p-4 shadow-sm ring-1 ring-border transition-transform duration-300 group-hover:scale-110">
                        <ImagePlus className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-sm font-bold text-text-strong">Sube la portada del libro</p>
                      <p className="mt-2 text-xs font-medium text-text-muted">Haz clic para buscar en tus archivos</p>
                      <p className="mt-1 text-[11px] text-text-muted">Formato JPG o PNG, máximo 5MB</p>
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

          <div className="mt-10 flex flex-col-reverse gap-4 border-t border-border pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-xl h-12 px-6 font-bold w-full sm:w-auto" onClick={() => navigate('/publicador/libros')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl px-8 font-bold shadow-md shadow-primary/20 sm:w-auto">
              {loading ? 'Publicando...' : 'Publicar Libro'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};