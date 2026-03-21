"use client";

import { Suspense, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { validatePassword } from "@/lib/password-validation";
import { AnimatedGridBackground } from "@/components/ui/animated-grid-background";
import { AuthFormSkeleton } from "@/components/ui/auth-skeleton";
import { RegisterFormData } from "@/types/auth";
import { UserPlus, Mail, User, Briefcase, Shield, Lock, AlertCircle, CheckCircle2, Key } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function RegisterForm() {
  const searchParams = useSearchParams();
  const isBootstrap = searchParams.get("bootstrap") === "true";

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    role: "STANDARD_USER",
    setupToken: "",
  });

  const [passwordStrength, setPasswordStrength] = useState(validatePassword(""));
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!passwordStrength.isValid) {
      openModal("error", "Password requirements", "Password does not meet security requirements.");
      setIsLoading(false);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      openModal("error", "Password mismatch", "Passwords do not match.");
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        openModal("success", "Account created", "Account created successfully! Redirecting to sign in.");
        // Registration successful, redirect to login after a brief delay
        setTimeout(() => {
          window.location.href = "/login?message=Registration successful. Please sign in.";
        }, 1500);
      } else {
        const errorData = await response.json();
        openModal("error", "Registration failed", errorData.error || "Registration failed.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      openModal("error", "Registration failed", "Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Update password strength when password changes
    if (name === "password") {
      setPasswordStrength(validatePassword(value));
    }
  };

  const handleRoleChange = (value: "ADMIN" | "MANAGER" | "TECHNICIAN" | "STANDARD_USER") => {
    setFormData({
      ...formData,
      role: value,
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

      {/* Right side - Register Form */}
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
                <UserPlus className="w-8 h-8 text-amber-500" />
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
                Create Account
              </CardTitle>
              <CardDescription className="text-amber-100/60 text-base">
                Join the network management team
          </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-amber-100/80 font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="bg-slate-800/50 border-amber-500/20 focus:border-amber-500/50 text-white placeholder:text-slate-400 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-amber-100/80 font-medium">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="bg-slate-800/50 border-amber-500/20 focus:border-amber-500/50 text-white placeholder:text-slate-400 h-11"
                    />
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
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
                    className="bg-slate-800/50 border-amber-500/20 focus:border-amber-500/50 text-white placeholder:text-slate-400 h-11"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label htmlFor="department" className="text-amber-100/80 font-medium flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Department
                  </Label>
                  <Input
                    id="department"
                    name="department"
                    type="text"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="bg-slate-800/50 border-amber-500/20 focus:border-amber-500/50 text-white placeholder:text-slate-400 h-11"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="space-y-2"
                >
                  <Label htmlFor="role" className="text-amber-100/80 font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Role
                  </Label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="bg-slate-800/50 border-amber-500/20 focus:border-amber-500/50 text-white h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-amber-500/30">
                      <SelectItem value="ADMIN" className="text-white hover:bg-amber-500/10">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-amber-500" />
                          Administrator
                        </div>
                      </SelectItem>
                      <SelectItem value="MANAGER" className="text-white hover:bg-amber-500/10">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-amber-500" />
                          Network Manager
                        </div>
                      </SelectItem>
                      <SelectItem value="TECHNICIAN" className="text-white hover:bg-amber-500/10">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-amber-500" />
                          Network Technician
                        </div>
                      </SelectItem>
                      <SelectItem value="STANDARD_USER" className="text-white hover:bg-amber-500/10">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-amber-500" />
                          Standard User
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                {isBootstrap && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="setupToken" className="text-amber-100/80 font-medium flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Setup Token (Secret Handshake)
                    </Label>
                    <Input
                      id="setupToken"
                      name="setupToken"
                      type="password"
                      value={formData.setupToken}
                      onChange={handleInputChange}
                      placeholder="Enter bootstrap token"
                      className="bg-slate-800/50 border-amber-500/20 focus:border-amber-500/50 text-white placeholder:text-slate-400 h-11"
                    />
                  </motion.div>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
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
                    showStrength={true}
                    strength={passwordStrength}
                    required
                    className="bg-slate-800/50 border-amber-500/20 focus:border-amber-500/50 text-white placeholder:text-slate-400 h-11"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="space-y-2"
                >
                  <Label htmlFor="confirmPassword" className="text-amber-100/80 font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirm Password
                  </Label>
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="bg-slate-800/50 border-amber-500/20 focus:border-amber-500/50 text-white placeholder:text-slate-400 h-11"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-900 font-semibold shadow-lg shadow-amber-500/20 transition-all duration-300"
                    disabled={isLoading || success}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full"
                        />
                        Creating Account...
                      </span>
                    ) : success ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Success!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-6 text-center"
              >
                <p className="text-sm text-amber-100/50">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                  >
                    Sign in
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
              type="button"
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

export default function RegisterPage() {
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
      <RegisterForm />
    </Suspense>
  );
}
