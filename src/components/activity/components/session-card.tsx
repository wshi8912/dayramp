'use client';

import { Badge } from '@/components/ui/badge';
import { SessionCardProps } from '../types';
import { formatDate, formatDuration, getTimerTypeColor } from '../hooks/use-activity-stats';

export function SessionCard({ session, showDate = true }: SessionCardProps) {
  const workTime = session.work_duration_seconds || 0;
  const breakTime = session.break_duration_seconds || 0;
  const totalTime = session.duration_seconds || 0;

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-3">
        <Badge className={getTimerTypeColor(session.timer_type)}>
          {session.timer_type}
        </Badge>
        <div>
          {showDate && (
            <span className="text-sm">{formatDate(session.started_at)}</span>
          )}
          {session.preset_name && (
            <p className="text-xs text-muted-foreground">{session.preset_name}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm text-muted-foreground">
          {formatDuration(totalTime)}
        </span>
        {(workTime > 0 || breakTime > 0) && (
          <div className="text-xs text-muted-foreground">
            {workTime > 0 && `Work: ${formatDuration(workTime)}`}
            {workTime > 0 && breakTime > 0 && ' • '}
            {breakTime > 0 && `Break: ${formatDuration(breakTime)}`}
          </div>
        )}
        {session.is_completed && (
          <Badge variant="outline" className="text-xs ml-2">
            Completed
          </Badge>
        )}
      </div>
    </div>
  );
}