'use client';

import { CSSProperties, memo } from 'react';

import { cn } from '@/utils/cn';

type AudioWaveProps = {
  levels: number[];
  isActive?: boolean;
  className?: string;
  heightPx?: number;
  maxWidthPx?: number;
  barGapPx?: number;
  barWidthPx?: number;
};

const MIN_HEIGHT_PERCENT = 35;
const MAX_HEIGHT_PERCENT = 80;
const DEFAULT_HEIGHT_PX = 10;
const DEFAULT_MAX_WIDTH_PX = 80;
const DEFAULT_BAR_GAP_PX = 1;
const DEFAULT_BAR_WIDTH_PX = 1;

export const AudioWave = memo(function AudioWave({
  levels,
  isActive = false,
  className,
  heightPx = DEFAULT_HEIGHT_PX,
  maxWidthPx,
  barGapPx = DEFAULT_BAR_GAP_PX,
  barWidthPx = DEFAULT_BAR_WIDTH_PX,
}: AudioWaveProps) {
  const totalBars = levels.length ? levels.length * 2 : 0;
  const computedWidth = totalBars > 0 ? totalBars * barWidthPx + Math.max(totalBars - 1, 0) * barGapPx : 0;
  const containerStyle: CSSProperties = {
    height: heightPx,
    maxWidth: maxWidthPx ?? (computedWidth > 0 ? computedWidth : DEFAULT_MAX_WIDTH_PX),
    width: '100%',
    columnGap: barGapPx,
  };

  if (!levels?.length) {
    return (
      <div
        aria-hidden='true'
        className={cn('pointer-events-none flex w-full items-end justify-center', className)}
        style={containerStyle}
      />
    );
  }

  const mirrored = [...levels, ...levels.slice().reverse()];

  return (
    <div
      aria-hidden='true'
      className={cn('pointer-events-none flex w-full items-end justify-center', className)}
      style={containerStyle}
    >
      {mirrored.map((level, idx) => {
        const clamped = Math.min(Math.max(level, 0), 1);
        const height = MIN_HEIGHT_PERCENT + (MAX_HEIGHT_PERCENT - MIN_HEIGHT_PERCENT) * clamped;
        const opacity = isActive ? 0.5 + clamped * 0.3 : 0.2;
        return (
          <div
            key={`wave-bar-${idx}`}
            className={cn('rounded-full bg-primary/70 transition-[height,opacity] duration-150 ease-out', !isActive && 'opacity-30')}
            style={{ height: `${height}%`, opacity, width: barWidthPx }}
          />
        );
      })}
    </div>
  );
});
