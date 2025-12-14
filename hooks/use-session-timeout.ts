"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UseSessionTimeoutOptions {
  idleTime?: number; // Time in milliseconds before logout (default: 30 minutes)
  warningTime?: number; // Time in milliseconds before showing warning (default: 5 minutes before logout)
  onWarning?: () => void;
  onLogout?: () => void;
}

export function useSessionTimeout({
  idleTime = 30 * 60 * 1000, // 30 minutes default
  warningTime = 5 * 60 * 1000, // 5 minutes before logout
  onWarning,
  onLogout,
}: UseSessionTimeoutOptions = {}) {
  const { data: session } = useSession();
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    if (!session) return;

    const now = Date.now();
    const timeSinceActivity = now - lastActivityRef.current;

    // Update last activity
    lastActivityRef.current = now;
    warningShownRef.current = false;

    // Set warning timer (show warning before logout)
    const timeUntilWarning = idleTime - warningTime - timeSinceActivity;
    if (timeUntilWarning > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        if (onWarning) {
          onWarning();
        }
        warningShownRef.current = true;
      }, timeUntilWarning);
    }

    // Set logout timer
    const timeUntilLogout = idleTime - timeSinceActivity;
    if (timeUntilLogout > 0) {
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, timeUntilLogout);
    } else {
      // Already past idle time, logout immediately
      handleLogout();
    }
  };

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    }
    await signOut({ redirect: false });
    router.push("/login?message=Session expired due to inactivity");
  };

  useEffect(() => {
    if (!session) return;

    // Track user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "keydown",
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [session, idleTime, warningTime]);

  return {
    resetTimer,
    lastActivity: lastActivityRef.current,
  };
}

