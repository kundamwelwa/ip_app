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
import { Palette, Monitor, Sun, Moon, Loader2, Save, Sparkles, Type } from "lucide-react";
import { useTheme } from "next-themes";

interface AppearanceSettingsProps {
  settings: {
    theme: "light" | "dark" | "system";
    compactMode: boolean;
    showAnimations: boolean;
    fontSize: "small" | "medium" | "large";
  };
  onUpdate: (updates: any) => Promise<void>;
  saving: boolean;
}

export function AppearanceSettings({ settings, onUpdate, saving }: AppearanceSettingsProps) {
  const { theme, setTheme } = useTheme();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setLocalSettings({ ...localSettings, theme: newTheme as any });
  };

  const handleSave = async () => {
    await onUpdate(localSettings);
  };

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Theme & Display
          </CardTitle>
          <CardDescription>Customize the look and feel of your interface</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Color Theme</Label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleThemeChange("light")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  localSettings.theme === "light"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Sun className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-medium">Light</p>
              </button>

              <button
                onClick={() => handleThemeChange("dark")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  localSettings.theme === "dark"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Moon className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-medium">Dark</p>
              </button>

              <button
                onClick={() => handleThemeChange("system")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  localSettings.theme === "system"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Monitor className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-medium">System</p>
              </button>
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label htmlFor="font-size" className="text-base font-semibold flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font Size
            </Label>
            <Select
              value={localSettings.fontSize}
              onValueChange={(value: any) =>
                setLocalSettings({ ...localSettings, fontSize: value })
              }
            >
              <SelectTrigger id="font-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium (Recommended)</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Compact Mode</Label>
              <p className="text-xs text-muted-foreground">
                Reduce spacing and padding for a more condensed layout
              </p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.compactMode}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, compactMode: e.target.checked })
              }
              className="h-4 w-4"
            />
          </div>

          {/* Animations */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Show Animations
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable smooth transitions and animations
              </p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.showAnimations}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, showAnimations: e.target.checked })
              }
              className="h-4 w-4"
            />
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
                  Save Appearance Settings
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

