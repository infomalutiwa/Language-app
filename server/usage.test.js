import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUsage, DEVICE_DAILY_SEC } from './usage.js';

test('reserve and refund adjust the remaining budget', () => {
  const u = createUsage('/nonexistent/usage.json');
  assert.equal(u.remaining('d1', 'ip1'), DEVICE_DAILY_SEC);
  u.reserve('d1', 'ip1', 300);
  assert.equal(u.remaining('d1', 'ip1'), DEVICE_DAILY_SEC - 300);
  u.refund('d1', 'ip1', 100);
  assert.equal(u.remaining('d1', 'ip1'), DEVICE_DAILY_SEC - 200);
});

test('a new device behind the same IP is bound by the IP cap', () => {
  const u = createUsage('/nonexistent/usage.json');
  u.reserve('a', 'shared', 3600);
  assert.equal(u.remaining('b', 'shared'), 0);
});
