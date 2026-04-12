"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";


// ─── Input style (borrowed from existing auth forms) ──────────────────────────
const inputBase =
  "w-full bg-[#0a0e14] border border-white/[0.12] rounded-lg py-4 pl-12 pr-4 text-white placeholder:text-slate-600 text-sm outline-none transition-all duration-200 focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 hover:border-white/20";

function MsIcon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined select-none ${className}`}
      style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
    >
      {name}
    </span>
  );
}

function Spinner() {
  return (
    <motion.span
      aria-hidden="true"
      className="inline-block w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function SystemRecoveryForm() {
  const [resetKey, setResetKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/system/reset-bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetKey }),
      });

      if (response.ok) {
        setStatus({
          type: "success",
          message: "System has been reset! You can now register a new master account.",
        });
        setResetKey(""); // Clear on success
      } else {
        const err = await response.json();
        setStatus({
          type: "error",
          message: err.error || "Failed to reset system configuration.",
        });
      }
    } catch (err) {
      console.error("Recovery error:", err);
      setStatus({
        type: "error",
        message: "An unexpected error occurred. Verify the API is online.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const delay = (i: number) => ({ delay: 0.05 + i * 0.05 });

  return (
    <div className="w-full space-y-8">
      {/* ── Banner for Errors/Success ──────────────────────────────────── */}
      <AnimatePresence mode="popLayout">
        {status.type && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mb-6"
          >
            <div
              className={`p-4 rounded-lg flex gap-3 shadow-lg border relative overflow-hidden ${
                status.type === "error"
                  ? "bg-red-500/10 border-red-500/30 text-white"
                  : "bg-green-500/10 border-green-500/30 text-white"
              }`}
            >
              {status.type === "error" ? (
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 relative z-10" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 relative z-10" />
              )}
              <div className="relative z-10 text-sm leading-relaxed">
                {status.message}
                {status.type === "success" && (
                  <p className="mt-2 font-semibold">
                    <Link href="/register?bootstrap=true" className="text-amber-400 hover:text-amber-300 underline decoration-amber-400/30 underline-offset-4">
                      Proceed to Registration →
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="space-y-2">
        <h2
          className="text-4xl font-semibold tracking-tight text-white flex items-center justify-start gap-3"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          System Recovery
        </h2>
        <p className="text-red-400/80 text-lg">
          Disaster recovery protocol. Requires master authorization key.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={delay(0)}
          className="space-y-2 group"
        >
          <label
            htmlFor="resetKey"
            className="block text-sm font-medium text-slate-400 group-focus-within:text-red-400 transition-colors"
          >
            Master Recovery Key
          </label>
          <div className="relative flex items-center">
            <MsIcon
              name="admin_panel_settings"
              className="absolute left-4 text-slate-500 group-focus-within:text-red-400 transition-colors text-[20px]"
            />
            <input
              id="resetKey"
              type="password"
              value={resetKey}
              onChange={(e) => setResetKey(e.target.value)}
              required
              autoComplete="off"
              placeholder="Enter alphanumeric recovery key"
              className={inputBase}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={delay(1)}
          className="pt-2"
        >
          <button
            type="submit"
            disabled={isLoading || status.type === "success"}
            className="
              relative w-full py-4 rounded-lg font-bold text-sm text-white
              bg-red-600 hover:bg-red-500
              shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_8px_30px_rgba(220,38,38,0.5)]
              hover:scale-[1.01] transition-all duration-300
              disabled:opacity-60 disabled:cursor-not-allowed
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
              overflow-hidden group
            "
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <span className="relative flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Spinner />
                  Authorizing Protocol...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  Execute System Reset
                </>
              )}
            </span>
          </button>
        </motion.div>
      </form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="pt-8 border-t border-white/[0.06] flex flex-col items-center"
      >
        <p className="text-slate-400 text-sm">
          Return to standard operator{" "}
          <Link
            href="/login"
            className="text-amber-400 font-semibold ml-1 hover:underline decoration-2 underline-offset-4 transition-colors"
          >
            Login portal
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
