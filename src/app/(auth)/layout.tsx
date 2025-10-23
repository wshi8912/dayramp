import { PropsWithChildren } from 'react';

import { Footer } from '@/components/footer';
import { Logo } from '@/components/logo';
import { Navigation } from '@/app/navigation';

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <>
      <header className='relative z-50 flex w-full items-center justify-between gap-4 p-4'>
        <Logo />
        <Navigation />
      </header>
      {children}
      <Footer />
    </>
  );
}
