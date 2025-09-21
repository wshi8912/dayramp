import { cn } from '@/utils/cn';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ className, size = 'md', ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent',
        {
          'h-6 w-6': size === 'sm',
          'h-12 w-12': size === 'md',
          'h-24 w-24': size === 'lg',
        },
        'text-sky-500',
        className
      )}
      {...props}
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
