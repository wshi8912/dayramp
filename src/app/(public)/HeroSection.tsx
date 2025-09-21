import Link from 'next/link';

import { Container } from '@/components/container';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className='relative overflow-hidden py-4 lg:py-8'>
      {/* Beautiful light blue-green gradient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Very light base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/15 via-transparent to-teal-50/15"></div>

        {/* First bubble layer - blue-green tones */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-gradient-to-r from-cyan-200/8 to-teal-100/8 blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-gradient-to-r from-sky-200/10 to-emerald-100/10 blur-3xl"></div>

        {/* Second bubble layer - more blue-green tones */}
        <div className="absolute top-2/3 -right-12 h-80 w-80 rounded-full bg-gradient-to-l from-blue-100/12 to-teal-200/12 blur-3xl"></div>
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-gradient-to-t from-emerald-100/10 to-sky-200/10 blur-3xl"></div>

        {/* Floating particles effect - very subtle */}
        <div className="absolute top-1/4 left-1/2 h-1 w-1 rounded-full bg-cyan-100/20 blur-sm"></div>
        <div className="absolute top-1/3 left-1/4 h-2 w-2 rounded-full bg-blue-100/20 blur-sm"></div>
        <div className="absolute top-2/3 right-1/3 h-1.5 w-1.5 rounded-full bg-teal-100/20 blur-sm"></div>
        <div className="absolute bottom-1/4 right-1/4 h-1 w-1 rounded-full bg-green-100/20 blur-sm"></div>

        {/* Extremely subtle mesh pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#e6fffa15_1px,transparent_1px)] bg-[length:20px_20px] opacity-20"></div>
      </div>

      <Container className='relative z-10 mx-auto flex flex-col items-center'>
        <div className='w-fit rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-4 py-1 mb-6'>
          <span className='font-alt text-sm font-semibold text-white'>
            AI-Powered Asset Extraction
          </span>
        </div>

        <div className='text-center max-w-4xl mx-auto'>
          <h1 className='text-neutral-900 text-4xl md:text-5xl lg:text-6xl font-bold font-alt bg-clip-text drop-shadow-lg mb-6'>Extract insights from any content—videos, images, documents & more</h1>
          <p className='text-lg text-neutral-800 mb-8 max-w-3xl mx-auto'>
            Transform your media files, PDFs, documents, and digital assets into structured data and actionable insights. Powered by AI to understand what matters most in your content.
          </p>

          <Button asChild size='lg' className='group'>
            <Link href='/signup' className='flex items-center gap-2'>
              Start building for free
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className="transition-transform group-hover:translate-x-1">
                <path d="M2.5 10C2.5 10.1657 2.56585 10.3247 2.68306 10.4419C2.80027 10.5591 2.95924 10.625 3.125 10.625H15.3664L10.8078 15.1828C10.6905 15.3001 10.6246 15.4592 10.6246 15.625C10.6246 15.7909 10.6905 15.9499 10.8078 16.0672C10.9251 16.1845 11.0841 16.2504 11.25 16.2504C11.4159 16.2504 11.5749 16.1845 11.6922 16.0672L17.3172 10.4422C17.3752 10.3841 17.4213 10.3152 17.4527 10.2393C17.4842 10.1634 17.5004 10.0821 17.5004 10C17.5004 9.91786 17.4842 9.83654 17.4527 9.76066C17.4213 9.68479 17.3752 9.61586 17.3172 9.55781L11.6922 3.93281C11.5749 3.81555 11.4159 3.74966 11.25 3.74966C11.0841 3.74966 10.9251 3.81555 10.8078 3.93281C10.6905 4.05008 10.6246 4.20915 10.6246 4.375C10.6246 4.54085 10.6905 4.69992 10.8078 4.81719L15.3664 9.375H3.125C2.95924 9.375 2.80027 9.44085 2.68306 9.55806C2.56585 9.67527 2.5 9.83424 2.5 10Z" fill="currentColor" />
              </svg>
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
} 