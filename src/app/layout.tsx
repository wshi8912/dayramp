import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Montserrat, Montserrat_Alternates } from 'next/font/google';

import { GoogleAnalytics } from '@/components/google-analytics';
import { SWRegister } from '@/components/sw-register';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/utils/cn';
import { Analytics } from '@vercel/analytics/react';

import '@/styles/globals.css';

export const dynamic = 'force-dynamic';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

const montserratAlternates = Montserrat_Alternates({
  variable: '--font-montserrat-alternates',
  weight: ['500', '600', '700'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DayRamp',
  description: 'Start your day with focus and productivity',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={cn('font-sans antialiased', montserrat.variable, montserratAlternates.variable)}>

        <div className='m-auto flex h-full max-w-[1440px] flex-col px-4'>
          <main className='relative flex-1'>
            <div className='relative h-full'>{children}</div>
          </main>
        </div>
        <GoogleAnalytics />
        <Analytics />
        <SWRegister />
        <Toaster />
      </body>
    </html >
  );
}
