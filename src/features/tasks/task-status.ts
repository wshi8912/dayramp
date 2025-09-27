export const TASK_STATUSES = ['todo', 'pending', 'done'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  pending: 'Pending',
  done: 'Done',
};

export const TASK_STATUS_DB_VALUES = [...TASK_STATUSES, 'deleted'] as const;

export type TaskStatusDb = (typeof TASK_STATUS_DB_VALUES)[number];

export function isTaskStatus(value: string | null | undefined): value is TaskStatus {
  return typeof value === 'string' && (TASK_STATUSES as readonly string[]).includes(value);
}

export function isTaskStatusDb(value: string | null | undefined): value is TaskStatusDb {
  return typeof value === 'string' && (TASK_STATUS_DB_VALUES as readonly string[]).includes(value);
}

export function normalizeTaskStatus(value: string | null | undefined): TaskStatus {
  if (isTaskStatus(value)) return value;
  return 'todo';
}
