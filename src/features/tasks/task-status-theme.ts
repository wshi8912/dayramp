import type { LucideIcon } from 'lucide-react';
import { Check, Circle, Clock } from 'lucide-react';

import { TASK_STATUS_LABELS, TASK_STATUSES, type TaskStatus } from '@/features/tasks/task-status';

export type TaskStatusVisual = {
  icon: LucideIcon;
  pillClass: string;
  ribbonClass: string;
  iconClass: string;
  haloClass: string;
  cardClass: string;
  label: string;
};

export const TASK_STATUS_ORDER = [...TASK_STATUSES] as const;

export const TASK_STATUS_THEME: Record<TaskStatus, TaskStatusVisual> = {
  todo: {
    icon: Circle,
    pillClass:
      'border border-orange-200 bg-orange-100/90 text-orange-800 shadow-sm dark:border-orange-400/60 dark:bg-orange-500/20 dark:text-orange-50',
    ribbonClass:
      'border border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-400/60 dark:bg-orange-500/25 dark:text-orange-50',
    iconClass: 'text-orange-600 dark:text-orange-200',
    haloClass: 'bg-orange-500/15 dark:bg-orange-500/25',
    cardClass:
      'border border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-50',
    label: TASK_STATUS_LABELS.todo,
  },
  pending: {
    icon: Clock,
    pillClass:
      'border border-yellow-200 bg-yellow-100/90 text-yellow-800 shadow-sm dark:border-yellow-500/60 dark:bg-yellow-500/25 dark:text-yellow-50',
    ribbonClass:
      'border border-yellow-200 bg-yellow-100 text-yellow-800 dark:border-yellow-500/60 dark:bg-yellow-500/30 dark:text-yellow-50',
    iconClass: 'text-yellow-600 dark:text-yellow-200',
    haloClass: 'bg-yellow-500/15 dark:bg-yellow-500/35',
    cardClass:
      'border border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-500/40 dark:bg-yellow-500/20 dark:text-yellow-50',
    label: TASK_STATUS_LABELS.pending,
  },
  done: {
    icon: Check,
    pillClass:
      'border border-emerald-200 bg-emerald-100/90 text-emerald-800 shadow-sm dark:border-emerald-500/60 dark:bg-emerald-500/20 dark:text-emerald-50',
    ribbonClass:
      'border border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/25 dark:text-emerald-50',
    iconClass: 'text-emerald-600 dark:text-emerald-200',
    haloClass: 'bg-emerald-500/10 dark:bg-emerald-500/25',
    cardClass:
      'border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-50',
    label: TASK_STATUS_LABELS.done,
  },
};

export function getTaskStatusVisual(status: TaskStatus): TaskStatusVisual {
  return TASK_STATUS_THEME[status];
}
