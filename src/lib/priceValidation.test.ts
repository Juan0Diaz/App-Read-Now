import test from 'node:test';
import assert from 'node:assert/strict';

import { validatePrecio } from './priceValidation';

test('rechaza un precio vacío o negativo', () => {
  assert.throws(() => validatePrecio(''), {
    message: 'El precio debe ser un número mayor o igual a cero.',
  });
  assert.throws(() => validatePrecio('-1'), {
    message: 'El precio debe ser un número mayor o igual a cero.',
  });
});

test('permite un precio válido', () => {
  assert.equal(validatePrecio('25.50'), 25.5);
});
