import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | DayKickOff',
  description: 'Privacy policy for DayKickOff - How we collect and use your data',
};

export default function PrivacyPage() {
  return (
    <div className='relative mx-auto flex w-full max-w-[800px] flex-col gap-8 px-4 pt-20 pb-12 text-foreground'>
      <section className='flex flex-col gap-4'>
        <h1 className='text-3xl font-semibold'>Privacy Policy</h1>
        <p className='text-sm text-muted-foreground'>Effective date: September 15, 2025</p>
      </section>

      <section className='flex flex-col gap-6 text-muted-foreground'>
        <div>
          <h2 className='text-xl font-medium mb-3'>Information Collection</h2>
          <p className='text-sm leading-relaxed'>
            We collect minimal data to provide our service. Usage data and preferences are stored locally in your browser.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-medium mb-3'>Data Usage</h2>
          <p className='text-sm leading-relaxed mb-2'>We use collected data to:</p>
          <ul className='list-disc list-inside text-sm space-y-1 ml-2'>
            <li>Maintain and improve the service</li>
            <li>Remember your preferences and settings</li>
            <li>Track your timer usage locally</li>
          </ul>
        </div>

        <div>
          <h2 className='text-xl font-medium mb-3'>Cookies</h2>
          <p className='text-sm leading-relaxed'>
            We use session cookies to operate our service. You can control cookies through your browser settings.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-medium mb-3'>Data Security</h2>
          <p className='text-sm leading-relaxed'>
            Your data is stored locally. We use standard security measures to protect any server-side data.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-medium mb-3'>Third-Party Services</h2>
          <p className='text-sm leading-relaxed'>
            We do not share your personal data with third parties. No external analytics or advertising services are used.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-medium mb-3'>Changes to This Policy</h2>
          <p className='text-sm leading-relaxed'>
            We may update this policy periodically. Changes become effective immediately upon posting.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-medium mb-3'>Contact Us</h2>
          <p className='text-sm leading-relaxed'>
            For questions about this Privacy Policy, contact us at:{' '}
            <a href='mailto:modetimer.app@gmail.com' className='underline hover:text-foreground'>
              modetimer.app@gmail.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}