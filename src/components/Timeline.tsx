'use client';

import { fromUTC } from '@/libs/tz';

type Task = {
  id: string;
  title: string;
  startAt?: string;
  endAt?: string;
  dueAt?: string;
  note?: string;
  status?: string;
};

export function Timeline({ tasks, tz, onSelect }: { tasks: Task[]; tz: string; onSelect?: (t: Task) => void }) {
  const fmt = (iso?: string) => (iso ? fromUTC(iso, tz).localISO.replace('T', ' ') : '');
  const fmtHM = (iso?: string) => (iso ? fromUTC(iso, tz).localISO.slice(11, 16) : '');
  const timeKey = (t: Task) => t.startAt || t.dueAt || '';
  const sorted = [...tasks].sort((a, b) => {
    const ta = timeKey(a);
    const tb = timeKey(b);
    if (!ta && !tb) return 0;
    if (!ta) return 1;
    if (!tb) return -1;
    return new Date(ta).getTime() - new Date(tb).getTime();
  });

  return (
    <div className='rounded-lg border bg-card p-3 text-card-foreground'>
      <div className='mb-2 text-xs text-muted-foreground'>Timeline</div>

      {sorted.length === 0 ? (
        <div className='text-sm text-muted-foreground'>No timed tasks yet.</div>
      ) : (
        <div className='relative'>
          {/* vertical rail aligned with dots */}
          <div className='pointer-events-none absolute left-20 top-0 bottom-0 w-0.5 bg-border' />

          <ul className='space-y-3'>
            {sorted.map((t, idx) => {
              const isDueOnly = !!t.dueAt && !t.startAt && !t.endAt;
              const timeStr = t.startAt && t.endAt
                ? `${fmt(t.startAt)} → ${fmt(t.endAt)}`
                : t.startAt
                ? fmt(t.startAt)
                : t.dueAt
                ? `due ${fmt(t.dueAt)}`
                : '';
              const leftLabel = t.startAt
                ? fmtHM(t.startAt)
                : t.dueAt
                ? `due ${fmtHM(t.dueAt)}`
                : '';

              const dotColor = t.status === 'done'
                ? 'bg-muted-foreground'
                : isDueOnly
                ? 'bg-amber-500'
                : 'bg-primary';

              return (
                <li key={t.id} className='relative pl-28'>
                  {/* left time label */}
                  {leftLabel && (
                    <span className='absolute left-0 top-1.5 w-16 pr-2 text-right font-mono text-[11px] tabular-nums text-muted-foreground'>
                      {leftLabel}
                    </span>
                  )}
                  {/* dot */}
                  <span className={`absolute left-20 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-background ${dotColor}`} />

                  <button
                    className={`w-full rounded-md border p-2 text-left transition-colors hover:border-accent hover:bg-accent/50 ${isDueOnly ? 'opacity-90' : ''}`}
                    onClick={() => onSelect?.(t)}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <div className={`truncate font-medium leading-tight ${isDueOnly ? 'text-sm' : ''}`}>
                        <span className='truncate'>{t.title}</span>
                        {t.status && (
                          <span className='ml-2 align-middle rounded-full bg-accent px-1.5 py-[1px] text-[10px] uppercase text-accent-foreground'>
                            {t.status}
                          </span>
                        )}
                      </div>
                      {/* keep right-side range for ranges; for due-only we rely on left label */}
                      {t.startAt && t.endAt && (
                        <div className='shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground'>
                          {fmtHM(t.startAt)} → {fmtHM(t.endAt)}
                        </div>
                      )}
                    </div>
                    {t.note && <div className='mt-1 truncate text-xs text-muted-foreground'>{t.note}</div>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
