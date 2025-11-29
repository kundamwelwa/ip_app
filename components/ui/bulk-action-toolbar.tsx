"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  X,
  Download,
  Link,
  Tag,
  CheckSquare,
  XSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary";
  onClick: () => void;
}

interface BulkActionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onClear: () => void;
  onSelectAll?: () => void;
  actions: BulkAction[];
  className?: string;
}

export function BulkActionToolbar({
  selectedCount,
  totalCount,
  onClear,
  onSelectAll,
  actions,
  className,
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300",
        className
      )}
    >
      <div className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-gray-900 border-2 border-primary/20 rounded-full shadow-2xl backdrop-blur-sm">
        {/* Selection Info */}
        <div className="flex items-center gap-3 pr-3 border-r border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <CheckSquare className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {selectedCount} selected
            </span>
            <span className="text-xs text-muted-foreground">
              of {totalCount} total
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || "outline"}
              size="sm"
              onClick={action.onClick}
              className="h-9"
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}

          {onSelectAll && !allSelected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              className="h-9"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Select All ({totalCount})
            </Button>
          )}
        </div>

        {/* Clear Button */}
        <div className="pl-3 border-l border-gray-300 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-9 w-9 p-0"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Checkbox component for table rows
interface BulkSelectCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function BulkSelectCheckbox({
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: BulkSelectCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onCheckedChange(!checked);
      }}
      className={cn(
        "flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200",
        checked
          ? "bg-primary border-primary text-primary-foreground"
          : "border-gray-300 dark:border-gray-600 hover:border-primary",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {checked && (
        <svg
          className="w-3 h-3"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 3L4.5 8.5L2 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

