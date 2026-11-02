import { supabase } from '../lib/supabase';
import { Libro, SolicitudRevision, User } from '../types';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5080/gateway').replace(/\/+$/, '');

async function authHeader(requiredAuth = true): Promise<HeadersInit> {
  if (!supabase) {
    return {};
  }

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error al recuperar la sesión de Supabase:', error);
  }

  if (!session?.access_token) {
    if (requiredAuth) {
      throw new Error('Debes iniciar sesión para acceder a esta información.');
    }
    return {};
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

async function request<T>(path: string, options: RequestInit = {}, requiredAuth = true): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(await authHeader(requiredAuth)),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`API ${response.status}: ${message}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const getLibros = () => request<Libro[]>('/api/libros', {}, false);
export const getLibro = (id: string) => request<Libro>(`/api/libros/${id}`, {}, false);
export const getLibroGestion = (id: string) => request<Libro>(`/api/libros/gestion/${id}`, {}, true);
export const getSolicitudesRevision = async (): Promise<SolicitudRevision[]> => {
  const solicitudes = await request<Array<{ libro: Libro; publicador: User | null }>>(
    '/api/libros/revision-solicitudes',
    {},
    true,
  );
  return solicitudes.map(({ libro, publicador }) => ({ ...libro, publicador: publicador ?? undefined }));
};
export const revisarLibro = (id: string, estado: 'Aprobado' | 'Corrección', comentario?: string) =>
  request<void>(`/api/libros/${id}/revision`, {
    method: 'PATCH',
    body: JSON.stringify({ estado, comentario: comentario?.trim() || undefined }),
  }, true);
export const resubmitirLibro = (id: string, comentario?: string) =>
  request<void>(`/api/libros/${id}/resubmitir`, {
    method: 'POST',
    body: JSON.stringify({ comentario: comentario?.trim() || undefined }),
  }, true);
export const crearLibro = (data: Partial<Libro>) =>
  request<Libro>('/api/libros', { method: 'POST', body: JSON.stringify(data) }, true);
export const crearLibroConPublicacion = (data: Partial<Libro>) =>
  request<Libro>('/api/libros/publicar', { method: 'POST', body: JSON.stringify(data) }, true);
export const actualizarLibro = (id: string, data: Partial<Libro>) =>
  request<void>(`/api/libros/${id}`, { method: 'PUT', body: JSON.stringify(data) }, true);
export const eliminarLibro = (id: string) =>
  request<void>(`/api/libros/${id}`, { method: 'DELETE' }, true);
