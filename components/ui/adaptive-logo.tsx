"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AdaptiveLogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  variant?: "default" | "pill" | "flat";
}

export function AdaptiveLogo({ 
  className, 
  width = 180, 
  height = 60,
  priority = false,
  variant = "default"
}: AdaptiveLogoProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        className={cn("animate-pulse bg-gray-200 dark:bg-gray-700 rounded", className)}
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";

  // No container styles - just clean logo
  const getContainerStyles = () => {
    return "bg-transparent";
  };

  const getImageStyles = () => {
    if (variant === "flat") {
      return cn(
        "object-contain transition-all duration-300",
        isDark 
          ? "brightness-200 contrast-110 saturate-0 opacity-90 hover:opacity-100" 
          : "brightness-95 contrast-105 opacity-95 hover:opacity-100"
      );
    }
    
    return cn(
      "object-contain transition-all duration-300",
      isDark 
        ? "brightness-125 contrast-110" 
        : "brightness-100 contrast-105"
    );
  };

  return (
    <div className={cn("relative flex items-center justify-center", getContainerStyles(), className)}>
      <Image
        src="/Logo.png"
        alt="IPA-MS System Logo"
        width={width}
        height={height}
        priority={priority}
        className={getImageStyles()}
        style={{
          maxWidth: "100%",
          height: "auto",
        }}
      />
    </div>
  );
}

