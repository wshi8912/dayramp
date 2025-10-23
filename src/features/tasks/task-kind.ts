export const TASK_KINDS = ['task', 'event'] as const;
export const TASK_KIND_ORDER = ['event', 'task'] as const;

export type TaskKind = (typeof TASK_KINDS)[number];

export const TASK_KIND_LABELS: Record<TaskKind, string> = {
  task: 'Task',
  event: 'Event'
};

export function isTaskKind(value: unknown): value is TaskKind {
  return typeof value === 'string' && (TASK_KINDS as readonly string[]).includes(value);
}

export function normalizeTaskKind(value: unknown): TaskKind {
  if (isTaskKind(value)) return value;
  return 'task';
}
