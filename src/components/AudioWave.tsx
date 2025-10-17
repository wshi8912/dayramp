'use client';

import { memo } from 'react';

import { cn } from '@/utils/cn';

type AudioWaveProps = {
  levels: number[];
  isActive?: boolean;
  className?: string;
};

const MIN_HEIGHT_PERCENT = 25;
const MAX_HEIGHT_PERCENT = 85;

export const AudioWave = memo(function AudioWave({ levels, isActive = false, className }: AudioWaveProps) {
  if (!levels?.length) {
    return (
      <div
        aria-hidden='true'
        className={cn('pointer-events-none flex h-3 w-full max-w-[100px] items-end justify-center gap-[2px]', className)}
      />
    );
  }

  const mirrored = [...levels, ...levels.slice().reverse()];

  return (
    <div
      aria-hidden='true'
      className={cn('pointer-events-none flex h-3 w-full max-w-[100px] items-end justify-center gap-[2px]', className)}
    >
      {mirrored.map((level, idx) => {
        const clamped = Math.min(Math.max(level, 0), 1);
        const height = MIN_HEIGHT_PERCENT + (MAX_HEIGHT_PERCENT - MIN_HEIGHT_PERCENT) * clamped;
        const opacity = isActive ? 0.45 + clamped * 0.35 : 0.25;
        return (
          <div
            key={`wave-bar-${idx}`}
            className={cn(
              'w-[2px] rounded-full bg-primary/80 transition-[height,opacity] duration-150 ease-out',
              !isActive && 'opacity-30'
            )}
            style={{ height: `${height}%`, opacity }}
          />
        );
      })}
    </div>
  );
});
