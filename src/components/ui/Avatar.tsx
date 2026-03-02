import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 dark:bg-primary-900/30",
        {
          "h-8 w-8 text-xs": size === "sm",
          "h-10 w-10 text-sm": size === "md",
          "h-14 w-14 text-lg": size === "lg",
        },
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt ?? ""} className="h-full w-full object-cover" />
      ) : (
        <span className="font-semibold text-primary-600 dark:text-primary-400">
          {fallback ?? "?"}
        </span>
      )}
    </div>
  );
}
