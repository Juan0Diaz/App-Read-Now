import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertCircle, Check, Edit2, MessageSquareText, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { actualizarLibro, getSolicitudesRevision, revisarLibro } from '../microservicios/Libros';
import { Libro } from '../types';

const revisionLabel: Record<string, string> = {
  Pendiente: 'Pendiente de revisión',
  Corrección: 'Requiere corrección',
  Aprobado: 'Aprobado',
};

export const AdminBookReviews = () => {
  const { user, role } = useAuth();
  const [libros, setLibros] = useState<Libro[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Libro>>({});
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const selected = useMemo(
    () => libros.find((libro) => libro.id_libro === selectedId) ?? null,
    [libros, selectedId],
  );

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      const data = await getSolicitudesRevision();
      setLibros(data);
      setSelectedId((current) => current ?? data[0]?.id_libro ?? null);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSolicitudes();
  }, []);

  useEffect(() => {
    if (!selected) {
      setDraft({});
      setComment('');
      return;
    }
    setDraft({
      titulo: selected.titulo,
      autor: selected.autor,
      editorial: selected.editorial,
      fecha_publicacion: selected.fecha_publicacion,
      descripcion: selected.descripcion,
      disponible: selected.disponible,
      portada_url: selected.portada_url,
    });
    setComment(selected.comentario_revision ?? '');
  }, [selected]);

  if (!user || role !== 'Administrador') {
    return <Navigate to="/" />;
  }

  const guardarInformacion = async () => {
    if (!selected) return;
    try {
      setProcessing(true);
      setError('');
      await actualizarLibro(selected.id_libro, draft);
      await fetchSolicitudes();
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar la información.');
    } finally {
      setProcessing(false);
    }
  };

  const decidir = async (estado: 'Aprobado' | 'Corrección') => {
    if (!selected) return;
    if (estado === 'Corrección' && !comment.trim()) {
      setError('Escribe el mensaje de corrección que verá el publicador.');
      return;
    }

    try {
      setProcessing(true);
      setError('');
      await revisarLibro(selected.id_libro, estado, comment);
      const restantes = libros.filter((libro) => libro.id_libro !== selected.id_libro);
      setLibros(restantes);
      setSelectedId(restantes[0]?.id_libro ?? null);
    } catch (err: any) {
      setError(err.message || 'No se pudo registrar la revisión.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-soft">
      <header className="page-header-surface sticky top-0 z-10 flex h-20 shrink-0 items-center px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-strong">Revisión de libros</h1>
          <p className="text-sm text-text-muted">Solicitudes enviadas por publicadores</p>
        </div>
        {libros.length > 0 && (
          <span className="ml-auto rounded-full bg-warning/15 px-3 py-1 text-sm font-bold text-warning">
            {libros.length} pendiente{libros.length === 1 ? '' : 's'}
          </span>
        )}
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 overflow-y-auto p-4 md:p-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-error/20 bg-error-soft p-3 text-sm font-semibold text-error lg:col-span-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <aside className="min-h-0 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 font-semibold text-text-strong">Solicitudes</div>
          {loading ? (
            <p className="p-6 text-sm text-text-muted">Cargando solicitudes...</p>
          ) : libros.length === 0 ? (
            <p className="p-6 text-sm text-text-muted">No hay libros pendientes.</p>
          ) : (
            <div className="max-h-[38rem] overflow-y-auto p-2">
              {libros.map((libro) => (
                <button
                  key={libro.id_libro}
                  type="button"
                  onClick={() => setSelectedId(libro.id_libro)}
                  className={`mb-2 w-full rounded-xl border p-3 text-left transition-colors ${selectedId === libro.id_libro ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-surface-soft'}`}
                >
                  <span className="block font-bold text-text-strong">{libro.titulo}</span>
                  <span className="mt-1 block text-xs text-text-muted">{libro.autor}</span>
                  <span className="mt-2 inline-block rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase text-warning">
                    {revisionLabel[libro.estado_revision ?? 'Pendiente']}
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {selected ? (
          <section className="rounded-2xl border border-border bg-surface p-5 md:p-7">
            <div className="mb-6 flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-text-strong">Editar antes de decidir</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {([
                ['titulo', 'Título'],
                ['autor', 'Autor'],
                ['editorial', 'Editorial'],
                ['fecha_publicacion', 'Fecha de publicación'],
              ] as const).map(([field, label]) => (
                <label key={field} className="text-sm font-semibold text-text-body">
                  {label}
                  <input
                    type={field === 'fecha_publicacion' ? 'date' : 'text'}
                    value={typeof draft[field] === 'string' ? draft[field] : ''}
                    onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value || undefined }))}
                    className="theme-input mt-2"
                    disabled={processing}
                  />
                </label>
              ))}

              <div className="md:col-span-2">
                <span className="text-sm font-semibold text-text-body">Portada del libro</span>
                <div className="mt-2 grid items-start gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="flex aspect-[2/3] w-full max-w-44 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-soft">
                    {draft.portada_url ? (
                      <img
                        key={draft.portada_url}
                        src={draft.portada_url}
                        alt={`Portada de ${draft.titulo || 'libro enviado'}`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="px-4 text-center text-xs font-semibold text-text-muted">Sin portada</div>
                    )}
                  </div>
                  <label className="text-sm font-semibold text-text-body">
                    URL de portada
                    <input
                      type="url"
                      value={draft.portada_url ?? ''}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        portada_url: event.target.value || undefined,
                      }))}
                      className="theme-input mt-2"
                      disabled={processing}
                    />
                  </label>
                </div>
              </div>

              <label className="text-sm font-semibold text-text-body md:col-span-2">
                Descripción
                <textarea
                  value={draft.descripcion ?? ''}
                  onChange={(event) => setDraft((current) => ({ ...current, descripcion: event.target.value }))}
                  className="theme-input mt-2 min-h-28 resize-y"
                  disabled={processing}
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="button" variant="outline" onClick={guardarInformacion} disabled={processing}>
                <Edit2 className="mr-2 h-4 w-4" /> Guardar cambios
              </Button>
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <label className="flex items-center gap-2 text-sm font-semibold text-text-body">
                <MessageSquareText className="h-5 w-5 text-primary" />
                Mensaje para el publicador
              </label>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={1000}
                placeholder="Indica qué debe corregirse antes de aprobar el libro."
                className="theme-input mt-2 min-h-24 resize-y"
                disabled={processing}
              />
              <div className="mt-4 flex flex-col justify-end gap-3 sm:flex-row">
                <Button type="button" variant="outline" onClick={() => decidir('Corrección')} disabled={processing}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Rechazar y pedir corrección
                </Button>
                <Button type="button" onClick={() => decidir('Aprobado')} disabled={processing}>
                  <Check className="mr-2 h-4 w-4" /> Aprobar publicación
                </Button>
              </div>
            </div>
          </section>
        ) : !loading ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-text-muted">
            Selecciona una solicitud para revisarla.
          </div>
        ) : null}
      </div>
    </div>
  );
};
