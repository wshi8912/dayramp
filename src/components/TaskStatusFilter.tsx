'use client';

import { useMemo } from 'react';

import { TASK_STATUS_LABELS, type TaskStatus } from '@/features/tasks/task-status';
import { TASK_STATUS_ORDER, TASK_STATUS_THEME } from '@/features/tasks/task-status-theme';
import { cn } from '@/utils/cn';

export type StatusFilterValue = 'all' | TaskStatus;

type StatusCounts = Partial<Record<StatusFilterValue, number>>;

type TaskStatusFilterProps = {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
  counts?: StatusCounts;
  allLabel?: string;
  className?: string;
};

export function TaskStatusFilter({
  value,
  onChange,
  counts,
  allLabel = 'All',
  className,
}: TaskStatusFilterProps) {
  const options = useMemo(() => ['all', ...TASK_STATUS_ORDER] as StatusFilterValue[], []);

  return (
    <div
      className={cn(
        'flex w-full flex-nowrap items-center gap-1 overflow-x-auto sm:flex-wrap sm:gap-2',
        className
      )}
    >
      {options.map((option) => {
        const isActive = option === value;
        const count = counts?.[option];
        const label = option === 'all' ? allLabel : TASK_STATUS_LABELS[option];
        const theme = option === 'all' ? null : TASK_STATUS_THEME[option];

        const baseClasses =
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-muted/80 focus-visible:ring-offset-background';

        const activeClasses =
          option === 'all'
            ? 'border-primary/40 bg-primary/10 text-primary'
            : theme?.ribbonClass ?? '';
        const inactiveClasses =
          'border-transparent bg-muted/60 text-muted-foreground hover:bg-muted focus-visible:ring-offset-background dark:hover:bg-muted/40';

        return (
          <button
            key={option}
            type='button'
            data-active={isActive ? 'true' : undefined}
            className={cn(baseClasses, isActive ? activeClasses : inactiveClasses)}
            onClick={() => onChange(option)}
          >
            {theme && <theme.icon className='h-3 w-3' />}
            <span>{label}</span>
            {typeof count === 'number' && (
              <span className='font-mono text-[10px]'>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
