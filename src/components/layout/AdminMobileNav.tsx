"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import {
  BarChartIcon,
  ClipboardIcon,
  CreditCardIcon,
  HomeIcon,
  MessageSquareIcon,
  SettingsIcon,
  ShoppingBagIcon,
  TruckIcon,
  UserIcon,
  XIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/admin/products", label: "Products", icon: ShoppingBagIcon },
  { href: "/admin/cargo", label: "Cargo", icon: TruckIcon },
  { href: "/admin/orders", label: "Orders", icon: ClipboardIcon },
  { href: "/admin/payments", label: "Payments", icon: CreditCardIcon },
  { href: "/admin/requests", label: "Requests", icon: MessageSquareIcon },
  { href: "/admin/customers", label: "Customers", icon: UserIcon },
  { href: "/admin/analytics", label: "Analytics", icon: BarChartIcon },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

interface AdminMobileNavProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminMobileNav({ open, onClose }: AdminMobileNavProps) {
  const pathname = usePathname();

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-backdrop-fade-in"
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl dark:bg-gray-950 animate-bottom-sheet-up">
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
          <span className="font-heading text-lg font-bold text-primary-600">Pabakal Admin</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/admin/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
