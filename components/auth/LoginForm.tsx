"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminBanner } from "@/components/ui/admin-banner";
import type { LoginFormData } from "@/types/auth";

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

// ─── Main component ───────────────────────────────────────────────────────────
export function LoginForm() {
  const router = useRouter();

  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adminNotice, setAdminNotice] = useState<{
    title: string;
    message: string;
    reason?: string;
  } | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAdminNotice(null);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        const msg =
          result.error === "CredentialsSignin"
            ? "Invalid email, password, or your account is pending/unauthorised."
            : result.error;
        setAdminNotice({ title: "Authentication failed", message: msg, reason: msg });
      } else {
        router.push("/dashboard");
      }
    } catch {
      setAdminNotice({ title: "Unexpected error", message: "Something went wrong. Please try again." });
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
          Welcome back.
        </h2>
        <p className="text-slate-400 text-lg">
          Enter your credentials to access the secure mesh.
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
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Form ────────────────────────────────────────────────────────────── */}
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
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="name@rajant.mesh"
              className={inputBase}
            />
          </div>
        </motion.div>

        {/* Password */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2 group"
        >
          <div className="flex justify-between items-center">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-400 group-focus-within:text-amber-400 transition-colors"
            >
              Security Key
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <MsIcon
              name="lock"
              className="absolute left-4 text-slate-500 group-focus-within:text-amber-400 transition-colors text-[20px]"
            />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              className={inputBase}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 text-slate-500 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 rounded"
            >
              <MsIcon name={showPassword ? "visibility_off" : "visibility"} className="text-[20px]" />
            </button>
          </div>
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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
                <><Spinner />Authenticating…</>
              ) : (
                <><MsIcon name="verified_user" className="text-[18px]" />Login</>
              )}
            </span>
          </button>
        </motion.div>
      </form>

      {/* ── Secondary actions ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="pt-6 border-t border-white/[0.06] flex flex-col items-center"
      >
        <p className="text-slate-400 text-sm">
          New operator?{" "}
          <Link
            href="/register"
            className="text-amber-400 font-semibold ml-1 hover:underline decoration-2 underline-offset-4 transition-colors"
          >
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
