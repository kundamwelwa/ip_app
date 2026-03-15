"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { UsersDashboard } from "@/components/users/users-dashboard";

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Redirect non-admins
  useEffect(() => {
    if (session?.user && !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return null;
  }

  return (
    <DashboardLayout>
      <UsersDashboard session={session} />
    </DashboardLayout>
  );
}

