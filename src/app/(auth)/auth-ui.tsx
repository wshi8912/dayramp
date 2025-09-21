'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { ActionResponse } from '@/types/action-response';

const titleMap = {
  login: 'Log in',
  signup: 'Sign up',
} as const;

export function AuthUI({
  mode,
  signInWithPassword,
  signUpWithPassword,
}: {
  mode: 'login' | 'signup';
  signInWithPassword: (email: string, password: string) => Promise<ActionResponse>;
  signUpWithPassword: (email: string, password: string) => Promise<ActionResponse>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    
    const form = event.target as HTMLFormElement;
    const email = form['email'].value;
    const password = form['password'].value;
    
    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setPending(false);
        return;
      }
      
      const result = await signUpWithPassword(email, password);
      
      if (result?.error) {
        if (result.error.message?.includes('already registered')) {
          setError('This email is already registered.');
        } else {
          setError('Failed to sign up. Please try again.');
        }
        setPending(false);
      } else if (result?.data?.requiresEmailConfirmation) {
        setUserEmail(email);
        setEmailSent(true);
        setPending(false);
      } else {
        router.push('/?welcome=true');
      }
    } else {
      const result = await signInWithPassword(email, password);
      
      if (result?.error) {
        if (result.error.message?.includes('Invalid login credentials')) {
          setError('Invalid email or password.');
        } else if (result.error.message?.includes('Email not confirmed')) {
          setError('Please confirm your email before signing in.');
        } else {
          setError('Failed to log in. Please try again.');
        }
        setPending(false);
      } else {
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });
        router.push('/core');
      }
    }
  }

  if (emailSent && mode === 'signup') {
    return (
      <section className='mx-auto mt-16 w-full max-w-md px-4'>
        <Card className='text-center rounded-2xl border bg-card text-foreground backdrop-blur'>
          <CardHeader>
            <Image src='/icon-72x72.png' width={50} height={50} alt='DayKickOff' className='m-auto' />
            <CardTitle className='text-lg text-foreground'>Check your email</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-3'>
            <div className='rounded-md border bg-muted p-6 text-left'>
              <div className='flex flex-col items-center text-center gap-3'>
                <div className='rounded-full bg-accent p-3'>
                  <MailCheck className='h-6 w-6 text-primary' />
                </div>
                <h3 className='text-base font-medium text-foreground'>Confirmation email sent</h3>
                <p className='text-sm text-muted-foreground'>
                  We sent a confirmation email to <span className='font-medium text-foreground'>{userEmail}</span>.
                  Click the link in the email to activate your account.
                </p>
                <p className='text-xs text-muted-foreground'>
                  Didn't receive it? Check your spam folder or contact support.
                </p>
                <Link href='/login'>
                  <Button variant='ghost' className='text-muted-foreground hover:bg-accent mt-2'>
                    Go to login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className='mx-auto mt-16 w-full max-w-md px-4'>
      <Card className='text-center rounded-2xl border bg-card text-foreground backdrop-blur'>
        <CardHeader>
          <Image src='/icon-72x72.png' width={50} height={50} alt='ModeTimer' className='m-auto' />
          <CardTitle className='text-lg text-foreground'>{titleMap[mode]}</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-3'>
          <form onSubmit={handleSubmit} className='rounded-md border bg-muted p-4 text-left'>
            <div className='space-y-4'>
              <div>
                <label htmlFor='email' className='mb-2 block text-sm text-foreground'>Email</label>
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
              </div>

              <div>
                <label htmlFor='password' className='mb-2 block text-sm text-foreground'>Password</label>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    name='password'
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                    aria-label='Password'
                    className='border-input bg-input text-foreground placeholder:text-muted-foreground pr-10'
                    required
                    minLength={mode === 'signup' ? 6 : undefined}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                  >
                    {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                  </button>
                </div>
              </div>
            </div>
            
            {error && (
              <p className='mt-3 text-sm text-red-400'>{error}</p>
            )}
            
            <div className='mt-6'>
              <Button variant='default' className='w-full' type='submit' disabled={pending}>
                {pending ? 'Processing...' : titleMap[mode]}
              </Button>
            </div>

            {mode === 'login' && (
              <div className='mt-3 text-center'>
                <Link href='/forgot-password' className='text-sm text-muted-foreground hover:text-foreground'>
                  Forgot your password?
                </Link>
              </div>
            )}
          </form>

          <div className='text-sm text-muted-foreground'>
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <Link href='/signup' className='underline text-foreground hover:text-muted-foreground'>
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href='/login' className='underline text-foreground hover:text-muted-foreground'>
                  Log in
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
