"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProfileInfo } from "@/components/profile/profile-info";
import { ProfileSecurity } from "@/components/profile/profile-security";
import { ProfileActivity } from "@/components/profile/profile-activity";
import { ToastContainer } from "@/components/ui/toast-notification";
import {
  User,
  Shield,
  Activity,
  Loader2,
  AlertTriangle,
  Save,
  RefreshCw,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profilePicture?: string;
  phoneNumber?: string;
  _count?: {
    ipAssignments: number;
    auditLogs: number;
    reports: number;
  };
}

interface ProfileDashboardProps {
  session: any;
}

export function ProfileDashboard({ session }: ProfileDashboardProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "warning" | "info" }>>([]);

  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Fetch profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");

      const data = await response.json();
      setProfile(data.profile);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle profile update
  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setSaving(true);
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      await fetchProfile();
      showToast("Profile updated successfully!", "success");
    } catch (err) {
      console.error("Error updating profile:", err);
      showToast(err instanceof Error ? err.message : "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change password");
      }

      showToast("Password changed successfully!", "success");
      return true;
    } catch (err) {
      console.error("Error changing password:", err);
      showToast(err instanceof Error ? err.message : "Failed to change password", "error");
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              {error || "Failed to load profile"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information and account settings
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchProfile}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/40 p-1 grid w-full grid-cols-3 gap-1">
          <TabsTrigger
            value="info"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            <User className="h-4 w-4 mr-2" />
            Personal Info
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="info">
          <ProfileInfo
            profile={profile}
            onUpdate={handleUpdateProfile}
            saving={saving}
          />
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <ProfileSecurity
            profile={profile}
            onChangePassword={handleChangePassword}
          />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <ProfileActivity profile={profile} />
        </TabsContent>
      </Tabs>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

