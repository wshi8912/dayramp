"use client";

import { usePathname } from 'next/navigation';

type Variant = 'sky' | 'orange' | 'green' | 'star' | 'light';

const routeToVariant = (pathname?: string): Variant => {
  if (!pathname) return 'light';
  if (pathname.includes('pomodoro') || pathname.includes('focus')) return 'green';
  if (pathname.includes('interval')) return 'orange';
  return 'light';
};

export function BackgroundGradient({ force }: { force?: Variant }) {
  const pathname = usePathname();
  const variant: Variant = force ? force : routeToVariant(pathname);

  if (variant === 'star') {
    return (
      <div className="fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-zinc-950 to-black" />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'radial-gradient(white 0.7px, transparent 0.7px), radial-gradient(white 0.5px, transparent 0.5px)',
            backgroundSize: '12px 12px, 16px 16px',
            backgroundPosition: '0 0, 6px 8px',
          }}
        />
      </div>
    );
  }

  const gradients: Record<Exclude<Variant, 'star'>, string> = {
    light: 'from-[#f6f3eb] via-[#bdcdd6]/55 to-[#f6f3eb]',
    orange: 'from-[#f6f3eb] via-[#6096b4]/35 to-[#f6f3eb]',
    green: 'from-[#f6f3eb] via-[#93bfcf]/45 to-[#f6f3eb]',
    sky: 'from-[#f6f3eb] via-[#bdcdd6]/45 to-[#93bfcf]/40',
  };

  const gradientClasses = gradients[variant] ?? gradients.light;

  return (
    <div className="fixed inset-0 -z-10" aria-hidden>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses}`} />
    </div>
  );
}
