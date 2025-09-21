"use client";

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void> | void;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISSED_KEY = 'daykickoff:a2hs-dismissed';

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  const mql = window.matchMedia && window.matchMedia('(display-mode: standalone)');
  const iosStandalone = (window.navigator as any).standalone;
  return (mql && mql.matches) || iosStandalone;
}

export function InstallAppButton() {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone()) {
      setVisible(false);
      return;
    }
    setVisible(true);

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);
  }, []);

  if (!visible) return null;

  async function handleConfirm() {
    // Android/Chrome path
    if (deferredRef.current) {
      const dp = deferredRef.current;
      try {
        await dp.prompt?.();
        const choice = await dp.userChoice?.catch(() => null);
        if (choice?.outcome !== 'accepted') {
          try {
            localStorage.setItem(DISMISSED_KEY, '1');
          } catch {}
        }
      } catch {}
      setOpen(false);
      return;
    }

    // iOS guidance only
    setOpen(false);
  }

  function handleCancel() {
    setOpen(false);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {}
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant='outline'
        className='mt-2 border-white/20 bg-white/10 text-white hover:bg-white/20'
      >
        Install App
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className='border-white/20 bg-white/10 text-white backdrop-blur'>
          <AlertDialogHeader>
            <AlertDialogTitle>Install DayKickOff</AlertDialogTitle>
            <AlertDialogDescription className='text-white/80'>
              Add DayKickOff to your home screen for quick access and a full-screen experience.
              {isIOS() ? (
                <>
                  <br />On iOS, use Safari: Share → Add to Home Screen.
                </>
              ) : (
                <>
                  <br />You can uninstall anytime from your home screen.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='border-white/20 bg-transparent text-white hover:bg-white/10' onClick={handleCancel}>
              Not now
            </AlertDialogCancel>
            <AlertDialogAction className='bg-white text-black hover:bg-white/90' onClick={handleConfirm}>
              {isIOS() ? 'OK' : 'Install'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
