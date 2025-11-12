"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export interface ToastProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "success":
        return "border-green-500 bg-green-50 dark:bg-green-950/30";
      case "error":
        return "border-red-500 bg-red-50 dark:bg-red-950/30";
      case "warning":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30";
      case "info":
        return "border-blue-500 bg-blue-50 dark:bg-blue-950/30";
    }
  };

  const getIconBgStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-100 dark:bg-green-950/50";
      case "error":
        return "bg-red-100 dark:bg-red-950/50";
      case "warning":
        return "bg-yellow-100 dark:bg-yellow-950/50";
      case "info":
        return "bg-blue-100 dark:bg-blue-950/50";
    }
  };

  const getTextStyles = () => {
    switch (type) {
      case "success":
        return "text-green-900 dark:text-green-100";
      case "error":
        return "text-red-900 dark:text-red-100";
      case "warning":
        return "text-yellow-900 dark:text-yellow-100";
      case "info":
        return "text-blue-900 dark:text-blue-100";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
      <Card className={`min-w-[300px] max-w-[500px] shadow-lg border-2 ${getStyles()}`}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start space-x-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${getIconBgStyles()}`}>
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium break-words ${getTextStyles()}`}>
                {message}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

