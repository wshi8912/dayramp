import * as React from 'react';
import { cn } from '@/utils/cn';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  compact?: boolean;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, min = 1, max = 999, step = 1, suffix, compact = false, disabled, ...props }, ref) => {
    const handleIncrement = () => {
      const newValue = Math.min(max, value + step);
      onChange(newValue);
    };

    const handleDecrement = () => {
      const newValue = Math.max(min, value - step);
      onChange(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/[^0-9]/g, '');
      if (inputValue === '') {
        onChange(min);
        return;
      }
      const numValue = parseInt(inputValue, 10);
      if (!isNaN(numValue)) {
        const clampedValue = Math.max(min, Math.min(max, numValue));
        onChange(clampedValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDecrement();
      }
    };

    return (
      <div className={cn('relative flex items-center', className)}>
        <input
          ref={ref}
          type='text'
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            'flex w-full rounded-md border border-white/20 bg-white/10 text-white text-sm',
            'transition-colors placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40',
            'disabled:cursor-not-allowed disabled:opacity-50',
            compact ? 'h-8 px-2 pr-8' : 'h-10 px-3 pr-12',
            suffix && (compact ? 'pr-10' : 'pr-16')
          )}
          {...props}
        />
        {suffix && (
          <span className={cn(
            'absolute text-white/60 pointer-events-none',
            compact ? 'left-2 ml-6 text-xs' : 'left-3 ml-8 text-sm'
          )}>
            {suffix}
          </span>
        )}
        <div className={cn('absolute flex flex-col', compact ? 'right-0.5' : 'right-1')}>
          <button
            type='button'
            onClick={handleIncrement}
            disabled={disabled || value >= max}
            className={cn(
              'flex items-center justify-center rounded-t border border-white/20 bg-white/10',
              'hover:bg-white/20 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              compact ? 'h-[15px] w-6' : 'h-4 w-8'
            )}
            aria-label='Increment'
          >
            <ChevronUp className={cn('text-white', compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
          </button>
          <button
            type='button'
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            className={cn(
              'flex items-center justify-center rounded-b border border-t-0 border-white/20 bg-white/10',
              'hover:bg-white/20 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              compact ? 'h-[15px] w-6' : 'h-4 w-8'
            )}
            aria-label='Decrement'
          >
            <ChevronDown className={cn('text-white', compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
          </button>
        </div>
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

export { NumberInput };