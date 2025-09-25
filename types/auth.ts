import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      department: string
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    department: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    department: string
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
  role: "ADMIN" | "MANAGER" | "TECHNICIAN";
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: "ADMIN" | "MANAGER" | "TECHNICIAN";
  createdAt: Date;
  updatedAt: Date;
}
