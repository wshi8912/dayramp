'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimerSession } from '../types';
import { SessionList } from '../components/session-list';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

type FilterType = 'all' | 'focus' | 'interval' | 'breathing';

interface HistoryTabProps {
  sessions: TimerSession[];
  loading: boolean;
}

type DayDatum = {
  day: string;
  dateKey: string;
  focusWork: number;
  focusBreak: number;
  intervalWork: number;
  intervalBreak: number;
  breathingWork: number;
  breathingBreak: number;
};

function formatMinutesLabel(mins: number) {
  if (!mins) return '0m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function ymdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function HistoryTab({ sessions, loading }: HistoryTabProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  
  // Filter sessions based on selected filter
  const filteredSessions = useMemo(() => {
    if (filter === 'all') return sessions;
    
    const filterMap: Record<Exclude<FilterType, 'all'>, string> = {
      focus: 'pomodoro',
      interval: 'interval',
      breathing: 'breathing'
    };
    
    return sessions.filter(s => s.timer_type === filterMap[filter]);
  }, [sessions, filter]);

  const chartData = useMemo<DayDatum[]>(() => {
    console.log('Processing sessions for chart:', filteredSessions.length, 'sessions');
    // Build the last 7 days (oldest -> newest)
    const days: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }

    const base: DayDatum[] = days.map((d) => ({
      day: d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
      dateKey: ymdLocal(d),
      focusWork: 0,
      focusBreak: 0,
      intervalWork: 0,
      intervalBreak: 0,
      breathingWork: 0,
      breathingBreak: 0,
    }));

    const byDateKey = new Map(base.map((b) => [b.dateKey, b] as const));

    // Use filtered sessions instead of all sessions
    for (const s of filteredSessions) {
      if (!s.started_at) continue;
      const d = new Date(s.started_at);
      const k = ymdLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      const row = byDateKey.get(k);
      if (!row) continue; // not within last 7 days

      const workMin = Math.max(0, Math.round((s.work_duration_seconds || 0) / 60));
      const breakMin = Math.max(0, Math.round((s.break_duration_seconds || 0) / 60));
      switch (s.timer_type) {
        case 'pomodoro':
          row.focusWork += workMin;
          row.focusBreak += breakMin;
          break;
        case 'interval':
          row.intervalWork += workMin;
          row.intervalBreak += breakMin;
          break;
        case 'breathing':
          row.breathingWork += workMin;
          row.breathingBreak += breakMin;
          break;
        default:
          break;
      }
    }

    // Log the processed data for debugging
    console.log('Chart data:', base);
    console.log('Has any data:', base.some(d => 
      d.focusWork > 0 || d.focusBreak > 0 || 
      d.intervalWork > 0 || d.intervalBreak > 0 || 
      d.breathingWork > 0 || d.breathingBreak > 0
    ));
    return base;
  }, [filteredSessions]);

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          ALL
        </Button>
        <Button
          variant={filter === 'focus' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('focus')}
          className={filter === 'focus' ? 'bg-red-500 hover:bg-red-600' : ''}
        >
          Focus
        </Button>
        <Button
          variant={filter === 'interval' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('interval')}
          className={filter === 'interval' ? 'bg-blue-500 hover:bg-blue-600' : ''}
        >
          Interval
        </Button>
        <Button
          variant={filter === 'breathing' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('breathing')}
          className={filter === 'breathing' ? 'bg-green-500 hover:bg-green-600' : ''}
        >
          Breathing
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Last 7 Days {filter !== 'all' && `- ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tickFormatter={(v) => formatMinutesLabel(Number(v))} width={56} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip
                  formatter={(value: any) => formatMinutesLabel(Number(value))}
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Legend wrapperStyle={{ paddingTop: 8 }} />
                
                {/* Show bars based on filter */}
                {(filter === 'all' || filter === 'focus') && (
                  <>
                    <Bar dataKey="focusWork" stackId="a" name="Focus • Work" fill="#ef4444" isAnimationActive={false} />
                    <Bar dataKey="focusBreak" stackId="a" name="Focus • Break" fill="#fca5a5" isAnimationActive={false} />
                  </>
                )}
                
                {(filter === 'all' || filter === 'interval') && (
                  <>
                    <Bar dataKey="intervalWork" stackId="a" name="Interval • Work" fill="#3b82f6" isAnimationActive={false} />
                    <Bar dataKey="intervalBreak" stackId="a" name="Interval • Break" fill="#93bbfc" isAnimationActive={false} />
                  </>
                )}
                
                {(filter === 'all' || filter === 'breathing') && (
                  <>
                    <Bar dataKey="breathingWork" stackId="a" name="Breathing • Work" fill="#22c55e" isAnimationActive={false} />
                    <Bar dataKey="breathingBreak" stackId="a" name="Breathing • Break" fill="#86efac" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <SessionList 
        sessions={filteredSessions} 
        loading={loading}
        emptyMessage={filter === 'all' ? "No timer sessions yet" : `No ${filter} sessions yet`}
      />
    </div>
  );
}
