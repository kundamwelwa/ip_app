"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { validatePassword } from "@/lib/password-validation";
import type { RegisterFormData } from "@/types/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// ─── Icon helper ──────────────────────────────────────────────────────────────
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

// ─── Password strength bar ────────────────────────────────────────────────────
function StrengthBar({ score }: { score: number }) {
  const segments = 4;
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-400", "bg-green-500"];
  return (
    <div className="flex gap-1 mt-1.5" aria-label={`Password strength: ${score} of 4`}>
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i < score ? colors[score - 1] : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Shared input style ───────────────────────────────────────────────────────
const inputBase =
  "w-full bg-[#0a0e14] border border-white/[0.12] rounded-lg py-4 pl-12 pr-4 text-white placeholder:text-slate-600 text-sm outline-none transition-all duration-200 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 hover:border-white/20";

const inputBaseNoPadLeft =
  "w-full bg-[#0a0e14] border border-white/[0.12] rounded-lg py-4 px-4 text-white placeholder:text-slate-600 text-sm outline-none transition-all duration-200 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 hover:border-white/20";

// ─── Select ───────────────────────────────────────────────────────────────────
const selectBase =
  "w-full bg-[#0a0e14] border border-white/[0.12] rounded-lg py-4 pl-12 pr-4 text-white text-sm outline-none transition-all duration-200 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 hover:border-white/20 appearance-none cursor-pointer";

// ─── Main component ───────────────────────────────────────────────────────────
export function RegisterForm() {
  const searchParams = useSearchParams();
  const isBootstrap = searchParams.get("bootstrap") === "true";

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    role: "STANDARD_USER",
    setupToken: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(validatePassword(""));
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({ open: false, type: "success", title: "", message: "" });

  const openModal = useCallback(
    (type: "success" | "error", title: string, message: string) => {
      setModal({ open: true, type, title, message });
    },
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") setPasswordStrength(validatePassword(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!passwordStrength.isValid) {
      openModal("error", "Password requirements", "Password does not meet security requirements.");
      setIsLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      openModal("error", "Password mismatch", "Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        openModal("success", "Account created", "Account created successfully! Redirecting to sign in.");
        setTimeout(() => {
          window.location.href = "/login?message=Registration successful. Please sign in.";
        }, 1500);
      } else {
        const err = await response.json();
        openModal("error", "Registration failed", err.error || "Registration failed.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      openModal("error", "Registration failed", "Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  const delay = (i: number) => ({ delay: 0.05 + i * 0.05 });

  return (
    <>
      <div className="w-full space-y-8">
        {/* ── Heading ─────────────────────────────────────────────────────── */}
        <header className="space-y-2">
          <h2
            className="text-4xl font-semibold tracking-tight text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Create account.
          </h2>
          <p className="text-slate-400 text-lg">
            Join the network management team.
          </p>
        </header>

        {/* ── Form ────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* First + Last name row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={delay(0)}
            className="grid grid-cols-2 gap-3"
          >
            <div className="space-y-2 group">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-slate-400 group-focus-within:text-amber-400 transition-colors"
              >
                First Name
              </label>
              <div className="relative flex items-center">
                <MsIcon name="person" className="absolute left-4 text-slate-500 group-focus-within:text-amber-400 transition-colors text-[20px]" />
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  autoComplete="given-name"
                  placeholder="Alex"
                  className={inputBase}
                />
              </div>
            </div>
            <div className="space-y-2 group">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-slate-400 group-focus-within:text-amber-400 transition-colors"
              >
                Last Name
              </label>
              <div className="relative flex items-center">
                <MsIcon name="person" className="absolute left-4 text-slate-500 group-focus-within:text-amber-400 transition-colors text-[20px]" />
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  autoComplete="family-name"
                  placeholder="Smith"
                  className={inputBase}
                />
              </div>
            </div>
          </motion.div>

          {/* Email */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={delay(1)}
            className="space-y-2 group"
          >
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-400 group-focus-within:text-amber-400 transition-colors"
            >
              Email Address
            </label>
            <div className="relative flex items-center">
              <MsIcon name="alternate_email" className="absolute left-4 text-slate-500 group-focus-within:text-amber-400 transition-colors text-[20px]" />
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

          {/* Department */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={delay(2)}
            className="space-y-2 group"
          >
            <label
              htmlFor="department"
              className="block text-sm font-medium text-slate-400 group-focus-within:text-amber-400 transition-colors"
            >
              Department
            </label>
            <div className="relative flex items-center">
              <MsIcon name="corporate_fare" className="absolute left-4 text-slate-500 group-focus-within:text-amber-400 transition-colors text-[20px]" />
              <input
                id="department"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
                required
                placeholder="Network Operations"
                className={inputBase}
              />
            </div>
          </motion.div>

          {/* Role */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={delay(3)}
            className="space-y-2 group"
          >
            <label
              htmlFor="role"
              className="block text-sm font-medium text-slate-400 group-focus-within:text-amber-400 transition-colors"
            >
              Role
            </label>
            <div className="relative flex items-center">
              <MsIcon name="shield_person" className="absolute left-4 text-slate-500 group-focus-within:text-amber-400 transition-colors text-[20px] z-10" />
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={selectBase}
              >
                <option value="ADMIN">Administrator</option>
                <option value="MANAGER">Network Manager</option>
                <option value="TECHNICIAN">Network Technician</option>
                <option value="STANDARD_USER">Standard User</option>
              </select>
              <MsIcon name="expand_more" className="absolute right-4 text-slate-500 text-[20px] pointer-events-none" />
            </div>
          </motion.div>

          {/* Bootstrap token (conditional) */}
          <AnimatePresence>
            {isBootstrap && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 group overflow-hidden"
              >
                <label
                  htmlFor="setupToken"
                  className="block text-sm font-medium text-slate-400 group-focus-within:text-amber-400 transition-colors"
                >
                  Setup Token
                </label>
                <div className="relative flex items-center">
                  <MsIcon name="key" className="absolute left-4 text-slate-500 group-focus-within:text-amber-400 transition-colors text-[20px]" />
                  <input
                    id="setupToken"
                    name="setupToken"
                    type="password"
                    value={formData.setupToken}
                    onChange={handleChange}
                    placeholder="Enter bootstrap token"
                    className={inputBase}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={delay(4)}
            className="space-y-2 group"
          >
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-400 group-focus-within:text-amber-400 transition-colors"
            >
              Password
            </label>
            <div className="relative flex items-center">
              <MsIcon name="lock" className="absolute left-4 text-slate-500 group-focus-within:text-amber-400 transition-colors text-[20px]" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
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
            {/* Strength bar */}
            {formData.password && (
              <StrengthBar score={passwordStrength.score} />
            )}
          </motion.div>

          {/* Confirm password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={delay(5)}
            className="space-y-2 group"
          >
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-400 group-focus-within:text-amber-400 transition-colors"
            >
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <MsIcon name="lock_reset" className="absolute left-4 text-slate-500 group-focus-within:text-amber-400 transition-colors text-[20px]" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="••••••••••••"
                className={inputBase}
              />
              <button
                type="button"
                aria-label={showConfirm ? "Hide password" : "Show password"}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 text-slate-500 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 rounded"
              >
                <MsIcon name={showConfirm ? "visibility_off" : "visibility"} className="text-[20px]" />
              </button>
            </div>
            {/* Password match indicator */}
            {formData.confirmPassword && (
              <p
                className={`text-xs mt-1 ${
                  formData.password === formData.confirmPassword
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {formData.password === formData.confirmPassword
                  ? "✓ Passwords match"
                  : "✗ Passwords do not match"}
              </p>
            )}
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={delay(6)}
          >
            <button
              type="submit"
              disabled={isLoading || success}
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
                  <><Spinner />Creating Account…</>
                ) : success ? (
                  <><CheckCircle2 className="w-4 h-4" />Success!</>
                ) : (
                  <><MsIcon name="person_add" className="text-[18px]" />Create Account</>
                )}
              </span>
            </button>
          </motion.div>
        </form>

        {/* ── Sign-in link ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="pt-6 border-t border-white/[0.06] flex flex-col items-center"
        >
          <p className="text-slate-400 text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-amber-400 font-semibold ml-1 hover:underline decoration-2 underline-offset-4 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* ── Result modal ─────────────────────────────────────────────────────── */}
      <Dialog open={modal.open} onOpenChange={(open) => setModal((prev) => ({ ...prev, open }))}>
        <DialogContent className="bg-slate-900 border border-amber-500/30 text-white shadow-2xl">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-2">
              {modal.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              <DialogTitle className="text-xl font-semibold">{modal.title}</DialogTitle>
            </div>
            <DialogDescription className="text-amber-100/70 mt-1">{modal.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
              onClick={() => setModal((prev) => ({ ...prev, open: false }))}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
