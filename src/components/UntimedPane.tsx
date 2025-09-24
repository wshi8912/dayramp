'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Circle } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  note?: string;
  status?: string;
  startAt?: string;
  dueAt?: string;
};

// Circular progress component for deadline tasks
function CircularProgress({ progress, color, size = 16 }: { progress: number; color: string; size?: number }) {
  const radius = size / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-300 ${color}`}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function UntimedPane({ tasks, onSelect }: { tasks: Task[]; onSelect?: (t: Task) => void }) {
  const formatTime = (isoString?: string) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const calculateProgress = (dueAt: string) => {
    const now = new Date();
    const due = new Date(dueAt);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);

    const totalMs = endOfDay.getTime() - today.getTime();
    const elapsedMs = now.getTime() - today.getTime();
    const progress = Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100));

    // Color based on remaining time
    const remainingHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    let color = 'text-green-500';
    if (remainingHours < 2) color = 'text-red-500';
    else if (remainingHours < 4) color = 'text-yellow-500';

    return { progress, color };
  };

  const getTaskTypeInfo = (task: Task) => {
    if (task.dueAt && !task.startAt) {
      return {
        icon: Clock,
        color: 'border-orange-200 bg-orange-50/30',
        type: 'deadline'
      };
    } else if (task.startAt && !task.dueAt) {
      return {
        icon: Play,
        color: 'border-blue-200 bg-blue-50/30',
        type: 'start-only'
      };
    } else {
      return {
        icon: Circle,
        color: 'border-gray-200 bg-gray-50/30',
        type: 'unscheduled'
      };
    }
  };

  return (
    <div className='rounded-lg border bg-card p-3 text-card-foreground'>
      {tasks.length === 0 ? (
        <div className='text-sm text-muted-foreground'>No tasks yet.</div>
      ) : (
        <div className='space-y-1.5'>
          {tasks.map((t) => {
            const startTime = formatTime(t.startAt);
            const dueTime = formatTime(t.dueAt);
            const taskTypeInfo = getTaskTypeInfo(t);
            const IconComponent = taskTypeInfo.icon;
            const progress = t.dueAt ? calculateProgress(t.dueAt) : null;

            return (
              <Card
                key={t.id}
                role='button'
                tabIndex={0}
                onClick={() => onSelect?.(t)}
                className={`cursor-pointer p-3 shadow-sm transition-colors hover:bg-accent/30 ${taskTypeInfo.color}`}
              >
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2 truncate text-sm font-medium leading-tight'>
                    <IconComponent className={`h-4 w-4 shrink-0 ${
                      taskTypeInfo.type === 'deadline' ? 'text-orange-500' :
                      taskTypeInfo.type === 'start-only' ? 'text-blue-500' :
                      'text-gray-400'
                    }`} />
                    <span className='truncate'>{t.title}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    {progress && taskTypeInfo.type === 'deadline' && (
                      <CircularProgress
                        progress={progress.progress}
                        color={progress.color}
                        size={16}
                      />
                    )}
                    {startTime && !t.dueAt && (
                      <Badge variant='outline' className='shrink-0 text-[10px]'>
                        {startTime}開始
                      </Badge>
                    )}
                    {dueTime && (
                      <Badge variant='outline' className='shrink-0 text-[10px] text-orange-600 border-orange-300'>
                        {dueTime}締切
                      </Badge>
                    )}
                    {t.status && (
                      <Badge variant='secondary' className='shrink-0 text-[10px] uppercase'>
                        {t.status}
                      </Badge>
                    )}
                  </div>
                </div>
                {t.note && <div className='mt-1 truncate text-xs text-gray-600'>{t.note}</div>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
