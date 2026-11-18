import test from 'node:test';
import assert from 'node:assert/strict';

import { formatPrecioCOP, normalizePrecio, validatePrecio } from './priceValidation';

test('rechaza precios vacíos o fuera del límite permitido', () => {
  assert.throws(() => validatePrecio(''), {
    message: 'El precio debe estar entre $10.000 y $5.000.000 COP.',
  });
  assert.throws(() => validatePrecio('9.999'), {
    message: 'El precio debe estar entre $10.000 y $5.000.000 COP.',
  });
  assert.throws(() => validatePrecio('5.000.001'), {
    message: 'El precio debe estar entre $10.000 y $5.000.000 COP.',
  });
});

test('permite precios en los límites mínimo y máximo', () => {
  assert.equal(validatePrecio('10.000'), 10000);
  assert.equal(validatePrecio('25.500'), 25500);
  assert.equal(validatePrecio('5.000.000'), 5000000);
  assert.equal(normalizePrecio('137.000'), 137000);
});

test('formatea precios colombianos con separador de miles', () => {
  assert.equal(formatPrecioCOP('137000'), '137.000');
  assert.equal(formatPrecioCOP('137'), '137');
});
