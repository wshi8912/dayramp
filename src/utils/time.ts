export function formatHMS(totalMs: number) {
  const ms = Math.max(0, Math.floor(totalMs));
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export function pad(n: number) {
  return n.toString().padStart(2, '0');
}

