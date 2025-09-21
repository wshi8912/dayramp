'use client';

import { useState } from 'react';
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
  const [tz, setTz] = useState(current);
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  return (
    <form action={action} className='space-y-4'>
      <div className='text-sm text-muted-foreground'>
        Browser detected: <span className='font-mono'>{detected}</span>
      </div>

      <div className='flex flex-col gap-2'>
        <label className='text-sm'>Timezone</label>
        <select
          name='timezone'
          value={tz}
          onChange={(e) => setTz(e.target.value)}
          className='rounded-md border bg-background p-2'
        >
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
