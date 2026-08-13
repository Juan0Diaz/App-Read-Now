import { supabase } from './supabase';
import { Libro, Genero, Publicacion, Favorito, User } from '../types';

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
export const getLibros = () => request<Libro[]>('/api/libros');
export const getLibro = (id: string) => request<Libro>(`/api/libros/${id}`);
export const crearLibro = (data: Partial<Libro>) =>
  request<Libro>('/api/libros', { method: 'POST', body: JSON.stringify(data) });
export const crearLibroConPublicacion = (data: Partial<Libro>) =>
  request<Libro>('/api/libros/publicar', { method: 'POST', body: JSON.stringify(data) });
export const actualizarLibro = (id: string, data: Partial<Libro>) =>
  request<void>(`/api/libros/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const eliminarLibro = (id: string) =>
  request<void>(`/api/libros/${id}`, { method: 'DELETE' });

// ---------- Géneros ----------
export const getGeneros = () => request<Genero[]>('/api/generos');

// ---------- Publicaciones ----------
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

// ---------- Favoritos ----------
export const getFavoritos = () => request<Favorito[]>('/api/favoritos');
export const agregarFavorito = (idLibro: string) =>
  request<void>(`/api/favoritos/${idLibro}`, { method: 'POST' });
export const quitarFavorito = (idLibro: string) =>
  request<void>(`/api/favoritos/${idLibro}`, { method: 'DELETE' });

// ---------- Préstamos ----------
export const solicitarPrestamo = (idLibro: string) =>
  request<void>(`/api/prestamos/${idLibro}`, { method: 'POST' });
export const getMisPrestamos = () => request<any[]>('/api/prestamos/mios');

// ---------- Usuarios ----------
export const getMiPerfil = () => request<User>('/api/usuarios/me');
export const actualizarMiPerfil = (data: { nombre?: string; fecha_date?: string; numero_tel?: string }) =>
  request<void>('/api/usuarios/me', { method: 'PUT', body: JSON.stringify(data) });
export const cambiarMiRol = (nombreRol: 'Visualizador' | 'Publicador') =>
  request<void>('/api/usuarios/me/rol', { method: 'PUT', body: JSON.stringify(nombreRol) });
export const eliminarMiCuenta = () =>
  request<void>('/api/usuarios/me', { method: 'DELETE' });
export const getUsuarios = () => request<User[]>('/api/usuarios');
export const asignarRol = (idUsuario: string, nombreRol: string) =>
  request<void>(`/api/usuarios/${idUsuario}/rol`, {
    method: 'PUT',
    body: JSON.stringify(nombreRol),
  });
