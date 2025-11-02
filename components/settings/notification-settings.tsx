"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Mail, AlertTriangle, FileText, Wrench, Loader2, Save } from "lucide-react";

interface NotificationSettingsProps {
  settings: {
    emailNotifications: boolean;
    alertNotifications: boolean;
    reportNotifications: boolean;
    maintenanceNotifications: boolean;
    emailDigest: "realtime" | "daily" | "weekly" | "never";
  };
  onUpdate: (updates: any) => Promise<void>;
  saving: boolean;
}

export function NotificationSettings({ settings, onUpdate, saving }: NotificationSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    await onUpdate(localSettings);
  };

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Control what notifications you receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Email Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive email notifications for important events
              </p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.emailNotifications}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, emailNotifications: e.target.checked })
              }
              className="h-4 w-4"
            />
          </div>

          {/* Alert Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                System Alerts
              </Label>
              <p className="text-xs text-muted-foreground">
                Get notified about system alerts and issues
              </p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.alertNotifications}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, alertNotifications: e.target.checked })
              }
              className="h-4 w-4"
            />
          </div>

          {/* Report Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Report Completion
              </Label>
              <p className="text-xs text-muted-foreground">
                Notify when your reports are ready
              </p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.reportNotifications}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, reportNotifications: e.target.checked })
              }
              className="h-4 w-4"
            />
          </div>

          {/* Maintenance Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Wrench className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                Maintenance Reminders
              </Label>
              <p className="text-xs text-muted-foreground">
                Reminders for equipment maintenance schedules
              </p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.maintenanceNotifications}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  maintenanceNotifications: e.target.checked,
                })
              }
              className="h-4 w-4"
            />
          </div>

          {/* Email Digest */}
          {localSettings.emailNotifications && (
            <div className="space-y-2">
              <Label htmlFor="email-digest" className="text-base font-semibold">
                Email Digest Frequency
              </Label>
              <Select
                value={localSettings.emailDigest}
                onValueChange={(value: any) =>
                  setLocalSettings({ ...localSettings, emailDigest: value })
                }
              >
                <SelectTrigger id="email-digest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time (Immediate)</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Digest</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Save Button */}
          {hasChanges && (
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

