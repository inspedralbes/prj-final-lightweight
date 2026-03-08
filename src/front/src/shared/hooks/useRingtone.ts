import { useCallback, useRef } from "react";

/**
 * Plays a looping phone-ring tone using Web Audio API.
 * No external asset files required.
 *
 * Pattern: two beeps (480 Hz + 440 Hz, 400 ms each)
 *          then 2 s silence → repeat every 3 s.
 */
export function useRingtone() {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
  }, []);

  const playBurst = useCallback((ctx: AudioContext) => {
    const now = ctx.currentTime;
    const beeps: [number, number][] = [
      [480, 0.0],
      [440, 0.5],
    ];
    beeps.forEach(([freq, offset]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.25, now + offset + 0.02);
      gain.gain.setValueAtTime(0.25, now + offset + 0.38);
      gain.gain.linearRampToValueAtTime(0, now + offset + 0.4);
      osc.start(now + offset);
      osc.stop(now + offset + 0.42);
    });
  }, []);

  const play = useCallback(() => {
    stop();
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      playBurst(ctx);
      intervalRef.current = setInterval(() => {
        if (ctxRef.current) playBurst(ctxRef.current);
      }, 3000);
    } catch {
      // AudioContext unavailable (SSR / test env) — silently ignore
    }
  }, [stop, playBurst]);

  return { play, stop };
}
