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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Trash2, CheckCircle, Info } from "lucide-react";

export interface BulkConfirmationItem {
  id: string;
  label: string;
  sublabel?: string;
  status?: string;
}

interface BulkConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  items: BulkConfirmationItem[];
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  warningMessage?: string;
}

export function BulkConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  items,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  isLoading = false,
  warningMessage,
}: BulkConfirmationDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          borderColor: "border-red-200 dark:border-red-900",
          iconBg: "bg-red-100 dark:bg-red-950/30",
          iconColor: "text-red-600",
          messageBg: "bg-red-50 dark:bg-red-950/20",
          messageBorder: "border-red-200 dark:border-red-900",
          messageText: "text-red-900 dark:text-red-100",
          buttonVariant: "destructive" as const,
        };
      case "warning":
        return {
          borderColor: "border-amber-200 dark:border-amber-900",
          iconBg: "bg-amber-100 dark:bg-amber-950/30",
          iconColor: "text-amber-600",
          messageBg: "bg-amber-50 dark:bg-amber-950/20",
          messageBorder: "border-amber-200 dark:border-amber-900",
          messageText: "text-amber-900 dark:text-amber-100",
          buttonVariant: "default" as const,
        };
      case "info":
        return {
          borderColor: "border-blue-200 dark:border-blue-900",
          iconBg: "bg-blue-100 dark:bg-blue-950/30",
          iconColor: "text-blue-600",
          messageBg: "bg-blue-50 dark:bg-blue-950/20",
          messageBorder: "border-blue-200 dark:border-blue-900",
          messageText: "text-blue-900 dark:text-blue-100",
          buttonVariant: "default" as const,
        };
    }
  };

  const styles = getVariantStyles();
  const Icon = variant === "danger" ? Trash2 : variant === "warning" ? AlertTriangle : Info;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-[600px] border-2 ${styles.borderColor}`}>
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg}`}>
              <Icon className={`h-6 w-6 ${styles.iconColor}`} />
            </div>
            <div>
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription className="text-base mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Item count badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Selected items:
            </span>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {items.length} {items.length === 1 ? "item" : "items"}
            </Badge>
          </div>

          {/* Items list */}
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.label}</div>
                    {item.sublabel && (
                      <div className="text-xs text-muted-foreground truncate">
                        {item.sublabel}
                      </div>
                    )}
                  </div>
                  {item.status && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {item.status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Warning message */}
          {warningMessage && (
            <div className={`p-3 rounded-lg border ${styles.messageBg} ${styles.messageBorder}`}>
              <p className={`text-sm ${styles.messageText} flex items-start gap-2`}>
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{warningMessage}</span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={styles.buttonVariant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

