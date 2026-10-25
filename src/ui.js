export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Bilingual label: German large, Romanian small beside it.
export const b = (de, ro) => `<span class="bi">${de}<small lang="ro">${ro}</small></span>`;
export const bt = (de, ro) => `${de} · ${ro}`;
export const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
