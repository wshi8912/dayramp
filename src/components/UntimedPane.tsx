'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Task = {
  id: string;
  title: string;
  note?: string;
  status?: string;
};

export function UntimedPane({ tasks, onSelect }: { tasks: Task[]; onSelect?: (t: Task) => void }) {
  return (
    <div className='rounded-lg border bg-card p-3 text-card-foreground'>
      {tasks.length === 0 ? (
        <div className='text-sm text-muted-foreground'>No tasks yet.</div>
      ) : (
        <div className='space-y-1.5'>
          {tasks.map((t) => (
            <Card
              key={t.id}
              role='button'
              tabIndex={0}
              onClick={() => onSelect?.(t)}
              className='cursor-pointer p-3 shadow-sm transition-colors hover:bg-accent/30'
            >
              <div className='flex items-center justify-between gap-2'>
                <div className='truncate font-medium leading-tight'>
                  <span className='truncate'>{t.title}</span>
                </div>
                {t.status && (
                  <Badge variant='secondary' className='ml-2 shrink-0 text-[10px] uppercase'>
                    {t.status}
                  </Badge>
                )}
              </div>
              {t.note && <div className='mt-1 truncate text-xs text-muted-foreground'>{t.note}</div>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
