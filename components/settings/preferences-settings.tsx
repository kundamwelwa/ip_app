"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sliders, Home, List, RefreshCw, Calendar, Clock, Globe, Loader2, Save } from "lucide-react";

interface PreferencesSettingsProps {
  settings: {
    defaultDashboard: string;
    itemsPerPage: number;
    autoRefresh: boolean;
    refreshInterval: number;
    dateFormat: string;
    timeFormat: "12h" | "24h";
    timezone: string;
  };
  onUpdate: (updates: any) => Promise<void>;
  saving: boolean;
}

export function PreferencesSettings({ settings, onUpdate, saving }: PreferencesSettingsProps) {
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
      <Card className="border-2 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-green-600 dark:text-green-400" />
            General Preferences
          </CardTitle>
          <CardDescription>Customize your workflow and display preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Dashboard */}
          <div className="space-y-2">
            <Label htmlFor="default-dashboard" className="text-base font-semibold flex items-center gap-2">
              <Home className="h-4 w-4" />
              Default Dashboard
            </Label>
            <Select
              value={localSettings.defaultDashboard}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, defaultDashboard: value })
              }
            >
              <SelectTrigger id="default-dashboard">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="/dashboard">Main Dashboard</SelectItem>
                <SelectItem value="/equipment">Equipment Management</SelectItem>
                <SelectItem value="/ip-management">IP Management</SelectItem>
                <SelectItem value="/alerts">Alerts</SelectItem>
                <SelectItem value="/reports">Reports</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This page will load when you first sign in
            </p>
          </div>

          {/* Items Per Page */}
          <div className="space-y-2">
            <Label htmlFor="items-per-page" className="text-base font-semibold flex items-center gap-2">
              <List className="h-4 w-4" />
              Items Per Page
            </Label>
            <Select
              value={localSettings.itemsPerPage.toString()}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, itemsPerPage: parseInt(value) })
              }
            >
              <SelectTrigger id="items-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 items</SelectItem>
                <SelectItem value="25">25 items</SelectItem>
                <SelectItem value="50">50 items</SelectItem>
                <SelectItem value="100">100 items</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto Refresh */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Auto Refresh Data
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically refresh dashboards and data
              </p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.autoRefresh}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, autoRefresh: e.target.checked })
              }
              className="h-4 w-4"
            />
          </div>

          {/* Refresh Interval */}
          {localSettings.autoRefresh && (
            <div className="space-y-2">
              <Label htmlFor="refresh-interval" className="text-sm font-medium">
                Refresh Interval (seconds)
              </Label>
              <Input
                id="refresh-interval"
                type="number"
                min="10"
                max="300"
                value={localSettings.refreshInterval}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    refreshInterval: parseInt(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Data will refresh every {localSettings.refreshInterval} seconds
              </p>
            </div>
          )}

          {/* Date Format */}
          <div className="space-y-2">
            <Label htmlFor="date-format" className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Format
            </Label>
            <Select
              value={localSettings.dateFormat}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, dateFormat: value })
              }
            >
              <SelectTrigger id="date-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (Europe)</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Format */}
          <div className="space-y-2">
            <Label htmlFor="time-format" className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Format
            </Label>
            <Select
              value={localSettings.timeFormat}
              onValueChange={(value: any) =>
                setLocalSettings({ ...localSettings, timeFormat: value })
              }
            >
              <SelectTrigger id="time-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Timezone
            </Label>
            <Select
              value={localSettings.timezone}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, timezone: value })
              }
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                <SelectItem value="America/New_York">Eastern Time (GMT-5)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (GMT-6)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (GMT-7)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (GMT-8)</SelectItem>
                <SelectItem value="Africa/Johannesburg">South Africa (GMT+2)</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                  Save Preferences
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

