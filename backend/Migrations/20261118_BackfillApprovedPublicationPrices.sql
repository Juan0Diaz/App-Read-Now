UPDATE public."Publicacion" AS publicacion
SET precio = (15000 + floor(random() * 901)::integer * 50)::numeric
FROM public."Libro" AS libro
WHERE libro.id_libro = publicacion.id_libro
  AND libro.estado_revision = 'Aprobado';
