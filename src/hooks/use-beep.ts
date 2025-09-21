"use client";

import { useRef } from 'react';

export function useBeep() {
  const ctxRef = useRef<AudioContext | null>(null);

  function ensureCtx() {
    if (ctxRef.current) return ctxRef.current;
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      ctxRef.current = new Ctx();
      return ctxRef.current;
    } catch {
      return null;
    }
  }

  function unlock() {
    const ctx = ensureCtx();
    // Best-effort resume on user gesture
    try { ctx?.resume(); } catch {}
  }

  // Softer, pleasing short tone with gentle envelope
  function click(durationMs = 90, frequency = 660) {
    const ctx = ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Master gain with short attack and exponential decay
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.18, now + 0.006);
    master.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

    // Gentle lowpass to soften highs
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2200, now);
    lp.Q.setValueAtTime(0.0001, now);

    // Slight stereo shimmer via detuned duo
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, now);
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(frequency, now);
    osc2.detune.setValueAtTime(6, now); // ~6 cents up

    // Sub-gains to balance harmonics
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.8, now);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.35, now);

    osc1.connect(g1).connect(lp).connect(master).connect(ctx.destination);
    osc2.connect(g2).connect(lp);

    osc1.start(now);
    osc2.start(now);
    const stopAt = now + durationMs / 1000 + 0.005;
    osc1.stop(stopAt);
    osc2.stop(stopAt);
  }

  // Two-note pleasant start chime
  function chimeStart() {
    const ctx = ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const schedule = (t: number, freq: number, durMs: number, vol = 0.16) => {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + durMs / 1000);

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2400, t);

      const o1 = ctx.createOscillator();
      o1.type = 'sine';
      o1.frequency.setValueAtTime(freq, t);
      const o2 = ctx.createOscillator();
      o2.type = 'triangle';
      o2.frequency.setValueAtTime(freq * 1.5, t); // perfect fifth for sparkle
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.25, t);

      o1.connect(lp).connect(gain).connect(ctx.destination);
      o2.connect(g2).connect(lp);
      o1.start(t);
      o2.start(t);
      const stopAt = t + durMs / 1000 + 0.02;
      o1.stop(stopAt);
      o2.stop(stopAt);
    };
    schedule(now, 660, 120, 0.16);
    schedule(now + 0.09, 880, 140, 0.14);
  }

  return { click, unlock, chimeStart };
}
