import type { LucideIcon } from 'lucide-react';
import { Calendar, Circle, Clock, Play } from 'lucide-react';

export type CalendarTaskLike = {
  kind?: 'task' | 'event';
  startAt?: string | null;
  endAt?: string | null;
  dueAt?: string | null;
  status?: string | null;
};

export type CalendarTone = 'event' | 'deadline' | 'scheduled' | 'start-only' | 'unscheduled';

type CalendarVisualKey = 'event' | 'deadline' | 'scheduled' | 'unscheduled';

type CalendarToneTokens = {
  cardClass: string;
  iconClass: string;
  chipClass: string;
  dotClass: string;
};

export type CalendarTheme = CalendarToneTokens & {
  tone: CalendarTone;
  visualKey: CalendarVisualKey;
  icon: LucideIcon;
};

const CALENDAR_TOKENS: Record<CalendarVisualKey, CalendarToneTokens> = {
  event: {
    cardClass: 'calendar-tone calendar-tone--event',
    iconClass: 'calendar-icon calendar-icon--event',
    chipClass: 'calendar-chip calendar-chip--event',
    dotClass: 'calendar-dot calendar-dot--event',
  },
  scheduled: {
    cardClass: 'calendar-tone calendar-tone--scheduled',
    iconClass: 'calendar-icon calendar-icon--scheduled',
    chipClass: 'calendar-chip calendar-chip--scheduled',
    dotClass: 'calendar-dot calendar-dot--scheduled',
  },
  deadline: {
    cardClass: 'calendar-tone calendar-tone--deadline',
    iconClass: 'calendar-icon calendar-icon--deadline',
    chipClass: 'calendar-chip calendar-chip--deadline',
    dotClass: 'calendar-dot calendar-dot--deadline',
  },
  unscheduled: {
    cardClass: 'calendar-tone calendar-tone--unscheduled',
    iconClass: 'calendar-icon calendar-icon--unscheduled',
    chipClass: 'calendar-chip calendar-chip--unscheduled',
    dotClass: 'calendar-dot calendar-dot--unscheduled',
  },
};

const ICON_BY_TONE: Record<CalendarTone, LucideIcon> = {
  event: Calendar,
  deadline: Clock,
  scheduled: Play,
  'start-only': Play,
  unscheduled: Circle,
};

function detectTone(task: CalendarTaskLike): CalendarTone {
  if (task.kind === 'event') {
    return 'event';
  }
  const hasStart = !!task.startAt;
  const hasEnd = !!task.endAt;
  const hasDue = !!task.dueAt;
  if (hasDue && !hasStart) {
    return 'deadline';
  }
  if (hasStart && hasEnd) {
    return 'scheduled';
  }
  if (hasStart && !hasEnd) {
    return 'start-only';
  }
  return 'unscheduled';
}

export function resolveCalendarTheme(task: CalendarTaskLike): CalendarTheme {
  const tone = detectTone(task);
  const visualKey: CalendarVisualKey = tone === 'start-only' ? 'scheduled' : tone;
  const tokens = CALENDAR_TOKENS[visualKey];
  return {
    tone,
    visualKey,
    icon: ICON_BY_TONE[tone],
    ...tokens,
  };
}
