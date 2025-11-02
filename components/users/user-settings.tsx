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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Loader2, Save } from "lucide-react";

interface UserSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserSettings({ open, onOpenChange }: UserSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    security: {
      passwordMinLength: 8,
      passwordExpireDays: 90,
      maxLoginAttempts: 5,
      sessionTimeoutMinutes: 60,
      requirePasswordChange: true,
    },
    registration: {
      allowSelfRegistration: false,
      defaultRole: "TECHNICIAN",
      requireEmailVerification: true,
      autoApproveAccounts: false,
    },
    notifications: {
      notifyOnNewUser: true,
      notifyOnUserDeactivation: true,
      notifyOnRoleChange: true,
      emailRecipients: "",
    },
    audit: {
      logUserActions: true,
      logLoginAttempts: true,
      logPasswordChanges: true,
      retentionDays: 365,
    },
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("userManagementSettings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (err) {
        console.error("Failed to load saved settings:", err);
      }
    }
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      // Save to localStorage (in production, this would be an API call)
      localStorage.setItem("userManagementSettings", JSON.stringify(settings));
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      alert("Settings saved successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            User Management Settings
          </DialogTitle>
          <DialogDescription>
            Configure user management, security, and access control settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="security" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password-min-length" className="font-semibold">
                  Minimum Password Length
                </Label>
                <Input
                  id="password-min-length"
                  type="number"
                  min="6"
                  max="32"
                  value={settings.security.passwordMinLength}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        passwordMinLength: parseInt(e.target.value),
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Minimum number of characters required for passwords
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-expire" className="font-semibold">
                  Password Expiration (days)
                </Label>
                <Input
                  id="password-expire"
                  type="number"
                  min="0"
                  max="365"
                  value={settings.security.passwordExpireDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        passwordExpireDays: parseInt(e.target.value),
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Days before users must change their password (0 to disable)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-login-attempts" className="font-semibold">
                  Maximum Login Attempts
                </Label>
                <Input
                  id="max-login-attempts"
                  type="number"
                  min="3"
                  max="10"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        maxLoginAttempts: parseInt(e.target.value),
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Account will be locked after this many failed attempts
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout" className="font-semibold">
                  Session Timeout (minutes)
                </Label>
                <Input
                  id="session-timeout"
                  type="number"
                  min="15"
                  max="480"
                  value={settings.security.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        sessionTimeoutMinutes: parseInt(e.target.value),
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Inactive users will be logged out after this duration
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Require Password Change on First Login
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    New users must change their password on first login
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.security.requirePasswordChange}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        requirePasswordChange: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>
            </div>
          </TabsContent>

          {/* Registration Settings */}
          <TabsContent value="registration" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Allow Self-Registration
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Users can create their own accounts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.registration.allowSelfRegistration}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registration: {
                        ...settings.registration,
                        allowSelfRegistration: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-role" className="font-semibold">
                  Default Role for New Users
                </Label>
                <Select
                  value={settings.registration.defaultRole}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      registration: {
                        ...settings.registration,
                        defaultRole: value,
                      },
                    })
                  }
                >
                  <SelectTrigger id="default-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TECHNICIAN">Technician</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Require Email Verification
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Users must verify their email before accessing the system
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.registration.requireEmailVerification}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registration: {
                        ...settings.registration,
                        requireEmailVerification: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Auto-Approve New Accounts
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Accounts are immediately active without admin approval
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.registration.autoApproveAccounts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registration: {
                        ...settings.registration,
                        autoApproveAccounts: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Notify on New User Registration
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Send notification when a new user registers
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.notifyOnNewUser}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        notifyOnNewUser: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Notify on User Deactivation
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Send notification when a user is deactivated
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.notifyOnUserDeactivation}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        notifyOnUserDeactivation: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Notify on Role Changes
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Send notification when a user's role is changed
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.notifyOnRoleChange}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        notifyOnRoleChange: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-recipients" className="font-semibold">
                  Notification Recipients
                </Label>
                <Input
                  id="email-recipients"
                  placeholder="admin@company.com, manager@company.com"
                  value={settings.notifications.emailRecipients}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        emailRecipients: e.target.value,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of email addresses
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Audit Settings */}
          <TabsContent value="audit" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Log User Actions</Label>
                  <p className="text-xs text-muted-foreground">
                    Record all user actions in audit log
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.audit.logUserActions}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      audit: {
                        ...settings.audit,
                        logUserActions: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Log Login Attempts</Label>
                  <p className="text-xs text-muted-foreground">
                    Record all login attempts (successful and failed)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.audit.logLoginAttempts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      audit: {
                        ...settings.audit,
                        logLoginAttempts: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Log Password Changes
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Record when users change their passwords
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.audit.logPasswordChanges}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      audit: {
                        ...settings.audit,
                        logPasswordChanges: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retention-days" className="font-semibold">
                  Audit Log Retention (days)
                </Label>
                <Input
                  id="retention-days"
                  type="number"
                  min="30"
                  max="730"
                  value={settings.audit.retentionDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      audit: {
                        ...settings.audit,
                        retentionDays: parseInt(e.target.value),
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Audit logs will be kept for this many days
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              // Reload settings from localStorage to discard changes
              const savedSettings = localStorage.getItem("userManagementSettings");
              if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
              }
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

