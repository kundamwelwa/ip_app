"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { AnimatedGridBackground } from "@/components/ui/animated-grid-background";
import { AuthFormSkeleton } from "@/components/ui/auth-skeleton";
import { LoginFormData } from "@/types/auth";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { AdminBanner } from "@/components/ui/admin-banner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [modalState, setModalState] = useState<{
    open: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const reasonParam = searchParams.get("reason");
  const detailParam = searchParams.get("detail");
  const titleParam = searchParams.get("title");
  const [adminNotice, setAdminNotice] = useState<{
    title: string;
    message: string;
    reason?: string;
  } | null>(null);

  const openModal = useCallback(
    (
      type: "success" | "error",
      title: string,
      message: string
    ) => {
      setModalState({ open: true, type, title, message });
    },
    []
  );

  useEffect(() => {
    if (message) {
      openModal("success", "Success", message);
    }
  }, [message, openModal]);

  useEffect(() => {
    if (reasonParam) {
      setAdminNotice({
        title: titleParam || "Sign-in failed",
        message: detailParam || "Your account has a restriction applied by an administrator.",
        reason: reasonParam,
      });
    }
  }, [reasonParam, detailParam, titleParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        // NextAuth overrides errors with "CredentialsSignin" by default unless configured.
        // If it throws "CredentialsSignin", give a generic broad error.
        // If our thrown error bubbles up, we can print it.
        const errorMessage = result.error === "CredentialsSignin" 
          ? "Invalid email, password, or your account resides in a pending/unauthorized state."
          : result.error;
        setAdminNotice({
          title: "Sign-in failed",
          message: errorMessage,
          reason: errorMessage,
        });
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      openModal("error", "Sign-in failed", "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-900">
      {/* Left side - Animated Background */}
      <div className="hidden lg:block lg:w-1/2 fixed left-0 top-0 h-screen">
        <AnimatedGridBackground
          imageSrc="/authimage.jpg"
          systemName="Rajant Mesh Network"
          subtitle="IP Address • Management System"
        />
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 lg:ml-auto flex items-center justify-center p-8 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {adminNotice && (
            <div className="mb-4">
              <AdminBanner
                title={adminNotice.title}
                message={adminNotice.message}
                reason={adminNotice.reason}
                ctaLabel="Got it"
                onCta={() => setAdminNotice(null)}
                onDismiss={() => setAdminNotice(null)}
              />
            </div>
          )}
          <Card className="border-amber-500/20 bg-gradient-to-br from-slate-900/95 via-zinc-900/95 to-slate-900/95 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mx-auto mb-2 w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-600/20 flex items-center justify-center border border-amber-500/30"
              >
                <Lock className="w-8 h-8 text-amber-500" />
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-amber-100/60 text-base">
                Sign in to access the IP Management System
          </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email" className="text-amber-100/80 font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="bg-slate-800/50 border-amber-500/20 focus:border-amber-500/50 text-white h-11"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-amber-100/80 font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <PasswordInput
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="bg-slate-800/50 border-amber-500/20 focus:border-amber-500/50 text-white placeholder:text-slate-400 h-11"
                  />
                  <div className="flex justify-end mt-1">
                    <Link
                      href="/forgot-password"
                      className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-900 font-semibold shadow-lg shadow-amber-500/20 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full"
                        />
                        Signing In...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </motion.div>
              </form>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 text-center"
              >
                <p className="text-sm text-amber-100/50">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </motion.div>
              
              {/* Mining Theme Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 pt-6 border-t border-amber-500/10 text-center"
              >
                <p className="text-xs text-amber-100/30 flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  Manage your IP addresses effectively
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog
        open={modalState.open}
        onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="bg-slate-900 border border-amber-500/30 text-white shadow-2xl">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-2">
              {modalState.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              <DialogTitle className="text-xl font-semibold">
                {modalState.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-amber-100/70 mt-1">
              {modalState.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
              onClick={() =>
                setModalState((prev) => ({ ...prev, open: false }))
              }
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-900">
        <div className="hidden lg:block lg:w-1/2 fixed left-0 top-0 h-screen">
          <AnimatedGridBackground
            imageSrc="/authimage.jpg"
            systemName="Rajant Mesh Network"
            subtitle="IP Address • Management System"
          />
        </div>
        <div className="w-full lg:w-1/2 lg:ml-auto flex items-center justify-center p-8 min-h-screen">
          <AuthFormSkeleton />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
