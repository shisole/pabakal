import Link from "next/link";

import { Breadcrumbs } from "@/components/layout";
import { EmptyState } from "@/components/ui";
import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Customers | Pabakal Admin",
};

export default async function CustomersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  // Fetch order counts and totals for each customer
  const customerIds = profiles?.map((p) => p.id) ?? [];
  let customerStats: Record<string, { count: number; total: number }> = {};

  if (customerIds.length > 0) {
    const { data: orders } = await supabase
      .from("orders")
      .select("customer_id, total_php")
      .in("customer_id", customerIds);

    if (orders) {
      customerStats = orders.reduce<Record<string, { count: number; total: number }>>(
        (acc, order) => {
          if (!acc[order.customer_id]) {
            acc[order.customer_id] = { count: 0, total: 0 };
          }
          acc[order.customer_id].count += 1;
          acc[order.customer_id].total += order.total_php;
          return acc;
        },
        {},
      );
    }
  }

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Customers" }]}
      />

      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>

      {profiles && profiles.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-md dark:bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Phone</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                  Orders
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Total Spent
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {profiles.map((profile) => {
                const stats = customerStats[profile.id] ?? { count: 0, total: 0 };
                return (
                  <tr key={profile.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/customers/${profile.id}`}
                        className="font-medium text-primary-600 hover:underline"
                      >
                        {profile.full_name ?? "Unnamed"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{profile.email}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {profile.phone ?? "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                      {stats.count}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatPhp(stats.total)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No customers yet"
          description="Customers will appear here once they sign up."
        />
      )}
    </div>
  );
}
