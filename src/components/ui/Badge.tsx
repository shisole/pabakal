import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
}

export default function Badge({
  className,
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        {
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300": variant === "default",
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":
            variant === "success",
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400":
            variant === "warning",
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400": variant === "danger",
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400": variant === "info",
        },
        {
          "px-2 py-0.5 text-xs": size === "sm",
          "px-3 py-1 text-sm": size === "md",
        },
        className,
      )}
      {...props}
    />
  );
}
