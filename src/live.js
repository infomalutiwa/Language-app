import { GoogleGenAI, Modality } from '@google/genai';
import { api } from './api.js';

const IN_RATE = 16000;
const OUT_RATE = 24000;

// Mic worklet: downmix to mono, resample to 16 kHz, emit ~64 ms Int16 chunks.
const WORKLET = `
class Cap extends AudioWorkletProcessor {
  constructor() { super(); this.buf = []; this.pos = 0; this.ratio = sampleRate / ${IN_RATE}; }
  process(inputs) {
    const ch = inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.pos += 1;
      if (this.pos >= this.ratio) { this.pos -= this.ratio; this.buf.push(ch[i]); }
    }
    if (this.buf.length >= 1024) {
      const out = new Int16Array(this.buf.length);
      let sum = 0;
      for (let i = 0; i < out.length; i++) {
        const s = Math.max(-1, Math.min(1, this.buf[i]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        sum += s * s;
      }
      this.port.postMessage({ pcm: out.buffer, rms: Math.sqrt(sum / out.length) }, [out.buffer]);
      this.buf = [];
    }
    return true;
  }
}
registerProcessor('cap', Cap);`;

const b64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

/**
 * One live voice session. Emits via callbacks:
 *  onState('connecting'|'listening'|'speaking'|'thinking'|'error'|'ended', detail)
 *  onText({ role: 'ai'|'me', text, final })
 *  onLevel(0..1)
 */
export class LiveSession {
  constructor(cb) {
    this.cb = cb;
    this.muted = false;
    this.startedAt = 0;
    this.reserved = 0;
    this.nextPlay = 0;
    this.sources = new Set();
    this.aiLevel = 0;
    this.micLevel = 0;
    this.closed = false;
  }

  async start(scenario) {
    this.cb.onState('connecting');
    let tok;
    try {
      tok = await api.token(scenario);
    } catch (e) {
      return this.fail(e.code === 'daily_limit' ? 'limit' : e.code === 'server_not_configured' ? 'server' : 'network');
    }
    this.reserved = tok.reservedSec;

    try {
      this.mic = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      await api.end(this.reserved);
      return this.fail('mic');
    }

    this.inCtx = new AudioContext({ latencyHint: 'interactive' });
    this.outCtx = new AudioContext({ sampleRate: OUT_RATE });
    await Promise.all([this.inCtx.resume(), this.outCtx.resume()]);

    try {
      const ai = new GoogleGenAI({ apiKey: tok.token, httpOptions: { apiVersion: 'v1alpha' } });
      this.session = await ai.live.connect({
        model: tok.model,
        config: { responseModalities: [Modality.AUDIO] },
        callbacks: {
          onopen: () => {},
          onmessage: (m) => this.onMessage(m),
          onerror: () => this.fail('network'),
          onclose: () => { if (!this.closed) this.finish('ended'); },
        },
      });
    } catch {
      await this.teardown();
      await api.end(this.reserved);
      return this.fail('network');
    }

    await this.inCtx.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET], { type: 'text/javascript' })));
    const src = this.inCtx.createMediaStreamSource(this.mic);
    this.node = new AudioWorkletNode(this.inCtx, 'cap');
    this.node.port.onmessage = ({ data }) => {
      this.micLevel = Math.min(1, data.rms * 6);
      if (this.muted || this.closed) return;
      try { this.session.sendRealtimeInput({ audio: { data: b64(data.pcm), mimeType: `audio/pcm;rate=${IN_RATE}` } }); } catch {}
    };
    src.connect(this.node);

    this.startedAt = Date.now();
    this.limitTimer = setTimeout(() => this.stop('limit'), this.reserved * 1000);
    this.levelTimer = setInterval(() => this.tickLevel(), 50);
    this.cb.onState('thinking');
    // Let the AI open the conversation in character.
    if (scenario !== 'translator') {
      try { this.session.sendRealtimeInput({ text: 'Beginne jetzt das Gespräch.' }); } catch {}
    }
  }

  tickLevel() {
    const speaking = this.sources.size > 0;
    const lvl = speaking ? this.aiLevel : this.muted ? 0 : this.micLevel;
    this.aiLevel *= 0.85;
    this.cb.onLevel(lvl);
    const state = speaking ? 'speaking' : this.waiting ? 'thinking' : 'listening';
    if (state !== this.lastState && !this.closed) { this.lastState = state; this.cb.onState(state); }
  }

  onMessage(m) {
    const sc = m.serverContent;
    if (!sc) return;
    if (sc.interrupted) this.flushAudio();
    for (const p of sc.modelTurn?.parts ?? []) {
      if (p.inlineData?.data) { this.waiting = false; this.play(unb64(p.inlineData.data)); }
    }
    if (sc.inputTranscription?.text) { this.waiting = true; this.cb.onText({ role: 'me', text: sc.inputTranscription.text }); }
    if (sc.outputTranscription?.text) this.cb.onText({ role: 'ai', text: sc.outputTranscription.text });
    if (sc.turnComplete) this.cb.onText({ role: 'ai', text: '', final: true });
  }

  play(bytes) {
    const n = bytes.byteLength >> 1;
    const pcm = new Int16Array(bytes.buffer, bytes.byteOffset, n);
    const buf = this.outCtx.createBuffer(1, n, OUT_RATE);
    const ch = buf.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < n; i++) { ch[i] = pcm[i] / 0x8000; sum += ch[i] * ch[i]; }
    this.aiLevel = Math.max(this.aiLevel, Math.min(1, Math.sqrt(sum / n) * 5));
    const s = this.outCtx.createBufferSource();
    s.buffer = buf;
    s.connect(this.outCtx.destination);
    const t = Math.max(this.outCtx.currentTime + 0.02, this.nextPlay);
    s.start(t);
    this.nextPlay = t + buf.duration;
    this.sources.add(s);
    s.onended = () => this.sources.delete(s);
  }

  flushAudio() {
    for (const s of this.sources) { try { s.stop(); } catch {} }
    this.sources.clear();
    this.nextPlay = 0;
  }

  // Barge-in: stop playback locally; server-side VAD handles the rest.
  interrupt() { this.flushAudio(); }
  setMuted(v) { this.muted = v; }
  say(text) { try { this.session.sendRealtimeInput({ text }); } catch {} }

  fail(kind) {
    this.finish('error', kind);
  }

  async teardown() {
    clearTimeout(this.limitTimer);
    clearInterval(this.levelTimer);
    this.flushAudio();
    try { this.node?.disconnect(); } catch {}
    try { this.session?.close(); } catch {}
    this.mic?.getTracks().forEach((t) => t.stop());
    await Promise.allSettled([this.inCtx?.close(), this.outCtx?.close()]);
  }

  async finish(state, detail) {
    if (this.closed) return;
    this.closed = true;
    const used = this.startedAt ? Math.round((Date.now() - this.startedAt) / 1000) : 0;
    await this.teardown();
    if (this.startedAt) await api.end(Math.max(0, this.reserved - used));
    this.cb.onState(state, { kind: detail, usedSec: used });
  }

  stop(reason) { return this.finish('ended', reason); }
}
