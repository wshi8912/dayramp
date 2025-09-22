'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ActionResponse } from '@/types/action-response';

export function ForgotPasswordUI({
  resetPassword,
}: {
  resetPassword: (email: string) => Promise<ActionResponse>;
}) {
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    
    const form = event.target as HTMLFormElement;
    const email = form['email'].value;
    
    const result = await resetPassword(email);
    
    if (result?.error) {
      setError('Email address not found.');
      setPending(false);
    } else {
      form.reset();
      setPending(false);
      setSentTo(email);
    }
  }

  return (
    <section className='mx-auto mt-16 w-full max-w-md px-4'>
      <Card className='text-center rounded-2xl border bg-card text-foreground backdrop-blur'>
        <CardHeader>
          <Image src='/icon-72x72.png' width={50} height={50} alt='DayRamp' className='m-auto' />
          <CardTitle className='text-lg text-foreground'>Reset Password</CardTitle>
          <CardDescription className='text-muted-foreground'>
            We'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-3'>
          {sentTo ? (
            <div className='rounded-md border bg-muted p-6 text-left'>
              <div className='flex flex-col items-center text-center gap-3'>
                <div className='rounded-full bg-accent p-3'>
                  <MailCheck className='h-6 w-6 text-primary' />
                </div>
                <h3 className='text-base font-medium text-foreground'>Check your email</h3>
                <p className='text-sm text-muted-foreground'>
                  We sent a password reset link to <span className='font-medium text-foreground'>{sentTo}</span>.
                </p>
                <p className='text-xs text-muted-foreground'>Didn't receive it? Check your spam folder.</p>
                <Link href='/login'>
                  <Button
                    variant='ghost'
                    className='text-muted-foreground hover:bg-accent mt-2'
                  >
                    <ArrowLeft className='mr-2 h-4 w-4' />
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className='rounded-md border bg-muted p-4 text-left'>
              <label htmlFor='email' className='mb-2 block text-sm text-foreground'>Email Address</label>
              <Input
                id='email'
                type='email'
                name='email'
                placeholder='you@example.com'
                aria-label='Email address'
                className='border-input bg-input text-foreground placeholder:text-muted-foreground'
                autoFocus
                required
              />
              {error && (
                <p className='mt-2 text-sm text-red-400'>{error}</p>
              )}
              <div className='mt-4 flex justify-between items-center'>
                <Link href='/login'>
                  <Button variant='ghost' className='text-muted-foreground hover:bg-accent' type='button'>
                    <ArrowLeft className='mr-2 h-4 w-4' />
                    Back
                  </Button>
                </Link>
                <Button variant='default' className='bg-white text-black hover:bg-white/90' type='submit' disabled={pending}>
                  {pending ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}