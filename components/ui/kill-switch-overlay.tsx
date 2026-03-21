"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, ShieldAlert, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useKillSwitch } from "@/hooks/use-kill-switch";
import { AdminBanner } from "@/components/ui/admin-banner";

export function KillSwitchOverlay() {
  const { banner, killSwitch, accountNotice, clearBanner, clearAccountNotice } = useKillSwitch();

  // Block keyboard shortcuts and scrolling while the overlay is active
  useEffect(() => {
    if (!killSwitch.triggered) return;

    const blockKeys = (event: KeyboardEvent) => {
      const blocked =
        event.key === "F12" ||
        event.key === "Escape" ||
        (event.ctrlKey && event.shiftKey && ["I", "J", "C", "K"].includes(event.key)) ||
        (event.metaKey && event.altKey);
      if (blocked) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    const blockContext = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("keydown", blockKeys, true);
    document.addEventListener("contextmenu", blockContext, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", blockKeys, true);
      document.removeEventListener("contextmenu", blockContext, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [killSwitch.triggered]);

  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore storage errors
    }
    const reason = encodeURIComponent(
      killSwitch.reason || "Account access was restricted by an administrator."
    );
    await signOut({
      callbackUrl: `/login?reason=${reason}&title=Access%20restricted&detail=Your%20account%20is%20currently%20disabled.`,
    });
  };

  const supportHref =
    "mailto:support@fqml.com?subject=Account%20suspension&body=My%20account%20was%20suspended.%20Please%20assist.";

  return (
    <>
      <AnimatePresence>
        {accountNotice && !killSwitch.triggered && (
          <motion.div
            key="account-notice"
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed top-4 inset-x-0 z-[12500] flex justify-center px-4"
          >
            <div className="max-w-3xl w-full mx-auto">
              <AdminBanner
                title={accountNotice.title}
                message={accountNotice.message}
                reason={accountNotice.reason}
                ctaLabel="Got it"
                onCta={clearAccountNotice}
                onDismiss={clearAccountNotice}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {banner && !killSwitch.triggered && (
          <motion.div
            key="banner"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed top-4 inset-x-0 z-[12000] flex justify-center px-4"
          >
            <div className="max-w-3xl w-full mx-auto">
              <AdminBanner
                title="Admin Broadcast"
                message={banner.message}
                reason={banner.expiresAt ? `Visible until ${new Date(banner.expiresAt).toLocaleTimeString()}` : undefined}
                ctaLabel="Dismiss"
                onCta={clearBanner}
                onDismiss={clearBanner}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {killSwitch.triggered && (
          <motion.div
            key="kill-switch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[13000] bg-slate-950/80 backdrop-blur-[12px] flex items-center justify-center px-4"
            style={{ pointerEvents: "auto" }}
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-2xl w-full mx-auto bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-slate-700/60 shadow-2xl rounded-3xl p-10 text-center text-slate-100 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.12),transparent_40%)] pointer-events-none" />
              <div className="relative space-y-5">
                <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/15 border border-rose-400/40 flex items-center justify-center shadow-inner">
                  <ShieldAlert className="h-8 w-8 text-rose-200" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-white">
                    Access Suspended
                  </h2>
                  <p className="text-base text-slate-200/80 leading-relaxed">
                    Your account access has been temporarily suspended by the Administrator. Please
                    contact support for further details.
                  </p>
                  {killSwitch.reason && (
                    <p className="text-sm text-rose-100/80 bg-rose-500/10 border border-rose-400/30 rounded-xl px-4 py-2 inline-block">
                      Reason: {killSwitch.reason}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button
                    asChild
                    size="lg"
                    className="min-w-[180px] bg-white text-slate-900 hover:bg-slate-100"
                  >
                    <a href={supportHref}>
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Support
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="min-w-[160px] border-slate-600 text-slate-100"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
