import { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * Super Admin check:
 * The Super Admin is defined by the SUPER_ADMIN_EMAIL environment variable.
 * This guarantees exactly ONE Super Admin who has immutable access.
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  return !!superAdminEmail && email.toLowerCase() === superAdminEmail.toLowerCase();
}

/**
 * Granular Permission System:
 * We map roles to specific operations. The Super Admin bypasses these checks.
 */
export const PERMISSIONS: Record<string, string[]> = {
  VIEW_DASHBOARD: ["ADMIN", "MANAGER", "TECHNICIAN", "STANDARD_USER"],
  MANAGE_USERS: ["ADMIN", "SUPER_ADMIN"],
  ASSIGN_ROLES: ["SUPER_ADMIN"], // Only Super Admin can assign roles natively
  "equipment:write": ["ADMIN", "MANAGER", "SUPER_ADMIN"],
  "equipment:read": ["ADMIN", "MANAGER", "TECHNICIAN", "STANDARD_USER", "SUPER_ADMIN"],
  "ip:write": ["ADMIN", "MANAGER", "TECHNICIAN", "SUPER_ADMIN"],
  "ip:read": ["ADMIN", "MANAGER", "TECHNICIAN", "STANDARD_USER", "SUPER_ADMIN"],
  RESOLVE_ALERTS: ["ADMIN", "MANAGER", "SUPER_ADMIN"],
};

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(session: Session | null, permission: Permission): boolean {
  if (!session?.user?.email) return false;

  // Super Admin has immutable access to every operation
  if (isSuperAdmin(session.user.email) || session.user.role === "SUPER_ADMIN") {
    return true;
  }

  // If they don't have a role, deny access
  if (!session.user.role) return false;

  const allowedRoles = PERMISSIONS[permission] || [];
  if (allowedRoles.includes(session.user.role)) return true;

  // Granular Permission fallback – custom per-user permissions stored on the JWT
  const userPermissions = (session.user as any).permissions as string[];
  if (
    Array.isArray(userPermissions) &&
    (userPermissions.includes(permission) || userPermissions.includes("*"))
  ) {
    return true;
  }

  return false;
}

/**
 * Server-side Permission Guard to be used in API routes.
 *
 * Usage:
 *   const guard = await checkPermission('equipment:write');
 *   if (guard) return guard;
 */
export async function checkPermission(permission: Permission) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized – login required" }, { status: 401 });
  }

  if (!hasPermission(session, permission)) {
    // Best-effort audit log using console (SecurityAudit table pending migration)
    try {
      const headersList = await headers();
      const sourceIp =
        headersList.get("x-forwarded-for") ||
        headersList.get("remote-addr") ||
        "unknown";
      console.warn(
        `[RBAC][DENIED] user=${session.user.email} role=${session.user.role} ` +
          `permission=${permission} ip=${sourceIp}`
      );
    } catch {
      // Non-fatal
    }

    return NextResponse.json(
      { error: "Forbidden: You do not have permission to perform this action" },
      { status: 403 }
    );
  }

  return null;
}
