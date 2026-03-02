import { Breadcrumbs } from "@/components/layout";
import { Card } from "@/components/ui";
import { getOrderStatusLabel } from "@/lib/helpers/order";
import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";
import { type OrderStatus } from "@/lib/supabase/types";

export const metadata = {
  title: "Analytics | Pabakal Admin",
};

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const [{ data: orders }, { data: orderItems }] = await Promise.all([
    supabase.from("orders").select("id, status, total_php"),
    supabase
      .from("order_items")
      .select("product_name, quantity, total_price_php")
      .order("total_price_php", { ascending: false }),
  ]);

  const totalRevenue = orders?.reduce((sum, o) => sum + o.total_php, 0) ?? 0;
  const orderCount = orders?.length ?? 0;
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  // Orders by status breakdown
  const statusCounts: Record<string, number> = {};
  if (orders) {
    for (const order of orders) {
      statusCounts[order.status] = (statusCounts[order.status] ?? 0) + 1;
    }
  }

  // Top 5 products by revenue
  const productRevenue: Record<string, { name: string; revenue: number; quantity: number }> = {};
  if (orderItems) {
    for (const item of orderItems) {
      if (!productRevenue[item.product_name]) {
        productRevenue[item.product_name] = { name: item.product_name, revenue: 0, quantity: 0 };
      }
      productRevenue[item.product_name].revenue += item.total_price_php;
      productRevenue[item.product_name].quantity += item.quantity;
    }
  }
  const topProducts = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Analytics" }]}
      />

      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            {formatPhp(totalRevenue)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{orderCount}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Order Value</p>
          <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
            {formatPhp(avgOrderValue)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Top 5 Products by Revenue
          </h2>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, idx) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product.quantity} sold
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatPhp(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No sales data yet.</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Orders by Status
          </h2>
          {Object.keys(statusCounts).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(statusCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => {
                  const percentage = orderCount > 0 ? (count / orderCount) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          {getOrderStatusLabel(status as OrderStatus)}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No order data yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
