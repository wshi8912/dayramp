import { redirect } from 'next/navigation';

import { updatePassword } from '../auth-actions';
import { ResetPasswordUI } from '../reset-password-ui';

export default async function ResetPasswordPage() {
  return (
    <section className='py-sm m-auto flex max-w-lg items-center'>
      <ResetPasswordUI updatePassword={updatePassword} />
    </section>
  );
}