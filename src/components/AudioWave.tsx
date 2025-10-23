'use client';

import { CSSProperties, memo } from 'react';

import { cn } from '@/utils/cn';

type AudioWaveProps = {
  levels: number[];
  isActive?: boolean;
  className?: string;
};

export const AudioWave = memo(function AudioWave({
  levels,
  isActive = false,
  className,
}: AudioWaveProps) {
  // Calculate overall audio level from the levels array
  const averageLevel = levels.length > 0
    ? levels.reduce((sum, level) => sum + level, 0) / levels.length
    : 0;

  // Clamp the level between 0 and 1
  const clampedLevel = Math.min(Math.max(averageLevel, 0), 1);

  // Number of concentric circles to display
  const circleCount = 3;

  // Generate circles based on audio level
  const circles = Array.from({ length: circleCount }, (_, index) => {
    const baseDelay = index * 100; // Stagger animation timing
    const baseScale = 1 + index * 0.075; // Each circle starts slightly larger

    // When active, scale increases based on audio level
    const scale = isActive
      ? baseScale + clampedLevel * (0.2 + index * 0.05)
      : baseScale * 0.6;

    // Opacity increases with audio level
    const opacity = isActive
      ? 0.08 + clampedLevel * (0.15 + index * 0.05)
      : 0.03;

    return {
      scale,
      opacity,
      delay: baseDelay,
    };
  });

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 flex items-center justify-center', className)}
      aria-hidden='true'
    >
      {circles.map((circle, idx) => (
        <div
          key={`ripple-${idx}`}
          className='absolute rounded-full bg-primary transition-all duration-300 ease-out'
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${circle.scale})`,
            opacity: circle.opacity,
            transitionDelay: `${circle.delay}ms`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
});
