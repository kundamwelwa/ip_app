"use client";

import { X, AlertTriangle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminBannerProps = {
  title: string;
  message: string;
  reason?: string;
  ctaLabel?: string;
  onCta?: () => void;
  supportHref?: string;
  onDismiss?: () => void;
  className?: string;
};

export function AdminBanner({
  title,
  message,
  reason,
  ctaLabel = "Got it",
  onCta,
  supportHref = "mailto:support@fqml.com?subject=Account%20update",
  onDismiss,
  className,
}: AdminBannerProps) {
  return (
    <div
      className={cn(
        "relative w-full rounded-2xl bg-[#0f1729] text-slate-50 border border-slate-700/60 shadow-2xl overflow-hidden",
        "p-4 sm:p-5 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-base sm:text-lg font-semibold leading-tight">{title}</p>
              <p className="text-sm text-slate-200/80 mt-1">{message}</p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-slate-300/70 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {reason && (
            <p className="text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
              {reason}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {supportHref && (
          <Button
            asChild
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
          >
            <a href={supportHref}>
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </a>
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="border-slate-600 text-slate-100"
          onClick={onCta}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
