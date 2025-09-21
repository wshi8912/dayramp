'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CaptureBar } from '@/components/CaptureBar';
import { Timeline } from '@/components/Timeline';
import { UntimedPane } from '@/components/UntimedPane';
import { AddTaskButton } from '@/components/AddTaskButton';
import { TaskSheet } from '@/components/TaskSheet';

export type UITask = {
  id: string;
  title: string;
  note?: string;
  startAt?: string;
  endAt?: string;
  dueAt?: string;
};

export function CoreView({
  tz,
  timed,
  untimed,
}: {
  tz: string;
  timed: UITask[];
  untimed: UITask[];
}) {
  const router = useRouter();
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

  return (
    <>
      <div className='mb-6'>
        <CaptureBar />
      </div>
      <div className='mb-6'>
        <Timeline tasks={timedMemo} tz={tz} onSelect={handleSelect} />
      </div>
      <div className='mb-6'>
        <UntimedPane tasks={untimedMemo} onSelect={handleSelect} />
      </div>
      <div className='flex items-center gap-2'>
        <AddTaskButton />
        <div className='text-sm text-muted-foreground'>Search coming soon</div>
      </div>
      <TaskSheet open={open} onOpenChange={setOpen} task={selected ?? undefined} tz={tz} onSaved={refreshAndClose} />
    </>
  );
}

