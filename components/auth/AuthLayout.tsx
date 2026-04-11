"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { AuthTopNav } from "@/components/auth/AuthTopNav";

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Fallback shown inside the form area during Suspense resolution */
  formFallback?: React.ReactNode;
}

function FormSkeleton() {
  return (
    <div className="w-full max-w-md space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-10 w-3/4 rounded bg-white/10" />
        <div className="h-5 w-1/2 rounded bg-white/[0.06]" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="h-12 rounded-lg bg-white/[0.06]" />
        </div>
      ))}
      <div className="h-12 rounded-lg bg-amber-500/20" />
    </div>
  );
}

export function AuthLayout({ children, formFallback }: AuthLayoutProps) {
  return (
    <>
      {/* Google Fonts — Space Grotesk + Inter + Material Symbols */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>

      <div className="relative min-h-screen flex" style={{ background: "#0a0e14" }}>
        {/* ── Left brand panel (hidden on mobile) ───────────────────────── */}
        <div className="hidden lg:block lg:w-1/2 fixed left-0 top-0 h-screen">
          <BrandPanel />
        </div>

        {/* ── Right panel ────────────────────────────────────────────────── */}
        <div className="relative w-full lg:w-1/2 lg:ml-auto flex flex-col min-h-screen">
          {/* Top-right nav: help + language */}
          <AuthTopNav />

          {/* Subtle amber glow */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

          {/* Centred form area */}
          <div className="flex flex-1 items-center justify-center px-6 py-16 sm:px-12 lg:px-24 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="w-full max-w-md"
            >
              <Suspense fallback={formFallback ?? <FormSkeleton />}>
                {children}
              </Suspense>

              {/* Encrypted-sessions status */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-center text-[11px] text-slate-600 flex items-center justify-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                IP-AMS · All sessions are encrypted end-to-end
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
