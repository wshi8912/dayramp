import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';

import { signInWithPassword, signUpWithPassword } from '../auth-actions';
import { AuthUI } from '../auth-ui';

export default async function SignUp() {
  const session = await getSession();

  if (session) {
    redirect('/core');
  }

  return (
    <section className='py-sm m-auto flex max-w-lg items-center'>
      <AuthUI 
        mode='signup' 
        signInWithPassword={signInWithPassword}
        signUpWithPassword={signUpWithPassword}
      />
    </section>
  );
}
