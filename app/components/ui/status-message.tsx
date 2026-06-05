"use client";

import { useEffect, useState } from "react";
import { cn } from "@/app/lib/utils";

interface StatusMessageProps {
  type?: "error" | "success" | "info";
  message: string;
  className?: string;
  toast?: boolean;
  duration?: number;
  onClose?: () => void;
}

const variantStyles = {
  error: {
    container: "border-red-200 bg-red-50 text-red-700",
    icon: "text-red-700",
    label: "error",
    symbol: "error_outline",
  },
  success: {
    container: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "text-emerald-700",
    label: "success",
    symbol: "check_circle",
  },
  info: {
    container: "border-blue-200 bg-blue-50 text-blue-700",
    icon: "text-blue-700",
    label: "info",
    symbol: "info",
  },
} as const;

export function StatusMessage({
  type = "info",
  message,
  className,
  toast = true,
  duration = 3000,
  onClose,
}: StatusMessageProps) {
  const [isVisible, setIsVisible] = useState(true);
  const style = variantStyles[type];

  useEffect(() => {
    if (!toast) return;

    setIsVisible(true);

    const timer = window.setTimeout(() => {
      if (onClose) {
        onClose();
      }
      setIsVisible(false);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [toast, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "rounded-2xl border px-4 py-3 flex items-start gap-3 text-sm",
        style.container,
        toast && "fixed top-15 right-4 z-50 max-w-sm shadow-xl",
        className,
      )}
    >
      <span className={cn("material-symbols-outlined text-2xl", style.icon)}>
        {style.symbol}
      </span>
      <div className="leading-5">{message}</div>
    </div>
  );
}
