import Link from 'next/link';
import { IoMenu, IoPersonCircleOutline } from 'react-icons/io5';

import { AccountMenu } from '@/components/account-menu';
import { UnauthenticatedMenu } from '@/components/unauthenticated-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getSession } from '@/features/account/controllers/get-session';

import { signOutAction } from './(auth)/auth-actions';

export async function Navigation() {
  const session = await getSession();

  return (
    <div className='relative flex items-center gap-4'>
      {/* Desktop Menu */}
      <div className='hidden lg:block'>
        {session ? <AccountMenu /> : <UnauthenticatedMenu />}
      </div>

      {/* Mobile Menu Trigger (Always visible on mobile) */}
      <Sheet>
        <SheetTrigger className='block lg:hidden'>
          {session ? <IoPersonCircleOutline size={28} /> : <IoMenu size={28} />}
        </SheetTrigger>
        <SheetContent
          className='w-full mobile-nav-sheet'
          style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}
        >
          <SheetHeader>
            <Logo />
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription asChild className='flex flex-col gap-4 py-8'>
              <div>
                {session ? (
                  <>
                    {/* Mobile Links (Session) - Inside Sheet */}
                    <Button variant='link' asChild className='justify-start'>
                      <Link href='/core'>Tasks</Link>
                    </Button>
                    <Button variant='link' asChild className='justify-start'>
                      <Link href='/settings/timezone'>Settings</Link>
                    </Button>
                    <Button variant='link' asChild className='justify-start'>
                      <Link href='/pricing'>Plans</Link>
                    </Button>
                    <form action={signOutAction} className='mt-4'>
                      <Button variant='default' type='submit' className='w-full'>Log out</Button>
                    </form>
                  </>
                ) : (
                  <>
                    {/* Mobile Links (No Session) - Inside Sheet */}
                    <Button variant='link' asChild className='justify-start'>
                      <Link href='/login'>Log in</Link>
                    </Button>
                    <Button variant='default' className='flex-shrink-0 mt-2' asChild>
                      <Link href='/signup'>Sign up</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
}
