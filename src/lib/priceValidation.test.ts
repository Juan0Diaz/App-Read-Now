import test from 'node:test';
import assert from 'node:assert/strict';

import { formatPrecioCOP, normalizePrecio, validatePrecio } from './priceValidation';

test('rechaza un precio vacío o negativo', () => {
  assert.throws(() => validatePrecio(''), {
    message: 'El precio debe ser un número mayor o igual a cero.',
  });
  assert.throws(() => validatePrecio('-1'), {
    message: 'El precio debe ser un número mayor o igual a cero.',
  });
});

test('permite un precio válido', () => {
  assert.equal(validatePrecio('25.500'), 25500);
  assert.equal(normalizePrecio('137.000'), 137000);
});

test('formatea precios colombianos con separador de miles', () => {
  assert.equal(formatPrecioCOP('137000'), '137.000');
  assert.equal(formatPrecioCOP('137'), '137');
});
