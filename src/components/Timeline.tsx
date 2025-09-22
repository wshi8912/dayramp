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
  return (
    <div className='rounded-lg border bg-card p-3 text-card-foreground'>
      <div className='mb-1 text-xs text-muted-foreground'>Timeline</div>
      <div className='grid grid-cols-1 gap-1.5 md:grid-cols-2'>
        {tasks.length === 0 ? (
          <div className='text-sm text-muted-foreground'>No timed tasks yet.</div>
        ) : (
          tasks.map((t) => {
            const isDueOnly = !!t.dueAt && !t.startAt && !t.endAt;
            const timeStr = t.startAt && t.endAt
              ? `${fmt(t.startAt)} → ${fmt(t.endAt)}`
              : t.startAt
              ? fmt(t.startAt)
              : t.dueAt
              ? `due ${fmt(t.dueAt)}`
              : '';
            return (
              <button
                key={t.id}
                className={`rounded-md border p-2 text-left hover:bg-accent/50 hover:border-accent transition-colors ${isDueOnly ? 'opacity-90' : ''}`}
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
                  {timeStr && (
                    <div className='shrink-0 text-[11px] text-muted-foreground font-mono tabular-nums'>
                      {timeStr}
                    </div>
                  )}
                </div>
                {t.note && (
                  <div className='mt-1 truncate text-xs text-muted-foreground'>{t.note}</div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
