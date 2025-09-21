export function recordVisit(path: string) {
  try {
    localStorage.setItem('daykickoff:lastUsed', path);
    const raw = localStorage.getItem('daykickoff:recent');
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [path, ...arr.filter((p) => p !== path)].slice(0, 3);
    localStorage.setItem('daykickoff:recent', JSON.stringify(next));
  } catch {}
}

