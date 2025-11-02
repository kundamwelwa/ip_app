"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Lock,
  Key,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface ProfileSecurityProps {
  profile: UserProfile;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

export function ProfileSecurity({ profile, onChangePassword }: ProfileSecurityProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    return Math.min(strength, 100);
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 40) return "bg-red-500";
    if (strength < 70) return "bg-orange-500";
    return "bg-green-500";
  };

  const getStrengthText = (strength: number) => {
    if (strength < 40) return "Weak";
    if (strength < 70) return "Medium";
    return "Strong";
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (newPassword === currentPassword) {
      newErrors.newPassword = "New password must be different from current password";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const success = await onChangePassword(currentPassword, newPassword);
      
      if (success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      {/* Change Password Card */}
      <Card className="border-2 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password" className="font-semibold">
              Current Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className={errors.currentPassword ? "border-red-500" : ""}
            />
            {errors.currentPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password" className="font-semibold">
              New Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 8 characters)"
              className={errors.newPassword ? "border-red-500" : ""}
            />
            {newPassword && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Password Strength:</span>
                  <span className={`font-semibold ${passwordStrength < 40 ? "text-red-600" : passwordStrength < 70 ? "text-orange-600" : "text-green-600"}`}>
                    {getStrengthText(passwordStrength)}
                  </span>
                </div>
                <Progress value={passwordStrength} className={`h-2 ${getStrengthColor(passwordStrength)}`} />
              </div>
            )}
            {errors.newPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="font-semibold">
              Confirm New Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className={errors.confirmPassword ? "border-red-500" : ""}
            />
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Passwords match
              </p>
            )}
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Password Requirements:
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li className="flex items-center gap-2">
                {newPassword.length >= 8 ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                )}
                At least 8 characters
              </li>
              <li className="flex items-center gap-2">
                {/[A-Z]/.test(newPassword) ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                )}
                One uppercase letter
              </li>
              <li className="flex items-center gap-2">
                {/[a-z]/.test(newPassword) ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                )}
                One lowercase letter
              </li>
              <li className="flex items-center gap-2">
                {/[0-9]/.test(newPassword) ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                )}
                One number
              </li>
            </ul>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Changing Password...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Security Information
          </CardTitle>
          <CardDescription>Your account security status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium">Account Active</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email Verified:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">Yes</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Two-Factor Auth:</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">Not Enabled</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Password Change:</span>
              <span className="font-semibold">Never</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

