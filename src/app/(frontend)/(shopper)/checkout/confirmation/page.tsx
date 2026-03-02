import Link from "next/link";
import { notFound } from "next/navigation";

import { CheckCircleIcon } from "@/components/icons";
import { Button, Card } from "@/components/ui";
import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";

interface ConfirmationPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const { orderId } = await searchParams;
  if (!orderId) notFound();

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="mt-4 font-heading text-3xl font-bold text-gray-900 dark:text-white">
          Order Confirmed!
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Thank you for your order. We&apos;ll process it right away.
        </p>
      </div>

      <Card className="mt-8 p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Order Number</span>
            <span className="font-heading font-bold text-gray-900 dark:text-white">
              {order.order_number}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Items</span>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {order.order_items.length} item{order.order_items.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total</span>
            <span className="font-heading text-lg font-bold text-primary-600">
              {formatPhp(order.total_php)}
            </span>
          </div>
        </div>
      </Card>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href={`/orders/${order.id}`}>
          <Button className="w-full sm:w-auto">View Order Details</Button>
        </Link>
        <Link href="/products">
          <Button variant="outline" className="w-full sm:w-auto">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
