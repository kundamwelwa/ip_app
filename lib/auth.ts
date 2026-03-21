import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const ip = req.headers?.['x-forwarded-for'] || '127.0.0.1';
        if (typeof ip === 'string' && !checkRateLimit(ip)) {
          throw new Error("Too many login attempts, please try again later.");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        // Enforcement: Must be @fqml.com strictly
        if (!normalizedEmail.endsWith('@fqml.com')) {
          throw new Error("Login is restricted strictly to @fqml.com domains.");
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!user) {
            throw new Error("Invalid email, password, or your account resides in a pending/unauthorized state.");
          }

          // Auto re-activate if suspension period has passed
          const now = new Date();
          let effectiveUser = user as any;
          if (user.suspendedUntil && user.suspendedUntil <= now) {
            effectiveUser = await prisma.user.update({
              where: { id: user.id },
              data: {
                isActive: true,
                suspendedUntil: null,
                deactivationReason: null,
                sessionVersion: { increment: 1 },
              },
            });
          }

          if (!effectiveUser.isActive && normalizedEmail !== (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase()) {
            const reason = effectiveUser.deactivationReason || "Account is inactive or pending Super Admin approval.";
            throw new Error(reason);
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            effectiveUser.password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid email, password, or your account resides in a pending/unauthorized state.");
          }

          // Register successful login IP explicitly (Audit Trail extension)
          if (typeof ip === 'string') {
            await prisma.user.update({
              where: { id: effectiveUser.id },
              data: { lastLoginIp: ip } as any,
            });
          }

          return {
            id: effectiveUser.id,
            email: effectiveUser.email,
            name: `${effectiveUser.firstName} ${effectiveUser.lastName}`,
            role: effectiveUser.role,
            department: effectiveUser.department,
            sessionVersion: (effectiveUser as any).sessionVersion || 0,
            permissions: (effectiveUser as any).permissions || [],
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          throw new Error(error.message || "Authentication failed.");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes in seconds
    updateAge: 5 * 60, // Update session every 5 minutes if active
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in
      if (user) {
        token.role = user.role;
        token.department = user.department;
        token.sessionVersion = (user as any).sessionVersion;
        token.permissions = (user as any).permissions;
      }
      
      // On every subsequent request, we do a lightweight check against the DB
      // to guarantee immediate session termination if privileges are revoked
      if (token?.sub) {
        try {
          // If you see performance issues, this could be cached in Redis.
          const freshUser = await prisma.user.findUnique({
            where: { id: token.sub },
          }) as any;

          if (!freshUser) {
            return { ...token, error: "SessionTerminated" }; 
          }

          const now = new Date();
          if (freshUser.suspendedUntil && freshUser.suspendedUntil <= now) {
            const reactivated = await prisma.user.update({
              where: { id: freshUser.id },
              data: {
                isActive: true,
                suspendedUntil: null,
                deactivationReason: null,
                sessionVersion: { increment: 1 },
              },
            });
            freshUser.isActive = reactivated.isActive;
            freshUser.sessionVersion = reactivated.sessionVersion;
            freshUser.deactivationReason = reactivated.deactivationReason;
          }

          if (!freshUser.isActive) {
            return { ...token, error: "SessionTerminated" }; 
          }

          // If session version changed (e.g. Super Admin modified privileges), terminate
          if (freshUser.sessionVersion !== token.sessionVersion) {
            return { ...token, error: "SessionTerminated" };
          }
          
          // Keep token in sync with DB
          token.role = freshUser.role;
          token.department = freshUser.department;
          token.permissions = freshUser.permissions;
          token.sessionVersion = freshUser.sessionVersion;
        } catch (error) {
          // Fallback to existing token in case of DB transient error
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        if (token.error === "SessionTerminated") {
          // By returning an empty or invalid session, the client is forced out
          // Provide an empty/broken session object to NextAuth
          return { ...session, error: "RefreshAccessTokenError" } as any;
        }

        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.department = token.department as string;
        (session.user as any).permissions = token.permissions;
        (session.user as any).sessionVersion = token.sessionVersion;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
