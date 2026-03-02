import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ArrowLeftIcon, UploadIcon } from "@/components/icons";
import { Badge, Card } from "@/components/ui";
import { getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/helpers/order";
import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";
import { type OrderStatus, type PaymentStatus } from "@/lib/supabase/types";

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

const paymentVariantMap: Record<
  PaymentStatus,
  "default" | "success" | "warning" | "danger" | "info"
> = {
  pending: "warning",
  partial: "info",
  paid: "success",
  refunded: "danger",
};

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*), payments(*)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Orders
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
          {order.order_number}
        </h1>
        <Badge variant={statusVariantMap[order.status]}>{getOrderStatusLabel(order.status)}</Badge>
      </div>

      <p className="mt-1 text-sm text-gray-500">
        Placed on{" "}
        {new Date(order.created_at).toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>

      {/* Order items */}
      <Card className="mt-8 p-6">
        <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">Items</h2>
        <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-3">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                {item.product_image_url ? (
                  <img
                    src={item.product_image_url}
                    alt={item.product_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                    No img
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.product_name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatPhp(item.unit_price_php)} x {item.quantity}
                </p>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatPhp(item.total_price_php)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-900 dark:text-gray-100">
              {formatPhp(order.subtotal_php)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Shipping</span>
            <span className="text-gray-900 dark:text-gray-100">
              {formatPhp(order.shipping_fee_php)}
            </span>
          </div>
          {order.discount_php > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Discount</span>
              <span className="text-green-600">-{formatPhp(order.discount_php)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
            <span className="font-medium text-gray-900 dark:text-white">Total</span>
            <span className="font-heading text-lg font-bold text-primary-600">
              {formatPhp(order.total_php)}
            </span>
          </div>
        </div>
      </Card>

      {/* Payment info */}
      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
            Payment
          </h2>
          <Badge variant={paymentVariantMap[order.payment_status]}>
            {getPaymentStatusLabel(order.payment_status)}
          </Badge>
        </div>
        {order.payments && order.payments.length > 0 ? (
          <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
            {order.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                    {payment.method.replace("_", " ")}
                  </p>
                  {payment.reference_number && (
                    <p className="text-xs text-gray-500">Ref: {payment.reference_number}</p>
                  )}
                  {payment.paid_at && (
                    <p className="text-xs text-gray-500">
                      {new Date(payment.paid_at).toLocaleDateString("en-PH")}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatPhp(payment.amount_php)}
                  </span>
                  {payment.verified && <p className="text-xs text-green-600">Verified</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">No payments recorded yet.</p>
        )}

        {/* Payment proof upload placeholder */}
        {order.payment_status !== "paid" && order.status !== "cancelled" && (
          <div className="mt-4 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center dark:border-gray-700">
            <UploadIcon className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Submit Payment Proof
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Upload a screenshot of your payment for verification.
            </p>
            {/* Placeholder — actual upload will be implemented later */}
          </div>
        )}
      </Card>

      {/* Delivery address */}
      <Card className="mt-6 p-6">
        <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
          Delivery Address
        </h2>
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          <p>{order.delivery_address}</p>
          <p>
            {order.delivery_city}, {order.delivery_province} {order.delivery_zip}
          </p>
        </div>
      </Card>

      {/* Customer notes */}
      {order.customer_notes && (
        <Card className="mt-6 p-6">
          <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
            Your Notes
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{order.customer_notes}</p>
        </Card>
      )}
    </div>
  );
}
