export type Role = 'Visualizador' | 'Publicador' | 'Administrador';

export interface User {
  id_usuario: string; // matches Supabase UUID
  correo: string;
  fecha_date?: string;
  nombre?: string;
}

export interface UserRole {
  id_usuario: string;
  id_Rol: string;
}

export interface Rol {
  id_Rol: string;
  nombre_Rol: Role;
}

export interface Genero {
  id_genero: string;
  nombre_genero: string;
  descripcion: string;
}

export interface Libro {
  id_libro: string;
  titulo: string;
  autor: string;
  disponible: boolean;
  editorial: string;
  estado: string; // e.g. 'Nuevo', 'Usado', 'Digital'
  fecha_publicacion: string;
  id_genero: number;
  id_genero_1?: number;
  id_genero_2?: number;
  portada_url?: string;
}

export interface Publicacion {
  id_publicacion: number;
  id_usuario: string;
  id_libro: number;
  precio: number;
  descripcion: string;
  fecha_publicacion: string;
  estado: 'Activa' | 'Suspendida';
}

export interface Favorito {
  id_favoritos: number;
  id_libro: number;
  nombre_libro: string;
}

export interface UsuarioFavorito {
  id_usuario: string;
  id_favoritos: number;
}

// Extended types for UI convenience
export interface LibroWithDetails extends Libro {
  genero?: Genero;
  publicacion?: Publicacion;
}
