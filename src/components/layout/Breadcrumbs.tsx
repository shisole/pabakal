"use client";

import Link from "next/link";

import { ChevronRightIcon } from "@/components/icons";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, idx) => (
          <li key={item.label} className="flex items-center gap-1">
            {idx > 0 && <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />}
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-primary-600 dark:text-gray-400"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-900 dark:text-gray-100">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
