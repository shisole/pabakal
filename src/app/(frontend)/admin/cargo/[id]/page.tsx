import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeftIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/layout";
import { Badge, Button, Card } from "@/components/ui";
import { getCargoStatusLabel, getCargoStatusIndex, getCargoStatusOrder } from "@/lib/helpers/cargo";
import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";
import { type Cargo, type CargoStatusHistory, type Product } from "@/lib/supabase/types";

export const metadata = {
  title: "Cargo Detail | Pabakal Admin",
};

export default async function CargoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: cargoData }, { data: historyData }, { data: productsData }] = await Promise.all([
    supabase.from("cargos").select("*").eq("id", id).single(),
    supabase
      .from("cargo_status_history")
      .select("*")
      .eq("cargo_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("products")
      .select("id, name, slug, selling_price_php, status, quantity_total")
      .eq("cargo_id", id),
  ]);

  if (!cargoData) notFound();

  const cargo = cargoData as Cargo;
  const history = (historyData ?? []) as CargoStatusHistory[];
  const products = (productsData ?? []) as Pick<
    Product,
    "id" | "name" | "slug" | "selling_price_php" | "status" | "quantity_total"
  >[];
  const statusOrder = getCargoStatusOrder();
  const currentIdx = getCargoStatusIndex(cargo.status);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Cargo", href: "/admin/cargo" },
          { label: cargo.name },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{cargo.name}</h1>
        <Link href="/admin/cargo">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Status Timeline
            </h2>
            <div className="flex items-center gap-2">
              {statusOrder.map((status, idx) => {
                const isCompleted = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={status} className="flex flex-1 flex-col items-center">
                    <div
                      className={`mb-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        isCurrent
                          ? "bg-primary-500 text-white"
                          : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-center text-xs ${
                        isCurrent
                          ? "font-semibold text-primary-600"
                          : isCompleted
                            ? "text-green-600"
                            : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {getCargoStatusLabel(status)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cargo Details
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Status</dt>
                <dd className="mt-1">
                  <Badge variant="info">{getCargoStatusLabel(cargo.status)}</Badge>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Shipping Provider</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                  {cargo.shipping_provider ?? "Not set"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Tracking Number</dt>
                <dd className="mt-1 font-mono text-gray-900 dark:text-gray-100">
                  {cargo.tracking_number ?? "Not set"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Shipping Cost</dt>
                <dd className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {formatPhp(cargo.total_shipping_cost_php)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Estimated Arrival</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                  {cargo.estimated_arrival
                    ? new Date(cargo.estimated_arrival).toLocaleDateString()
                    : "Not set"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Actual Arrival</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                  {cargo.actual_arrival
                    ? new Date(cargo.actual_arrival).toLocaleDateString()
                    : "Pending"}
                </dd>
              </div>
            </dl>
            {cargo.notes && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {cargo.notes}
                </p>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Products ({products.length})
            </h2>
            {products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Name</th>
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Price</th>
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Qty</th>
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="font-medium text-primary-600 hover:underline"
                          >
                            {p.name}
                          </Link>
                        </td>
                        <td className="py-2 text-gray-700 dark:text-gray-300">
                          {formatPhp(p.selling_price_php)}
                        </td>
                        <td className="py-2 text-gray-700 dark:text-gray-300">
                          {p.quantity_total}
                        </td>
                        <td className="py-2">
                          <Badge size="sm">{p.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No products assigned to this cargo yet.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Status History
            </h2>
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="border-l-2 border-primary-200 pl-3 dark:border-primary-800"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getCargoStatusLabel(entry.status)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                    {entry.notes && (
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{entry.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No status changes yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
