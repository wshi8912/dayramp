import Link from 'next/link';

export function Footer() {
  return (
    <footer className='mt-12 border-t border-border'>
      <div className='mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between sm:gap-4'>
        <nav className='flex items-center gap-3 text-xs'>
          <span className='select-none text-muted-foreground' aria-hidden>
            •
          </span>
          <Link
            className='px-0 text-muted-foreground transition-colors hover:underline focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring'
            href='/privacy'
          >
            Privacy
          </Link>
          <span className='select-none text-muted-foreground' aria-hidden>
            •
          </span>
          <Link
            className='px-0 text-muted-foreground transition-colors hover:underline focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring'
            href='/terms'
          >
            Terms
          </Link>
        </nav>
        <div className='text-center text-xs text-muted-foreground sm:text-right mt-4'>
          © {new Date().getFullYear()} DayKickOff
        </div>
      </div>
    </footer>
  );
}
