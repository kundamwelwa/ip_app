"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ─── Help modal ───────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "I forgot my password — what do I do?",
    a: 'Click "Forgot password?" below the password field. You\'ll receive a reset link via email.',
  },
  {
    q: "How do I request a new operator account?",
    a: 'Click "New operator? Request Access" at the bottom of the form. An admin will review your application.',
  },
  {
    q: "My account is locked / pending — who do I contact?",
    a: "Reach out to your system administrator or email support@ip-ams.internal.",
  },
  {
    q: "Is this system secure?",
    a: "Yes. All sessions are encrypted, credentials are hashed with bcrypt, and IP-AMS uses role-based access control.",
  },
];

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="
          max-w-md
          bg-slate-900/95 backdrop-blur-2xl
          border border-amber-500/20
          text-white shadow-2xl
        "
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-amber-400 text-[22px] leading-none select-none"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
            >
              help_outline
            </span>
            <DialogTitle className="text-lg font-semibold text-white">
              Help &amp; Support
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-sm mt-1">
            Frequently asked questions about the IP-AMS login.
          </DialogDescription>
        </DialogHeader>

        <ul className="mt-2 space-y-4">
          {FAQ.map(({ q, a }) => (
            <li key={q} className="space-y-1">
              <p className="text-sm font-medium text-amber-200/90">{q}</p>
              <p className="text-sm text-slate-400/80 leading-relaxed">{a}</p>
            </li>
          ))}
        </ul>

        <div className="mt-4 pt-4 border-t border-white/[0.07]">
          <p className="text-xs text-slate-500/70 text-center">
            For urgent issues email{" "}
            <a
              href="mailto:support@ip-ams.internal"
              className="text-amber-400/80 hover:text-amber-300 transition-colors"
            >
              support@ip-ams.internal
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Language switcher ────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
  { code: "af", label: "Afrikaans" },
];

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("en");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch language"
        onClick={() => setOpen((v) => !v)}
        className="
          flex items-center gap-1 px-2 py-1.5 rounded-lg
          text-slate-400 hover:text-amber-400
          hover:bg-white/[0.05]
          transition-colors
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400
        "
      >
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[20px] leading-none select-none"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
        >
          language
        </span>
        <span className="text-xs font-medium uppercase">{selected}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select language"
          className="
            absolute right-0 top-full mt-1.5 z-50 w-36
            rounded-lg overflow-hidden
            bg-slate-900/95 backdrop-blur-xl
            border border-white/10 shadow-2xl
          "
        >
          {LANGUAGES.map(({ code, label }) => (
            <li key={code} role="option" aria-selected={selected === code}>
              <button
                type="button"
                className={`
                  w-full text-left px-4 py-2.5 text-[13px] transition-colors
                  ${
                    selected === code
                      ? "text-amber-400 bg-amber-500/10"
                      : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                  }
                  ${code !== "en" ? "opacity-60 cursor-not-allowed" : ""}
                `}
                onClick={() => {
                  if (code === "en") {
                    setSelected(code);
                    setOpen(false);
                  }
                }}
                disabled={code !== "en"}
              >
                {label}
                {code !== "en" && (
                  <span className="ml-1.5 text-[10px] text-slate-500">(soon)</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Top nav bar ──────────────────────────────────────────────────────────────
export function AuthTopNav() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <div
        className="
          absolute top-0 right-0 z-10
          flex items-center gap-1 p-4
        "
      >
        <button
          type="button"
          aria-label="Open help"
          onClick={() => setHelpOpen(true)}
          className="
            flex items-center justify-center w-8 h-8 rounded-lg
            text-slate-400 hover:text-amber-400
            hover:bg-white/[0.05]
            transition-colors
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400
          "
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[20px] leading-none select-none"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
          >
            help_outline
          </span>
        </button>
        <LanguageSwitcher />
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
