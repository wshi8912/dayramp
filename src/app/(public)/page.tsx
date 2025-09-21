"use client";
import { Suspense } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { InstallAppButton } from '@/components/install-app-button';
import { LoginSuccessMessage } from '@/components/login-success-message';

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <LoginSuccessMessage />
      </Suspense>
      <div className='relative mx-auto flex w-full max-w-[1000px] flex-col gap-10 px-4 pt-20 lg:gap-14 text-foreground'>
        <section className='flex flex-col items-center gap-3 text-center'>
          <h1 className='text-3xl font-semibold'>DayKickOff</h1>
          <p className='max-w-xl text-sm text-muted-foreground'>Start your day with focus and productivity.</p>
        </section>

        <section className='flex flex-col items-center gap-4'>
          <Button variant='default' asChild>
            <Link href='/login'>Get Started</Link>
          </Button>
        </section>

        <section className='flex justify-center'>
          <InstallAppButton />
        </section>
      </div>
    </>
  );
}
