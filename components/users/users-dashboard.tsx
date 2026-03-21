"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserList } from "@/components/users/user-list";
import { UserStats } from "@/components/users/user-stats";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { UserSettings } from "@/components/users/user-settings";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ToastContainer } from "@/components/ui/toast-notification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  Settings,
  RefreshCw,
  Shield,
  Activity,
  Loader2,
  AlertTriangle,
  BarChart3,
  Ban,
  Clock4,
  Megaphone,
} from "lucide-react";

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "TECHNICIAN" | "STANDARD_USER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deactivationReason?: string | null;
  deactivatedAt?: string | null;
  deactivatedBy?: string | null;
  suspendedUntil?: string | null;
  bannerMessage?: string | null;
  bannerExpiresAt?: string | null;
  lastLogin?: string;
  permissions?: string[];
  _count?: {
    ipAssignments: number;
    auditLogs: number;
    reports: number;
  };
}

interface UsersDashboardProps {
  session: any;
}

export function UsersDashboard({ session }: UsersDashboardProps) {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<"deactivate" | "activate" | "suspend" | "banner">("deactivate");
  const [statusReason, setStatusReason] = useState("");
  const [suspendMinutes, setSuspendMinutes] = useState(30);
  const [statusBanner, setStatusBanner] = useState("");
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [killSwitchOpen, setKillSwitchOpen] = useState(false);
  const [killReason, setKillReason] = useState("Mass suspension triggered by Super Admin");
  const [killTarget, setKillTarget] = useState<"STANDARD_USER" | "ALL">("STANDARD_USER");
  const [killBanner, setKillBanner] = useState("");
  const [killLoading, setKillLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Toast notifications
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "warning" | "info" }>>([]);

  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Fetch users
  const fetchUsers = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const response = await fetch(`/api/users?t=${Date.now()}`);
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Auto-refresh every minute
    const interval = setInterval(() => {
      fetchUsers(false);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers(false);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setAddDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user");
      }

      setDeleteDialogOpen(false);
      await fetchUsers(false);
      showToast(`User ${selectedUser.firstName} ${selectedUser.lastName} deleted successfully`, "success");
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast(err instanceof Error ? err.message : "Failed to delete user", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusAction = (user: User, action: "deactivate" | "activate" | "suspend" | "banner" = user.isActive ? "deactivate" : "activate") => {
    setSelectedUser(user);
    setStatusAction(action);
    setStatusReason("");
    setSuspendMinutes(30);
    setStatusBanner("");
    setStatusDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setResetPasswordDialogOpen(true);
  };

  const submitStatusUpdate = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);

      if (statusAction === "banner" && !statusBanner.trim()) {
        showToast("Please provide a banner message to send.", "error");
        return;
      }

      const payload: any = {
        action: statusAction,
      };

      if (statusReason) payload.deactivationReason = statusReason;
      if (statusBanner) payload.bannerMessage = statusBanner;

      if (statusAction === "suspend" && suspendMinutes > 0) {
        payload.suspendedUntil = new Date(Date.now() + suspendMinutes * 60 * 1000).toISOString();
        if (!payload.deactivationReason) {
          payload.deactivationReason = `Suspended for ${suspendMinutes} minutes`;
        }
      }

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user status");
      }

      setStatusDialogOpen(false);
      await fetchUsers(false);

      const successMessage =
        statusAction === "activate"
          ? "User reactivated successfully"
          : statusAction === "banner"
            ? "Banner message sent"
            : statusAction === "suspend"
              ? `User suspended${suspendMinutes ? ` for ${suspendMinutes} minutes` : ""}`
              : "User deactivated";
      showToast(successMessage, "success");
    } catch (err) {
      console.error("Error updating user status:", err);
      showToast(err instanceof Error ? err.message : "Failed to update user status", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleKillSwitch = async () => {
    try {
      setKillLoading(true);
      const response = await fetch("/api/users/kill-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: killTarget,
          reason: killReason,
          bannerMessage: killBanner || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Kill-switch failed");
      }

      setKillSwitchOpen(false);
      await fetchUsers(false);
      showToast(`Kill-switch executed for ${killTarget === "ALL" ? "all users" : "Standard Users"}`, "warning");
    } catch (err) {
      console.error("Error triggering kill-switch:", err);
      showToast(err instanceof Error ? err.message : "Kill-switch failed", "error");
    } finally {
      setKillLoading(false);
    }
  };

  const confirmResetPassword = async () => {
    if (!selectedUser) return;

    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters long", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/users/${selectedUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reset password");
      }

      setResetPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      showToast(`Password reset successfully for ${selectedUser.firstName} ${selectedUser.lastName}`, "success");
    } catch (err) {
      console.error("Error resetting password:", err);
      showToast(err instanceof Error ? err.message : "Failed to reset password", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    admins: users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length,
    managers: users.filter((u) => u.role === "MANAGER").length,
    technicians: users.filter((u) => u.role === "TECHNICIAN").length,
    users: users.filter((u) => u.role === "STANDARD_USER").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading user management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage system users, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {session.user.role === "SUPER_ADMIN" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setKillSwitchOpen(true)}
            >
              <Ban className="h-4 w-4 mr-2" />
              Kill Switch
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm" onClick={handleAddUser}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Admin Badge */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Administrator Access
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            You have full access to user management and system settings
          </p>
        </div>
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

      {/* Statistics Cards */}
      <UserStats stats={stats} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/40 p-1 grid w-full grid-cols-2 gap-1">
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            <Users className="h-4 w-4 mr-2" />
            Users List
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            <Activity className="h-4 w-4 mr-2" />
            Activity & Analytics
          </TabsTrigger>
        </TabsList>

        {/* Users List Tab */}
        <TabsContent value="users">
          <UserList
            users={users}
            loading={refreshing}
            currentUserId={session.user.id}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onStatusAction={handleStatusAction}
            onResetPassword={handleResetPassword}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                User Activity & Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Activity tracking and analytics coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <UserFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={(message, type) => {
          fetchUsers(false);
          showToast(message, type);
        }}
        mode="add"
        isSuperAdmin={session.user.role === "SUPER_ADMIN"}
      />

      {/* Edit User Dialog */}
      <UserFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        onSuccess={(message, type) => {
          fetchUsers(false);
          showToast(message, type);
        }}
        mode="edit"
        isSuperAdmin={session.user.role === "SUPER_ADMIN"}
      />

      {/* Settings Dialog */}
      <UserSettings open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Delete Confirmation Dialog */}
      {selectedUser && (
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete User"
          description={`Are you sure you want to delete ${selectedUser.firstName} ${selectedUser.lastName}?`}
          confirmText="Delete User"
          cancelText="Cancel"
          onConfirm={confirmDeleteUser}
          variant="destructive"
          loading={actionLoading}
          details={[
            `${selectedUser._count?.ipAssignments || 0} IP assignments will be removed`,
            `${selectedUser._count?.reports || 0} reports will be deleted`,
            `Email: ${selectedUser.email}`,
          ]}
        />
      )}

      {/* Status / Suspension Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="border-2 border-amber-200 dark:border-amber-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              {statusAction === "activate"
                ? "Reactivate User"
                : statusAction === "suspend"
                  ? "Suspend User"
                  : statusAction === "banner"
                    ? "Send Banner Message"
                    : "Deactivate User"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser
                ? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="font-semibold">Action</Label>
                <Select
                  value={statusAction}
                  onValueChange={(v) => setStatusAction(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deactivate">Deactivate (hard off)</SelectItem>
                    <SelectItem value="suspend">Suspend with timer</SelectItem>
                    <SelectItem value="activate">Reactivate</SelectItem>
                    <SelectItem value="banner">Send banner only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold flex items-center gap-2">
                  <Clock4 className="h-4 w-4" />
                  Auto-reactivate (minutes)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={suspendMinutes}
                  onChange={(e) => setSuspendMinutes(Number(e.target.value))}
                  disabled={statusAction !== "suspend"}
                />
                <p className="text-xs text-muted-foreground">
                  Set to 0 for an indefinite suspension.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Reason</Label>
              <Textarea
                placeholder="Why is this user being deactivated or suspended?"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Banner message (optional)
              </Label>
              <Textarea
                placeholder="Warn the user before/while suspending. Example: “Please save your work; your session will end in 2 minutes.”"
                value={statusBanner}
                onChange={(e) => setStatusBanner(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Delivered immediately as a top-of-screen banner. Clears automatically after a few minutes or when emptied.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={submitStatusUpdate} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                "Apply"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mass Kill-Switch Dialog */}
      <Dialog open={killSwitchOpen} onOpenChange={setKillSwitchOpen}>
        <DialogContent className="border-2 border-red-200 dark:border-red-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Kill-Switch / Mass Suspension
            </DialogTitle>
            <DialogDescription>
              Immediately deactivate a cohort of users and invalidate all sessions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-semibold">Target audience</Label>
              <Select
                value={killTarget}
                onValueChange={(v) => setKillTarget(v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD_USER">All Standard Users</SelectItem>
                  <SelectItem value="ALL">Everyone (all roles)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Reason</Label>
              <Textarea
                value={killReason}
                onChange={(e) => setKillReason(e.target.value)}
                placeholder="Reason for mass suspension"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Banner message (optional)
              </Label>
              <Textarea
                value={killBanner}
                onChange={(e) => setKillBanner(e.target.value)}
                placeholder="Optional broadcast shown before logout"
              />
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-200">
              This immediately sets accounts to inactive, bumps session versions, and forces logout across all devices.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setKillSwitchOpen(false)} disabled={killLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleKillSwitch} disabled={killLoading}>
              {killLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Triggering...
                </>
              ) : (
                "Trigger Kill-Switch"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="border-2 border-blue-200 dark:border-blue-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Reset User Password
            </DialogTitle>
            <DialogDescription>
              {selectedUser && `Reset password for ${selectedUser.firstName} ${selectedUser.lastName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password" className="font-semibold">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 The user will need to use this new password on their next login
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordDialogOpen(false);
                setNewPassword("");
                setConfirmPassword("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={confirmResetPassword} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

