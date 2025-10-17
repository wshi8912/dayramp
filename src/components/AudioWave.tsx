'use client';

import { memo } from 'react';

import { cn } from '@/utils/cn';

type AudioWaveProps = {
  levels: number[];
  isActive?: boolean;
  className?: string;
};

const MIN_HEIGHT_PERCENT = 12;
const MAX_HEIGHT_PERCENT = 100;

export const AudioWave = memo(function AudioWave({ levels, isActive = false, className }: AudioWaveProps) {
  if (!levels?.length) {
    return (
      <div
        aria-hidden='true'
        className={cn('pointer-events-none flex h-12 w-full max-w-xs items-end justify-center gap-[3px]', className)}
      />
    );
  }

  const mirrored = [...levels, ...levels.slice().reverse()];

  return (
    <div
      aria-hidden='true'
      className={cn('pointer-events-none flex h-12 w-full max-w-xs items-end justify-center gap-[3px]', className)}
    >
      {mirrored.map((level, idx) => {
        const clamped = Math.min(Math.max(level, 0), 1);
        const height = MIN_HEIGHT_PERCENT + (MAX_HEIGHT_PERCENT - MIN_HEIGHT_PERCENT) * clamped;
        const opacity = isActive ? 0.3 + clamped * 0.7 : 0.25;
        return (
          <div
            key={`wave-bar-${idx}`}
            className={cn(
              'w-[3px] rounded-full bg-primary transition-[height,opacity] duration-100 ease-out will-change-transform',
              !isActive && 'opacity-30'
            )}
            style={{ height: `${height}%`, opacity }}
          />
        );
      })}
    </div>
  );
});
