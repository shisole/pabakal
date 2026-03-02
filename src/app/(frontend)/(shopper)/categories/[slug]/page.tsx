import Link from "next/link";
import { notFound } from "next/navigation";

import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("category_id", category.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
        {category.name}
      </h1>
      {category.description && (
        <p className="mt-2 text-gray-500 dark:text-gray-400">{category.description}</p>
      )}

      {products && products.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => {
            const image = product.product_images?.[0];
            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group rounded-2xl border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                  {image && (
                    <img
                      src={image.url}
                      alt={image.alt_text ?? product.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {product.name}
                  </h3>
                  {product.brand && <p className="text-xs text-gray-500">{product.brand}</p>}
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-heading text-lg font-bold text-primary-600">
                      {formatPhp(product.selling_price_php)}
                    </span>
                    {product.compare_at_price_php && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPhp(product.compare_at_price_php)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-gray-500">No products in this category yet.</p>
          <Link href="/products" className="mt-2 text-sm text-primary-600 hover:underline">
            Browse all products
          </Link>
        </div>
      )}
    </div>
  );
}
