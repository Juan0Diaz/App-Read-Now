import assert from 'node:assert/strict';
import test from 'node:test';
import { getLoginReturnPath, getSafeReturnPath } from './authRedirect';

test('accepts an internal return route including its query and fragment', () => {
  assert.equal(getLoginReturnPath({
    from: { pathname: '/libro/123', search: '?tab=details', hash: '#reviews' },
  }), '/libro/123?tab=details#reviews');
});

test('rejects external and malformed return destinations', () => {
  assert.equal(getSafeReturnPath('//example.com'), null);
  assert.equal(getLoginReturnPath({ from: 'https://example.com' }), null);
});
