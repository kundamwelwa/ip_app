"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive" | "warning";
  loading?: boolean;
  details?: string[];
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "default",
  loading = false,
  details,
}: ConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case "destructive":
        return "border-red-200 dark:border-red-800";
      case "warning":
        return "border-orange-200 dark:border-orange-800";
      default:
        return "border-blue-200 dark:border-blue-800";
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case "destructive":
        return "bg-red-50 dark:bg-red-950/30";
      case "warning":
        return "bg-orange-50 dark:bg-orange-950/30";
      default:
        return "bg-blue-50 dark:bg-blue-950/30";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`border-2 ${getBorderColor()}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        {details && details.length > 0 && (
          <div className={`p-4 rounded-lg border-2 ${getBorderColor()} ${getBackgroundColor()}`}>
            <p className="text-sm font-semibold mb-2">This will also affect:</p>
            <ul className="space-y-1">
              {details.map((detail, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-lg leading-none">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {variant === "destructive" && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              ⚠️ This action cannot be undone
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {variant === "destructive" ? (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

