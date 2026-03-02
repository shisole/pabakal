import Link from "next/link";

import { Card } from "@/components/ui";
import { getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/helpers/order";
import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard | Pabakal Admin",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: orders },
    { count: totalOrders },
    { count: pendingOrders },
    { count: activeProducts },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("orders").select("total_php"),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("orders")
      .select(
        "id, order_number, status, payment_status, total_php, created_at, profiles(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalRevenue = orders?.reduce((sum, o) => sum + o.total_php, 0) ?? 0;

  const stats = [
    {
      label: "Total Revenue",
      value: formatPhp(totalRevenue),
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "Total Orders",
      value: totalOrders ?? 0,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Pending Orders",
      value: pendingOrders ?? 0,
      color: "text-yellow-600 dark:text-yellow-400",
    },
    {
      label: "Active Products",
      value: activeProducts ?? 0,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            View all
          </Link>
        </div>

        {recentOrders && recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Order</th>
                  <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Customer</th>
                  <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Payment</th>
                  <th className="pb-3 text-right font-medium text-gray-500 dark:text-gray-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentOrders.map((order) => {
                  const profile = order.profiles as { full_name: string | null } | null;
                  return (
                    <tr key={order.id}>
                      <td className="py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-primary-600 hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="py-3 text-gray-700 dark:text-gray-300">
                        {profile?.full_name ?? "Unknown"}
                      </td>
                      <td className="py-3 text-gray-700 dark:text-gray-300">
                        {getOrderStatusLabel(order.status)}
                      </td>
                      <td className="py-3 text-gray-700 dark:text-gray-300">
                        {getPaymentStatusLabel(order.payment_status)}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatPhp(order.total_php)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No orders yet.</p>
        )}
      </Card>
    </div>
  );
}
