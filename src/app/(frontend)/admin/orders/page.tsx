import Link from "next/link";

import { Breadcrumbs } from "@/components/layout";
import { Badge, EmptyState } from "@/components/ui";
import { getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/helpers/order";
import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";
import { type OrderStatus } from "@/lib/supabase/types";

export const metadata = {
  title: "Orders | Pabakal Admin",
};

const statusVariant: Record<OrderStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  pending: "warning",
  confirmed: "info",
  preparing: "info",
  ready: "info",
  shipped_local: "info",
  delivered: "success",
  cancelled: "danger",
};

interface OrdersPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { status: filterStatus } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("id, order_number, status, payment_status, total_php, created_at, profiles(full_name)")
    .order("created_at", { ascending: false });

  if (filterStatus && filterStatus !== "all") {
    query = query.eq("status", filterStatus as OrderStatus);
  }

  const { data: orders } = await query;

  const statuses: { value: string; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "preparing", label: "Preparing" },
    { value: "ready", label: "Ready" },
    { value: "shipped_local", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Orders" }]}
      />

      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Link
            key={s.value}
            href={s.value === "all" ? "/admin/orders" : `/admin/orders?status=${s.value}`}
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

      {orders && orders.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-md dark:bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Order</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Customer</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Payment</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Total
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {orders.map((order) => {
                const profile = order.profiles as { full_name: string | null } | null;
                return (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-primary-600 hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {profile?.full_name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[order.status] ?? "default"} size="sm">
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {getPaymentStatusLabel(order.payment_status)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatPhp(order.total_php)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No orders found"
          description={
            filterStatus && filterStatus !== "all"
              ? `No orders with status "${filterStatus}".`
              : "No orders have been placed yet."
          }
        />
      )}
    </div>
  );
}
