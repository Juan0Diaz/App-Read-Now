import test from 'node:test';
import assert from 'node:assert/strict';

import { getDisplayPublicationDate } from './dateUtils';

test('prioriza la fecha del libro sobre la fecha de la publicación', () => {
  const value = getDisplayPublicationDate({
    id_publicacion: 'p1',
    id_usuario: 'u1',
    id_libro: 'l1',
    fecha_publicacion: '2024-05-01',
    libro: {
      id_libro: 'l1',
      titulo: 'El libro',
      autor: 'Autor',
      disponible: true,
      fecha_publicacion: '2023-02-15',
    },
  });

  assert.equal(value, '2023-02-15');
});

test('usa la fecha de la publicación si el libro no tiene fecha', () => {
  const value = getDisplayPublicationDate({
    id_publicacion: 'p2',
    id_usuario: 'u1',
    id_libro: 'l2',
    fecha_publicacion: '2024-10-10',
    libro: {
      id_libro: 'l2',
      titulo: 'Otro libro',
      autor: 'Autor',
      disponible: true,
    },
  });

  assert.equal(value, '2024-10-10');
});
