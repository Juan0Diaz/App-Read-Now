export type Role = 'Visualizador' | 'Publicador' | 'Administrador' | 'Desactivado';

export interface User {
  id_usuario: string; 
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
  estado: string; 
  fecha_publicacion: string;
  id_genero: string;
  id_genero_1?: string;
  id_genero_2?: string;
  portada_url?: string;
}

export interface Publicacion {
  id_publicacion: string;
  id_usuario: string;
  id_libro: string;
  precio: number;
  descripcion: string;
  fecha_publicacion: string;
  estado: 'Activa' | 'Suspendida';
}

export interface Favorito {
  id_favoritos: string;
  id_libro: string;
  nombre_libro: string;
}

export interface UsuarioFavorito {
  id_usuario: string;
  id_favoritos: string;
}


export interface LibroWithDetails extends Libro {
  genero?: Genero;
  publicacion?: Publicacion;
}
