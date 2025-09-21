"use client";

import { useRef, useCallback } from 'react';

export interface AudioSettings {
  file: string;
  repeatCount: number;
  enabled?: boolean;
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentRepeatRef = useRef<number>(0);
  const targetRepeatsRef = useRef<number>(0);

  const playAudio = useCallback(async (settings: AudioSettings) => {
    if (!settings.file || settings.enabled === false) return;

    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create new audio instance
      const audio = new Audio(`/sounds/effect/${settings.file}`);
      audioRef.current = audio;
      
      currentRepeatRef.current = 0;
      // Clamp repeats between 1 and 4
      targetRepeatsRef.current = Math.min(4, Math.max(1, settings.repeatCount));

      const playNext = () => {
        if (currentRepeatRef.current < targetRepeatsRef.current) {
          audio.currentTime = 0;
          audio.play().catch(() => {
            // Handle play failure silently
          });
          currentRepeatRef.current++;
        }
      };

      // Set up event listeners
      audio.addEventListener('ended', () => {
        if (currentRepeatRef.current < targetRepeatsRef.current) {
          // Small delay between repeats
          setTimeout(playNext, 100);
        }
      });

      audio.addEventListener('error', () => {
        // Handle error silently
      });

      // Start playing
      playNext();

    } catch (error) {
      // Handle error silently
    }
  }, []);

  // Preview audio uses same repeat behavior as playAudio
  const previewAudio = useCallback(async (settings: AudioSettings) => {
    if (!settings?.file) return;
    await playAudio(settings);
  }, [playAudio]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      currentRepeatRef.current = 0;
      targetRepeatsRef.current = 0;
    }
  }, []);

  return {
    playAudio,
    previewAudio,
    stopAudio,
  };
}
