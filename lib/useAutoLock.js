import { useEffect } from "react";

export default function useAutoLock(onLock, idleMs = 3 * 60 * 1000) {
  useEffect(() => {
    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(onLock, idleMs);
    };

    const events = ["mousemove", "keydown", "click", "touchstart"];

    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [onLock, idleMs]);
}
