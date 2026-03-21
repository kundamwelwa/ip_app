"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { createClient } from "@/lib/client";

type BannerState = {
  message: string;
  expiresAt?: string | null;
};

type KillSwitchState = {
  triggered: boolean;
  reason?: string;
  deactivatedAt?: string | null;
};

export function useKillSwitch() {
  const { data: session, status } = useSession();
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [killSwitch, setKillSwitch] = useState<KillSwitchState>({
    triggered: false,
    reason: undefined,
    deactivatedAt: undefined,
  });

  const canUseSupabase = useMemo(
    () =>
      Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      ),
    []
  );

  const handleStatusPayload = (record: any) => {
    if (!record) return;

    // Handle banner broadcast
    if (record.bannerMessage) {
      const expiresAt = record.bannerExpiresAt
        ? new Date(record.bannerExpiresAt).toISOString()
        : undefined;
      setBanner({ message: record.bannerMessage, expiresAt });
    } else {
      setBanner(null);
    }

    // Handle kill-switch
    if (record.isActive === false) {
      setKillSwitch({
        triggered: true,
        reason: record.deactivationReason || "Account access disabled by administrator.",
        deactivatedAt: record.deactivatedAt,
      });
    }
  };

  // Supabase realtime subscription
  useEffect(() => {
    if (!session?.user?.id || status !== "authenticated" || !canUseSupabase) {
      return;
    }

    const client = createClient();
    const channel = client
      .channel(`user-status-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${session.user.id}`,
        },
        (payload) => {
          handleStatusPayload(payload.new);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [session?.user?.id, status, canUseSupabase]);

  // Polling fallback to guarantee updates even without realtime
  useEffect(() => {
    if (!session?.user?.id || status !== "authenticated") return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/users/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          handleStatusPayload(data.user);
        }
      } catch (error) {
        // best-effort; ignore polling errors
      }
    };

    // Immediate check + interval
    poll();
    const interval = setInterval(poll, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session?.user?.id, status]);

  // Expire banner locally when expiresAt elapses
  useEffect(() => {
    if (!banner?.expiresAt) return;
    const expires = new Date(banner.expiresAt).getTime();
    const now = Date.now();
    if (expires <= now) {
      setBanner(null);
      return;
    }
    const timer = setTimeout(() => setBanner(null), expires - now);
    return () => clearTimeout(timer);
  }, [banner]);

  return {
    banner,
    killSwitch,
    clearBanner: () => setBanner(null),
  };
}
