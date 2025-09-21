import { Database } from '@/types/supabase/database.types';

export type TimerSession = Database['public']['Tables']['timer_sessions']['Row'];

export interface ActivityStats {
  totalSessions: number;
  totalTime: number;
  totalWorkTime: number;
  totalBreakTime: number;
  todaySessions: number;
  todayTime: number;
  todayWorkTime: number;
  todayBreakTime: number;
}

export interface SessionCardProps {
  session: TimerSession;
  showDate?: boolean;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface SessionListProps {
  sessions: TimerSession[];
  loading?: boolean;
  emptyMessage?: string;
}

export interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type TimerType = 'pomodoro' | 'interval' | 'breathing';