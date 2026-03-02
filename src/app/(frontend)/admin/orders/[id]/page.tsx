import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeftIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/layout";
import { Badge, Button, Card } from "@/components/ui";
import { getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/helpers/order";
import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";
import { type OrderWithItems, type OrderStatus, type PaymentStatus } from "@/lib/supabase/types";

export const metadata = {
  title: "Order Detail | Pabakal Admin",
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

const paymentVariant: Record<PaymentStatus, "default" | "success" | "warning" | "danger"> = {
  pending: "warning",
  partial: "warning",
  paid: "success",
  refunded: "danger",
};

const nextStatusMap: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  pending: { next: "confirmed", label: "Confirm Order" },
  confirmed: { next: "preparing", label: "Mark Preparing" },
  preparing: { next: "ready", label: "Mark Ready" },
  ready: { next: "shipped_local", label: "Ship Order" },
  shipped_local: { next: "delivered", label: "Mark Delivered" },
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), payments(*), profiles(*)")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const order = data as unknown as OrderWithItems;
  const nextAction = nextStatusMap[order.status];

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Orders", href: "/admin/orders" },
          { label: order.order_number },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {order.order_number}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          {nextAction && (
            <form>
              <Button type="submit" size="sm" disabled>
                {nextAction.label}
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Order Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Product</th>
                    <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="pb-2 text-center font-medium text-gray-500 dark:text-gray-400">
                      Qty
                    </th>
                    <th className="pb-2 text-right font-medium text-gray-500 dark:text-gray-400">
                      Unit Price
                    </th>
                    <th className="pb-2 text-right font-medium text-gray-500 dark:text-gray-400">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {order.order_items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 text-gray-900 dark:text-gray-100">{item.product_name}</td>
                      <td className="py-2">
                        <Badge
                          variant={item.fulfillment_type === "pre_order" ? "warning" : "success"}
                          size="sm"
                        >
                          {item.fulfillment_type === "pre_order" ? "Pre-order" : "In Stock"}
                        </Badge>
                      </td>
                      <td className="py-2 text-center text-gray-700 dark:text-gray-300">
                        {item.quantity}
                      </td>
                      <td className="py-2 text-right text-gray-700 dark:text-gray-300">
                        {formatPhp(item.unit_price_php)}
                      </td>
                      <td className="py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatPhp(item.total_price_php)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 dark:border-gray-700">
                    <td colSpan={4} className="pt-3 text-right text-sm text-gray-500">
                      Subtotal
                    </td>
                    <td className="pt-3 text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatPhp(order.subtotal_php)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="pt-1 text-right text-sm text-gray-500">
                      Shipping
                    </td>
                    <td className="pt-1 text-right text-gray-700 dark:text-gray-300">
                      {formatPhp(order.shipping_fee_php)}
                    </td>
                  </tr>
                  {order.discount_php > 0 && (
                    <tr>
                      <td colSpan={4} className="pt-1 text-right text-sm text-gray-500">
                        Discount
                      </td>
                      <td className="pt-1 text-right text-green-600">
                        -{formatPhp(order.discount_php)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-gray-200 dark:border-gray-700">
                    <td
                      colSpan={4}
                      className="pt-3 text-right text-base font-semibold text-gray-900 dark:text-gray-100"
                    >
                      Total
                    </td>
                    <td className="pt-3 text-right text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatPhp(order.total_php)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Payment History
            </h2>
            {order.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Method</th>
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">
                        Reference
                      </th>
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">
                        Verified
                      </th>
                      <th className="pb-2 text-right font-medium text-gray-500 dark:text-gray-400">
                        Amount
                      </th>
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {order.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="py-2 capitalize text-gray-900 dark:text-gray-100">
                          {payment.method.replace("_", " ")}
                        </td>
                        <td className="py-2 font-mono text-gray-700 dark:text-gray-300">
                          {payment.reference_number ?? "N/A"}
                        </td>
                        <td className="py-2">
                          <Badge variant={payment.verified ? "success" : "warning"} size="sm">
                            {payment.verified ? "Verified" : "Pending"}
                          </Badge>
                        </td>
                        <td className="py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                          {formatPhp(payment.amount_php)}
                        </td>
                        <td className="py-2 text-gray-500 dark:text-gray-400">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No payments recorded.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Status</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Order Status</dt>
                <dd className="mt-1">
                  <Badge variant={statusVariant[order.status]}>
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Payment Status</dt>
                <dd className="mt-1">
                  <Badge variant={paymentVariant[order.payment_status]}>
                    {getPaymentStatusLabel(order.payment_status)}
                  </Badge>
                </dd>
              </div>
              {order.has_pre_order_items && (
                <div>
                  <Badge variant="warning" size="sm">
                    Has Pre-order Items
                  </Badge>
                </div>
              )}
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Customer
            </h2>
            {order.profiles ? (
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-500 dark:text-gray-400">Name</dt>
                  <dd className="mt-0.5 text-gray-900 dark:text-gray-100">
                    <Link
                      href={`/admin/customers/${order.profiles.id}`}
                      className="text-primary-600 hover:underline"
                    >
                      {order.profiles.full_name ?? "Unknown"}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="mt-0.5 text-gray-900 dark:text-gray-100">
                    {order.profiles.email}
                  </dd>
                </div>
                {order.profiles.phone && (
                  <div>
                    <dt className="font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                    <dd className="mt-0.5 text-gray-900 dark:text-gray-100">
                      {order.profiles.phone}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-gray-500">Customer info unavailable.</p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Delivery Address
            </h2>
            <p className="text-sm text-gray-900 dark:text-gray-100">{order.delivery_address}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {order.delivery_city}, {order.delivery_province} {order.delivery_zip}
            </p>
          </Card>

          {(order.customer_notes || order.admin_notes) && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Notes</h2>
              {order.customer_notes && (
                <div className="mb-3">
                  <h3 className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Customer Notes
                  </h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {order.customer_notes}
                  </p>
                </div>
              )}
              {order.admin_notes && (
                <div>
                  <h3 className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Admin Notes
                  </h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {order.admin_notes}
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
