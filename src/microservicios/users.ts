import { supabase } from '../lib/supabase';
import { User } from '../types';

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

export const getMiPerfil = () =>
  request<User>('/api/usuarios/me');

export const actualizarMiPerfil = (
  data: { nombre?: string; fecha_date?: string; numero_tel?: string }
) =>
  request<void>('/api/usuarios/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const cambiarMiRol = (
  nombreRol: 'Visualizador' | 'Publicador'
) =>
  request<void>('/api/usuarios/me/rol', {
    method: 'PUT',
    body: JSON.stringify(nombreRol),
  });

export const eliminarMiCuenta = () =>
  request<void>('/api/usuarios/me', {
    method: 'DELETE',
  });

export const getUsuarios = () =>
  request<User[]>('/api/usuarios');

export const asignarRol = (
  idUsuario: string,
  nombreRol: string
) =>
  request<void>(`/api/usuarios/${idUsuario}/rol`, {
    method: 'PUT',
    body: JSON.stringify(nombreRol),
  });