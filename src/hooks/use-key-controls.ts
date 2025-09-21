"use client";

import { useEffect } from 'react';

export function useKeyControls({ onToggle, onEscape }: { onToggle: () => void; onEscape?: () => void }) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onToggle();
      } else if (e.code === 'Escape') {
        onEscape?.();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onEscape, onToggle]);
}

