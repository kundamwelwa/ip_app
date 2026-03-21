import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      department: string
      sessionVersion?: number
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    department: string
    sessionVersion?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    department: string
    sessionVersion?: number
    permissions?: string[]
  }
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "TECHNICIAN" | "STANDARD_USER";
  setupToken?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "TECHNICIAN" | "STANDARD_USER";
  isActive: boolean;
  deactivationReason?: string | null;
  suspendedUntil?: Date | null;
  bannerMessage?: string | null;
  bannerExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
