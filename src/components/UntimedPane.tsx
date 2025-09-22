'use client';

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
            <button
              key={t.id}
              className='w-full rounded-md border p-2 text-left hover:bg-accent/50 hover:border-accent transition-colors'
              onClick={() => onSelect?.(t)}
            >
              <div className='flex items-center justify-between gap-2'>
                <div className='truncate font-medium leading-tight'>
                  <span className='truncate'>{t.title}</span>
                </div>
                {t.status && (
                  <span className='ml-2 shrink-0 align-middle rounded-full bg-accent px-1.5 py-[1px] text-[10px] uppercase text-accent-foreground'>
                    {t.status}
                  </span>
                )}
              </div>
              {t.note && (
                <div className='mt-1 truncate text-xs text-muted-foreground'>{t.note}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
