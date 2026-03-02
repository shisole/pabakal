"use client";

import Link from "next/link";
import { useState } from "react";

import { BellIcon, LogOutIcon, MenuIcon, PackageIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

import AdminMobileNav from "./AdminMobileNav";

export default function AdminHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <Link href="/admin/dashboard" className="flex items-center gap-2 lg:hidden">
            <PackageIcon className="h-5 w-5 text-primary-600" />
            <span className="font-heading text-lg font-bold text-primary-600">Pabakal</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            View Store
          </Link>
          <button
            type="button"
            className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
          </button>
          <form action="/auth/callback?next=/login" method="get">
            <button
              type="submit"
              className={cn(
                "rounded-lg p-2 text-gray-600 hover:bg-gray-100",
                "dark:text-gray-400 dark:hover:bg-gray-800",
              )}
              aria-label="Log out"
            >
              <LogOutIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Mobile nav overlay */}
      <AdminMobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
