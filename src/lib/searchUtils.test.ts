import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSearchText } from './searchUtils';

test('normalizes case and diacritics for accent-insensitive searches', () => {
  assert.equal(normalizeSearchText('GÉNERO'), 'genero');
  assert.equal(normalizeSearchText('Garcia Márquez'), 'garcia marquez');
});
