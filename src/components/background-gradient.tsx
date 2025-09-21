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

  if (variant === 'light') {
    return (
      <div className="fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100" />
      </div>
    );
  }

  const cls =
    variant === 'orange'
      ? 'from-amber-800 via-orange-900 to-orange-950'
      : variant === 'green'
      ? 'from-emerald-800 via-emerald-900 to-emerald-950'
      : 'from-sky-800 via-sky-900 to-sky-950';

  return <div className={`fixed inset-0 -z-10 bg-gradient-to-br ${cls}`} aria-hidden />;
}
