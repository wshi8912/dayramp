import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions | DayRamp',
  description: 'Terms and conditions for using DayRamp',
};

export default function TermsPage() {
  return (
    <div className='relative mx-auto flex w-full max-w-[800px] flex-col gap-8 px-4 pt-20 pb-12 text-foreground'>
      <section className='flex flex-col gap-4'>
        <h1 className='text-3xl font-semibold'>Terms and Conditions</h1>
        <p className='text-sm text-muted-foreground'>Last Updated: September 15, 2025</p>
      </section>

      <section className='flex flex-col gap-6 text-muted-foreground'>
        <div>
          <h2 className='text-xl font-medium mb-3'>Acceptance of Terms</h2>
          <p className='text-sm leading-relaxed'>
            By using DayRamp, you agree to these Terms and Conditions.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-medium mb-3'>Changes to Terms</h2>
          <p className='text-sm leading-relaxed'>
            We may modify these terms at any time. Changes are effective immediately upon posting.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-medium mb-3'>Use of Service</h2>
          <ul className='list-disc list-inside text-sm space-y-1 ml-2'>
            <li>Use DayRamp for personal, non-commercial purposes only</li>
            <li>Do not reverse-engineer or modify the service</li>
            <li>Do not use for any illegal activities</li>
          </ul>
        </div>

        <div>
          <h2 className='text-xl font-medium mb-3'>Health Disclaimer</h2>
          <p className='text-sm leading-relaxed'>
            Breathing and exercise timers may affect your health. Not a substitute for medical advice. Consult a physician if you have health conditions.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-medium mb-3'>Intellectual Property</h2>
          <p className='text-sm leading-relaxed'>
            Pomodoro® is a registered trademark of Francesco Cirillo. This site is not affiliated.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-medium mb-3'>Limitation of Liability</h2>
          <p className='text-sm leading-relaxed'>
            We are not liable for any damages resulting from your use of the service, including data loss or health issues.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-medium mb-3'>Contact Us</h2>
          <p className='text-sm leading-relaxed'>
            For questions about these Terms, contact us at:{' '}
            <a href='mailto:modetimer.app@gmail.com' className='underline hover:text-foreground'>
              modetimer.app@gmail.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}