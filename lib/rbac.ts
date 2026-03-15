import { Session } from "next-auth";

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
  VIEW_DASHBOARD: ["ADMIN", "MANAGER", "TECHNICIAN"],
  MANAGE_USERS: ["ADMIN"],
  ASSIGN_ROLES: [], // Only Super Admin can assign roles natively
  MANAGE_EQUIPMENT: ["ADMIN", "MANAGER"],
  VIEW_EQUIPMENT: ["ADMIN", "MANAGER", "TECHNICIAN"],
  MANAGE_IP: ["ADMIN", "MANAGER", "TECHNICIAN"],
  RESOLVE_ALERTS: ["ADMIN", "MANAGER"],
};

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(session: Session | null, permission: Permission): boolean {
  if (!session?.user?.email) return false;
  
  // Super Admin has immutable access to every operation
  if (isSuperAdmin(session.user.email)) {
    return true;
  }

  // If they don't have a role or they are PENDING (which we represent via no role access)
  if (!session.user.role) return false;

  const allowedRoles = PERMISSIONS[permission] || [];
  if (allowedRoles.includes(session.user.role)) return true;

  // Granular Permission fallback
  const userPermissions = (session.user as any).permissions as string[];
  if (Array.isArray(userPermissions) && (userPermissions.includes(permission) || userPermissions.includes("*"))) {
    return true;
  }

  return false;
}
