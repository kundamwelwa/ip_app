"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus, Save, AlertCircle } from "lucide-react";
import { User } from "./users-dashboard";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess: (message: string, type?: "success" | "error") => void;
  mode: "add" | "edit";
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
  mode,
}: UserFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    role: "TECHNICIAN" as "ADMIN" | "MANAGER" | "TECHNICIAN",
    password: "",
    confirmPassword: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load user data when editing
  useEffect(() => {
    if (mode === "edit" && user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: user.department,
        role: user.role,
        password: "",
        confirmPassword: "",
        isActive: user.isActive,
      });
    } else {
      // Reset form when adding new user
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        department: "",
        role: "TECHNICIAN",
        password: "",
        confirmPassword: "",
        isActive: true,
      });
    }
    setErrors({});
  }, [mode, user, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.department.trim()) {
      newErrors.department = "Department is required";
    }

    // Password validation only for new users
    if (mode === "add") {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      setSubmitError(null);

      const url = mode === "add" ? "/api/users" : `/api/users/${user?.id}`;
      const method = mode === "add" ? "POST" : "PATCH";

      const body: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        department: formData.department,
        role: formData.role,
        isActive: formData.isActive,
      };

      // Only include password for new users
      if (mode === "add") {
        body.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${mode} user`);
      }

      const successMessage = `User ${formData.firstName} ${formData.lastName} ${mode === "add" ? "created" : "updated"} successfully!`;
      onSuccess(successMessage, "success");
      onOpenChange(false);
    } catch (err) {
      console.error(`Error ${mode}ing user:`, err);
      setSubmitError(err instanceof Error ? err.message : `Failed to ${mode} user`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "add" ? (
              <>
                <UserPlus className="h-5 w-5 text-primary" />
                Add New User
              </>
            ) : (
              <>
                <Save className="h-5 w-5 text-primary" />
                Edit User
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Create a new user account for the system"
              : "Update user information and permissions"}
          </DialogDescription>
        </DialogHeader>

        {/* Error Display */}
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {submitError}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4 py-4">
          {/* Personal Information */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-sm font-semibold">Personal Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="font-semibold">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="John"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="font-semibold">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Doe"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john.doe@company.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Role & Department */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-sm font-semibold">Role & Department</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department" className="font-semibold">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  placeholder="Engineering"
                  className={errors.department ? "border-red-500" : ""}
                />
                {errors.department && (
                  <p className="text-xs text-red-500">{errors.department}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="font-semibold">
                  User Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="TECHNICIAN">Technician</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.role === "ADMIN" && "Full system access"}
                  {formData.role === "MANAGER" && "Management and reporting access"}
                  {formData.role === "TECHNICIAN" && "Operational access only"}
                </p>
              </div>
            </div>
          </div>

          {/* Password (only for new users) */}
          {mode === "add" && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="text-sm font-semibold">Account Security</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-semibold">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Min 8 characters"
                    className={errors.password ? "border-red-500" : ""}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-semibold">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Re-enter password"
                    className={errors.confirmPassword ? "border-red-500" : ""}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Account Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Account Status</Label>
              <p className="text-xs text-muted-foreground">
                {formData.isActive
                  ? "User can access the system"
                  : "User account is disabled"}
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="h-4 w-4"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mode === "add" ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>
                {mode === "add" ? (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create User
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

