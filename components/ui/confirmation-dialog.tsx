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
import { AlertTriangle, Trash2, AlertCircle, Info } from "lucide-react";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  itemName?: string;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  itemName,
}: ConfirmationDialogProps) {
  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-6 w-6 text-yellow-600" />;
      case "info":
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case "danger":
        return "border-red-200 dark:border-red-900";
      case "warning":
        return "border-yellow-200 dark:border-yellow-900";
      case "info":
        return "border-blue-200 dark:border-blue-900";
    }
  };

  const getIconBgColor = () => {
    switch (variant) {
      case "danger":
        return "bg-red-100 dark:bg-red-950/30";
      case "warning":
        return "bg-yellow-100 dark:bg-yellow-950/30";
      case "info":
        return "bg-blue-100 dark:bg-blue-950/30";
    }
  };

  const getAlertBgColor = () => {
    switch (variant) {
      case "danger":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-900 dark:text-red-100";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900 text-yellow-900 dark:text-yellow-100";
      case "info":
        return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-100";
    }
  };

  const getButtonStyles = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700";
      case "info":
        return "bg-blue-600 hover:bg-blue-700";
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-[500px] border-2 ${getBorderColor()}`}>
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${getIconBgColor()}`}>
              {getIcon()}
            </div>
            <div>
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription className="text-base mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          {itemName && (
            <p className="text-sm text-muted-foreground mb-4">
              Item: <span className="font-semibold text-foreground">{itemName}</span>
            </p>
          )}
          <div className={`p-3 rounded-lg border ${getAlertBgColor()}`}>
            <p className="text-sm">
              {variant === "danger" && "⚠️ This action cannot be undone."}
              {variant === "warning" && "⚠️ Please confirm this action."}
              {variant === "info" && "ℹ️ Please review before proceeding."}
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            className={getButtonStyles()}
          >
            {variant === "danger" && <Trash2 className="h-4 w-4 mr-2" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
