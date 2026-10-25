import { readFileSync, writeFileSync } from 'node:fs';

// Daily live-talk budget per device and per IP. Without accounts this is a
// soft limit: clearing storage gives a new device id, the IP cap backs it up.
export const DEVICE_DAILY_SEC = Number(process.env.DAILY_SECONDS ?? 600);
export const IP_DAILY_SEC = Number(process.env.IP_DAILY_SECONDS ?? 3600);

const today = () => new Date().toISOString().slice(0, 10);

export function createUsage(file) {
  let state = { day: today(), device: {}, ip: {} };
  try {
    const saved = JSON.parse(readFileSync(file, 'utf8'));
    if (saved.day === today()) state = saved;
  } catch {}

  const roll = () => {
    if (state.day !== today()) state = { day: today(), device: {}, ip: {} };
  };
  const save = () => {
    try { writeFileSync(file, JSON.stringify(state)); } catch {}
  };

  return {
    remaining(deviceId, ip) {
      roll();
      return Math.max(0, Math.min(
        DEVICE_DAILY_SEC - (state.device[deviceId] ?? 0),
        IP_DAILY_SEC - (state.ip[ip] ?? 0),
      ));
    },
    // Reserve `sec` up front; the token's expireTime enforces it.
    reserve(deviceId, ip, sec) {
      roll();
      state.device[deviceId] = (state.device[deviceId] ?? 0) + sec;
      state.ip[ip] = (state.ip[ip] ?? 0) + sec;
      save();
    },
    refund(deviceId, ip, sec) {
      roll();
      state.device[deviceId] = Math.max(0, (state.device[deviceId] ?? 0) - sec);
      state.ip[ip] = Math.max(0, (state.ip[ip] ?? 0) - sec);
      save();
    },
  };
}
