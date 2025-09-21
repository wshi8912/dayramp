"use client";

import { useRef, useCallback, useEffect } from 'react';

export interface BGMSettings {
  file: string;
  volume: number; // 0-1 range
  enabled?: boolean;
}

interface UseBGMPlayerOptions {
  fadeTime?: number; // milliseconds for cross-fade
}

export function useBGMPlayer(options: UseBGMPlayerOptions = {}) {
  const { fadeTime = 1000 } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentFileRef = useRef<string | null>(null);
  const targetVolumeRef = useRef<number>(1);
  const isPlayingRef = useRef<boolean>(false);

  // Clear any existing fade
  const clearFade = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  // Fade volume to target
  const fadeVolume = useCallback((targetVolume: number, callback?: () => void) => {
    clearFade();

    if (!audioRef.current) {
      callback?.();
      return;
    }

    const audio = audioRef.current;
    const startVolume = audio.volume;
    const volumeDiff = targetVolume - startVolume;
    const steps = 20; // Number of fade steps
    const stepTime = fadeTime / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      audio.volume = Math.max(0, Math.min(1, startVolume + (volumeDiff * progress)));

      if (currentStep >= steps) {
        clearFade();
        audio.volume = targetVolume;
        callback?.();
      }
    }, stepTime);
  }, [fadeTime, clearFade]);

  // Play BGM with settings
  const playBGM = useCallback(async (settings: BGMSettings) => {
    if (!settings.file || settings.enabled === false) {
      stopBGM();
      return;
    }

    // Normalize volume: 0-2 range to 0-1 for audio element (where 1.0 = 100%, 2.0 = 100% audio volume)
    targetVolumeRef.current = Math.max(0, Math.min(1, settings.volume));

    // If same file is already playing, just adjust volume
    if (currentFileRef.current === settings.file && audioRef.current && isPlayingRef.current) {
      fadeVolume(targetVolumeRef.current);
      return;
    }

    // Cross-fade to new BGM
    const oldAudio = audioRef.current;

    try {
      // Create new audio instance
      const newAudio = new Audio(`/sounds/bgm/${settings.file}`);
      newAudio.loop = true;
      newAudio.volume = 0; // Start at 0 for fade-in

      // Set up event listeners
      newAudio.addEventListener('error', (e) => {
        console.warn('BGM playback error:', e);
        isPlayingRef.current = false;
      });

      // Start playing new audio
      await newAudio.play();
      audioRef.current = newAudio;
      currentFileRef.current = settings.file;
      isPlayingRef.current = true;

      // Fade in new audio
      fadeVolume(targetVolumeRef.current);

      // Fade out and clean up old audio if exists
      if (oldAudio) {
        const fadeOutInterval = setInterval(() => {
          oldAudio.volume = Math.max(0, oldAudio.volume - 0.05);
          if (oldAudio.volume <= 0) {
            clearInterval(fadeOutInterval);
            oldAudio.pause();
            oldAudio.src = '';
          }
        }, fadeTime / 20);
      }

    } catch (error) {
      console.warn('Failed to play BGM:', error);
      isPlayingRef.current = false;
    }
  }, [fadeVolume, fadeTime]);

  // Stop BGM
  const stopBGM = useCallback(() => {
    clearFade();

    if (audioRef.current) {
      fadeVolume(0, () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current = null;
        }
      });
    }

    currentFileRef.current = null;
    isPlayingRef.current = false;
  }, [clearFade, fadeVolume]);

  // Stop BGM immediately (no fade)
  const stopBGMImmediate = useCallback(() => {
    clearFade();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    currentFileRef.current = null;
    isPlayingRef.current = false;
  }, [clearFade]);

  // Pause BGM (keep position)
  const pauseBGM = useCallback(() => {
    if (audioRef.current && isPlayingRef.current) {
      fadeVolume(0, () => {
        audioRef.current?.pause();
        isPlayingRef.current = false;
      });
    }
  }, [fadeVolume]);

  // Pause BGM immediately (no fade)
  const pauseBGMImmediate = useCallback(() => {
    clearFade();
    if (audioRef.current) {
      audioRef.current.pause();
      isPlayingRef.current = false;
    }
  }, [clearFade]);

  // Resume BGM
  const resumeBGM = useCallback(async () => {
    if (audioRef.current && !isPlayingRef.current) {
      try {
        await audioRef.current.play();
        isPlayingRef.current = true;
        fadeVolume(targetVolumeRef.current);
      } catch (error) {
        console.warn('Failed to resume BGM:', error);
      }
    }
  }, [fadeVolume]);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    // Normalize volume: 0-2 range to 0-1 for audio element
    targetVolumeRef.current = Math.max(0, Math.min(1, volume));
    if (audioRef.current) {
      fadeVolume(targetVolumeRef.current);
    }
  }, [fadeVolume]);

  // Switch BGM with cross-fade
  const switchBGM = useCallback(async (newSettings: BGMSettings) => {
    if (!newSettings.file || newSettings.enabled === false) {
      stopBGM();
      return;
    }

    // If it's the same file, just update volume
    if (currentFileRef.current === newSettings.file) {
      setVolume(newSettings.volume);
      return;
    }

    // Otherwise do a cross-fade transition
    await playBGM(newSettings);
  }, [playBGM, stopBGM, setVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearFade();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [clearFade]);

  return {
    playBGM,
    stopBGM,
    stopBGMImmediate,
    pauseBGM,
    pauseBGMImmediate,
    resumeBGM,
    switchBGM,
    setVolume,
    isPlaying: isPlayingRef.current,
    currentFile: currentFileRef.current,
  };
}