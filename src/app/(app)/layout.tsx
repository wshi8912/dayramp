import { PropsWithChildren } from 'react';
import { redirect } from 'next/navigation';

import { Logo } from '@/components/logo';
import { getSession } from '@/features/account/controllers/get-session';

import { Navigation } from '../navigation';

export default async function ProjectsLayout({ children }: PropsWithChildren) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <>
      <div
        className='fixed inset-0 -z-10'
        aria-hidden
        style={{ backgroundColor: 'hsl(var(--background))' }}
      />
      <div className='m-auto flex h-full max-w-[1440px] flex-col px-1'>
        <header className='flex items-center justify-between py-8'>
          <Logo />
          <Navigation />
        </header>
        <main className='relative flex-1'>
          <div className='relative h-full'>{children}</div>
        </main>
        {/* Footer omitted here */}
      </div>
    </>
  );
}
