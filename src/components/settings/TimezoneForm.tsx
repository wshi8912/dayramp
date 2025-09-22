'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export function TimezoneForm({
  current,
  timezones,
  action,
}: {
  current: string;
  timezones: string[];
  action: (formData: FormData) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [tz, setTz] = useState(current);
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const autoSubmitted = useRef(false);

  // Default to Auto (browser) on first visit when timezone is unset/UTC
  useEffect(() => {
    if (autoSubmitted.current) return;
    // Treat 'UTC' as unset default; if user explicitly chose UTC, they can reselect it later.
    if ((current === 'UTC' || !current) && detected && detected !== 'UTC') {
      setTz(detected);
      // Auto-submit to persist the detected TZ
      // Delay to ensure state is applied before submission
      setTimeout(() => {
        if (formRef.current) {
          autoSubmitted.current = true;
          formRef.current.requestSubmit();
        }
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, detected]);

  return (
    <form ref={formRef} action={action} className='space-y-4'>
      <div className='text-sm text-muted-foreground'>
        Auto (browser): <span className='font-mono'>{detected}</span>
      </div>

      <div className='flex flex-col gap-2'>
        <label className='text-sm'>Timezone</label>
        <select
          name='timezone'
          value={tz}
          onChange={(e) => setTz(e.target.value)}
          className='rounded-md border bg-background p-2'
        >
          <option value={detected}>Auto (Browser) — {detected}</option>
          {timezones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>

      <div className='flex items-center gap-2'>
        <Button type='submit'>Save</Button>
        <Button
          type='button'
          variant='outline'
          onClick={() => setTz(detected)}
        >
          Use detected
        </Button>
      </div>
    </form>
  );
}
