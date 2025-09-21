'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IoPersonCircleOutline } from 'react-icons/io5';

import {
  DropdownMenu,
  DropdownMenuArrow,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
// Using server-side sign out via API to clear HttpOnly cookies

export function AccountMenu() {
  const router = useRouter();
  const { toast } = useToast();

  async function handleLogoutClick(e?: React.MouseEvent) {
    console.log('Logout clicked!');
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        toast({
          title: 'Logged out successfully',
          description: 'You have been logged out of your account.',
        });
        router.push('/login');
        router.refresh();
      } else {
        const body = await res.json().catch(() => null);
        console.error('Logout error:', body);
        toast({
          title: 'Logout failed',
          description: 'There was an error logging out. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Unexpected logout error:', err);
      toast({
        title: 'Logout failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='rounded-full'>
        <IoPersonCircleOutline size={24} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='me-4'>
        <DropdownMenuItem asChild>
          <Link href='/core'>Tasks</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href='/settings/timezone'>Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href='/account'>Account</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleLogoutClick();
          }}
        >
          Log Out
        </DropdownMenuItem>
        <DropdownMenuArrow className='me-4 fill-white' />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
