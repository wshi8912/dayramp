'use client';

import { useEffect, useMemo, useRef, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export function TimezoneForm({
  current,
  timezones,
  action,
}: {
  current: string;
  timezones: string[];
  action: (prevState: any, formData: FormData) => Promise<any>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [tz, setTz] = useState(current);
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const autoSubmitted = useRef(false);
  const { toast } = useToast();

  const initialState = useMemo(() => ({ ok: false }), []);
  const [state, formAction] = useActionState(action as any, initialState);

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

  // Reflect server-updated value and show toast
  useEffect(() => {
    if (state?.ok && state.timezone) {
      setTz(state.timezone);
      toast({ title: 'Saved', description: `Timezone set to ${state.timezone}` });
    } else if (state?.error) {
      toast({ title: 'Error', description: state.error });
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={formAction} className='space-y-4'>
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
        <SubmitButton />
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type='submit' disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </Button>
  );
}
