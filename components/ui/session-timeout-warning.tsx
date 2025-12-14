"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionTimeout } from "@/hooks/use-session-timeout";

export function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useSessionTimeout({
    idleTime: 30 * 60 * 1000, // 30 minutes
    warningTime: 5 * 60 * 1000, // Show warning 5 minutes before logout
    onWarning: () => {
      setShowWarning(true);
      setTimeRemaining(300);
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Start countdown
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
  });

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleStayActive = () => {
    setShowWarning(false);
    setTimeRemaining(300);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Reset timer by triggering activity
    window.dispatchEvent(new Event("mousedown"));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50 w-full max-w-md"
        >
          <div className="bg-gradient-to-br from-amber-500/20 to-yellow-600/20 backdrop-blur-xl border border-amber-500/30 rounded-lg p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-amber-200 font-semibold mb-1">
                  Session Timeout Warning
                </h3>
                <p className="text-amber-100/80 text-sm mb-3">
                  Your session will expire in{" "}
                  <span className="font-bold text-amber-300">
                    {formatTime(timeRemaining)}
                  </span>{" "}
                  due to inactivity.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleStayActive}
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Stay Active
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

