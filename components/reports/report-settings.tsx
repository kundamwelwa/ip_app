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

interface ReportSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportSettings({ open, onOpenChange }: ReportSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    general: {
      defaultFormat: "pdf",
      autoSave: true,
      retentionDays: 90,
      compressionEnabled: true,
    },
    scheduling: {
      enableScheduling: false,
      defaultSchedule: "weekly",
      scheduleTime: "09:00",
      emailNotifications: true,
    },
    export: {
      includeCharts: true,
      includeRawData: false,
      watermark: true,
      pageSize: "A4",
      orientation: "portrait",
    },
    notifications: {
      onCompletion: true,
      onFailure: true,
      emailRecipients: "",
      slackWebhook: "",
    },
    performance: {
      maxConcurrentReports: 3,
      cacheResults: true,
      cacheDuration: 24,
      compressionLevel: "medium",
    },
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("reportSettings");
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
      localStorage.setItem("reportSettings", JSON.stringify(settings));
      
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
            Report Settings
          </DialogTitle>
          <DialogDescription>
            Configure report generation, export, and notification settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-format" className="font-semibold">
                  Default Export Format
                </Label>
                <Select
                  value={settings.general.defaultFormat}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, defaultFormat: value },
                    })
                  }
                >
                  <SelectTrigger id="default-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel (XLSX)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the default format for exported reports
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Auto-Save Reports</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically save generated reports to the database
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.general.autoSave}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, autoSave: e.target.checked },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retention-days" className="font-semibold">
                  Report Retention Period (days)
                </Label>
                <Input
                  id="retention-days"
                  type="number"
                  min="1"
                  max="365"
                  value={settings.general.retentionDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: {
                        ...settings.general,
                        retentionDays: parseInt(e.target.value),
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Old reports will be automatically archived after this period
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Enable Compression</Label>
                  <p className="text-xs text-muted-foreground">
                    Compress reports to save storage space
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.general.compressionEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: {
                        ...settings.general,
                        compressionEnabled: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>
            </div>
          </TabsContent>

          {/* Scheduling Settings */}
          <TabsContent value="scheduling" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Enable Report Scheduling</Label>
                  <p className="text-xs text-muted-foreground">
                    Schedule reports to run automatically
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.scheduling.enableScheduling}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      scheduling: {
                        ...settings.scheduling,
                        enableScheduling: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              {settings.scheduling.enableScheduling && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="default-schedule" className="font-semibold">
                      Default Schedule Frequency
                    </Label>
                    <Select
                      value={settings.scheduling.defaultSchedule}
                      onValueChange={(value) =>
                        setSettings({
                          ...settings,
                          scheduling: {
                            ...settings.scheduling,
                            defaultSchedule: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger id="default-schedule">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule-time" className="font-semibold">
                      Preferred Generation Time
                    </Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={settings.scheduling.scheduleTime}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          scheduling: {
                            ...settings.scheduling,
                            scheduleTime: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Send email when scheduled reports are ready
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.scheduling.emailNotifications}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          scheduling: {
                            ...settings.scheduling,
                            emailNotifications: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4"
                    />
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Export Settings */}
          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Include Charts & Graphs</Label>
                  <p className="text-xs text-muted-foreground">
                    Add visual charts to exported reports
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.export.includeCharts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      export: { ...settings.export, includeCharts: e.target.checked },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Include Raw Data</Label>
                  <p className="text-xs text-muted-foreground">
                    Append raw data tables to reports
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.export.includeRawData}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      export: { ...settings.export, includeRawData: e.target.checked },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Add Watermark</Label>
                  <p className="text-xs text-muted-foreground">
                    Add company watermark to PDF reports
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.export.watermark}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      export: { ...settings.export, watermark: e.target.checked },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="page-size" className="font-semibold">
                  Page Size
                </Label>
                <Select
                  value={settings.export.pageSize}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      export: { ...settings.export, pageSize: value },
                    })
                  }
                >
                  <SelectTrigger id="page-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orientation" className="font-semibold">
                  Page Orientation
                </Label>
                <Select
                  value={settings.export.orientation}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      export: { ...settings.export, orientation: value },
                    })
                  }
                >
                  <SelectTrigger id="orientation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Notify on Completion</Label>
                  <p className="text-xs text-muted-foreground">
                    Send notification when report generation completes
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.onCompletion}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        onCompletion: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Notify on Failure</Label>
                  <p className="text-xs text-muted-foreground">
                    Send notification when report generation fails
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.onFailure}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        onFailure: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-recipients" className="font-semibold">
                  Email Recipients
                </Label>
                <Input
                  id="email-recipients"
                  placeholder="user1@example.com, user2@example.com"
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

              <div className="space-y-2">
                <Label htmlFor="slack-webhook" className="font-semibold">
                  Slack Webhook URL (Optional)
                </Label>
                <Input
                  id="slack-webhook"
                  placeholder="https://hooks.slack.com/services/..."
                  value={settings.notifications.slackWebhook}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        slackWebhook: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Performance Settings */}
          <TabsContent value="performance" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-concurrent" className="font-semibold">
                  Max Concurrent Reports
                </Label>
                <Input
                  id="max-concurrent"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.performance.maxConcurrentReports}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      performance: {
                        ...settings.performance,
                        maxConcurrentReports: parseInt(e.target.value),
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of reports that can be generated simultaneously
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Cache Results</Label>
                  <p className="text-xs text-muted-foreground">
                    Cache report data to improve performance
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.performance.cacheResults}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      performance: {
                        ...settings.performance,
                        cacheResults: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
              </div>

              {settings.performance.cacheResults && (
                <div className="space-y-2">
                  <Label htmlFor="cache-duration" className="font-semibold">
                    Cache Duration (hours)
                  </Label>
                  <Input
                    id="cache-duration"
                    type="number"
                    min="1"
                    max="168"
                    value={settings.performance.cacheDuration}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        performance: {
                          ...settings.performance,
                          cacheDuration: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="compression-level" className="font-semibold">
                  Compression Level
                </Label>
                <Select
                  value={settings.performance.compressionLevel}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      performance: {
                        ...settings.performance,
                        compressionLevel: value,
                      },
                    })
                  }
                >
                  <SelectTrigger id="compression-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Faster)</SelectItem>
                    <SelectItem value="medium">Medium (Balanced)</SelectItem>
                    <SelectItem value="high">High (Smaller Files)</SelectItem>
                  </SelectContent>
                </Select>
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
              const savedSettings = localStorage.getItem("reportSettings");
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

