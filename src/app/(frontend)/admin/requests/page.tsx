import Link from "next/link";

import { Breadcrumbs } from "@/components/layout";
import { Badge, EmptyState } from "@/components/ui";
import { formatUsd } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";
import { type RequestStatus } from "@/lib/supabase/types";

export const metadata = {
  title: "Requests | Pabakal Admin",
};

const statusVariant: Record<RequestStatus, "default" | "success" | "warning" | "danger" | "info"> =
  {
    pending: "warning",
    reviewing: "info",
    available: "success",
    unavailable: "danger",
    closed: "default",
  };

const statusLabel: Record<RequestStatus, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  available: "Available",
  unavailable: "Unavailable",
  closed: "Closed",
};

interface RequestsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const { status: filterStatus } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("product_requests")
    .select(
      "id, product_name, source_price_usd, status, created_at, profiles!product_requests_customer_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false });

  if (filterStatus && filterStatus !== "all") {
    query = query.eq("status", filterStatus as RequestStatus);
  }

  const { data: requests } = await query;

  const statuses: { value: string; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "reviewing", label: "Reviewing" },
    { value: "available", label: "Available" },
    { value: "unavailable", label: "Unavailable" },
    { value: "closed", label: "Closed" },
  ];

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Requests" }]}
      />

      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Product Requests</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Link
            key={s.value}
            href={s.value === "all" ? "/admin/requests" : `/admin/requests?status=${s.value}`}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              (filterStatus ?? "all") === s.value
                ? "bg-primary-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {requests && requests.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-md dark:bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Customer</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Product</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Source Price
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {requests.map((req) => {
                const profile = req.profiles as { full_name: string | null } | null;
                return (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {profile?.full_name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/requests/${req.id}`}
                        className="font-medium text-primary-600 hover:underline"
                      >
                        {req.product_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {req.source_price_usd == null ? "—" : formatUsd(req.source_price_usd)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[req.status] ?? "default"} size="sm">
                        {statusLabel[req.status] ?? req.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No requests found"
          description={
            filterStatus && filterStatus !== "all"
              ? `No requests with status "${filterStatus}".`
              : "No product requests have been submitted yet."
          }
        />
      )}
    </div>
  );
}
