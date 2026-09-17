import { supabase } from '../lib/supabase';
import { UsuarioPrestamo } from '../types';

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

export const solicitarPrestamo = (idLibro: string) =>
  request<void>(`/api/prestamos/${idLibro}`, { method: 'POST' });

export const getMisPrestamos = () =>
  request<UsuarioPrestamo[]>('/api/prestamos/mios');