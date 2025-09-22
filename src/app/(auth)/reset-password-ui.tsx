'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

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

export function ResetPasswordUI({
  updatePassword,
}: {
  updatePassword: (newPassword: string) => Promise<ActionResponse>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    
    const form = event.target as HTMLFormElement;
    const password = form['password'].value;
    const confirmPassword = form['confirmPassword'].value;
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setPending(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setPending(false);
      return;
    }
    
    const result = await updatePassword(password);
    
    if (result?.error) {
      setError('Failed to update password. Please try again.');
      setPending(false);
    } else {
      setSuccess(true);
      setPending(false);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  }

  return (
    <section className='mx-auto mt-16 w-full max-w-md px-4'>
      <Card className='text-center rounded-2xl border bg-card text-foreground backdrop-blur'>
        <CardHeader>
          <Image src='/icon-72x72.png' width={50} height={50} alt='DayRamp' className='m-auto' />
          <CardTitle className='text-lg text-foreground'>Set New Password</CardTitle>
          <CardDescription className='text-muted-foreground'>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-3'>
          {success ? (
            <div className='rounded-md border bg-muted p-6 text-left'>
              <div className='flex flex-col items-center text-center gap-3'>
                <div className='rounded-full bg-green-500/20 p-3'>
                  <CheckCircle className='h-6 w-6 text-green-400' />
                </div>
                <h3 className='text-base font-medium text-foreground'>Password Updated</h3>
                <p className='text-sm text-muted-foreground'>
                  Redirecting to login page...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className='rounded-md border bg-muted p-4 text-left'>
              <div className='space-y-4'>
                <div>
                  <label htmlFor='password' className='mb-2 block text-sm text-foreground'>New Password</label>
                  <div className='relative'>
                    <Input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      name='password'
                      placeholder='At least 6 characters'
                      aria-label='New password'
                      className='border-input bg-input text-foreground placeholder:text-muted-foreground pr-10'
                      required
                      minLength={6}
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

                <div>
                  <label htmlFor='confirmPassword' className='mb-2 block text-sm text-foreground'>Confirm Password</label>
                  <div className='relative'>
                    <Input
                      id='confirmPassword'
                      type={showConfirmPassword ? 'text' : 'password'}
                      name='confirmPassword'
                      placeholder='Re-enter your password'
                      aria-label='Confirm password'
                      className='border-input bg-input text-foreground placeholder:text-muted-foreground pr-10'
                      required
                      minLength={6}
                    />
                    <button
                      type='button'
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className='absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                    >
                      {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <p className='mt-2 text-sm text-red-400'>{error}</p>
              )}

              <div className='mt-6 flex justify-end'>
                <Button variant='default' className='w-full' type='submit' disabled={pending}>
                  {pending ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}