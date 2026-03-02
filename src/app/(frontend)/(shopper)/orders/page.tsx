import Link from "next/link";
import { redirect } from "next/navigation";

import { PackageIcon } from "@/components/icons";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { getOrderStatusLabel } from "@/lib/helpers/order";
import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";
import { type OrderStatus } from "@/lib/supabase/types";

const statusVariantMap: Record<OrderStatus, "default" | "success" | "warning" | "danger" | "info"> =
  {
    pending: "warning",
    confirmed: "info",
    preparing: "info",
    ready: "info",
    shipped_local: "info",
    delivered: "success",
    cancelled: "danger",
  };

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">My Orders</h1>

      {orders && orders.length > 0 ? (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="p-4 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading font-bold text-gray-900 dark:text-white">
                      {order.order_number}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusVariantMap[order.status]}>
                      {getOrderStatusLabel(order.status)}
                    </Badge>
                    <p className="mt-1 font-heading text-lg font-bold text-primary-600">
                      {formatPhp(order.total_php)}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<PackageIcon className="h-12 w-12" />}
          title="No orders yet"
          description="Your order history will appear here once you place your first order."
          action={
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          }
          className="mt-12"
        />
      )}
    </div>
  );
}
