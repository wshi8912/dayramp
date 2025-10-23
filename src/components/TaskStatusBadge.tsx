'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { normalizeTaskStatus, TASK_STATUS_LABELS, TaskStatus } from '@/features/tasks/task-status';
import { TASK_STATUS_ORDER, TASK_STATUS_THEME } from '@/features/tasks/task-status-theme';
import { patchJSON } from '@/libs/api';
import { cn } from '@/utils/cn';

type TaskStatusBadgeProps = {
  taskId: string;
  status?: string | null;
  size?: 'sm' | 'md';
  align?: 'start' | 'end';
  tone?: 'light' | 'dark';
  variant?: 'segmented' | 'icon';
  onStatusChange?: (status: TaskStatus) => void;
};

export function TaskStatusBadge({
  taskId,
  status,
  size = 'sm',
  align = 'start',
  tone = 'light',
  variant = 'segmented',
  onStatusChange,
}: TaskStatusBadgeProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [current, setCurrent] = useState<TaskStatus>(() => normalizeTaskStatus(status));
  const [updating, setUpdating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<TaskStatus | null>(null);

  useEffect(() => {
    setCurrent(normalizeTaskStatus(status));
  }, [status]);

  const statuses = useMemo(() => TASK_STATUS_ORDER as TaskStatus[], []);

  const selectStatus = async (next: TaskStatus) => {
    if (next === current || updating) return;
    setUpdating(true);
    setPendingStatus(next);
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
      setPendingStatus(null);
    }
  };

  const groupToneClass =
    tone === 'dark'
      ? 'border-white/20 bg-white/10 text-white shadow-none'
      : 'border-border/80 bg-background/80 shadow-sm';
  const buttonSizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]';
  const iconWrapperClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const iconSizeClass = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  if (variant === 'icon') {
    const theme = TASK_STATUS_THEME[current];
    const IconComponent = theme.icon;
    const showSpinner = updating;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type='button'
            aria-label={`Change status (currently ${TASK_STATUS_LABELS[current]})`}
            title={TASK_STATUS_LABELS[current]}
            disabled={updating}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed sm:h-8 sm:w-8',
              tone === 'dark' && 'border-white/30 bg-white/10 text-white focus-visible:ring-offset-0'
            )}
          >
            {showSpinner ? (
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
            ) : (
              <IconComponent className={cn('h-3.5 w-3.5', theme.iconClass)} />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-40' onClick={(event) => event.stopPropagation()}>
          {statuses.map((option) => {
            const optionTheme = TASK_STATUS_THEME[option];
            const OptionIcon = optionTheme.icon;
            const isActive = option === current;
            return (
              <DropdownMenuItem
                key={option}
                disabled={updating}
                onSelect={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectStatus(option);
                }}
                className='flex items-center gap-2 text-sm'
              >
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border', optionTheme.pillClass)}>
                  <OptionIcon className={cn('h-3 w-3', optionTheme.iconClass)} />
                </span>
                <span className='flex-1'>{TASK_STATUS_LABELS[option]}</span>
                {isActive && <Check className='h-3.5 w-3.5 text-emerald-500' />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div
      role='group'
      aria-label='Task status'
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-0.5 py-0.5 transition',
        groupToneClass,
        align === 'end' && 'ms-auto'
      )}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {statuses.map((option) => {
        const isActive = option === current;
        const showSpinner = updating && pendingStatus === option;
        const theme = TASK_STATUS_THEME[option];
        const IconComponent = theme.icon;

        return (
          <button
            key={option}
            type='button'
            aria-pressed={isActive}
            aria-label={`Mark as ${TASK_STATUS_LABELS[option]}`}
            title={TASK_STATUS_LABELS[option]}
            disabled={updating}
            className={cn(
              'flex items-center gap-1 rounded-full border border-transparent uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed',
              tone === 'dark' && 'focus-visible:ring-offset-0',
              buttonSizeClass,
              !isActive && 'text-muted-foreground hover:bg-muted/70 dark:hover:bg-muted/30',
              isActive && theme.pillClass
            )}
            onClick={(event) => {
              event.stopPropagation();
              selectStatus(option);
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <span
              className={cn(
                'flex items-center justify-center rounded-full',
                iconWrapperClass,
                theme.haloClass,
                !isActive && 'border border-transparent'
              )}
            >
              {showSpinner ? (
                <Loader2 className={cn(iconSizeClass, 'animate-spin')} />
              ) : (
                <IconComponent className={cn(iconSizeClass, theme.iconClass)} />
              )}
            </span>
            <span className='font-semibold'>{TASK_STATUS_LABELS[option]}</span>
          </button>
        );
      })}
    </div>
  );
}
