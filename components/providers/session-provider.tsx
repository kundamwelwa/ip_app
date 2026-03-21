"use client";

import { SessionProvider } from "next-auth/react";
import { SessionTimeoutWarning } from "@/components/ui/session-timeout-warning";
import { KillSwitchOverlay } from "@/components/ui/kill-switch-overlay";

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
      <SessionTimeoutWarning />
      <KillSwitchOverlay />
    </SessionProvider>
  );
}
