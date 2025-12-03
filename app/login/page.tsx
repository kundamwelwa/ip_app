"use client";

import { useState, Suspense } from "react";
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

function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
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
          subtitle="First Quantum Minerals • Zambia Operations"
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
              {/* Success Message */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-4 p-4 bg-green-500/10 border border-green-500/30 text-green-300 rounded-lg flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{message}</p>
                </motion.div>
              )}
              
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}
              
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
                    placeholder="kelly@firstquantum.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="bg-slate-800/50 border-amber-500/20 focus:border-amber-500/50 text-white placeholder:text-slate-400 h-11"
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
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="bg-slate-800/50 border-amber-500/20 focus:border-amber-500/50 text-white placeholder:text-slate-400 h-11"
                  />
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
                  Secured Network Infrastructure
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
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
            subtitle="First Quantum Minerals • Zambia Operations"
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
