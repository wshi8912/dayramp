'use client';

import { fromUTC } from '@/libs/tz';

type Task = {
  id: string;
  title: string;
  startAt?: string;
  endAt?: string;
  dueAt?: string;
  note?: string;
};

export function Timeline({ tasks, tz, onSelect }: { tasks: Task[]; tz: string; onSelect?: (t: Task) => void }) {
  const fmt = (iso?: string) => (iso ? fromUTC(iso, tz).localISO.replace('T', ' ') : '');
  return (
    <div className='rounded-lg border bg-card p-3 text-card-foreground'>
      <div className='mb-2 text-sm text-muted-foreground'>Timeline (TZ: {tz})</div>
      <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
        {tasks.length === 0 ? (
          <div className='text-sm text-muted-foreground'>No timed tasks yet.</div>
        ) : (
          tasks.map((t) => (
            <button
              key={t.id}
              className='rounded-md border p-2 text-left hover:bg-accent'
              onClick={() => onSelect?.(t)}
            >
              <div className='font-medium'>{t.title}</div>
              <div className='text-xs text-muted-foreground'>
                {t.startAt && t.endAt
                  ? `${fmt(t.startAt)} → ${fmt(t.endAt)}`
                  : t.startAt
                  ? fmt(t.startAt)
                  : t.dueAt
                  ? `due ${fmt(t.dueAt)}`
                  : 'untimed'}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
