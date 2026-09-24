import { supabase } from '../lib/supabase';
import { Publicacion } from '../types';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5080').replace(/\/+$/, '');

async function authHeader(): Promise<HeadersInit> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error al recuperar la sesión de Supabase:', error);
  }

  if (!session?.access_token) {
    throw new Error('Debes iniciar sesión para acceder a esta información.');
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(await authHeader()),
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

export const getPublicaciones = () => request<Publicacion[]>('/api/publicaciones');
export const getMisPublicaciones = () => request<Publicacion[]>('/api/publicaciones/mias');
export const crearPublicacion = (data: Partial<Publicacion>) =>
  request<Publicacion>('/api/publicaciones', { method: 'POST', body: JSON.stringify(data) });
export const actualizarPublicacion = (id: string, data: Partial<Publicacion>) =>
  request<void>(`/api/publicaciones/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const eliminarPublicacion = (id: string) =>
  request<void>(`/api/publicaciones/${id}`, { method: 'DELETE' });
export const eliminarPublicacionConLibro = (id: string) =>
  request<void>(`/api/publicaciones/${id}/con-libro`, { method: 'DELETE' });
