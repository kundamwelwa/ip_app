"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { PreferencesSettings } from "@/components/settings/preferences-settings";
import { ToastContainer } from "@/components/ui/toast-notification";
import {
  Settings,
  Palette,
  Bell,
  Sliders,
  Loader2,
  AlertTriangle,
  Save,
  RefreshCw,
} from "lucide-react";

interface UserSettings {
  appearance: {
    theme: "light" | "dark" | "system";
    compactMode: boolean;
    showAnimations: boolean;
    fontSize: "small" | "medium" | "large";
  };
  notifications: {
    emailNotifications: boolean;
    alertNotifications: boolean;
    reportNotifications: boolean;
    maintenanceNotifications: boolean;
    emailDigest: "realtime" | "daily" | "weekly" | "never";
  };
  preferences: {
    defaultDashboard: string;
    itemsPerPage: number;
    autoRefresh: boolean;
    refreshInterval: number;
    dateFormat: string;
    timeFormat: "12h" | "24h";
    timezone: string;
  };
}

interface SettingsDashboardProps {
  session: any;
}

export function SettingsDashboard({ session }: SettingsDashboardProps) {
  const [activeTab, setActiveTab] = useState("appearance");
  const [settings, setSettings] = useState<UserSettings | null>(null);
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

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/profile/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");

      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle settings update
  const handleUpdateSettings = async (category: keyof UserSettings, updates: any) => {
    if (!settings) return;

    const updatedSettings = {
      ...settings,
      [category]: { ...settings[category], ...updates },
    };

    try {
      setSaving(true);
      const response = await fetch("/api/profile/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update settings");
      }

      setSettings(updatedSettings);
      showToast("Settings saved successfully!", "success");
    } catch (err) {
      console.error("Error updating settings:", err);
      showToast(err instanceof Error ? err.message : "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              {error || "Failed to load settings"}
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Settings & Preferences
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize your experience and preferences
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSettings}
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
            value="appearance"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            <Sliders className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <AppearanceSettings
            settings={settings.appearance}
            onUpdate={(updates) => handleUpdateSettings("appearance", updates)}
            saving={saving}
          />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <NotificationSettings
            settings={settings.notifications}
            onUpdate={(updates) => handleUpdateSettings("notifications", updates)}
            saving={saving}
          />
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <PreferencesSettings
            settings={settings.preferences}
            onUpdate={(updates) => handleUpdateSettings("preferences", updates)}
            saving={saving}
          />
        </TabsContent>
      </Tabs>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

