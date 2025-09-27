'use client';

import { useEffect, useState } from 'react';
import { Check, Circle, Clock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { TASK_STATUSES, TASK_STATUS_LABELS, TaskStatus, normalizeTaskStatus } from '@/features/tasks/task-status';
import { patchJSON } from '@/libs/api';
import { cn } from '@/utils/cn';

type TaskStatusBadgeProps = {
  taskId: string;
  status?: string | null;
  size?: 'sm' | 'md';
  align?: 'start' | 'end';
  tone?: 'light' | 'dark';
  onStatusChange?: (status: TaskStatus) => void;
};

const STATUS_META: Record<
  TaskStatus,
  { className: string; darkClassName: string; icon: typeof Check }
> = {
  todo: {
    className: 'bg-sky-50 text-sky-700 border-sky-200',
    darkClassName: 'bg-sky-400/25 text-white border-sky-200/40',
    icon: Circle,
  },
  pending: {
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    darkClassName: 'bg-amber-400/25 text-white border-amber-200/40',
    icon: Clock,
  },
  done: {
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    darkClassName: 'bg-emerald-400/25 text-white border-emerald-200/40',
    icon: Check,
  },
};

export function TaskStatusBadge({
  taskId,
  status,
  size = 'sm',
  align = 'start',
  tone = 'light',
  onStatusChange,
}: TaskStatusBadgeProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [current, setCurrent] = useState<TaskStatus>(() => normalizeTaskStatus(status));
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setCurrent(normalizeTaskStatus(status));
  }, [status]);

  const selectStatus = async (next: TaskStatus) => {
    if (next === current || updating) return;
    setUpdating(true);
    try {
      await patchJSON(`/api/tasks/${taskId}`, { status: next });
      setCurrent(next);
      onStatusChange?.(next);
      router.refresh();
    } catch (error) {
      console.error('Failed to update status', error);
      toast({
        title: 'ステータスの更新に失敗しました',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const meta = STATUS_META[current];
  const LabelIcon = meta.icon;
  const badgeToneClass = tone === 'dark' ? meta.darkClassName : meta.className;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label={`Change status (currently ${TASK_STATUS_LABELS[current]})`}
          className='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full'
        >
          <Badge
            variant='outline'
            className={cn(
              'flex cursor-pointer items-center gap-1 border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors',
              size === 'sm' && 'px-2 py-0.5 text-[10px]',
              size === 'md' && 'px-3 py-1 text-xs',
              align === 'end' && 'ms-auto',
              updating && 'opacity-75',
              tone === 'dark' ? 'hover:bg-white/20 focus-visible:ring-offset-0' : 'hover:bg-white',
              badgeToneClass,
            )}
          >
            {updating ? (
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
            ) : (
              <LabelIcon className='h-3.5 w-3.5' />
            )}
            <span>{TASK_STATUS_LABELS[current]}</span>
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className='w-40' onClick={(event) => event.stopPropagation()}>
        {TASK_STATUSES.map((option) => {
          const optionMeta = STATUS_META[option];
          const OptionIcon = optionMeta.icon;
          const optionToneClass = tone === 'dark' ? optionMeta.darkClassName : optionMeta.className;
          const isActive = option === current;
          return (
            <DropdownMenuItem
              key={option}
              onSelect={(event) => {
                event.preventDefault();
                event.stopPropagation();
                selectStatus(option);
              }}
              className='flex items-center gap-2 text-sm'
            >
              <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border', optionToneClass)}>
                <OptionIcon className='h-3 w-3' />
              </span>
              <span className='flex-1'>{TASK_STATUS_LABELS[option]}</span>
              {isActive && <Check className='h-4 w-4 text-emerald-600' />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
