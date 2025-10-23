'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, List } from 'lucide-react';

import { AddTaskButton } from '@/components/AddTaskButton';
import { CaptureBar } from '@/components/CaptureBar';
import { TaskSheet } from '@/components/TaskSheet';
import { Timeline } from '@/components/Timeline';
import { TimelineGrid } from '@/components/TimelineGrid';
import { Button } from '@/components/ui/button';
import { UntimedPane } from '@/components/UntimedPane';
import { useIsMobile } from '@/hooks/use-mobile';
import { postJSON } from '@/libs/api';

export type UITask = {
  id: string;
  title: string;
  note?: string;
  startAt?: string;
  endAt?: string;
  dueAt?: string;
  status?: string;
  kind: 'task' | 'event';
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
  const [useGrid, setUseGrid] = useState(true); // Default to calendar view
  const [denseMode, setDenseMode] = useState(true); // Default to compact
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setDenseMode(true);
    }
  }, [isMobile]);

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
  const filteredTimed = timedMemo;

  const handleCreateAt = async (startUtc: string, endUtc: string) => {
    try {
      const created: any = await postJSON('/api/tasks', {
        title: 'New event',
        startAt: startUtc,
        endAt: endUtc,
        dueAt: null,
        status: 'pending',
        source: 'manual',
        kind: 'event',
      });
      const ui: UITask = {
        id: created.id,
        title: created.title,
        note: created.note ?? undefined,
        startAt: created.start_at ?? undefined,
        endAt: created.end_at ?? undefined,
        dueAt: created.due_at ?? undefined,
        status: created.status ?? 'pending',
        kind: created.kind ?? 'event',
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
        <UntimedPane tz={tz} tasks={untimedMemo} activeDateKey={dayKey} onSelect={handleSelect} />
      </div>
      <div className='mb-6'>
        {useGrid && !isMobile && (
          <div className='mb-3 flex items-center justify-end gap-2'>
            <Button
              type='button'
              variant={denseMode ? 'default' : 'outline'}
              size='sm'
              onClick={() => setDenseMode(true)}
            >
              Compact
            </Button>
            <Button
              type='button'
              variant={!denseMode ? 'default' : 'outline'}
              size='sm'
              onClick={() => setDenseMode(false)}
            >
              Expanded
            </Button>
          </div>
        )}
        <div className='relative'>
          {/* View toggle button in the top-right corner */}
          <Button
            variant='ghost'
            size='sm'
            className='absolute right-3 top-3 z-10 h-8 w-8 p-0'
            onClick={() => setUseGrid(!useGrid)}
            title={useGrid ? 'Switch to list view' : 'Switch to calendar view'}
          >
            {useGrid ? <List className='h-4 w-4' /> : <Calendar className='h-4 w-4' />}
          </Button>

          {useGrid ? (
            <TimelineGrid
              tasks={filteredTimed}
              tz={tz}
              dayKey={dayKey}
              stepMin={30}
              defaultDurationMin={30}
              density={denseMode ? 'compact' : 'expanded'}
              onSelect={handleSelect}
              onCreate={handleCreateAt}
            />
          ) : (
            <Timeline tasks={filteredTimed} tz={tz} dayKey={dayKey} onSelect={handleSelect} />
          )}
        </div>
      </div>
      <AddTaskButton tz={tz} />
      <TaskSheet open={open} onOpenChange={setOpen} task={selected ?? undefined} tz={tz} onSaved={refreshAndClose} />
    </>
  );
}
