import { useEffect, useState } from 'react';

const DEFAULT_IDLE_MS = 2500;

const ACTIVITY_EVENTS: ReadonlyArray<keyof WindowEventMap> = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'wheel',
  'pointerdown',
];

/**
 * Tracks recent user interaction. Returns true while the user is active,
 * and flips to false after `idleMs` with no events.
 */
export default function useUserActivity(idleMs: number = DEFAULT_IDLE_MS): boolean {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const markActive = () => {
      setIsActive(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setIsActive(false), idleMs);
    };

    markActive();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, markActive, { passive: true });
    }

    return () => {
      if (timer) clearTimeout(timer);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, markActive);
      }
    };
  }, [idleMs]);

  return isActive;
}
