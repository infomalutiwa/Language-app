import test from 'node:test';
import assert from 'node:assert/strict';
import { Stretcher } from './stretch.js';

const sine = (sec, hz = 220, sr = 24000) => Float32Array.from({ length: sec * sr }, (_, i) => 0.5 * Math.sin((2 * Math.PI * hz * i) / sr));
const rms = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);

test('stretcher slows audio by the requested factor and keeps the level', () => {
  const x = sine(2);
  const st = new Stretcher(0.7);
  const parts = [];
  for (let i = 0; i < x.length; i += 2400) parts.push(st.push(x.slice(i, i + 2400)));
  parts.push(st.flush());
  const y = Float32Array.from(parts.flatMap((p) => [...p]));
  assert.ok(Math.abs(y.length / x.length - 1 / 0.7) < 0.06, `ratio ${y.length / x.length}`);
  const mid = y.slice(6000, y.length - 6000);
  assert.ok(Math.abs(rms(mid) / rms(x) - 1) < 0.15, `rms ${rms(mid)} vs ${rms(x)}`);
});

test('stretcher at normal speed passes audio through untouched', () => {
  const x = sine(1);
  const st = new Stretcher(1);
  assert.equal(st.push(x), x);
});
