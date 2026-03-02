import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeftIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/layout";
import { Badge, Button, Card } from "@/components/ui";
import { getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/helpers/order";
import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";
import { type OrderStatus } from "@/lib/supabase/types";

export const metadata = {
  title: "Customer Detail | Pabakal Admin",
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

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase
      .from("orders")
      .select("id, order_number, status, payment_status, total_php, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!profile) notFound();

  const totalSpent = orders?.reduce((sum, o) => sum + o.total_php, 0) ?? 0;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Customers", href: "/admin/customers" },
          { label: profile.full_name ?? "Customer" },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {profile.full_name ?? "Unnamed Customer"}
        </h1>
        <Link href="/admin/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Order History ({orders?.length ?? 0})
            </h2>
            {orders && orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Order</th>
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Payment</th>
                      <th className="pb-2 text-right font-medium text-gray-500 dark:text-gray-400">
                        Total
                      </th>
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="py-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-medium text-primary-600 hover:underline"
                          >
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="py-2">
                          <Badge variant={statusVariant[order.status] ?? "default"} size="sm">
                            {getOrderStatusLabel(order.status)}
                          </Badge>
                        </td>
                        <td className="py-2 text-gray-700 dark:text-gray-300">
                          {getPaymentStatusLabel(order.payment_status)}
                        </td>
                        <td className="py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                          {formatPhp(order.total_php)}
                        </td>
                        <td className="py-2 text-gray-500 dark:text-gray-400">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This customer has no orders yet.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="mt-0.5 text-gray-900 dark:text-gray-100">{profile.email}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                <dd className="mt-0.5 text-gray-900 dark:text-gray-100">
                  {profile.phone ?? "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Address</dt>
                <dd className="mt-0.5 text-gray-900 dark:text-gray-100">
                  {profile.address_line ? (
                    <>
                      {profile.address_line}
                      <br />
                      {profile.city}, {profile.province} {profile.zip_code}
                    </>
                  ) : (
                    "Not provided"
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Joined</dt>
                <dd className="mt-0.5 text-gray-900 dark:text-gray-100">
                  {new Date(profile.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Summary</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Total Orders</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {orders?.length ?? 0}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Total Spent</dt>
                <dd className="font-bold text-gray-900 dark:text-gray-100">
                  {formatPhp(totalSpent)}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
