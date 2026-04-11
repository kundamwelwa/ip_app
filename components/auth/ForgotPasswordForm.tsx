"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AdminBanner } from "@/components/ui/admin-banner";
import { CheckCircle2 } from "lucide-react";

// ─── Shared icon helper ───────────────────────────────────────────────────────
function MsIcon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined select-none leading-none ${className}`}
      style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
    >
      {name}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
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

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [adminNotice, setAdminNotice] = useState<{
    title: string;
    message: string;
    reason?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAdminNotice(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setAdminNotice({
          title: "Request failed",
          message: data.error || "Failed to send reset email",
        });
      }
    } catch {
      setAdminNotice({
        title: "Unexpected error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    "w-full bg-[#0a0e14] border border-white/[0.12] rounded-lg py-4 pl-12 pr-4 text-white placeholder:text-slate-600 text-sm outline-none transition-all duration-200 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 hover:border-white/20";

  return (
    <div className="w-full space-y-8">
      {/* ── Heading ─────────────────────────────────────────────────────────── */}
      <header className="space-y-2">
        <h2
          className="text-4xl font-semibold tracking-tight text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Reset Password
        </h2>
        <p className="text-slate-400 text-lg">
          Enter your email to receive a password reset link.
        </p>
      </header>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {adminNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <AdminBanner
              title={adminNotice.title}
              message={adminNotice.message}
              reason={adminNotice.reason}
              ctaLabel="Dismiss"
              onCta={() => setAdminNotice(null)}
              onDismiss={() => setAdminNotice(null)}
              supportHref=""
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Form or Success Message ─────────────────────────────────────────── */}
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-[#0f1729] border border-green-500/30 text-center space-y-4"
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-green-300">Check Your Email</h3>
          <p className="text-sm text-slate-300">
            We&apos;ve sent a password reset link to <span className="font-semibold text-white">{email}</span>
          </p>
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full py-3 rounded-lg font-bold text-sm text-slate-900 bg-amber-400 hover:bg-amber-500 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Email */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="space-y-2 group"
          >
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-400 group-focus-within:text-amber-400 transition-colors"
            >
              Email Address
            </label>
            <div className="relative flex items-center">
              <MsIcon
                name="alternate_email"
                className="absolute left-4 text-slate-500 group-focus-within:text-amber-400 transition-colors text-[20px]"
              />
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="name@rajant.mesh"
                className={inputBase}
              />
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button
              type="submit"
              disabled={isLoading}
              className="
                relative w-full py-4 rounded-lg font-bold text-sm text-slate-900
                bg-gradient-to-br from-amber-400 to-amber-600
                shadow-[0_4px_20px_rgba(249,168,37,0.2)] hover:shadow-[0_8px_30px_rgba(249,168,37,0.4)]
                hover:scale-[1.01] transition-all duration-300
                disabled:opacity-60 disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
                overflow-hidden group
              "
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out"
              />
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <><Spinner />Sending…</>
                ) : (
                  <><MsIcon name="send" className="text-[18px]" />Send Reset Link</>
                )}
              </span>
            </button>
          </motion.div>
        </form>
      )}

      {/* ── Secondary actions ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="pt-6 border-t border-white/[0.06] flex flex-col items-center"
      >
        <p className="text-slate-400 text-sm">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-amber-400 font-semibold ml-1 hover:underline decoration-2 underline-offset-4 transition-colors"
          >
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
