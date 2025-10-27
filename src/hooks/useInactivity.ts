import { useCallback, useEffect, useRef } from "react";

import { useAppStore } from "../store/useAppStore";
import { usePassword } from "./usePassword";

const EVENTS = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "touchstart",
  "touchmove",
  "wheel",
];

const useInactivity = (duration: number = 5 * 60 * 1000) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoggedIn = usePassword() !== null;
  const clearPassword = useAppStore((state) => state.clearPassword);

  /** Callback to Reset Timeout */
  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(clearPassword, duration);
  }, [clearPassword, duration]);

  /** Register Effect */
  useEffect(() => {
    if (!isLoggedIn) return;

    /** Callback to Reset Timeout */

    /** Register Events */
    EVENTS.forEach(function (name) {
      window.addEventListener(name, resetTimer, true);
    });

    /** Initial Timeout  */
    timeoutRef.current = setTimeout(clearPassword, duration);

    return () => {
      /** Remove Events */
      EVENTS.forEach(function (name) {
        window.removeEventListener(name, resetTimer, true);
      });

      /** Reset Timeout */
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [duration, isLoggedIn, resetTimer, clearPassword]);
};

export { useInactivity };
