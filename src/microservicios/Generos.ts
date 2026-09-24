import { supabase } from '../lib/supabase';
import { Genero } from '../types';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5080').replace(/\/+$/, '');

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

export const getGeneros = () => request<Genero[]>('/api/generos', {}, false);
export const crearGenero = (data: Partial<Genero>) =>
  request<Genero>('/api/generos', { method: 'POST', body: JSON.stringify(data) }, true);
export const eliminarGenero = (id: string) =>
  request<void>(`/api/generos/${id}`, { method: 'DELETE' }, true);
