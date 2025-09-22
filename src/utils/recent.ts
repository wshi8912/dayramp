export function recordVisit(path: string) {
  try {
    localStorage.setItem('dayramp:lastUsed', path);
    const raw = localStorage.getItem('dayramp:recent');
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [path, ...arr.filter((p) => p !== path)].slice(0, 3);
    localStorage.setItem('dayramp:recent', JSON.stringify(next));
  } catch {}
}

