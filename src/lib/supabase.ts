import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isDemoMode = !supabaseUrl || !supabaseAnonKey;


export const supabase = isDemoMode 
  ? null as any
  : createClient(supabaseUrl, supabaseAnonKey);


export const MOCK_GENEROS = [
  { id_genero: 1, nombre_genero: 'Ficción', descripcion: 'Obras literarias basadas en la imaginación.' },
  { id_genero: 2, nombre_genero: 'Ciencia', descripcion: 'Textos académicos y divulgación científica.' },
  { id_genero: 3, nombre_genero: 'Historia', descripcion: 'Relatos y estudios de eventos pasados.' },
];

export const MOCK_LIBROS = [
  {
    id_libro: 101,
    titulo: 'Cien años de soledad',
    autor: 'Gabriel García Márquez',
    disponible: true,
    editorial: 'Sudamericana',
    estado: 'Físico',
    fecha_publicacion: '1967-06-05',
    id_genero: 1,
    portada_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
  },
  {
    id_libro: 102,
    titulo: 'Sapiens: De animales a dioses',
    autor: 'Yuval Noah Harari',
    disponible: true,
    editorial: 'Debate',
    estado: 'Digital',
    fecha_publicacion: '2011-09-04',
    id_genero: 2,
    portada_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400',
  },
  {
    id_libro: 103,
    titulo: 'El arte de la guerra',
    autor: 'Sun Tzu',
    disponible: false,
    editorial: 'Varios',
    estado: 'Físico',
    fecha_publicacion: '-0500-01-01',
    id_genero: 3,
    portada_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400',
  }
];
