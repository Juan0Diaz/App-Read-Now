import { supabase } from './supabase';

// En Codespaces, define esta variable en tu .env como la URL forwarded del puerto 5080
// (Codespaces te la genera automáticamente, algo como https://<nombre>-5080.app.github.dev)
// En local (fuera de Codespaces) sería http://localhost:5080
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5080';

async function authHeader(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(await authHeader()),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${message}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------- Libros ----------
export const getLibros = () => request<any[]>('/api/libros');
export const getLibro = (id: string) => request<any>(`/api/libros/${id}`);
export const crearLibro = (data: unknown) =>
  request('/api/libros', { method: 'POST', body: JSON.stringify(data) });
export const actualizarLibro = (id: string, data: unknown) =>
  request(`/api/libros/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const eliminarLibro = (id: string) =>
  request(`/api/libros/${id}`, { method: 'DELETE' });

// ---------- Publicaciones ----------
export const getPublicaciones = () => request<any[]>('/api/publicaciones');
export const getMisPublicaciones = () => request<any[]>('/api/publicaciones/mias');
export const crearPublicacion = (data: unknown) =>
  request('/api/publicaciones', { method: 'POST', body: JSON.stringify(data) });

// ---------- Favoritos ----------
export const getFavoritos = () => request<any[]>('/api/favoritos');
export const agregarFavorito = (idLibro: string) =>
  request(`/api/favoritos/${idLibro}`, { method: 'POST' });
export const quitarFavorito = (idLibro: string) =>
  request(`/api/favoritos/${idLibro}`, { method: 'DELETE' });

// ---------- Usuarios ----------
export const getMiPerfil = () => request<any>('/api/usuarios/me');
