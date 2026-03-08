import { useCallback, useEffect, useRef } from "react";

/**
 * Plays a looping phone-ring tone using Web Audio API.
 * No external asset files required.
 *
 * iOS Safari requires AudioContext to be created/resumed during a user gesture.
 * We pre-unlock the context on any touchstart/click so it is ready when an
 * incoming call arrives (which is NOT a user gesture).
 *
 * Pattern: two beeps (480 Hz + 440 Hz, 400 ms each)
 *          then 2 s silence → repeat every 3 s.
 */
export function useRingtone() {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pre-unlock AudioContext on first user interaction (iOS requirement).
  // We keep the context alive (never close it) so it stays unlocked.
  useEffect(() => {
    const unlock = () => {
      try {
        if (!ctxRef.current) {
          ctxRef.current = new AudioContext();
        }
        if (ctxRef.current.state === "suspended") {
          ctxRef.current.resume().catch(() => {});
        }
      } catch {
        // AudioContext unavailable — ignore
      }
    };
    document.addEventListener("touchstart", unlock, { passive: true });
    document.addEventListener("click", unlock, { passive: true });
    return () => {
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
    };
  }, []);

  // Only clear the interval on stop — do NOT close the AudioContext so iOS
  // keeps it in the unlocked state for the next ring.
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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

  const play = useCallback(async () => {
    stop();
    try {
      // Create context if it was never unlocked yet
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
      }
      const ctx = ctxRef.current;
      // Resume if suspended (mandatory on iOS after page load)
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      playBurst(ctx);
      intervalRef.current = setInterval(async () => {
        if (!ctxRef.current) return;
        if (ctxRef.current.state === "suspended") {
          await ctxRef.current.resume().catch(() => {});
        }
        playBurst(ctxRef.current);
      }, 3000);
    } catch {
      // AudioContext unavailable (SSR / test env) — silently ignore
    }
  }, [stop, playBurst]);

  return { play, stop };
}
