'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CaptureBar } from '@/components/CaptureBar';
import { Timeline } from '@/components/Timeline';
import { TimelineGrid } from '@/components/TimelineGrid';
import { UntimedPane } from '@/components/UntimedPane';
import { AddTaskButton } from '@/components/AddTaskButton';
import { TaskSheet } from '@/components/TaskSheet';
import { postJSON } from '@/libs/api';

export type UITask = {
  id: string;
  title: string;
  note?: string;
  startAt?: string;
  endAt?: string;
  dueAt?: string;
  status?: string;
};

export function CoreView({
  tz,
  dayKey,
  timed,
  untimed,
}: {
  tz: string;
  dayKey: string;
  timed: UITask[];
  untimed: UITask[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<UITask | null>(null);

  const handleSelect = (task: UITask) => {
    setSelected(task);
    setOpen(true);
  };

  const refreshAndClose = () => {
    setOpen(false);
    setSelected(null);
    router.refresh();
  };

  const timedMemo = useMemo(() => timed, [timed]);
  const untimedMemo = useMemo(() => untimed, [untimed]);
  const useGrid = (searchParams?.get?.('grid') || '') === '1';

  const handleCreateAt = async (startUtc: string, endUtc: string) => {
    try {
      const created: any = await postJSON('/api/tasks', {
        title: 'New task',
        startAt: startUtc,
        endAt: endUtc,
        status: 'todo',
        source: 'manual',
      });
      const ui: UITask = {
        id: created.id,
        title: created.title,
        note: created.note ?? undefined,
        startAt: created.start_at ?? undefined,
        endAt: created.end_at ?? undefined,
        dueAt: created.due_at ?? undefined,
        status: created.status ?? 'todo',
      };
      setSelected(ui);
      setOpen(true);
      router.refresh();
    } catch (e) {
      console.error('Create task failed', e);
    }
  };

  return (
    <>
      <div className='mb-6'>
        <CaptureBar tz={tz} dayKey={dayKey} />
      </div>
      <div className='mb-6'>
        <UntimedPane tasks={untimedMemo} onSelect={handleSelect} />
      </div>
      <div className='mb-6'>
        {useGrid ? (
          <TimelineGrid
            tasks={timedMemo}
            tz={tz}
            dayKey={dayKey}
            stepMin={30}
            defaultDurationMin={30}
            onSelect={handleSelect}
            onCreate={handleCreateAt}
          />
        ) : (
          <Timeline tasks={timedMemo} tz={tz} onSelect={handleSelect} />
        )}
      </div>
      <AddTaskButton tz={tz} />
      <TaskSheet open={open} onOpenChange={setOpen} task={selected ?? undefined} tz={tz} onSaved={refreshAndClose} />
    </>
  );
}
