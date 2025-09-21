"use client";

import { useCallback, useState } from 'react';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enter = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
  }, []);

  const exit = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
  }, []);

  return { isFullscreen, enter, exit };
}

