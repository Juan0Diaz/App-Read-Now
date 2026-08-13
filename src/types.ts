export type Role = 'Visualizador' | 'Publicador' | 'Administrador' | 'Desactivado';

export interface User {
  id_usuario: string;
  correo: string;
  fecha_date?: string;
  nombre?: string;
  numero_tel?: string;
  roles?: UserRole[]; // solo viene poblado en GET /api/usuarios (panel de Administrador)
}

export interface UserRole {
  id_usuario: string;
  id_Rol: string;
  rol?: Rol;
}

export interface Rol {
  id_Rol: string;
  nombre_Rol: Role;
}

export interface Genero {
  id_genero: string;
  nombre_genero: string;
}

export interface Libro {
  id_libro: string;
  titulo: string;
  autor: string;
  disponible: boolean;
  editorial?: string;
  estado?: string; 
  fecha_publicacion?: string;
  id_genero?: string;
  id_genero_1?: string;
  id_genero_2?: string;
  descripcion?: string;
  portada_url?: string;
  genero?: Genero;
  genero_1?: Genero;
  genero_2?: Genero;

}

export interface Publicacion {
  id_publicacion: string;
  id_usuario: string;
  id_libro: string;
  precio?: number;
  descripcion?: string;
  fecha_publicacion?: string;
  libro?: Libro;
  usuario?: User;
}

export interface Favorito {
  id_favorito: string;
  id_libro: string;
  id_usuario?: string;
  libro?: Libro;
}

export interface UsuarioFavorito {
  id_usuario: string;
  id_favoritos: string;
}

// Extended types for UI convenience
export interface LibroWithDetails extends Libro {
  publicacion?: Publicacion;
}