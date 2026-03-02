import Link from "next/link";
import { notFound } from "next/navigation";

import { CheckCircleIcon, PackageIcon, TruckIcon } from "@/components/icons";
import { Badge, Card } from "@/components/ui";
import { getOrderStatusIndex, getOrderStatusLabel, getOrderStatusOrder } from "@/lib/helpers/order";
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

interface TrackOrderPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function TrackOrderPage({ params }: TrackOrderPageProps) {
  const { orderNumber } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .single();

  if (!order) notFound();

  const statusOrder = getOrderStatusOrder();
  const currentIndex = getOrderStatusIndex(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
          Track Order
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">{order.order_number}</p>
      </div>

      {/* Status badge */}
      <div className="mt-6 flex justify-center">
        <Badge variant={statusVariantMap[order.status]} size="md">
          {getOrderStatusLabel(order.status)}
        </Badge>
      </div>

      {/* Status timeline */}
      <Card className="mt-8 p-6">
        {isCancelled ? (
          <div className="text-center">
            <p className="text-lg font-medium text-red-600 dark:text-red-400">
              This order has been cancelled.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {statusOrder.map((status, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;
              const isLast = index === statusOrder.length - 1;

              return (
                <div key={status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isCompleted
                          ? "bg-primary-500 text-white"
                          : "bg-gray-200 text-gray-400 dark:bg-gray-700"
                      } ${isCurrent ? "ring-4 ring-primary-500/20" : ""}`}
                    >
                      {isCompleted ? (
                        index === statusOrder.length - 1 ? (
                          <CheckCircleIcon className="h-4 w-4" />
                        ) : index >= 4 ? (
                          <TruckIcon className="h-4 w-4" />
                        ) : (
                          <PackageIcon className="h-4 w-4" />
                        )
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-current" />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={`h-8 w-0.5 ${
                          index < currentIndex ? "bg-primary-500" : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-8">
                    <p
                      className={`text-sm font-medium ${
                        isCompleted
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {getOrderStatusLabel(status)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Order info */}
      <Card className="mt-6 p-6">
        <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
          Order Info
        </h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Order Date</span>
            <span className="text-gray-900 dark:text-gray-100">
              {new Date(order.created_at).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-heading font-bold text-primary-600">
              {formatPhp(order.total_php)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Delivery</span>
            <span className="text-right text-gray-900 dark:text-gray-100">
              {order.delivery_city}, {order.delivery_province}
            </span>
          </div>
        </div>
      </Card>

      <div className="mt-8 text-center">
        <Link href="/products" className="text-sm text-primary-600 hover:underline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
