import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';

import { resetPassword } from '../auth-actions';
import { ForgotPasswordUI } from '../forgot-password-ui';

export default async function ForgotPasswordPage() {
  const session = await getSession();

  if (session) {
    redirect('/');
  }

  return (
    <section className='py-sm m-auto flex max-w-lg items-center'>
      <ForgotPasswordUI resetPassword={resetPassword} />
    </section>
  );
}