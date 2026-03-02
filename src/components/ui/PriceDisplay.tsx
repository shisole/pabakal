import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function formatPHP(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

export default function PriceDisplay({
  price,
  compareAtPrice,
  size = "md",
  className,
}: PriceDisplayProps) {
  const hasDiscount = compareAtPrice != null && compareAtPrice > price;

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span
        className={cn("font-bold", {
          "text-sm": size === "sm",
          "text-lg": size === "md",
          "text-2xl": size === "lg",
          "text-red-600 dark:text-red-400": hasDiscount,
          "text-gray-900 dark:text-gray-100": !hasDiscount,
        })}
      >
        {formatPHP(price)}
      </span>
      {hasDiscount && (
        <span
          className={cn("text-gray-400 line-through dark:text-gray-500", {
            "text-xs": size === "sm",
            "text-sm": size === "md",
            "text-base": size === "lg",
          })}
        >
          {formatPHP(compareAtPrice)}
        </span>
      )}
    </div>
  );
}
