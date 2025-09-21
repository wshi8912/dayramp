'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, BarChart3, Target, Zap } from 'lucide-react';
import { TimerSession, ActivityStats } from '../types';
import { StatsCard } from '../components/stats-card';
import { formatDuration } from '../hooks/use-activity-stats';

interface StatisticsTabProps {
  sessions: TimerSession[];
  stats: ActivityStats;
}

export function StatisticsTab({ sessions, stats }: StatisticsTabProps) {
  // Calculate additional statistics
  const averageSessionTime = stats.totalSessions > 0 ? Math.round(stats.totalTime / stats.totalSessions) : 0;
  const workBreakRatio = stats.totalBreakTime > 0 ? (stats.totalWorkTime / stats.totalBreakTime).toFixed(1) : 'N/A';
  
  // Timer type breakdown
  const timerStats = sessions.reduce((acc, session) => {
    const type = session.timer_type;
    if (!acc[type]) acc[type] = { count: 0, time: 0 };
    acc[type].count++;
    acc[type].time += session.duration_seconds || 0;
    return acc;
  }, {} as Record<string, { count: number; time: number }>);

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Average Session"
          value={formatDuration(averageSessionTime)}
          subtitle={`Across ${stats.totalSessions} sessions`}
          icon={Clock}
        />
        <StatsCard
          title="Work:Break Ratio"
          value={workBreakRatio}
          subtitle={`${formatDuration(stats.totalWorkTime)} : ${formatDuration(stats.totalBreakTime)}`}
          icon={Target}
        />
      </div>

      {/* Total Work vs Break Time */}
      {(stats.totalWorkTime > 0 || stats.totalBreakTime > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Focus vs Rest Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium text-red-600">Total Focus Time</div>
                <div className="text-2xl font-bold">{formatDuration(stats.totalWorkTime)}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.totalTime > 0 && `${Math.round((stats.totalWorkTime / stats.totalTime) * 100)}% of total time`}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-green-600">Total Break Time</div>
                <div className="text-2xl font-bold">{formatDuration(stats.totalBreakTime)}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.totalTime > 0 && `${Math.round((stats.totalBreakTime / stats.totalTime) * 100)}% of total time`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timer Type Breakdown */}
      {Object.keys(timerStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Timer Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(timerStats).map(([type, data]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="capitalize font-medium">{type}</div>
                  <div className="text-right text-sm text-muted-foreground">
                    {data.count} sessions • {formatDuration(data.time)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coming Soon Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Advanced Analytics</CardTitle>
          <CardDescription>
            More detailed insights coming soon
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Charts, trends, and goal tracking will be available here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}