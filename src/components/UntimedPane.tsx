'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Task = {
  id: string;
  title: string;
  note?: string;
  status?: string;
  startAt?: string;
  dueAt?: string;
};

export function UntimedPane({ tasks, onSelect }: { tasks: Task[]; onSelect?: (t: Task) => void }) {
  const formatTime = (isoString?: string) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className='rounded-lg border bg-card p-3 text-card-foreground'>
      {tasks.length === 0 ? (
        <div className='text-sm text-muted-foreground'>No tasks yet.</div>
      ) : (
        <div className='space-y-1.5'>
          {tasks.map((t) => {
            const startTime = formatTime(t.startAt);
            const dueTime = formatTime(t.dueAt);

            return (
              <Card
                key={t.id}
                role='button'
                tabIndex={0}
                onClick={() => onSelect?.(t)}
                className='cursor-pointer p-3 shadow-sm transition-colors hover:bg-accent/30'
              >
                <div className='flex items-center justify-between gap-2'>
                  <div className='truncate text-sm font-medium leading-tight'>
                    <span className='truncate'>{t.title}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    {startTime && !t.dueAt && (
                      <Badge variant='outline' className='shrink-0 text-[10px]'>
                        {startTime}開始
                      </Badge>
                    )}
                    {dueTime && (
                      <Badge variant='outline' className='shrink-0 text-[10px] text-orange-600 border-orange-300'>
                        {dueTime}締切
                      </Badge>
                    )}
                    {t.status && (
                      <Badge variant='secondary' className='shrink-0 text-[10px] uppercase'>
                        {t.status}
                      </Badge>
                    )}
                  </div>
                </div>
                {t.note && <div className='mt-1 truncate text-xs text-gray-600'>{t.note}</div>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
