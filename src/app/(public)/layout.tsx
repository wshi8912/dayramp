import { PropsWithChildren } from 'react';

import { BackgroundGradient } from '@/components/background-gradient';
import { Footer } from '@/components/footer';
import { Logo } from '@/components/logo';
import { Navigation } from '@/app/navigation';

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <>
      <BackgroundGradient force='light' />
      <header className='relative z-50 flex w-full items-center justify-between gap-4 p-4'>
        <Logo />
        <Navigation />
      </header>
      {children}
      <Footer />
    </>
  );
}
