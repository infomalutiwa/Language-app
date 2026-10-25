import { registerPlugin } from '@capacitor/core';
import { isNative } from './ui.js';

// Self-update for the sideloaded Android app. Releases are published on GitHub by CI; the app asks
// the public Releases API, downloads the APK itself and hands it to Android's installer (which
// refuses anything not signed with the same key as the installed app).
const REPO = import.meta.env.VITE_GITHUB_REPO || 'infomalutiwa/Language-app';
export const updatesEnabled = isNative && import.meta.env.VITE_SELF_UPDATE !== 'false';
const Updater = isNative ? registerPlugin('Updater') : null;

export const semverCode = (v) => {
  const [a = 0, b = 0, c = 0] = String(v).replace(/^v/, '').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
  return a * 10000 + b * 100 + c;
};

export const currentVersion = () => Updater.getVersion();

export async function checkForUpdate() {
  const cur = await Updater.getVersion();
  const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error(`github ${r.status}`);
  const rel = await r.json();
  const asset = (rel.assets ?? []).find((a) => /\.apk$/i.test(a.name) && a.browser_download_url?.startsWith(`https://github.com/${REPO}/releases/download/`));
  const latest = String(rel.tag_name ?? '').replace(/^v/, '');
  return {
    current: cur.versionName,
    latest,
    available: !!asset && semverCode(latest) > cur.versionCode,
    url: asset?.browser_download_url,
    sha256: asset?.digest?.startsWith('sha256:') ? asset.digest.slice(7) : undefined,
    size: asset?.size,
    notes: String(rel.body ?? '').slice(0, 1200),
  };
}

export async function downloadUpdate(info, onProgress) {
  const sub = await Updater.addListener('progress', (e) => onProgress?.(e.percent));
  try { return await Updater.download({ url: info.url, sha256: info.sha256 }); } finally { sub.remove(); }
}

export const installUpdate = (path) => Updater.install({ path });
