"use client";

import { SessionProvider } from "next-auth/react";
import { SessionTimeoutWarning } from "@/components/ui/session-timeout-warning";

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
      <SessionTimeoutWarning />
    </SessionProvider>
  );
}
