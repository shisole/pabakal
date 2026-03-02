import Link from "next/link";

import { PlusIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/layout";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { getCargoStatusLabel } from "@/lib/helpers/cargo";
import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";
import { type CargoStatus } from "@/lib/supabase/types";

export const metadata = {
  title: "Cargo | Pabakal Admin",
};

const statusVariant: Record<CargoStatus, "default" | "success" | "warning" | "info"> = {
  purchased: "default",
  packed: "info",
  shipped: "info",
  in_transit: "warning",
  arrived: "success",
  distributed: "success",
};

export default async function CargoPage() {
  const supabase = await createClient();

  const { data: cargos } = await supabase
    .from("cargos")
    .select("*, products(id)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Cargo" }]} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cargo Shipments</h1>
        <Link href="/admin/cargo/new">
          <Button size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Cargo
          </Button>
        </Link>
      </div>

      {cargos && cargos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cargos.map((cargo) => {
            const productCount = (cargo.products as { id: string }[])?.length ?? 0;
            return (
              <Link key={cargo.id} href={`/admin/cargo/${cargo.id}`}>
                <Card className="p-5 hover:shadow-lg transition-shadow">
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{cargo.name}</h3>
                    <Badge variant={statusVariant[cargo.status]} size="sm">
                      {getCargoStatusLabel(cargo.status)}
                    </Badge>
                  </div>

                  <dl className="space-y-2 text-sm">
                    {cargo.tracking_number && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500 dark:text-gray-400">Tracking</dt>
                        <dd className="font-mono text-gray-700 dark:text-gray-300">
                          {cargo.tracking_number}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">Products</dt>
                      <dd className="text-gray-700 dark:text-gray-300">{productCount} items</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">Shipping Cost</dt>
                      <dd className="font-medium text-gray-700 dark:text-gray-300">
                        {formatPhp(cargo.total_shipping_cost_php)}
                      </dd>
                    </div>
                    {cargo.estimated_arrival && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500 dark:text-gray-400">ETA</dt>
                        <dd className="text-gray-700 dark:text-gray-300">
                          {new Date(cargo.estimated_arrival).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No cargo shipments"
          description="Create your first cargo shipment to start tracking."
          action={
            <Link href="/admin/cargo/new">
              <Button size="sm">
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Cargo
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
