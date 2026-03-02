import { type OrderStatus, type PaymentStatus } from "@/lib/supabase/types";

const ORDER_STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "shipped_local",
  "delivered",
];

/** Get human-readable label for an order status. */
export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    preparing: "Preparing",
    ready: "Ready for Pickup/Ship",
    shipped_local: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return labels[status];
}

/** Get the index of an order status for timeline rendering. */
export function getOrderStatusIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  return ORDER_STATUS_ORDER.indexOf(status);
}

/** Get human-readable label for a payment status. */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    pending: "Awaiting Payment",
    partial: "Partially Paid",
    paid: "Paid",
    refunded: "Refunded",
  };
  return labels[status];
}

/** Get the ordered list of order statuses (excluding cancelled). */
export function getOrderStatusOrder(): OrderStatus[] {
  return [...ORDER_STATUS_ORDER];
}
