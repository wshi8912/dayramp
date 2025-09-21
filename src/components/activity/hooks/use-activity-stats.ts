'use client';

import { useMemo } from 'react';
import { TimerSession, ActivityStats } from '../types';

export function useActivityStats(sessions: TimerSession[]): ActivityStats {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalSessions = 0;
    let totalTime = 0;
    let totalWorkTime = 0;
    let totalBreakTime = 0;
    let todaySessions = 0;
    let todayTime = 0;
    let todayWorkTime = 0;
    let todayBreakTime = 0;

    sessions.forEach(session => {
      const duration = session.duration_seconds || 0;
      const workDuration = session.work_duration_seconds || 0;
      const breakDuration = session.break_duration_seconds || 0;

      totalSessions++;
      totalTime += duration;
      totalWorkTime += workDuration;
      totalBreakTime += breakDuration;

      const sessionDate = new Date(session.started_at);
      if (sessionDate >= today) {
        todaySessions++;
        todayTime += duration;
        todayWorkTime += workDuration;
        todayBreakTime += breakDuration;
      }
    });

    return {
      totalSessions,
      totalTime,
      totalWorkTime,
      totalBreakTime,
      todaySessions,
      todayTime,
      todayWorkTime,
      todayBreakTime,
    };
  }, [sessions]);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function getTimerTypeColor(type: string): string {
  switch (type) {
    case 'pomodoro': return 'bg-red-500/10 text-red-600';
    case 'interval': return 'bg-blue-500/10 text-blue-600';
    case 'breathing': return 'bg-green-500/10 text-green-600';
    default: return 'bg-gray-500/10 text-gray-600';
  }
}