import type { ChangeEventHandler, FormEventHandler } from 'react';
import { Check, Pencil, Plus, Tags, Trash2, X } from 'lucide-react';
import { Genero } from '../types';

export interface AdminGenresProps {
  generos: Genero[];
  nombreNuevo: string;
  editandoId: string | null;
  nombreEdicion: string;
  loading: boolean;
  saving: boolean;
  error: string;
  notice: string;
  onCreate: FormEventHandler<HTMLFormElement>;
  onNewNameChange: ChangeEventHandler<HTMLInputElement>;
  onStartEditing: (genero: Genero) => void;
  onCancelEditing: () => void;
  onUpdate: FormEventHandler<HTMLFormElement>;
  onEditNameChange: ChangeEventHandler<HTMLInputElement>;
  onDelete: (genero: Genero) => void;
}

export const AdminGenres = ({
  generos,
  nombreNuevo,
  editandoId,
  nombreEdicion,
  loading,
  saving,
  error,
  notice,
  onCreate,
  onNewNameChange,
  onStartEditing,
  onCancelEditing,
  onUpdate,
  onEditNameChange,
  onDelete,
}: AdminGenresProps) => (
  <div className="flex h-full flex-col animate-in fade-in bg-surface-soft text-text-strong duration-500 dark:bg-surface-soft">
    <header className="sticky top-0 z-10 flex h-20 w-full shrink-0 items-center border-b border-border bg-surface px-6 sm:px-8">
      <h1 className="text-xl font-bold text-text-strong">Gestión de Géneros</h1>
    </header>

    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 overflow-y-auto p-5 sm:p-8">
      <form onSubmit={onCreate} className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row">
        <label htmlFor="nuevo-genero" className="sr-only">Nombre del nuevo género</label>
        <input
          id="nuevo-genero"
          value={nombreNuevo}
          onChange={onNewNameChange}
          maxLength={50}
          placeholder="Nombre del género"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-strong placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={saving || !nombreNuevo.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Añadir género
        </button>
      </form>

      {(error || notice) && (
        <p className={`text-sm ${error ? 'text-error' : 'text-success'}`} role={error ? 'alert' : 'status'}>
          {error || notice}
        </p>
      )}

      <section aria-labelledby="lista-generos-titulo">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="lista-generos-titulo" className="text-lg font-bold">Géneros registrados</h2>
          <span className="text-sm text-text-muted">{generos.length}</span>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {loading ? (
            <p className="py-10 text-center text-sm text-text-muted">Cargando géneros...</p>
          ) : generos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-text-muted">
              <Tags className="h-8 w-8" aria-hidden="true" />
              <p>No hay géneros registrados.</p>
            </div>
          ) : generos.map((genero) => (
            <div key={genero.id_genero} className="flex min-h-16 flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              {editandoId === genero.id_genero ? (
                <form onSubmit={onUpdate} className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                  <label htmlFor={`editar-${genero.id_genero}`} className="sr-only">Editar {genero.nombre_genero}</label>
                  <input
                    id={`editar-${genero.id_genero}`}
                    value={nombreEdicion}
                    onChange={onEditNameChange}
                    maxLength={50}
                    autoFocus
                    className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex items-center gap-2">
                    <button type="submit" title="Guardar cambios" aria-label="Guardar cambios" disabled={saving || !nombreEdicion.trim()} className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-success text-white hover:opacity-90 disabled:opacity-50">
                      <Check className="h-4 w-4" />
                    </button>
                    <button type="button" title="Cancelar edición" aria-label="Cancelar edición" onClick={onCancelEditing} disabled={saving} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-soft disabled:opacity-50">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <span className="font-medium text-text-strong">{genero.nombre_genero}</span>
              )}

              {editandoId !== genero.id_genero && (
                <div className="flex items-center gap-2">
                  <button type="button" title={`Editar ${genero.nombre_genero}`} aria-label={`Editar ${genero.nombre_genero}`} onClick={() => onStartEditing(genero)} disabled={saving} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-body hover:bg-surface-soft disabled:opacity-50">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" title={`Eliminar ${genero.nombre_genero}`} aria-label={`Eliminar ${genero.nombre_genero}`} onClick={() => onDelete(genero)} disabled={saving} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-error/30 text-error hover:bg-error/10 disabled:opacity-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);