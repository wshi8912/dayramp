'use client';

type Task = {
  id: string;
  title: string;
  note?: string;
};

export function UntimedPane({ tasks, onSelect }: { tasks: Task[]; onSelect?: (t: Task) => void }) {
  return (
    <div className='rounded-lg border bg-card p-3 text-card-foreground'>
      <div className='mb-2 text-sm text-muted-foreground'>Untimed (MIT up to 3)</div>
      {tasks.length === 0 ? (
        <div className='text-sm text-muted-foreground'>No untimed tasks yet.</div>
      ) : (
        <div className='space-y-2'>
          {tasks.map((t) => (
            <button
              key={t.id}
              className='w-full rounded-md border p-2 text-left hover:bg-accent'
              onClick={() => onSelect?.(t)}
            >
              <div className='font-medium'>{t.title}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
