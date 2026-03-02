import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeftIcon, EditIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/layout";
import { Badge, Button, Card } from "@/components/ui";
import { getCargoStatusLabel } from "@/lib/helpers/cargo";
import { formatPhp, formatUsd } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";
import { type ProductWithDetails } from "@/lib/supabase/types";

export const metadata = {
  title: "Product Detail | Pabakal Admin",
};

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*), categories(*), cargos(*)")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const product = data as unknown as ProductWithDetails;
  const available = product.quantity_total - product.quantity_sold - product.quantity_reserved;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Products", href: "/admin/products" },
          { label: product.name },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{product.name}</h1>
        <div className="flex gap-2">
          <Link href="/admin/products">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <Link href={`/admin/products/${id}/edit`}>
            <Button size="sm">
              <EditIcon className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Details</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Status</dt>
                <dd className="mt-1">
                  <Badge
                    variant={
                      product.status === "active"
                        ? "success"
                        : product.status === "draft"
                          ? "default"
                          : product.status === "sold_out"
                            ? "warning"
                            : "danger"
                    }
                  >
                    {product.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Category</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                  {product.categories?.name ?? "Uncategorized"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Brand</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">{product.brand ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Condition</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">{product.condition}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Featured</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                  {product.is_featured ? "Yes" : "No"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Cargo</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                  {product.cargos ? (
                    <Link
                      href={`/admin/cargo/${product.cargos.id}`}
                      className="text-primary-600 hover:underline"
                    >
                      {product.cargos.name} ({getCargoStatusLabel(product.cargos.status)})
                    </Link>
                  ) : (
                    "Not assigned"
                  )}
                </dd>
              </div>
            </dl>

            {product.description && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {product.tags.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="info" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {product.product_images.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Images
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {product.product_images.map((img) => (
                  <Image
                    key={img.id}
                    src={img.url}
                    alt={img.alt_text ?? product.name}
                    width={200}
                    height={200}
                    className="h-40 w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            </Card>
          )}

          {product.product_variants.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Variants
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Name</th>
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">SKU</th>
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">
                        Price Adj.
                      </th>
                      <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {product.product_variants.map((v) => (
                      <tr key={v.id}>
                        <td className="py-2 text-gray-900 dark:text-gray-100">{v.name}</td>
                        <td className="py-2 text-gray-500 dark:text-gray-400">{v.sku ?? "N/A"}</td>
                        <td className="py-2 text-gray-700 dark:text-gray-300">
                          {v.price_adjustment_php > 0 ? "+" : ""}
                          {formatPhp(v.price_adjustment_php)}
                        </td>
                        <td className="py-2 text-gray-700 dark:text-gray-300">
                          {v.quantity_total - v.quantity_sold - v.quantity_reserved}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Pricing</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Cost (USD)</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {formatUsd(product.cost_usd)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Shipping Allocation</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {formatPhp(product.shipping_allocation_php)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">Selling Price</dt>
                <dd className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatPhp(product.selling_price_php)}
                </dd>
              </div>
              {product.compare_at_price_php && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Compare-at Price</dt>
                  <dd className="font-medium text-gray-400 line-through">
                    {formatPhp(product.compare_at_price_php)}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Inventory
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Total</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {product.quantity_total}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Sold</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {product.quantity_sold}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Reserved</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {product.quantity_reserved}
                </dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">Available</dt>
                <dd className="text-lg font-bold text-gray-900 dark:text-gray-100">{available}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
