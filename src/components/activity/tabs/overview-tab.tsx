'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp } from 'lucide-react';
import { TimerSession, ActivityStats } from '../types';
import { StatsCard } from '../components/stats-card';
import { SessionCard } from '../components/session-card';
import { formatDuration } from '../hooks/use-activity-stats';

interface OverviewTabProps {
  sessions: TimerSession[];
  stats: ActivityStats;
}

export function OverviewTab({ sessions, stats }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Today"
          value={stats.todaySessions}
          subtitle={`Sessions • ${formatDuration(stats.todayTime)}`}
          icon={Calendar}
        />
        <StatsCard
          title="Total"
          value={stats.totalSessions}
          subtitle={`All sessions • ${formatDuration(stats.totalTime)}`}
          icon={TrendingUp}
        />
      </div>

      {/* Work/Break breakdown for today */}
      {(stats.todayWorkTime > 0 || stats.todayBreakTime > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">
                Today's Focus Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatDuration(stats.todayWorkTime)}</div>
              <p className="text-xs text-muted-foreground">Work sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">
                Today's Break Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatDuration(stats.todayBreakTime)}</div>
              <p className="text-xs text-muted-foreground">Rest sessions</p>
            </CardContent>
          </Card>
        </div>
      )}

      {sessions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.slice(0, 5).map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}