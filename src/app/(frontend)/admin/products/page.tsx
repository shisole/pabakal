import Image from "next/image";
import Link from "next/link";

import { PlusIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/layout";
import { Badge, Button, EmptyState } from "@/components/ui";
import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";
import { type ProductStatus } from "@/lib/supabase/types";

export const metadata = {
  title: "Products | Pabakal Admin",
};

const statusVariant: Record<ProductStatus, "default" | "success" | "warning" | "danger"> = {
  draft: "default",
  active: "success",
  sold_out: "warning",
  archived: "danger",
};

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*, product_images(url), categories(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Products" }]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Products</h1>
        <Link href="/admin/products/new">
          <Button size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {products && products.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-md dark:bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Image</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Price</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Qty</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {products.map((product) => {
                const images = product.product_images as { url: string }[];
                const category = product.categories as { name: string } | null;
                const available =
                  product.quantity_total - product.quantity_sold - product.quantity_reserved;
                return (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      {images?.[0]?.url ? (
                        <Image
                          src={images[0].url}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400 dark:bg-gray-800">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-medium text-primary-600 hover:underline"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {category?.name ?? "Uncategorized"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {formatPhp(product.selling_price_php)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{available}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[product.status]} size="sm">
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(product.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No products yet"
          description="Start by adding your first product."
          action={
            <Link href="/admin/products/new">
              <Button size="sm">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
