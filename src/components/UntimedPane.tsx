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
        <div className='space-y-2'>
          {tasks.map((t) => (
            <button
              key={t.id}
              className='w-full rounded-md border p-2 text-left hover:bg-accent'
              onClick={() => onSelect?.(t)}
            >
              <div className='font-medium'>
                {t.title}
                {t.status && (
                  <span className='ml-2 align-middle rounded-full border px-2 py-[1px] text-[10px] uppercase text-muted-foreground'>
                    {t.status}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
