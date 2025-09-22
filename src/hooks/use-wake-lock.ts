"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

type WakeLockSentinel = any; // Navigator wakeLock is not in TS lib yet

const STORAGE_KEY = 'dayramp:wake:enabled';

export function useWakeLock() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabledState] = useState(false);
  const [active, setActive] = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const enabledRef = useRef(false);
  const resumingRef = useRef(false);
  const releaseListenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setSupported(typeof navigator !== 'undefined' && 'wakeLock' in navigator);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const on = saved === '1';
      setEnabledState(on);
      enabledRef.current = on;
    } catch {}
  }, []);

  const attachReleaseListener = useCallback((sentinel: WakeLockSentinel) => {
    const onRelease = () => {
      setActive(false);
      // Attempt quiet re-acquire on visible
      if (document.visibilityState === 'visible' && enabledRef.current) {
        resumingRef.current = true;
        void request();
      }
    };
    sentinel.addEventListener?.('release', onRelease);
    releaseListenerRef.current = () => sentinel.removeEventListener?.('release', onRelease);
  }, []);

  const request = useCallback(async () => {
    if (!('wakeLock' in navigator)) return false;
    try {
      const s = await (navigator as any).wakeLock.request('screen');
      sentinelRef.current = s;
      attachReleaseListener(s);
      setActive(true);
      resumingRef.current = false;
      return true;
    } catch (e) {
      setActive(false);
      resumingRef.current = false;
      return false;
    }
  }, [attachReleaseListener]);

  const release = useCallback(async () => {
    try {
      if (releaseListenerRef.current) releaseListenerRef.current();
      if (sentinelRef.current?.release) await sentinelRef.current.release();
    } catch {}
    sentinelRef.current = null;
    setActive(false);
  }, []);

  // Re-acquire on visibility return
  useEffect(() => {
    if (!supported) return;
    const onVis = () => {
      if (document.visibilityState === 'visible' && enabledRef.current && !active) {
        resumingRef.current = true;
        void request();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [active, request, supported]);

  const setEnabled = useCallback(
    (on: boolean) => {
      setEnabledState(on);
      enabledRef.current = on;
      try {
        localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
      } catch {}
      if (!on) {
        void release();
      }
    },
    [release]
  );

  return {
    supported,
    enabled,
    setEnabled,
    active,
    request,
    release,
  } as const;
}

