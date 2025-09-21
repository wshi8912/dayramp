import { redirect } from 'next/navigation';
import { getSession } from '@/features/account/controllers/get-session';

export default async function CoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <>{children}</>;
}