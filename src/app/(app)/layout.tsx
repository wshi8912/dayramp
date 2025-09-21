import { PropsWithChildren } from 'react';
import { redirect } from 'next/navigation';

import { BackgroundGradient } from '@/components/background-gradient';
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
      <BackgroundGradient force='light' />
      <div className='m-auto flex h-full max-w-[1440px] flex-col px-4'>
        <header className='flex items-center justify-between py-8'>
          <Logo />
          <Navigation />
        </header>
        <main className='relative flex-1'>
          <div className='relative h-full'>{children}</div>
        </main>
        {/* フッターはここで省略 */}
      </div>
    </>
  );
}