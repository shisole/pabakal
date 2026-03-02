"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BarChartIcon,
  ClipboardIcon,
  CreditCardIcon,
  HomeIcon,
  MessageSquareIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  TruckIcon,
  UserIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const SIDEBAR_LINKS = [
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

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 lg:block">
      <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <PackageIcon className="h-6 w-6 text-primary-600" />
          <span className="font-heading text-lg font-bold text-primary-600">Pabakal</span>
          <span className="rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-700">
            Admin
          </span>
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {SIDEBAR_LINKS.map((link) => {
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
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800",
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
