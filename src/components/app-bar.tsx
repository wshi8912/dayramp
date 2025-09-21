import { Navigation } from '@/app/navigation';
import { Logo } from '@/components/logo';

export async function AppBar() {
  return (
    <header className='flex items-center justify-between py-8'>
      <Logo />
      <Navigation />
    </header>
  );
} 