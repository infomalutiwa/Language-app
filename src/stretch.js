// Streaming WSOLA time stretcher: plays speech slower without lowering the pitch.
// rate < 1 = slower (0.7 = 1.43x as long). Feed PCM chunks to push(), call flush() at the end of a turn.
const hann = (n) => Float32Array.from({ length: n }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n));
const join = (a, b) => { const o = new Float32Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };

export class Stretcher {
  constructor(rate = 1, sr = 24000) {
    this.rate = rate;
    this.N = Math.round((sr * 0.03) / 2) * 2;
    this.Hs = this.N / 2;
    this.Ha = this.Hs * rate;
    this.D = Math.round(sr * 0.006);
    this.win = hann(this.N);
    this.reset();
  }

  reset() {
    this.x = new Float32Array(0);
    this.base = 0;
    this.k = 0;
    this.prev = 0;
    this.acc = new Float32Array(this.N);
  }

  push(chunk, final = false) {
    if (this.rate >= 0.999) return chunk;
    const { N, Hs, D, win } = this;
    const realEnd = this.base + this.x.length + chunk.length;
    this.x = join(this.x, chunk);
    if (final) this.x = join(this.x, new Float32Array(N + 2 * D + Hs));
    const out = [];
    for (;;) {
      const p = Math.round(this.k * this.Ha);
      if (final && p >= realEnd) break;
      const need = this.k === 0 ? N : Math.max(p + D + N, this.prev + Hs + N);
      if (need > this.base + this.x.length) break;
      let pos = 0;
      if (this.k > 0) {
        const t = this.prev + Hs - this.base;
        let best = -Infinity;
        pos = p;
        for (let d = -D; d <= D; d += 2) {
          const s = p + d - this.base;
          if (s < 0) continue;
          let c = 0;
          for (let i = 0; i < N; i += 2) c += this.x[s + i] * this.x[t + i];
          if (c > best) { best = c; pos = p + d; }
        }
      }
      const s = pos - this.base;
      for (let i = 0; i < N; i++) this.acc[i] += this.x[s + i] * win[i];
      out.push(this.acc.slice(0, Hs));
      this.acc.copyWithin(0, Hs);
      this.acc.fill(0, N - Hs);
      this.prev = pos;
      this.k++;
    }
    const keep = Math.max(this.base, Math.min(this.prev + Hs, Math.round(this.k * this.Ha) - D));
    if (keep > this.base) { this.x = this.x.slice(keep - this.base); this.base = keep; }
    const res = new Float32Array(out.length * Hs);
    out.forEach((o, i) => res.set(o, i * Hs));
    return res;
  }

  flush() {
    if (this.rate >= 0.999) return new Float32Array(0);
    const res = this.push(new Float32Array(0), true);
    this.reset();
    return res;
  }
}
