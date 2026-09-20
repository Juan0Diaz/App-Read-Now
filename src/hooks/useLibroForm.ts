import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Libro } from '../types';

export type LibroFormData = {
  titulo: string;
  autor: string;
  editorial: string;
  fecha_publicacion: string;
  descripcion: string;
  estado: string;
  disponible: boolean;
  portada_url: string;
};

export const createEmptyLibroForm = (): LibroFormData => ({
  titulo: '',
  autor: '',
  editorial: '',
  fecha_publicacion: '',
  descripcion: '',
  estado: 'Nuevo',
  disponible: true,
  portada_url: '',
});

export function validateLibroForm(formData: Partial<LibroFormData>) {
  const tituloRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.,!?"¿?:()]+$/;
  if (!tituloRegex.test(formData.titulo ?? '')) {
    throw new Error('El título solo puede contener letras, números y signos de puntuación básicos, no caracteres especiales');
  }

  const autorRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!autorRegex.test(formData.autor ?? '')) {
    throw new Error('El autor solo puede contener letras, no caracteres especiales ni números');
  }

  const editorialRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.,!?"¿?:()]+$/;
  if (!editorialRegex.test(formData.editorial ?? '')) {
    throw new Error('La editorial solo puede contener letras, números y signos de puntuación básicos, no caracteres especiales');
  }

  const descripcion = (formData.descripcion ?? '').trim();
  if (descripcion.length === 0) {
    throw new Error('La descripción del libro no puede estar vacía.');
  }
  if (descripcion.length > 1000) {
    throw new Error('La descripción excede el límite máximo permitido.');
  }

  const validDescRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.,!?"¿?:()]+$/;
  if (!validDescRegex.test(descripcion)) {
    throw new Error('La descripción solo puede contener letras, números y signos de puntuación básicos, no caracteres especiales.');
  }

  if (formData.fecha_publicacion) {
    const pubDate = new Date(formData.fecha_publicacion);
    if (pubDate > new Date()) {
      throw new Error('La fecha de publicación no puede ser una fecha futura.');
    }
  }

  return descripcion;
}

export function buildLibroPayload(
  formData: Partial<LibroFormData>,
  selectedGeneros: string[],
  portadaUrl?: string,
) {
  const primaryGenero = selectedGeneros[0] || undefined;
  const secondaryGenero = selectedGeneros[1] || undefined;
  const tertiaryGenero = selectedGeneros[2] || undefined;

  return {
    titulo: formData.titulo,
    autor: formData.autor,
    editorial: formData.editorial,
    fecha_publicacion: formData.fecha_publicacion || undefined,
    id_genero: primaryGenero,
    id_genero_1: secondaryGenero,
    id_genero_2: tertiaryGenero,
    descripcion: (formData.descripcion ?? '').trim(),
    estado: formData.estado,
    disponible: formData.disponible,
    portada_url: portadaUrl || formData.portada_url || undefined,
  } as Partial<Libro>;
}

export function useLibroForm() {
  const [formData, setFormData] = useState<LibroFormData>(createEmptyLibroForm());
  const [selectedGeneros, setSelectedGeneros] = useState<string[]>(['']);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen excede el límite de 5MB.');
        return;
      }
      setImagenFile(file);
    }
  };

  const uploadImageIfNeeded = async (userId: string): Promise<string | undefined> => {
    if (!imagenFile) {
      return formData.portada_url || undefined;
    }

    const fileExt = imagenFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('Imagenes_Libros')
      .upload(filePath, imagenFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      if (uploadError.message.includes('400') || uploadError.message.includes('Payload')) {
        throw new Error('Imagen muy pesada, solo se admiten imágenes de máximo 5MB.');
      }
      throw new Error('Error al subir la imagen: ' + uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from('Imagenes_Libros')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const submitBook = async ({
    userId,
    onCreate,
    onUpdate,
    bookId,
  }: {
    userId: string;
    onCreate: (payload: Partial<Libro>) => Promise<unknown>;
    onUpdate: (id: string, payload: Partial<Libro>) => Promise<unknown>;
    bookId?: string;
  }) => {
    setLoading(true);
    setError('');

    try {
      validateLibroForm(formData);
      const portadaUrl = await uploadImageIfNeeded(userId);
      const payload = buildLibroPayload(formData, selectedGeneros, portadaUrl);

      if (bookId) {
        await onUpdate(bookId, payload);
        return;
      }

      await onCreate(payload);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error con el libro.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    selectedGeneros,
    setSelectedGeneros,
    imagenFile,
    setImagenFile,
    loading,
    error,
    setError,
    handleChange,
    handleImageChange,
    submitBook,
  };
}
