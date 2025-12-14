"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedGridBackground } from "@/components/ui/animated-grid-background";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to send reset email");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
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

      {/* Right side - Forgot Password Form */}
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
                <Mail className="w-8 h-8 text-amber-500" />
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
                Forgot Password
              </CardTitle>
              <CardDescription className="text-amber-100/60 text-base">
                Enter your email to receive a password reset link
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-300 mb-2">
                      Check Your Email
                    </h3>
                    <p className="text-sm text-amber-100/70">
                      We&apos;ve sent a password reset link to{" "}
                      <span className="font-semibold text-amber-200">{email}</span>
                    </p>
                    <p className="text-xs text-amber-100/50 mt-2">
                      Please check your inbox and follow the instructions to reset your password.
                    </p>
                  </div>
                  <Link href="/login">
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-900 font-semibold">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <>
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-slate-800/50 border-amber-500/20 focus:border-amber-500/50 text-white h-11"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
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
                            Sending...
                          </span>
                        ) : (
                          "Send Reset Link"
                        )}
                      </Button>
                    </motion.div>
                  </form>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 text-center"
                  >
                    <Link
                      href="/login"
                      className="text-sm text-amber-100/50 hover:text-amber-300 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </Link>
                  </motion.div>
                </>
              )}

              {/* Mining Theme Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
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
    </div>
  );
}

